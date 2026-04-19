import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects.js";
import { sprintsTable } from "./sprints.js";

export const taskStatus = ["pending", "in_progress", "completed"] as const; 
export const taskPriority = ["low", "medium", "high"] as const; 

export const tasksTable = pgTable("tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projectsTable.id, {onDelete: "cascade"}),
  sprintId: text("sprint_id").references(() => sprintsTable.id, { onDelete: "set null" }),
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  status: text("status", {enum: taskStatus}).notNull().default("pending"),
  priority: text("priority", {enum: taskPriority}).notNull().default("medium"),
  estimatedPoints: integer("estimated_points"),
  assignee: text("assignee"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export type TasksTable = typeof tasksTable.$inferSelect;
