import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { db } from "../db/index.js";
import { taskPriority, tasksTable, taskStatus } from "../db/schema.js";

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
}