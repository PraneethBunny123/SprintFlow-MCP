import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects.js";

export const sprintStatus = ["planned", "active", "closed"] as const

export const sprintsTable = pgTable("sprints", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  goal: text("goal").notNull().default(""),
  startDate: timestamp("start_date", { mode: "date" }).notNull(),
  endDate: timestamp("end_date", { mode: "date" }).notNull(),
  status: text("status", { enum: sprintStatus }).notNull().default("planned"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export type SprintsTable = typeof sprintsTable.$inferSelect;
