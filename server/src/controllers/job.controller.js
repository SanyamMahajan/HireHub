import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { Job, JOB_TYPES, WORK_MODES } from "../models/Job.js";
import { Application } from "../models/Application.js";
import { RESUME_DIR } from "../middleware/upload.js";
import { ApiError } from "../utils/ApiError.js";

const EDITABLE = ["title", "company", "location", "type", "workMode", "experience", "salaryMin", "salaryMax", "skills", "description", "status"];

function cleanJobInput(body = {}) {
  const data = {};
  for (const key of EDITABLE) if (body[key] !== undefined && body[key] !== "") data[key] = body[key];
  if (data.skills !== undefined) {
    data.skills = (Array.isArray(data.skills) ? data.skills : String(data.skills).split(","))
      .map((s) => String(s).trim())
      .filter(Boolean)
      .slice(0, 20);
  }
  for (const k of ["salaryMin", "salaryMax"]) if (data[k] !== undefined) data[k] = Number(data[k]);
  return data;
}

async function findOwnedJob(id, user) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.notFound("Job not found.");
  const job = await Job.findById(id);
  if (!job) throw ApiError.notFound("Job not found.");
  if (!job.postedBy.equals(user._id)) throw ApiError.forbidden("You can only manage jobs you posted.");
  return job;
}

// GET /api/jobs?q=&location=&type=&workMode=&skill=&page=&limit=&sort=
export async function listJobs(req, res) {
  const { q, location, type, workMode, skill, sort = "newest" } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 9));

  const filter = { status: "open" };
  if (q?.trim()) filter.$text = { $search: q.trim() };
  if (location?.trim()) filter.location = { $regex: location.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  if (JOB_TYPES.includes(type)) filter.type = type;
  if (WORK_MODES.includes(workMode)) filter.workMode = workMode;
  if (skill?.trim()) filter.skills = { $regex: `^${skill.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" };

  const sortBy =
    sort === "salary" ? { salaryMax: -1, createdAt: -1 } : sort === "relevance" && filter.$text ? { score: { $meta: "textScore" } } : { createdAt: -1 };

  const [jobs, total] = await Promise.all([
    Job.find(filter, filter.$text ? { score: { $meta: "textScore" } } : {})
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("postedBy", "name company"),
    Job.countDocuments(filter),
  ]);

  res.json({ jobs, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
}

// GET /api/jobs/:id
export async function getJob(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound("Job not found.");
  const job = await Job.findById(req.params.id).populate("postedBy", "name company");
  if (!job) throw ApiError.notFound("Job not found.");

  const isOwner = req.user && job.postedBy._id.equals(req.user._id);
  if (job.status === "closed" && !isOwner) throw ApiError.notFound("This job is no longer accepting applications.");

  const applicants = await Application.countDocuments({ job: job._id });
  let myApplication = null;
  if (req.user?.role === "candidate") {
    myApplication = await Application.findOne({ job: job._id, candidate: req.user._id }).select("status createdAt");
  }

  res.json({ job, applicants, isOwner: Boolean(isOwner), myApplication });
}

// POST /api/jobs  (recruiter)
export async function createJob(req, res) {
  const data = cleanJobInput(req.body);
  const job = await Job.create({ company: req.user.company, ...data, postedBy: req.user._id });
  res.status(201).json({ job });
}

// PUT /api/jobs/:id  (owner recruiter)
export async function updateJob(req, res) {
  const job = await findOwnedJob(req.params.id, req.user);
  job.set(cleanJobInput(req.body));
  await job.save();
  res.json({ job });
}

// DELETE /api/jobs/:id  (owner recruiter) - also removes its applications and resume files
export async function deleteJob(req, res) {
  const job = await findOwnedJob(req.params.id, req.user);
  const apps = await Application.find({ job: job._id }).select("resume.filename");
  await Promise.all(apps.map((a) => fs.rm(path.join(RESUME_DIR, a.resume.filename), { force: true })));
  await Application.deleteMany({ job: job._id });
  await job.deleteOne();
  res.status(204).end();
}

// GET /api/jobs/mine  (recruiter) - my jobs with applicant counts per status
export async function myJobs(req, res) {
  const jobs = await Job.aggregate([
    { $match: { postedBy: req.user._id } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "applications",
        localField: "_id",
        foreignField: "job",
        as: "apps",
      },
    },
    {
      $addFields: {
        applicants: { $size: "$apps" },
        shortlisted: { $size: { $filter: { input: "$apps", cond: { $in: ["$$this.status", ["shortlisted", "interview"]] } } } },
        hired: { $size: { $filter: { input: "$apps", cond: { $eq: ["$$this.status", "hired"] } } } },
      },
    },
    { $project: { apps: 0 } },
  ]);
  res.json({ jobs });
}
