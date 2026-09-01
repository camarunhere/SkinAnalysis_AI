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
