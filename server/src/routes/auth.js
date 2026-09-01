import bcrypt from "bcryptjs";
import { Router } from "express";
import { createToken, requireAuth } from "../auth.js";
import { User, logActivity } from "../models.js";

const router = Router();

function userPayload(u) {
  return {
    id: String(u._id),
    email: u.email,
    full_name: u.fullName,
    role: u.role,
    age: u.age ?? null,
    skin_type: u.skinType || "",
  };
}

router.post("/register", async (req, res) => {
  const { full_name, email, password, age, skin_type } = req.body || {};
  if (!full_name || String(full_name).trim().length < 2)
    return res.status(422).json({ detail: "Name is too short." });
  if (!email || !/^\S+@\S+\.\S+$/.test(email))
    return res.status(422).json({ detail: "A valid email is required." });
  if (!password || String(password).length < 6)
    return res.status(422).json({ detail: "Password must be at least 6 characters." });

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) return res.status(409).json({ detail: "An account with this email already exists." });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName: full_name,
    email: String(email).toLowerCase(),
    passwordHash,
    role: "user",
    age: age || null,
    skinType: skin_type || "",
  });
  await logActivity(user, "register");
  res.json({ token: createToken(user), user: userPayload(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: String(email || "").toLowerCase() });
  if (!user || !(await bcrypt.compare(password || "", user.passwordHash)))
    return res.status(401).json({ detail: "Invalid email or password." });
  if (user.isBlocked) return res.status(403).json({ detail: "This account has been blocked." });

  await logActivity(user, "login");
  res.json({ token: createToken(user), user: userPayload(user) });
});

router.post("/logout", requireAuth, async (req, res) => {
  await logActivity(req.user, "logout");
  res.json({ message: "Logged out." });
});

router.get("/me", requireAuth, (req, res) => res.json(userPayload(req.user)));

router.put("/me", requireAuth, async (req, res) => {
  const { full_name, age, skin_type } = req.body || {};
  if (full_name && String(full_name).trim().length >= 2) req.user.fullName = full_name;
  if (age !== undefined) req.user.age = age || null;
  if (skin_type !== undefined) req.user.skinType = skin_type;
  await req.user.save();
  res.json(userPayload(req.user));
});

export default router;
