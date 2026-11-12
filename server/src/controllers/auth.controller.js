import { User, ROLES } from "../models/User.js";
import { signToken } from "../middleware/auth.js";
import { ApiError } from "../utils/ApiError.js";

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

const normalizeSkills = (skills) =>
  (Array.isArray(skills) ? skills : String(skills || "").split(","))
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 30);

// POST /api/auth/register
export async function register(req, res) {
  const { name, email, password, role = "candidate", company, headline, skills } = req.body || {};
  if (!ROLES.includes(role)) throw ApiError.badRequest("Role must be candidate or recruiter.");
  if (role === "recruiter" && !company?.trim()) throw ApiError.badRequest("Company name is required for recruiters.");

  const user = await User.create({
    name,
    email,
    password,
    role,
    ...(role === "recruiter" ? { company } : { headline, skills: normalizeSkills(skills) }),
  });

  res.status(201).json({ token: signToken(user), user });
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) throw ApiError.badRequest("Email and password are required.");

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  res.json({ token: signToken(user), user });
}

// GET /api/auth/me
export function me(req, res) {
  res.json({ user: req.user });
}

// PATCH /api/auth/me
export async function updateMe(req, res) {
  const allowed = req.user.role === "recruiter" ? ["name", "company"] : ["name", "headline", "skills"];
  const updates = pick(req.body || {}, allowed);
  if (updates.skills !== undefined) updates.skills = normalizeSkills(updates.skills);

  Object.assign(req.user, updates);
  await req.user.save();
  res.json({ user: req.user });
}
