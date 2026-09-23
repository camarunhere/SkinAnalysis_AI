import { Router } from "express";
import { asyncHandler } from "../asyncHandler.js";
import { requireRole } from "../auth.js";
import { mlHealth, mlMetadata } from "../mlClient.js";
import { Analysis, Product, User, SKIN_CONDITIONS, logActivity } from "../models.js";

const router = Router();
router.use(...requireRole("admin"));

function userPayload(u) {
  return {
    id: String(u._id), email: u.email, full_name: u.fullName,
    role: u.role, is_blocked: u.isBlocked, created_at: u.createdAt,
  };
}
function productPayload(p) {
  return {
    id: String(p._id), name: p.name, condition: p.condition, category: p.category,
    description: p.description, usage_instructions: p.usageInstructions,
  };
}

router.get("/users", asyncHandler(async (req, res) => {
  const users = await User.find({ role: "user" }).sort({ createdAt: -1 });
  res.json(users.map(userPayload));
}));

router.put("/users/:id/block", asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).catch(() => null);
  if (!user) return res.status(404).json({ detail: "User not found." });
  user.isBlocked = !user.isBlocked;
  await user.save();
  await logActivity(req.user, "admin_block_toggle", `target=${user.email} blocked=${user.isBlocked}`);
  res.json(userPayload(user));
}));

router.get("/products", asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ condition: 1, category: 1 });
  res.json(products.map(productPayload));
}));

router.post("/products", asyncHandler(async (req, res) => {
  const { name, condition, category, description, usage_instructions } = req.body || {};
  if (!name || String(name).trim().length < 2)
    return res.status(422).json({ detail: "Product name is too short." });
  if (!SKIN_CONDITIONS.includes(condition))
    return res.status(422).json({ detail: `Condition must be one of: ${SKIN_CONDITIONS.join(", ")}` });
  if (!["cleanser", "treatment", "moisturizer", "sunscreen", "medical"].includes(category))
    return res.status(422).json({ detail: "Invalid category." });

  const product = await Product.create({
    name, condition, category,
    description: description || "", usageInstructions: usage_instructions || "",
  });
  res.json(productPayload(product));
}));

router.put("/products/:id", asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).catch(() => null);
  if (!product) return res.status(404).json({ detail: "Product not found." });
  const { name, condition, category, description, usage_instructions } = req.body || {};
  if (name) product.name = name;
  if (condition && SKIN_CONDITIONS.includes(condition)) product.condition = condition;
  if (category) product.category = category;
  if (description !== undefined) product.description = description;
  if (usage_instructions !== undefined) product.usageInstructions = usage_instructions;
  await product.save();
  res.json(productPayload(product));
}));

router.delete("/products/:id", asyncHandler(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id).catch(() => null);
  res.json({ message: "Product deleted." });
}));

router.get("/reports", asyncHandler(async (req, res) => {
  const [totalUsers, totalAnalyses, urgentReferrals, conditionAgg] = await Promise.all([
    User.countDocuments({ role: "user" }),
    Analysis.countDocuments(),
    Analysis.countDocuments({ urgentReferral: true }),
    Analysis.aggregate([{ $group: { _id: "$condition", count: { $sum: 1 } } }]),
  ]);

  const since = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);
  const dailyAgg = await Analysis.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const conditionCounts = Object.fromEntries(SKIN_CONDITIONS.map((c) => [c, 0]));
  for (const row of conditionAgg) conditionCounts[row._id] = row.count;

  res.json({
    total_users: totalUsers,
    total_analyses: totalAnalyses,
    urgent_referrals: urgentReferrals,
    condition_distribution: conditionCounts,
    analyses_per_day: dailyAgg.map((r) => ({ date: r._id, count: r.count })),
  });
}));

router.get("/model", asyncHandler(async (req, res) => {
  const [health, metadata] = await Promise.all([
    mlHealth().catch(() => ({ status: "down", model_loaded: false })),
    mlMetadata().catch(() => null),
  ]);
  res.json({ health, metadata });
}));

export default router;
