// Fills the database with demo users and jobs: npm run seed
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";
import { Job } from "./models/Job.js";
import { Application } from "./models/Application.js";

const DEMO_PASSWORD = "demo1234";

const jobs = [
  {
    title: "MERN Stack Developer Intern",
    location: "Amritsar, Punjab",
    type: "internship",
    workMode: "onsite",
    experience: "Fresher",
    salaryMin: 10000,
    salaryMax: 15000,
    skills: ["React", "Node.js", "Express", "MongoDB", "JavaScript"],
    description:
      "Work with our product team to build and maintain full-stack web applications. You will build REST APIs with Express, design MongoDB schemas, and create responsive React interfaces.",
  },
  {
    title: "Frontend Developer (React)",
    location: "Chandigarh",
    type: "full-time",
    workMode: "hybrid",
    experience: "0-2 years",
    salaryMin: 300000,
    salaryMax: 500000,
    skills: ["React", "TypeScript", "Tailwind CSS", "Redux"],
    description:
      "Build pixel-perfect, accessible user interfaces in React and TypeScript. Collaborate with designers and backend developers to ship features quickly.",
  },
  {
    title: "Node.js Backend Developer",
    location: "Mohali",
    type: "full-time",
    workMode: "onsite",
    experience: "1-3 years",
    salaryMin: 400000,
    salaryMax: 700000,
    skills: ["Node.js", "Express", "MongoDB", "JWT", "Docker"],
    description:
      "Design secure, scalable REST APIs, write efficient MongoDB queries and aggregations, and own authentication and authorization for our SaaS platform.",
  },
  {
    title: "Python AI Engineer (LLM)",
    location: "Remote",
    type: "full-time",
    workMode: "remote",
    experience: "1-2 years",
    salaryMin: 600000,
    salaryMax: 1000000,
    skills: ["Python", "FastAPI", "LangChain", "LangGraph", "MongoDB"],
    description:
      "Build LLM-powered features with LangChain and LangGraph, expose them via FastAPI services, and integrate them into our hiring products.",
  },
  {
    title: "UI/UX Design Intern",
    location: "Ludhiana, Punjab",
    type: "internship",
    workMode: "hybrid",
    experience: "Fresher",
    salaryMin: 8000,
    salaryMax: 12000,
    skills: ["Figma", "UI Design", "Prototyping", "HTML", "CSS"],
    description: "Design clean, user-friendly screens and prototypes in Figma and work with developers to bring them to life.",
  },
  {
    title: "Full Stack Developer (Part-time)",
    location: "Remote",
    type: "part-time",
    workMode: "remote",
    experience: "0-1 years",
    salaryMin: 20000,
    salaryMax: 30000,
    skills: ["React", "Node.js", "MongoDB", "Git"],
    description: "Help us maintain and add features to client websites built on the MERN stack. Flexible hours, fully remote.",
  },
];

await connectDB();
await Promise.all([User.deleteMany({}), Job.deleteMany({}), Application.deleteMany({})]);
await Promise.all([User.init(), Job.init(), Application.init()]); // ensure indexes exist

const recruiter = await User.create({
  name: "Demo Recruiter",
  email: "recruiter@hirehub.dev",
  password: DEMO_PASSWORD,
  role: "recruiter",
  company: "EdibleWebTech LLP",
});
await User.create({
  name: "Demo Candidate",
  email: "candidate@hirehub.dev",
  password: DEMO_PASSWORD,
  role: "candidate",
  headline: "B.Tech CSE student | MERN developer",
  skills: ["JavaScript", "React", "Node.js", "Express", "MongoDB", "Git"],
});

await Job.insertMany(jobs.map((j) => ({ ...j, company: recruiter.company, postedBy: recruiter._id })));

console.log(`Seeded 2 users and ${jobs.length} jobs.`);
console.log(`Recruiter: recruiter@hirehub.dev / ${DEMO_PASSWORD}`);
console.log(`Candidate: candidate@hirehub.dev / ${DEMO_PASSWORD}`);
await mongoose.disconnect();
