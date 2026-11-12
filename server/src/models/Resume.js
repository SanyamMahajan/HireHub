import mongoose from "mongoose";

// Resume PDFs are stored inside MongoDB (not on the server's disk), so they
// survive restarts and redeploys on stateless hosts like Render.
// Kept in their own collection so listing applications never loads PDF bytes.
const resumeSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true },
    contentType: { type: String, default: "application/pdf" },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

export const Resume = mongoose.model("Resume", resumeSchema);
