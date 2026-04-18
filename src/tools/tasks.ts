import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { db } from "../db/index.js";
import { projectsTable, taskPriority, tasksTable, taskStatus } from "../db/schema.js";
import { asc, eq, sql } from "drizzle-orm";

export function registerTaskTools(server: McpServer) {
  server.registerTool(
    "create_task", 
    {
      title: "Create a task",
      description: "Create a new task under a project",
      inputSchema: z.object({
        projectId: z.string().describe("The project this task belongs to"),
        title: z.string().describe("The title of the task"),
        description: z.string().optional().describe("The description of the task"),
        status: z.enum(taskStatus).optional().describe("Task status"),
        priority: z.enum(taskPriority).optional().describe("Task priority")
      })
    },
    async ({ projectId, title, description, status, priority }) => {
      const [project] = await db
        .select({ id: projectsTable.id })
        .from(projectsTable)
        .where(eq(projectsTable.id, projectId))
        .limit(1)
      
      if(!project) {
        return {
          content: [{ type: "text", text: `project with id: ${projectId} not found` }]
        }
      }

      const [task] = await db
        .insert(tasksTable)
        .values({
          id: crypto.randomUUID(),
          projectId,
          title,
          description: description ?? "",
          status: status ?? "pending",
          priority: priority ?? "medium"
        })
        .returning();

      return {
        content: [{type: "text", text: JSON.stringify(task, null, 2)}]
      }
    }
  )

  server.registerTool(
    "list_tasks",
    {
      title: "List tasks",
      description: "List all tasks for the specific project",
      inputSchema: z.object({
        projectId: z.string().describe("The project to list tasks for"),
      })
    },
    async ({ projectId }) => {
      const statusOrder = sql`CASE ${tasksTable.status}
        WHEN 'pending' THEN 0
        WHEN 'in_progress' THEN 1
        WHEN 'completed' THEN 2
        ELSE 3
      END`;

      const tasks = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.projectId, projectId))
        .orderBy(statusOrder, asc(tasksTable.createdAt))
      
      return {
        content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }]
      }
    }
  )

  server.registerTool(
    "update_task",
    {
      title: "Update a task",
      description: "Update teh status, priority or details of the task",
      inputSchema: z.object({
        taskId: z.string().describe("The task to be updated"),
        title: z.string().optional().describe("New title"),
        description: z.string().optional().describe("New description"),
        status: z.enum(taskStatus).optional().describe("New status"),
        priority: z.enum(taskPriority).optional().describe("New priority"),
      })
    },
    async ({ taskId, title, description, status, priority }) => {
      const patch: Partial<{
        title: string;
        description: string;
        status: (typeof taskStatus)[number];
        priority: (typeof taskPriority)[number];
        updatedAt: Date;
      }> = { updatedAt: new Date() };

      if (title !== undefined) patch.title = title;
      if (description !== undefined) patch.description = description;
      if (status !== undefined) patch.status = status;
      if (priority !== undefined) patch.priority = priority;

      const [task] = await db
        .update(tasksTable)
        .set(patch)
        .where(eq(tasksTable.id, taskId))
        .returning()
      
      if (!task) {
        return {
          content: [
            { type: "text", text: `Task with id: ${taskId} not found` },
          ],
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(task, null, 2) }]
      }
    }
  )

  server.registerTool(
    "delete_task",
    {
      title: "Delete a task",
      description: "Delete a task by id",
      inputSchema: z.object({
        taskId: z.string().describe("The task to delete")
      })
    },
    async ({ taskId }) => {
      const [task] = await db
        .delete(tasksTable)
        .where(eq(tasksTable.id, taskId))
        .returning()

      if (!task) {
        return {
          content: [
            { type: "text", text: `Task not found` },
          ],
        };
      }

      return {
        content: [{ type: "text", text:  `Task ${task.title} deleted successfully` }]
      }
    }
  )
}