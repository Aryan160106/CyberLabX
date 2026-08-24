import random
import subprocess
import uuid

from fastapi import FastAPI, HTTPException
from kubernetes import client, config

app = FastAPI()

# Load kubeconfig from the default location (~/.kube/config)
# This is the same config kubectl/helm already use on this machine
config.load_kube_config()

v1 = client.CoreV1Api()

# Path to your Helm chart on disk
CHART_PATH = r"C:\Users\aryan\CyberlabX\k8s\juiceshop-lab"

# Supported lab types -> which chart to use for each
SUPPORTED_LABS = {
    "juice-shop": CHART_PATH,
}


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


@app.get("/labs")
def list_labs():
    """List all active labs (namespaces prefixed with 'student-' or 'lab-')"""
    namespaces = v1.list_namespace()
    labs = []

    for ns in namespaces.items:
        name = ns.metadata.name
        if not (name.startswith("student-") or name.startswith("lab-")):
            continue

        pods = v1.list_namespaced_pod(namespace=name)
        pod_statuses = [pod.status.phase for pod in pods.items]

        labs.append({
            "namespace": name,
            "created": ns.metadata.creation_timestamp.isoformat() if ns.metadata.creation_timestamp else None,
            "pod_count": len(pods.items),
            "pod_statuses": pod_statuses,
        })

    return {"labs": labs}


@app.post("/labs/{lab_type}")
def deploy_lab(lab_type: str):
    """Deploy a new lab of the given type into a freshly created namespace"""
    if lab_type not in SUPPORTED_LABS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown lab_type '{lab_type}'. Supported: {list(SUPPORTED_LABS.keys())}"
        )

    chart_path = SUPPORTED_LABS[lab_type]
    suffix = uuid.uuid4().hex[:6]
    namespace = f"lab-{lab_type}-{suffix}"
    release_name = namespace
    node_port = random.randint(30010, 32767)

    result = subprocess.run(
        [
            "helm", "install", release_name, chart_path,
            "--namespace", namespace,
            "--create-namespace",
            "--set", f"namespace={namespace}",
            "--set", f"studentId={namespace}",
            "--set", f"nodePort={node_port}",
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"Helm install failed: {result.stderr}"
        )

    return {
        "deployed": True,
        "namespace": namespace,
        "release": release_name,
        "node_port": node_port,
        "helm_output": result.stdout,
    }


@app.delete("/labs/{namespace}")
def delete_lab(namespace: str):
    """Tear down a lab: uninstall its Helm release and delete the namespace"""
    if not namespace.startswith("lab-"):
        raise HTTPException(
            status_code=400,
            detail="Refusing to delete a namespace not created by this API (must start with 'lab-')"
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

    return {
        "deleted": True,
        "namespace": namespace,
        "helm_uninstall_output": uninstall_result.stdout or uninstall_result.stderr,
        "namespace_delete_error": ns_delete_error,
    }
