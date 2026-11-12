import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

export const MAX_RESUME_BYTES = 2 * 1024 * 1024; // 2 MB

// Keep the upload in memory (req.file.buffer); the controller saves it to MongoDB.
// Nothing is written to the server's disk.
export const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === "application/pdf" && file.originalname.toLowerCase().endsWith(".pdf");
    cb(isPdf ? null : ApiError.badRequest("Resume must be a PDF file."), isPdf);
  },
}).single("resume");

// A real PDF always starts with "%PDF-"; reject renamed non-PDF files
export const looksLikePdf = (buffer) => buffer?.subarray(0, 5).toString("latin1") === "%PDF-";
