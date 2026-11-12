import mongoose from "mongoose";

export const JOB_TYPES = ["full-time", "part-time", "internship", "contract"];
export const WORK_MODES = ["onsite", "remote", "hybrid"];

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Job title is required"], trim: true, maxlength: 120 },
    company: { type: String, required: [true, "Company is required"], trim: true, maxlength: 100 },
    location: { type: String, required: [true, "Location is required"], trim: true },
    type: { type: String, enum: JOB_TYPES, default: "full-time" },
    workMode: { type: String, enum: WORK_MODES, default: "onsite" },
    experience: { type: String, trim: true, default: "0-1 years" },
    salaryMin: { type: Number, min: 0 },
    salaryMax: {
      type: Number,
      min: 0,
      validate: {
        validator(v) {
          return v == null || this.salaryMin == null || v >= this.salaryMin;
        },
        message: "Maximum salary must be greater than minimum salary",
      },
    },
    skills: [{ type: String, trim: true }],
    description: { type: String, required: [true, "Description is required"], maxlength: 5000 },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Full-text search across title, company, skills and description
jobSchema.index({ title: "text", company: "text", skills: "text", description: "text" });
jobSchema.index({ status: 1, createdAt: -1 });

export const Job = mongoose.model("Job", jobSchema);
