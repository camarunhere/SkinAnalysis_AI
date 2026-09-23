# Backend image for Render: runs the Node/Express API, which in turn spawns
# the Python FastAPI ML service as a child process (see server/src/mlProcess.js).
# The frontend is deployed separately (e.g. Vercel) and is not built here.
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-venv python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python ML service dependencies
COPY requirements.txt ./
RUN python3 -m venv .venv \
    && .venv/bin/pip install --no-cache-dir --upgrade pip \
    && .venv/bin/pip install --no-cache-dir -r requirements.txt
COPY src ./src

# Node backend dependencies
COPY server/package.json server/package-lock.json ./server/
RUN npm --prefix server install --omit=dev
COPY server ./server

ENV NODE_ENV=production
EXPOSE 5000
WORKDIR /app/server
CMD ["node", "src/index.js"]
