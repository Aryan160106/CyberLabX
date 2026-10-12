# CyberLabX

A platform where students learn a security concept, then attack a real vulnerable app that was spun up just for them. Each lab runs in its own Kubernetes namespace and is deleted automatically when the timer runs out.

Built as a college project, but aimed at working like a real training product: sign up, launch a lab, practice, get scored.

> **Status:** under active development. Labs, auth and lifecycle management work. Learning content, flags, scoring and progress tracking are still being wired to the backend (see [Roadmap](#roadmap)).

---

## What's in the project

**Labs**

| Lab | Purpose | State |
|---|---|---|
| OWASP Juice Shop | Web app vulnerabilities (injection, broken auth, XSS and more) | Deployable |
| DVWA | Classic web vulnerabilities at adjustable difficulty | Listed in the UI, not deployable yet |
| Metasploitable | Network and service exploitation | Listed in the UI, not deployable yet |

**Frontend pages**

- **Landing:** hero, how it works, available labs, sign up / log in
- **Login / Signup:** account creation and sign in
- **Dashboard:** overview of progress (sample data for now)
- **Learn:** short concept pages per lab (sample data for now)
- **Quiz:** knowledge check before starting a lab (sample data for now)
- **Practice:** launch a lab, see the countdown, open it, end it (fully working)

**Backend (FastAPI)**

- Auth: signup, login and "who am I" with JWT
- Lab lifecycle: launch a lab, list your own lab, end it. A user can only see and end their own lab
- Expiry: a background reaper marks and removes expired labs
- Database: PostgreSQL via SQLAlchemy. Users and `lab_sessions` (owner, namespace, created, expires, ended, flag)

**Kubernetes side**

- Helm chart per lab (`k8s/juiceshop-lab/`): Deployment, Service, Ingress, NetworkPolicy, readiness/liveness probes
- One namespace per lab, so every student gets a clean, isolated copy
- Cleanup CronJob with its own ServiceAccount and RBAC role
- Backend RBAC so the API can create and delete lab namespaces

**Monitoring**

- Prometheus + Grafana (`kube-prometheus-stack`) for cluster and pod metrics
- Loki + Promtail for application logs

**Pipeline**

- GitHub Actions on a self-hosted runner (the cluster is local, so cloud runners can't reach it)
- Skaffold for one-command local build and deploy

---

## What works today

- Sign up / log in (JWT auth)
- Launch an OWASP Juice Shop lab from the Practice page
- One active lab per user, with a live countdown and a readiness check
- Each lab gets its own namespace with a NetworkPolicy, so labs can't reach each other
- Labs expire on their own (backend reaper + cleanup CronJob)
- Monitoring stack: Prometheus, Grafana, Loki
- CI/CD with GitHub Actions on a self-hosted runner

## What is not done yet

- Learn and Quiz screens run on hardcoded data (`frontend/src/data/`)
- Per-student unique flags, hints, scoring and XP
- Real data on the dashboard (skills, leaderboard, recommendations)
- DVWA and Metasploitable labs
- Grafana/Prometheus data inside the UI

---

## How it works

```
Browser ──> NGINX Ingress ──> React frontend
                         └──> FastAPI backend ──> PostgreSQL
                                    │
                                    └──> Kubernetes API ──> Helm chart
                                                              │
                                                  one namespace per lab
                                                  (Juice Shop + NetworkPolicy)
```

1. A logged-in student hits `POST /labs/{lab_type}`.
2. The backend checks they have no active lab, writes a `lab_sessions` row, and installs the Helm chart into a new namespace.
3. The lab is reachable at `http://<namespace>.127.0.0.1.nip.io:8080` through the ingress.
4. When `expires_at` passes (or the student ends it), the namespace is removed.

## Tech stack

| Area | Tools |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind 4, react-router-dom |
| Backend | Python, FastAPI, SQLAlchemy, PostgreSQL |
| Orchestration | Kubernetes (kind), Helm, Kubernetes Python client |
| Networking | NGINX Ingress, NetworkPolicies, nip.io |
| Observability | Prometheus, Grafana, Loki + Promtail |
| CI/CD | GitHub Actions (self-hosted runner), Skaffold for local deploys |

## Repo layout

```
backend/          FastAPI app, DB models, lab lifecycle logic
frontend/         React app
k8s/
  juiceshop-lab/  Helm chart for a single lab
  dashboard/      Manifests for backend, frontend, ingress
skaffold.yaml     Build + deploy for local development
kind-config.yaml  kind cluster config (ingress on host port 8080)
```

---

## Running it locally

Developed on Windows with PowerShell and Docker Desktop. Commands below are for that setup.

**You need:** Docker Desktop (running), `kind`, `kubectl`, `helm`, `skaffold`.

**1. Create the cluster**

```powershell
kind create cluster --name cyberlabx --config kind-config.yaml
```

Port 80 is usually taken by Docker Desktop, so the ingress is mapped to **8080**.

**2. Install the ingress controller**

```powershell
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

Check that `kubectl config current-context` says `kind-cyberlabx` before applying anything.

**3. Create the secrets**

The backend expects two Secrets in the `default` namespace: `cyberlabx-db` and `cyberlabx-auth`. Create them with your own values. Never commit real credentials.

**4. Build and deploy**

```powershell
skaffold run
```

Skaffold builds the backend and frontend images, loads them into kind, and deploys Postgres, backend and frontend.

**5. Open the app**

```
http://cyberlabx.127.0.0.1.nip.io:8080/
```

### If something breaks

- Lab unreachable? Check Docker Desktop is actually running first.
- 502/504 right after launch: Juice Shop is slow to start. Wait for the readiness probe.
- Always deploy through Skaffold. A manually built `:latest` image will not be the one the pods use.

---

## Monitoring

Prometheus and Grafana come from `kube-prometheus-stack`, logs from `loki-stack`, both in the `monitoring` namespace. In Grafana, add Loki as a data source with the URL `http://loki:3100`.

## Roadmap

| Sprint | Focus | State |
|---|---|---|
| 0-7 | Docker, Helm, isolation, CI/CD, monitoring, TTL cleanup, dashboard | Done |
| 8 | Database, auth, new frontend, labs owned by users | Done |
| 9 | Audit frontend data, map to backend endpoints | Next |
| 10 | Learn + Quiz backed by the database | Planned |
| 11 | Practice: unique flags, hints, scoring | Planned |
| 12 | Progress: XP, skills, leaderboard, recommendations | Planned |
| 13 | DVWA lab | Planned |

## Scoring (planned)

Score = lab performance + quiz results, minus penalties for hints used and wrong attempts. Each student gets a unique flag per lab.

## Safety note

The labs contain intentionally vulnerable software. They are isolated by namespace and NetworkPolicy and are meant for a local or controlled environment. Do not expose this setup to the public internet as-is.

## Credits

Vulnerable apps are open-source projects by their respective authors: [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/), [DVWA](https://github.com/digininja/DVWA), Metasploitable. CyberLabX is the platform around them.

## Author

Aryan, [github.com/Aryan160106/CyberLabX](https://github.com/Aryan160106/CyberLabX)