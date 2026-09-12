# CyberLabX
cyberlabx is a tool that helps students to deploy the cyberlabs easily in just 1 click instead of mannually deploying it which is one of the most heactic work evrytime , we just simply that work 

---

## What we are have done so far --
The cluster (where everything lives) - Kind, running through Docker Desktop
Backend -	FastAPI — talks to Kubernetes directly, and also runs helm install / helm uninstall behind the scenes to create/remove labs
Frontend - 	React + TypeScript + Vite, dark cyberpunk theme
How each lab is packaged - A Helm chart per lab type — only the Juice Shop one is built so far and working on more labs 
How traffic reaches a lab - NGINX Ingress, using URLs like studentA.local
Monitoring - 	Prometheus + Grafana + Alertmanager for metrics, Loki for logs
CI/CD - A GitHub Actions workflow (meant to run on our own local runner)
Keeping labs isolated - Kubernetes NetworkPolicies — basically "block everything by default, then allow only what's needed"
 

---

## What's working so far

### The core Kubernetes setup
- Each lab gets its own diff namespace , 
- Set up "deny everything by default" rules per namespace, then added a separate rule so admins can still get in((Took a bit of trial and error — had to combine two selectors as siblings under the same from block for it to actually work.))
- Confirmed that Docker Desktop's built-in networking (kindnet) actually respects these isolation rules — it's not just decoration, it really blocks traffic.
- The Juice Shop Helm chart now creates a brand-new, uniquely named lab every time instead of reusing the same three test namespaces.

### The backend (FastAPI)
- Connects to the cluster automatically.
- Can check if the cluster is healthy.
- Can list every lab currently running (with pod count, status, port, and type).
- Can deploy a new lab on request.
- Can tear a lab down — and it specifically refuses to delete the original `student-a/b/c` test namespaces, so nobody can accidentally nuke them.
- Set up to only accept requests from the frontend's actual address.

### The frontend (React)
- Fully connected to the real backend now - few of the data is let to be chnged like default labs 
- Automatically checks for lab updates every 5 seconds.
- Deploy and stop buttons both talk to the real backend and actually work.
- Has four screens: Login, Dashboard, Lab Detail, and Monitoring.
- Tested live: deploying, deleting, and the "can't delete the test labs" protection all work as expected.

### Fixing the networking (this was a big one)
**The problem:** Kind doesn't forward traffic the way Minikube does. Every lab gets a random port assigned, and there's no realistic way to pre-open every possible port. So even though labs were deploying fine, clicking "Open App" just timed out.

**The fix:** Switched from random ports to NGINX Ingress, which only needs ports 80 and 443 opened *once*, no matter how many labs exist. Each lab now gets its own address like `studentA.local` instead of a folder-style URL, because Juice Shop expects to load from the root of the site, not a subfolder.

- Confirmed it actually works — loading the app through the tunnel returns a real, fully working page.
- Found (and diagnosed) a follow-up bug where Juice Shop's styling and scripts weren't loading — this confirmed the "own address per lab" approach was the right call.
- **Still not done:** the "Open App" button in the frontend still points to the old, broken-style URL. Needs to be updated to use the new address format.

### Monitoring — confirmed alive and running
Checked directly in the cluster — Prometheus, Grafana, Alertmanager, and Loki (for logs) are all up and running properly.

**Currently investigating:** Grafana is showing two things both claiming to be the "default" data source (Prometheus and Loki are fighting over it). Not fixed yet — currently just looking at what's actually configured in the cluster before changing anything, so nothing breaks by accident. The goal is: Prometheus should be the default for metrics, Loki should still be available but not the default.

### CI/CD — partially working
- The GitHub Actions pipeline exists and has run twice — once successfully, once not.
- The GitHub repo is correctly linked.
- **The problem:** there's no runner installed on this machine to actually execute the pipeline and deploy anything for real — we looked and it's just missing.
- There's also a decent chunk of work sitting locally that hasn't been pushed to GitHub yet (backend changes, the networking fix files, and the new frontend folder) — waiting until the networking fix is fully confirmed working before committing it.

---

## How to run it locally

You'll need **4 terminal windows open at the same time**:

1. **Frontend**
   ```
   npm run dev
   ```
   Opens at `http://localhost:8443`

2. **Backend**
   ```
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Tunnel into the cluster** (this is what lets your browser reach the labs)
   ```
   kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80
   ```
   Opens at `http://localhost:8080`

4. **A free terminal** for any extra `kubectl`, `helm`, or `git` commands

Leave terminals 1–3 running in the background  — don't close them. If terminal 3 keeps printing `Handling connection for 8080`, that's normal, it just means it's working.

---

## What's still left to do--

- [ ] Point the "Open App" button at the new address format instead of the old broken one
- [ ] Fix the Grafana "two default data sources" issue
- [ ] Get a runner installed so CI/CD can actually deploy things
- [ ] Push the pending local changes once the networking fix is confirmed solid
- [ ] Build the DVWA and Metasploitable lab charts (only Juice Shop exists right now)
- [ ] Stop tracking `backend/__pycache__/main.cpython-314.pyc` in git

---

## How a request flows through the system (after the networking fix)

```
Your browser
   |
   |  goes to http://studentA.local (through the localhost:8080 tunnel)
   v
NGINX Ingress (the traffic director)
   |
   v
A private internal service for that specific lab
   |
   v
The actual lab (Juice Shop, etc.) running in its own pod
```