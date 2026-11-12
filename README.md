# HireHub: MERN Job Portal

HireHub is a full-stack job portal built with the **MERN stack** (MongoDB, Express, React, Node.js). Recruiters post jobs and manage applicants. Candidates search jobs, apply with their resume and track every application.

Built during my **Full Stack MERN Developer Training at EdibleWebTech LLP, Amritsar (June–July 2026)**.

## Features

**Candidates**
- Search jobs by keyword (MongoDB text search), location, job type and work mode, with pagination and sorting
- Apply with a PDF resume upload and an optional cover letter
- See which of your skills match each job
- Dashboard to track application status (applied → shortlisted → interview → hired / rejected), withdraw applications and edit your profile

**Recruiters**
- Post, edit, close/reopen and delete jobs
- Dashboard with stats and a hiring pipeline built with MongoDB aggregation
- View applicants with an automatic **skill-match %**, filter by status, download resumes and update status

**Security and quality**
- JWT authentication with bcrypt password hashing
- Role-based access control (`candidate` / `recruiter`) on both API and UI
- Ownership checks: recruiters only manage their own jobs and applicants
- Resume uploads restricted to PDF and 2 MB, stored with random file names, downloadable only by the candidate and the job's recruiter
- Central error handling with clear validation messages; Helmet and CORS configured

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, Tailwind CSS |
| Backend | Node.js, Express 5, Mongoose, JWT, bcryptjs, Multer, Helmet |
| Database | MongoDB (local or Atlas) |

## Project structure

```
HireHub/
├── server/                 # Express REST API
│   └── src/
│       ├── config/         # env + DB connection
│       ├── models/         # User, Job, Application (Mongoose)
│       ├── middleware/     # auth (JWT + roles), upload (multer), errors
│       ├── controllers/    # auth, jobs, applications, stats
│       ├── routes/         # all /api routes
│       └── seed.js         # demo data
└── client/                 # React + TypeScript frontend
    └── src/
        ├── context/        # AuthContext
        ├── lib/            # API client, types, formatting
        ├── components/     # Navbar, JobCard, ProtectedRoute, UI
        └── pages/          # Home, JobDetails, Auth, dashboards, JobForm, Applicants
```

## Getting started

Requirements: Node.js 20+ and MongoDB (local install or a free Atlas cluster).

```bash
# 1. Backend
cd server
npm install
cp .env.example .env      # set MONGODB_URI and JWT_SECRET
npm run seed              # optional: demo users + jobs
npm run dev               # http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm run dev               # http://localhost:5173
```

Demo accounts (after `npm run seed`):

| Role | Email | Password |
|---|---|---|
| Candidate | candidate@hirehub.dev | demo1234 |
| Recruiter | recruiter@hirehub.dev | demo1234 |

## API overview

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Public |
| GET / PATCH | `/api/auth/me` | Logged in |
| GET | `/api/jobs?q=&location=&type=&workMode=&page=` | Public |
| GET | `/api/jobs/:id` | Public |
| POST / PUT / DELETE | `/api/jobs`, `/api/jobs/:id` | Recruiter (owner) |
| GET | `/api/jobs/mine` | Recruiter |
| POST | `/api/jobs/:id/apply` (multipart `resume`) | Candidate |
| GET | `/api/jobs/:id/applications` | Recruiter (owner) |
| GET | `/api/applications/mine` | Candidate |
| DELETE | `/api/applications/:id` | Candidate (owner) |
| PATCH | `/api/applications/:id/status` | Recruiter (owner) |
| GET | `/api/applications/:id/resume` | Candidate or job's recruiter |
| GET | `/api/stats/dashboard` | Logged in |

## Related project

After HireHub collects applications, my capstone project [**AI Hiring Copilot**](https://github.com/SanyamMahajan/AI-Hiring-Copilot) screens resumes and runs AI mock interviews using FastAPI, LangGraph and Gemini.

---
Made by **Sanyam Mahajan** · [GitHub](https://github.com/SanyamMahajan) · [LinkedIn](https://www.linkedin.com/in/sanyammahajan07/)
