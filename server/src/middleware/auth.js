import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

export function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

// Verifies the Bearer token and attaches the user to req.user
export async function authenticate(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw ApiError.unauthorized("Your session has expired. Please log in again.");
  }

  const user = await User.findById(payload.id);
  if (!user) throw ApiError.unauthorized("Account no longer exists.");

  req.user = user;
  next();
}

// Like authenticate, but lets anonymous visitors through (used for public job pages)
export async function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next();
  try {
    await authenticate(req, res, () => {});
  } catch {
    // invalid token on a public route: treat as logged out
  }
  next();
}

// Role-based access control: authorize("recruiter")
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw ApiError.forbidden(`Only ${roles.join(" / ")} accounts can do this.`);
    }
    next();
  };
}
