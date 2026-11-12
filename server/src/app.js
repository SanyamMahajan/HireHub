import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl.split(",").map((o) => o.trim()),
    exposedHeaders: ["Content-Disposition"],
  })
);
app.use(express.json({ limit: "100kb" }));
if (env.nodeEnv !== "test") app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "HireHub API" }));
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);
