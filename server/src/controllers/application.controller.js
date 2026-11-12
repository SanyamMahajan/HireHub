import mongoose from "mongoose";
import { Job } from "../models/Job.js";
import { Application, APPLICATION_STATUSES } from "../models/Application.js";
import { Resume } from "../models/Resume.js";
import { looksLikePdf } from "../middleware/upload.js";
import { ApiError } from "../utils/ApiError.js";

async function loadApplication(id) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.notFound("Application not found.");
  const app = await Application.findById(id).populate("job", "postedBy title company");
  if (!app) throw ApiError.notFound("Application not found.");
  return app;
}

// POST /api/jobs/:id/apply  (candidate, multipart: resume + coverLetter)
export async function applyToJob(req, res) {
  if (!req.file) throw ApiError.badRequest("Please attach your resume (PDF).");
  if (!looksLikePdf(req.file.buffer)) throw ApiError.badRequest("That file is not a valid PDF.");
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound("Job not found.");

  const job = await Job.findById(req.params.id);
  if (!job || job.status !== "open") throw ApiError.notFound("This job is not accepting applications.");

  const exists = await Application.exists({ job: job._id, candidate: req.user._id });
  if (exists) throw ApiError.conflict("You have already applied to this job.");

  // Save the PDF bytes in MongoDB, then link it to the application
  const resume = await Resume.create({
    owner: req.user._id,
    originalName: req.file.originalname,
    contentType: "application/pdf",
    size: req.file.size,
    data: req.file.buffer,
  });

  try {
    const application = await Application.create({
      job: job._id,
      candidate: req.user._id,
      coverLetter: req.body?.coverLetter,
      resume: { file: resume._id, originalName: resume.originalName, size: resume.size },
    });
    res.status(201).json({ application });
  } catch (err) {
    await resume.deleteOne(); // e.g. duplicate apply race: don't keep an orphan resume
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
  await Resume.deleteOne({ _id: app.resume.file });
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

  const resume = await Resume.findById(app.resume.file);
  if (!resume) throw ApiError.notFound("Resume file not found.");

  const safeName = resume.originalName.replace(/[^\w.\- ]/g, "_");
  res.set({
    "Content-Type": resume.contentType,
    "Content-Length": resume.data.length,
    "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(resume.originalName)}`,
    "Cache-Control": "private, no-store",
  });
  res.send(resume.data);
}
