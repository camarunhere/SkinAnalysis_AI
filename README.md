# SkinAnalysis AI

AI-powered skin analysis website. Users upload a facial photo and get a skin
condition classification, a Grad-CAM heatmap explaining what the model
focused on, and skincare recommendations.

## How it works

The app has three parts that run together:

- **`src/`** — Python **FastAPI** ML microservice. Loads the
  [`Tanishq77/skin-condition-classifier`](https://huggingface.co/Tanishq77/skin-condition-classifier)
  model (EfficientNetV2B0, 95.6% test accuracy on a balanced 6-class
  dermatology dataset: acne, carcinoma, eczema, keratosis, milia, rosacea),
  runs inference on an uploaded image, and computes a Grad-CAM heatmap from
  the model's own convolutional gradients.
- **`server/`** — **Node.js + Express + MongoDB** backend. Serves the API
  (`/api/auth`, `/api/analysis`, `/api/admin`), handles auth/uploads, serves
  the built frontend, and automatically spawns the Python ML service as a
  child process on startup.
- **`frontend/`** — **React + Vite + Tailwind** single-page app.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Python](https://www.python.org/downloads/) 3.10+
- A MongoDB connection string (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas))

## Setup

**1. Python ML service**

```bash
python -m venv .venv
# macOS/Linux
source .venv/bin/activate
# Windows
.venv\Scripts\activate

pip install -r requirements.txt
```

**2. Node backend + React frontend**

```bash
npm run setup
```

This installs dependencies for both `server/` and `frontend/`, and builds
the frontend into `frontend/dist`, which the Node server serves in
production.

**3. Configure environment variables**

Copy `server/.env.example` to `server/.env` and fill in your MongoDB URI:

```bash
cp server/.env.example server/.env
```

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-name>.mongodb.net/?retryWrites=true&w=majority
PORT=5050
```

## Running the app

```bash
npm start
```

This starts the Node server, which connects to MongoDB, spawns the Python
ML service (`uvicorn src.ml_service:app`, default `http://127.0.0.1:5001`),
and serves the built frontend. Visit the server's port in your browser.

For frontend development with hot reload, run the frontend dev server and
backend separately:

```bash
npm run dev            # Node server, from repo root
npm run dev --prefix frontend   # Vite dev server
```

## Environment variables

| Variable         | Where              | Purpose                                                        |
| ----------------- | ------------------ | ---------------------------------------------------------------- |
| `MONGODB_URI`     | `server/.env`      | MongoDB connection string                                       |
| `PORT`            | `server/.env`      | Port the Node server listens on                                 |
| `ML_SERVICE_URL`  | `server/.env`      | URL of the Python ML service (default `http://127.0.0.1:5001`)  |
| `ML_PYTHON`       | `server/.env`      | Path to a Python interpreter to use for the ML service          |
| `SKIP_ML_SPAWN`   | `server/.env`      | If set, the Node server won't auto-start the ML service          |
| `CORS_ORIGIN`     | `server/.env` / Render | Comma-separated list of allowed frontend origins. Unset = allow all (fine for combined deployments). Required when the frontend is deployed separately (e.g. Vercel). |
| `VITE_API_URL`    | Vercel project env | Full URL of the deployed backend (e.g. `https://skinanalysis-api.onrender.com`). Only needed when frontend and backend are deployed to different domains — leave unset for local dev/combined deployments. |

## Deploying: backend on Render, frontend on Vercel

This app's backend needs both Node and Python running together (the Node
server spawns the Python ML service as a child process), so the backend
deploys as a single **Docker** web service using the `Dockerfile` at the
repo root. The frontend is a static Vite build, deployed separately to
Vercel.

**1. Push your code to GitHub** (if not already).

**2. Deploy the backend to Render**
- [dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**
- Connect your GitHub repo
- Render should auto-detect the root `Dockerfile` — if asked, set **Runtime** to **Docker**
- Leave **Root Directory** blank (the Dockerfile itself references both `server/` and `src/` from the repo root)
- Add environment variables under the service's **Environment** tab:
  ```
  MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
  CORS_ORIGIN=https://<your-app>.vercel.app
  ```
  (`PORT` is set automatically by Render — don't override it.)
- Deploy. Once live, note the backend's URL, e.g. `https://skinanalysis-api.onrender.com`
- In **MongoDB Atlas → Network Access**, allow connections from anywhere (`0.0.0.0/0`), since Render's outbound IPs aren't fixed on the free tier

**3. Deploy the frontend to Vercel**
- [vercel.com/new](https://vercel.com/new) → import the same GitHub repo
- Set **Root Directory** to `frontend`
- Framework preset: **Vite** (auto-detected)
- Add an environment variable:
  ```
  VITE_API_URL=https://skinanalysis-api.onrender.com
  ```
  (use the exact Render URL from step 2, no trailing slash)
- Deploy. Vercel gives you a URL like `https://your-app.vercel.app`

**4. Close the loop**
- Go back to the Render service's environment variables and set `CORS_ORIGIN` to that exact Vercel URL (if you used a placeholder in step 2)
- Redeploy the Render service so the new `CORS_ORIGIN` takes effect

**Notes**
- The Python ML model is downloaded from Hugging Face on first startup (not bundled in the image), so the first request after a deploy/restart will be slower while it downloads.
- Render's free tier spins down idle services — the first request after inactivity will be slow while it (and the ML service inside it) cold-starts.
- Uploaded images are stored on the container's local disk (`server/uploads/`), which is **not persistent** on Render — files are lost on redeploy/restart. For production use, swap this for an external store (e.g. S3) if upload history needs to survive restarts.

## Project structure

```
SkinAnalysis_AI/
├── src/            # Python FastAPI ML microservice (model + Grad-CAM)
├── server/         # Node.js + Express + MongoDB backend
├── frontend/       # React + Vite + Tailwind frontend
├── models/         # Downloaded/cached model weights (gitignored)
├── data/           # Local data files
└── requirements.txt
```
