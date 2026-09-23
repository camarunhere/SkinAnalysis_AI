import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../asyncHandler.js";
import { requireAuth } from "../auth.js";
import { mlAnalyze } from "../mlClient.js";
import { Analysis, Product, logActivity } from "../models.js";

const router = Router();
const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
mkdirSync(path.join(UPLOAD_ROOT, "originals"), { recursive: true });
mkdirSync(path.join(UPLOAD_ROOT, "gradcam"), { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
      return cb(new Error("Only JPEG, PNG or WEBP images are supported."));
    cb(null, true);
  },
});

function analysisPayload(a) {
  return {
    id: String(a._id),
    image_url: `/uploads/originals/${path.basename(a.imagePath)}`,
    gradcam_url: a.gradcamPath ? `/uploads/gradcam/${path.basename(a.gradcamPath)}` : null,
    condition: a.condition,
    confidence: a.confidence,
    probabilities: a.probabilities,
    reasons: a.reasons,
    urgent_referral: a.urgentReferral,
    recommended_products: (a.recommendedProducts || []).map((p) =>
      p.name ? {
        id: String(p._id), name: p.name, category: p.category,
        description: p.description, usage_instructions: p.usageInstructions,
      } : p
    ),
    created_at: a.createdAt,
  };
}

router.post("/upload", requireAuth, (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) return res.status(422).json({ detail: err.message });
    if (!req.file) return res.status(422).json({ detail: "No image file was uploaded." });

    try {
      const base64 = req.file.buffer.toString("base64");
      const result = await mlAnalyze(base64);

      const id = randomUUID();
      const ext = req.file.mimetype === "image/png" ? "png" : "jpg";
      const imagePath = path.join(UPLOAD_ROOT, "originals", `${id}.${ext}`);
      writeFileSync(imagePath, req.file.buffer);

      let gradcamPath = null;
      if (result.gradcam_base64) {
        gradcamPath = path.join(UPLOAD_ROOT, "gradcam", `${id}.png`);
        writeFileSync(gradcamPath, Buffer.from(result.gradcam_base64, "base64"));
      }

      const urgentReferral = result.condition === "carcinoma";
      const recommendedProducts = urgentReferral
        ? []
        : await Product.find({ condition: result.condition }).limit(4);

      const analysis = await Analysis.create({
        user: req.user._id,
        imagePath,
        gradcamPath,
        condition: result.condition,
        confidence: result.confidence,
        probabilities: result.probabilities,
        reasons: result.reasons || [],
        recommendedProducts: recommendedProducts.map((p) => p._id),
        urgentReferral,
      });
      analysis.recommendedProducts = recommendedProducts;

      await logActivity(req.user, "analysis", `condition=${result.condition}`);
      res.json(analysisPayload(analysis));
    } catch (e) {
      res.status(e.status === 422 ? 422 : 502).json({ detail: e.message || "Analysis failed." });
    }
  });
});

router.get("/history", requireAuth, asyncHandler(async (req, res) => {
  const items = await Analysis.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).populate("recommendedProducts");
  res.json(items.map(analysisPayload));
}));

router.get("/latest", requireAuth, asyncHandler(async (req, res) => {
  const item = await Analysis.findOne({ user: req.user._id }).sort({ createdAt: -1 }).populate("recommendedProducts");
  res.json(item ? analysisPayload(item) : null);
}));

router.get("/:id", requireAuth, asyncHandler(async (req, res) => {
  const item = await Analysis.findOne({ _id: req.params.id, user: req.user._id }).populate("recommendedProducts").catch(() => null);
  if (!item) return res.status(404).json({ detail: "Analysis not found." });
  res.json(analysisPayload(item));
}));

export default router;
