# Build context for this Dockerfile MUST be the repo root (CyberLabX/), not backend/,
# because it needs both backend/ and k8s/ (the Helm charts get baked into the image).

FROM python:3.12-slim

# The API shells out to `helm install`/`helm uninstall` to manage lab releases,
# so the Helm CLI has to exist inside this image.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 \
    && chmod 700 get_helm.sh \
    && ./get_helm.sh \
    && rm get_helm.sh \
    && apt-get purge -y curl \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/main.py .
COPY k8s/ ./charts/

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
