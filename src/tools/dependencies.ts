import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { db } from "../db/index.js";
import { taskDependenciesTable, tasksTable } from "../db/schema.js";
import { and, eq, isNull, inArray } from "drizzle-orm";

export function registerDependencyTools(server: McpServer) {
  server.registerTool(
    "add_task_dependency",
    {
      title: "Add task dependency",
      description: "Mark blockedTaskId as blocked by blockerTaskId",
      inputSchema: z.object({
        blockedTaskId: z.string(),
        blockerTaskId: z.string()
      })
    },
    async ({ blockedTaskId, blockerTaskId }) => {
      if(blockedTaskId === blockerTaskId) {
        return {
          content: [{ type: "text", text: "Task cannot depend on itself" }]
        }
      }

      return {
        content: [{ type: "text", text: "" }]
      }
    }
  )
}