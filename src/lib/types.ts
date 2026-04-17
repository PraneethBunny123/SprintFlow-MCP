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
    createdAt: string;
    updatedAt: string;
    status: "pending" | "in_progress" | "completed";
    priority: "low" | "medium" | "high";
  }
