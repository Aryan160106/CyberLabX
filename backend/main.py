from fastapi import FastAPI
from kubernetes import client, config

app = FastAPI()

# Load kubeconfig from the default location (~/.kube/config)
# This is the same config kubectl/helm already use on this machine
config.load_kube_config()

v1 = client.CoreV1Api()


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
    """List all active labs (namespaces prefixed with 'student-')"""
    namespaces = v1.list_namespace()
    labs = []

    for ns in namespaces.items:
        name = ns.metadata.name
        if not name.startswith("student-"):
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