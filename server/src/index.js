import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { connectDb } from "./db.js";
import { ensureMlService } from "./mlProcess.js";
import { mlHealth } from "./mlClient.js";
import { ensureProductCatalog } from "./productCatalog.js";
import authRoutes from "./routes/auth.js";
import analysisRoutes from "./routes/analysis.js";
import adminRoutes from "./routes/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIST = path.resolve(__dirname, "..", "..", "frontend", "dist");
const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
const PORT = process.env.PORT || 5000;

// When the frontend is deployed separately (e.g. Vercel) from this API
// (e.g. Render), set CORS_ORIGIN to a comma-separated list of allowed
// origins. Left unset, all origins are allowed — fine for same-origin
// deployments where the API also serves the built frontend below.
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(UPLOAD_ROOT));

app.get("/health", async (req, res) => {
  const ml = await mlHealth().catch(() => ({ status: "down", model_loaded: false }));
  res.json({ status: "ok", backend: "node+mongodb", ml_service: ml });
});

app.use("/api/auth", authRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/admin", adminRoutes);

// Only present when the frontend was built alongside this server (local/combined
// deployments). When the frontend is deployed separately (e.g. Vercel), this is
// absent and the API simply returns 404s for any non-API path, which is fine
// since the frontend is served from its own domain.
if (existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) return res.status(404).json({ detail: "Not found." });
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
}

// Safety net: any error forwarded via next(err) (see asyncHandler.js) lands
// here instead of crashing the process. Mongoose's CastError (e.g. a
// malformed :id) becomes a 400; anything unexpected becomes a generic 500
// with no internal details leaked to the client.
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === "CastError") return res.status(400).json({ detail: "Invalid ID." });
  res.status(500).json({ detail: "Something went wrong." });
});

const start = async () => {
  await connectDb();
  await ensureProductCatalog();
  await ensureMlService();
  app.listen(PORT, () => console.log(`[server] http://127.0.0.1:${PORT}`));
};

start();
