import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { Job } from "../models/Job.js";
import { Application, APPLICATION_STATUSES } from "../models/Application.js";
import { RESUME_DIR } from "../middleware/upload.js";
import { ApiError } from "../utils/ApiError.js";

const removeFile = (filename) => fs.rm(path.join(RESUME_DIR, filename), { force: true });

async function loadApplication(id) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.notFound("Application not found.");
  const app = await Application.findById(id).populate("job", "postedBy title company");
  if (!app) throw ApiError.notFound("Application not found.");
  return app;
}

// POST /api/jobs/:id/apply  (candidate, multipart: resume + coverLetter)
export async function applyToJob(req, res) {
  try {
    if (!req.file) throw ApiError.badRequest("Please attach your resume (PDF).");
    if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound("Job not found.");

    const job = await Job.findById(req.params.id);
    if (!job || job.status !== "open") throw ApiError.notFound("This job is not accepting applications.");

    const exists = await Application.exists({ job: job._id, candidate: req.user._id });
    if (exists) throw ApiError.conflict("You have already applied to this job.");

    const application = await Application.create({
      job: job._id,
      candidate: req.user._id,
      coverLetter: req.body?.coverLetter,
      resume: { filename: req.file.filename, originalName: req.file.originalname, size: req.file.size },
    });
    res.status(201).json({ application });
  } catch (err) {
    if (req.file) await removeFile(req.file.filename); // don't keep orphan uploads
    throw err;
  }
}

// GET /api/applications/mine  (candidate)
export async function myApplications(req, res) {
  const applications = await Application.find({ candidate: req.user._id })
    .sort({ createdAt: -1 })
    .populate("job", "title company location type workMode status");
  res.json({ applications });
}

// DELETE /api/applications/:id  (candidate withdraws)
export async function withdrawApplication(req, res) {
  const app = await loadApplication(req.params.id);
  if (!app.candidate.equals(req.user._id)) throw ApiError.forbidden();
  if (app.status !== "applied") throw ApiError.badRequest("You can only withdraw applications that are still under review.");
  await removeFile(app.resume.filename);
  await app.deleteOne();
  res.status(204).end();
}

// GET /api/jobs/:id/applications?status=  (owner recruiter)
export async function jobApplications(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound("Job not found.");
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound("Job not found.");
  if (!job.postedBy.equals(req.user._id)) throw ApiError.forbidden("You can only view applicants for your own jobs.");

  const filter = { job: job._id };
  if (APPLICATION_STATUSES.includes(req.query.status)) filter.status = req.query.status;

  const applications = await Application.find(filter)
    .sort({ createdAt: -1 })
    .populate("candidate", "name email headline skills");

  // Simple skill match % between candidate skills and job skills
  const jobSkills = job.skills.map((s) => s.toLowerCase());
  const withMatch = applications.map((a) => {
    const mine = (a.candidate?.skills || []).map((s) => s.toLowerCase());
    const matched = jobSkills.filter((s) => mine.includes(s));
    return {
      ...a.toObject(),
      skillMatch: jobSkills.length ? Math.round((matched.length / jobSkills.length) * 100) : null,
      matchedSkills: matched,
    };
  });

  res.json({ job, applications: withMatch });
}

// PATCH /api/applications/:id/status  (owner recruiter)
export async function updateStatus(req, res) {
  const { status } = req.body || {};
  if (!APPLICATION_STATUSES.includes(status)) {
    throw ApiError.badRequest(`Status must be one of: ${APPLICATION_STATUSES.join(", ")}.`);
  }
  const app = await loadApplication(req.params.id);
  if (!app.job.postedBy.equals(req.user._id)) throw ApiError.forbidden();
  app.status = status;
  await app.save();
  res.json({ application: app });
}

// GET /api/applications/:id/resume  (the candidate or the job's recruiter)
export async function downloadResume(req, res) {
  const app = await loadApplication(req.params.id);
  const allowed = app.candidate.equals(req.user._id) || app.job.postedBy.equals(req.user._id);
  if (!allowed) throw ApiError.forbidden();
  res.download(path.join(RESUME_DIR, app.resume.filename), app.resume.originalName);
}
