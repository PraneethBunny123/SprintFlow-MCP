import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { tasksTable } from "./tasks.js";

export const taskDependenciesTable = pgTable("task_dependencies", {
    id: text("id").primaryKey(),
    blockedTaskId: text("blocked_task_id")
      .notNull()
      .references(() => tasksTable.id, { onDelete: "cascade" }),
    blockerTaskId: text("blocker_task_id")
      .notNull()
      .references(() => tasksTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueEdge: uniqueIndex("task_dependencies_unique_edge").on(
    table.blockedTaskId,
    table.blockerTaskId
  ),
}))

export type TaskDependenciesTable = typeof taskDependenciesTable.$inferSelect;
