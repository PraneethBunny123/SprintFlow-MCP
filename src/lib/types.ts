export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type Todo = {
    id: string;
    projectId: string;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    status: "pending" | "in-progress" | "completed";
    priority: "low" | "medium" | "high";
  }
