import mongoose from "mongoose";

export const APPLICATION_STATUSES = ["applied", "shortlisted", "interview", "rejected", "hired"];

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resume: {
      filename: { type: String, required: true },
      originalName: { type: String, required: true },
      size: Number,
    },
    coverLetter: { type: String, maxlength: 2000, trim: true },
    status: { type: String, enum: APPLICATION_STATUSES, default: "applied" },
  },
  { timestamps: true }
);

// A candidate can apply to a job only once
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

export const Application = mongoose.model("Application", applicationSchema);
