import { sprintStatus, taskPriority, taskStatus } from "../db/schema.js";

export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type Task = {
  id: string;
  projectId: string;
  sprintId: string;
  title: string;
  description: string;
  status: typeof taskStatus;
  priority: typeof taskPriority;
  estimatedPoints: number;
  assignee: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type Sprint = {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: typeof sprintStatus;
  createdAt: string;
  updatedAt: string;
}
