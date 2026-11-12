import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middleware/auth.js";
import { uploadResume } from "../middleware/upload.js";
import * as auth from "../controllers/auth.controller.js";
import * as jobs from "../controllers/job.controller.js";
import * as apps from "../controllers/application.controller.js";
import * as stats from "../controllers/stats.controller.js";

const router = Router();
const recruiter = [authenticate, authorize("recruiter")];
const candidate = [authenticate, authorize("candidate")];

// Auth
router.post("/auth/register", auth.register);
router.post("/auth/login", auth.login);
router.get("/auth/me", authenticate, auth.me);
router.patch("/auth/me", authenticate, auth.updateMe);

// Jobs
router.get("/jobs", jobs.listJobs);
router.get("/jobs/mine", ...recruiter, jobs.myJobs); // must come before /jobs/:id
router.get("/jobs/:id", optionalAuth, jobs.getJob);
router.post("/jobs", ...recruiter, jobs.createJob);
router.put("/jobs/:id", ...recruiter, jobs.updateJob);
router.delete("/jobs/:id", ...recruiter, jobs.deleteJob);

// Applications
router.post("/jobs/:id/apply", ...candidate, uploadResume, apps.applyToJob);
router.get("/jobs/:id/applications", ...recruiter, apps.jobApplications);
router.get("/applications/mine", ...candidate, apps.myApplications);
router.delete("/applications/:id", ...candidate, apps.withdrawApplication);
router.patch("/applications/:id/status", ...recruiter, apps.updateStatus);
router.get("/applications/:id/resume", authenticate, apps.downloadResume);

// Dashboard stats
router.get("/stats/dashboard", authenticate, stats.dashboard);

export default router;
