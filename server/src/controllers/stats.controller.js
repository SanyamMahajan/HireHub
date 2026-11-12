import { Job } from "../models/Job.js";
import { Application, APPLICATION_STATUSES } from "../models/Application.js";

const emptyCounts = () => Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0]));

// GET /api/stats/dashboard - numbers for the logged-in user's dashboard
export async function dashboard(req, res) {
  if (req.user.role === "recruiter") {
    const jobIds = await Job.find({ postedBy: req.user._id }).distinct("_id");
    const [openJobs, byStatus] = await Promise.all([
      Job.countDocuments({ postedBy: req.user._id, status: "open" }),
      Application.aggregate([
        { $match: { job: { $in: jobIds } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);
    const counts = emptyCounts();
    for (const { _id, count } of byStatus) counts[_id] = count;
    const totalApplications = Object.values(counts).reduce((a, b) => a + b, 0);
    return res.json({ totalJobs: jobIds.length, openJobs, totalApplications, byStatus: counts });
  }

  const byStatus = await Application.aggregate([
    { $match: { candidate: req.user._id } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts = emptyCounts();
  for (const { _id, count } of byStatus) counts[_id] = count;
  res.json({ totalApplications: Object.values(counts).reduce((a, b) => a + b, 0), byStatus: counts });
}
