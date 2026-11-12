export type Role = "candidate" | "recruiter";
export type JobType = "full-time" | "part-time" | "internship" | "contract";
export type WorkMode = "onsite" | "remote" | "hybrid";
export type ApplicationStatus = "applied" | "shortlisted" | "interview" | "rejected" | "hired";

export const JOB_TYPES: JobType[] = ["full-time", "part-time", "internship", "contract"];
export const WORK_MODES: WorkMode[] = ["onsite", "remote", "hybrid"];
export const APPLICATION_STATUSES: ApplicationStatus[] = ["applied", "shortlisted", "interview", "rejected", "hired"];

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  company?: string;
  headline?: string;
  skills?: string[];
}

export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  workMode: WorkMode;
  experience?: string;
  salaryMin?: number;
  salaryMax?: number;
  skills: string[];
  description: string;
  status: "open" | "closed";
  postedBy: string | { _id: string; name: string; company?: string };
  createdAt: string;
}

export interface MyJob extends Job {
  applicants: number;
  shortlisted: number;
  hired: number;
}

export interface Application {
  _id: string;
  job: Pick<Job, "_id" | "title" | "company" | "location" | "type" | "workMode" | "status"> | null;
  status: ApplicationStatus;
  coverLetter?: string;
  resume: { originalName: string; size?: number };
  createdAt: string;
  updatedAt: string;
}

export interface Applicant extends Omit<Application, "job"> {
  candidate: Pick<User, "_id" | "name" | "email" | "headline" | "skills">;
  skillMatch: number | null;
  matchedSkills: string[];
}

export interface JobList {
  jobs: Job[];
  page: number;
  total: number;
  totalPages: number;
}

export interface DashboardStats {
  totalJobs?: number;
  openJobs?: number;
  totalApplications: number;
  byStatus: Record<ApplicationStatus, number>;
}
