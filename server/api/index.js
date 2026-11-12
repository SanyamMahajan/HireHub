// Vercel serverless entry point.
// Locally we use src/index.js (app.listen). On Vercel there is no long-running
// server: each request calls this function, so we connect to MongoDB once per
// warm instance and reuse the connection.
import { app } from "../src/app.js";
import { connectDB } from "../src/config/db.js";

let dbReady;

export default async function handler(req, res) {
  try {
    dbReady ??= connectDB();
    await dbReady;
  } catch (err) {
    dbReady = undefined; // retry on the next request
    console.error("MongoDB connection failed:", err.message);
    return res.status(503).json({ message: "Database unavailable. Please try again." });
  }
  return app(req, res);
}
