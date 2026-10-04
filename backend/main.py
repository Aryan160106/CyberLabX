import os
import secrets
import subprocess
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from kubernetes import client, config
from sqlalchemy import text
from sqlalchemy.orm import Session

from db import engine, init_db, get_db, LabSession, User
from auth import router as auth_router, get_current_user
from quiz import router as quiz_router
from missions import router as missions_router
from progress import router as progress_router
from account import router as account_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()  # creates the tables if they don't exist yet
    _start_reaper()
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(auth_router)
app.include_router(quiz_router)
app.include_router(missions_router)
app.include_router(progress_router)
app.include_router(account_router)

# Allow the frontend (running on Vite's dev server) to call this API from the browser
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)

# When running as a Pod inside the cluster, use the ServiceAccount token Kubernetes
# mounts automatically (in-cluster config). Fall back to the local ~/.kube/config
# only for running main.py directly on a laptop during quick local debugging.
try:
    config.load_incluster_config()
except config.ConfigException:
    config.load_kube_config()

v1 = client.CoreV1Api()

# Chart paths are relative to this file, matching the Dockerfile's `COPY k8s/ ./charts/`.
CHARTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "charts")
JUICE_SHOP_CHART = os.path.join(CHARTS_DIR, "juiceshop-lab")
DVWA_CHART = os.path.join(CHARTS_DIR, "dvwa-lab")                       # chart not built yet
METASPLOITABLE_CHART = os.path.join(CHARTS_DIR, "metasploitable-lab")   # chart not built yet

# Supported lab types -> which chart to use for each
SUPPORTED_LABS = {
    "juice-shop": JUICE_SHOP_CHART,
    "dvwa": DVWA_CHART,
    "metasploitable": METASPLOITABLE_CHART,
}

LAB_TTL_MINUTES = int(os.getenv("LAB_TTL_MINUTES", "60"))  # how long a lab runs before it's considered expired


@app.get("/")
def root():
    return {"status": "CyberLabX backend is running"}


@app.get("/health/cluster")
def cluster_health():
    """Quick sanity check: can we actually talk to the cluster?"""
    namespaces = v1.list_namespace()
    return {
        "connected": True,
        "namespace_count": len(namespaces.items),
        "namespaces": [ns.metadata.name for ns in namespaces.items],
    }


@app.get("/health/db")
def db_health():
    """Quick sanity check: can we actually talk to PostgreSQL?"""
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"connected": True}


def _infer_lab_type(namespace: str) -> str:
    """Guess the lab type from a namespace like 'lab-juice-shop-2fd28c'"""
    for lab_type in SUPPORTED_LABS:
        if namespace.startswith(f"lab-{lab_type}-"):
            return lab_type
    return "unknown"


def _lab_url(namespace: str) -> str:
    """Lab URL via ingress-nginx, which kind maps to host port 8080.
    nip.io resolves <namespace>.127.0.0.1.nip.io back to localhost."""
    return f"http://{namespace}.127.0.0.1.nip.io:8080"


def _teardown_namespace(namespace: str) -> bool:
    """Helm uninstall + delete namespace. True if the lab is gone (404 counts)."""
    subprocess.run(
        ["helm", "uninstall", namespace, "--namespace", namespace],
        capture_output=True, text=True,
    )
    try:
        v1.delete_namespace(name=namespace)
    except client.exceptions.ApiException as e:
        if e.status != 404:
            print(f"[teardown] could not delete {namespace}: {e.status}", flush=True)
            return False
    return True


def _expire_stale_sessions(db: Session, user: User) -> None:
    """Tear down this user's expired labs, then mark them ended.
    A session is only marked ended once its namespace is really gone."""
    now = datetime.now(timezone.utc)
    stale = db.query(LabSession).filter(
        LabSession.user_id == user.id,
        LabSession.ended_at.is_(None),
        LabSession.expires_at < now,
    ).all()
    for s in stale:
        if _teardown_namespace(s.namespace):
            s.ended_at = now
    if stale:
        db.commit()

def _lab_ready(namespace: str) -> bool:
    """True once every pod in the lab namespace is Running and Ready."""
    try:
        pods = v1.list_namespaced_pod(namespace=namespace).items
    except client.exceptions.ApiException:
        return False
    return bool(pods) and all(
        p.status.phase == "Running"
        and p.status.container_statuses
        and all(c.ready for c in p.status.container_statuses)
        for p in pods
    )

@app.get("/labs/me")
def my_lab(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the current user's active lab, if any."""
    _expire_stale_sessions(db, user)
    active = db.query(LabSession).filter(
        LabSession.user_id == user.id,
        LabSession.ended_at.is_(None),
    ).first()
    if not active:
        return {"active": False}
    return {
        "active": True,
        "lab_type": active.lab_type,
        "namespace": active.namespace,
        "lab_url": _lab_url(active.namespace),
        "created_at": active.created_at.isoformat(),
        "expires_at": active.expires_at.isoformat() if active.expires_at else None,
        "ready": _lab_ready(active.namespace),
    }


@app.post("/labs/{lab_type}")
def deploy_lab(
    lab_type: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deploy a new lab of the given type into a freshly created namespace"""
    if lab_type not in SUPPORTED_LABS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown lab_type '{lab_type}'. Supported: {list(SUPPORTED_LABS.keys())}"
        )

    # Clear out any of this user's labs whose TTL has already passed
    _expire_stale_sessions(db, user)

    # Block if this user already has an active lab
    active = db.query(LabSession).filter(
        LabSession.user_id == user.id,
        LabSession.ended_at.is_(None),
    ).first()
    if active:
        raise HTTPException(
            status_code=409,
            detail=f"You already have an active lab ({active.namespace}). End it before starting a new one."
        )

    chart_path = SUPPORTED_LABS[lab_type]
    suffix = uuid.uuid4().hex[:6]
    ctf_key = secrets.token_hex(16)  # per-launch Juice Shop CTF secret
    namespace = f"lab-{lab_type}-{suffix}"
    release_name = namespace

    result = subprocess.run(
        [
            "helm", "install", release_name, chart_path,
            "--namespace", namespace,
            "--create-namespace",
            "--set", f"namespace={namespace}",
            "--set", f"studentId={namespace}",
            "--set-string", f"ctfKey={ctf_key}",
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"Helm install failed: {result.stderr}"
        )

    # Record this lab in the database
    session = LabSession(
        user_id=user.id,
        lab_type=lab_type,
        namespace=namespace,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=LAB_TTL_MINUTES),
        flag=ctf_key,  # stores the per-launch CTF secret; never sent to the client
    )
    db.add(session)
    db.commit()

    return {
        "deployed": True,
        "namespace": namespace,
        "release": release_name,
        "lab_url": _lab_url(namespace),
        "helm_output": result.stdout,
    }


@app.delete("/labs/{namespace}")
def delete_lab(
    namespace: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """End the current user's own active lab: uninstall its Helm release,
    delete the namespace, and mark the session as ended."""
    session = db.query(LabSession).filter(
        LabSession.namespace == namespace,
        LabSession.user_id == user.id,
        LabSession.ended_at.is_(None),
    ).first()
    if not session:
        raise HTTPException(
            status_code=404,
            detail="No active lab with that namespace on your account"
        )

    uninstall_result = subprocess.run(
        ["helm", "uninstall", namespace, "--namespace", namespace],
        capture_output=True,
        text=True,
    )

    ns_delete_error = None
    try:
        v1.delete_namespace(name=namespace)
    except client.exceptions.ApiException as e:
        ns_delete_error = str(e)

    session.ended_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "deleted": True,
        "namespace": namespace,
        "helm_uninstall_output": uninstall_result.stdout or uninstall_result.stderr,
        "namespace_delete_error": ns_delete_error,
    }


# ---- Expiry reaper: the database is the source of truth for lab lifetime ----
def _reap_expired_labs() -> None:
    """End every lab whose expires_at has passed: helm uninstall, delete the
    namespace, mark the session ended. Failed deletions retry next cycle."""
    now = datetime.now(timezone.utc)
    gen = get_db()
    db = next(gen)
    try:
        expired = db.query(LabSession).filter(
            LabSession.ended_at.is_(None),
            LabSession.expires_at < now,
        ).all()
        for s in expired:
            subprocess.run(
                ["helm", "uninstall", s.namespace, "--namespace", s.namespace],
                capture_output=True, text=True,
            )
            try:
                v1.delete_namespace(name=s.namespace)
            except client.exceptions.ApiException as e:
                if e.status != 404:  # 404 = already gone, fine
                    print(f"[reaper] could not delete {s.namespace}: {e.status}", flush=True)
                    continue
            s.ended_at = now
            print(f"[reaper] ended expired lab {s.namespace}", flush=True)
        if expired:
            db.commit()
    finally:
        gen.close()


def _start_reaper(interval_seconds: int = 60) -> None:
    import threading, time

    def loop():
        while True:
            try:
                _reap_expired_labs()
            except Exception as e:
                print(f"[reaper] error: {e}", flush=True)
            time.sleep(interval_seconds)

    threading.Thread(target=loop, daemon=True, name="lab-reaper").start()