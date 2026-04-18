import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects.js";

export const taskStatus = ["pending", "in_progress", "completed"] as const; 
export const taskPriority = ["low", "medium", "high"] as const; 

export const tasksTable = pgTable("tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projectsTable.id, {onDelete: "cascade"}),
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  status: text("status", {enum: taskStatus}).notNull().default("pending"),
  priority: text("priority", {enum: taskPriority}).notNull().default("medium"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export type TasksTable = typeof tasksTable.$inferSelect;
