import mongoose from "mongoose";

const { Schema } = mongoose;

export const SKIN_CONDITIONS = ["acne", "carcinoma", "eczema", "keratosis", "milia", "rosacea"];

// ---- User Account -----------------------------------------------------------
const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  isBlocked: { type: Boolean, default: false },

  age: Number,
  skinType: { type: String, enum: ["oily", "dry", "combination", "normal", "sensitive", ""], default: "" },

  createdAt: { type: Date, default: Date.now },
});

// ---- Skincare Product Catalog ------------------------------------------------
const productSchema = new Schema({
  name: { type: String, required: true },
  condition: { type: String, enum: SKIN_CONDITIONS, required: true, index: true },
  category: { type: String, enum: ["cleanser", "treatment", "moisturizer", "sunscreen", "medical"], required: true },
  description: { type: String, default: "" },
  usageInstructions: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

// ---- Analysis Result (image + AI prediction + Grad-CAM + recommendation) ----
const analysisSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
  imagePath: { type: String, required: true },
  gradcamPath: { type: String },
  condition: { type: String, enum: SKIN_CONDITIONS, required: true },
  confidence: { type: Number, required: true },
  probabilities: { type: Schema.Types.Mixed },
  reasons: [{ region: String, detail: String }],
  recommendedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  urgentReferral: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true },
});

const activityLogSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  userEmail: String,
  action: { type: String, required: true },
  detail: String,
  createdAt: { type: Date, default: Date.now, index: true },
});

export const User = mongoose.model("User", userSchema);
export const Product = mongoose.model("Product", productSchema);
export const Analysis = mongoose.model("Analysis", analysisSchema);
export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

export async function logActivity(user, action, detail = "") {
  try {
    await ActivityLog.create({ user: user?._id, userEmail: user?.email, action, detail });
  } catch { /* logging must never break the request */ }
}
