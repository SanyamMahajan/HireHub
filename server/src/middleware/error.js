import mongoose from "mongoose";
import multer from "multer";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Central error handler: converts every error into { message, details? }
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || "Something went wrong.";
  let details = err.details;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = "Validation failed.";
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}.`;
  } else if (err?.code === 11000) {
    status = 409;
    message = `That ${Object.keys(err.keyValue || {}).join(", ") || "value"} is already in use.`;
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "Resume must be smaller than 2 MB." : err.message;
  }

  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 && env.nodeEnv === "production" ? "Internal server error." : message,
    ...(details && { details }),
  });
}
