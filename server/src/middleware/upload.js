import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

export const RESUME_DIR = path.resolve("uploads", "resumes");
fs.mkdirSync(RESUME_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: RESUME_DIR,
  // Random file names: never trust the user's file name on disk
  filename: (_req, _file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.pdf`),
});

export const uploadResume = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === "application/pdf" && file.originalname.toLowerCase().endsWith(".pdf");
    cb(isPdf ? null : ApiError.badRequest("Resume must be a PDF file."), isPdf);
  },
}).single("resume");
