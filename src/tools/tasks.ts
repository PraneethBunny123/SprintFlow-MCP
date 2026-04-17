import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { db } from "../db/index.js";
import { taskPriority, tasksTable, taskStatus } from "../db/schema.js";
import { eq } from "drizzle-orm";

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
      const [task] = await db
        .insert(tasksTable)
        .values({
          id: crypto.randomUUID(),
          projectId,
          title,
          description: description || "",
          status: status || "pending",
          priority: priority || "medium"
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
        projectId: z.string().describe("The project to list tasks for") 
      })
    },
    async ({projectId}) => {
      const tasks = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.projectId, projectId))
      
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
    async ({ taskId, ...updates }) => {
      const [task] = await db
        .update(tasksTable)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(tasksTable.id, taskId))
        .returning()
      
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
      
      return {
        content: [{ type: "text", text:  `Task ${task.title} deleted successfully` }]
      }
    }
  )
}