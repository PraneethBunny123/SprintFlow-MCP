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
  title: string;
  description: string;
  status: (typeof taskStatus)[number] | undefined;
  priority: (typeof taskPriority)[number] |undefined;
  sprintId: string | undefined;
  estimatedPoints: number | undefined;
  assignee: string | undefined;
  sortOrder: number | undefined;
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

export type TaskDependency = {
  id: string;
  blockedTaskId: string;
  blockerTaskId: string;
  createdAt: string;
};