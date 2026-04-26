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
        blockerTaskId: z.string(),
      })
    },
    async ({ blockedTaskId, blockerTaskId }) => {
      if(blockedTaskId === blockerTaskId) {
        return {
          content: [{ type: "text", text: "Task cannot depend on itself" }]
        }
      }

      const tasks = await db
        .select({ id: tasksTable.id, projectId: tasksTable.projectId })
        .from(tasksTable)
        .where(inArray(tasksTable.id, [blockedTaskId, blockerTaskId]))

      if (tasks.length !== 2) {
        return { content: [{ type: "text", text: "One or both task ids not found" }] };
      }

      const blocked = tasks.find((t) => t.id === blockedTaskId)
      const blocker = tasks.find((t) => t.id === blockerTaskId)

      if(blocked?.projectId !== blocker?.projectId) {
        return {
          content: [{ type: "text", text: "Dependencies must be inside same project" }],
        };
      } 

      const reverse = await db
        .select({ id: taskDependenciesTable.id })
        .from(taskDependenciesTable)
        .where(and(
          eq(taskDependenciesTable.blockedTaskId, blockerTaskId),
          eq(taskDependenciesTable.blockerTaskId, blockedTaskId),
        ))

      if(reverse.length > 0) {
        return {
          content: [{ type: "text", text: "Reverse dependency already exists (cycle)" }],
        };
      }

      const [edge] = await db
        .insert(taskDependenciesTable)
        .values({
          id: crypto.randomUUID(),
          blockedTaskId,
          blockerTaskId
        })
        .returning();

      return {
        content: [{ type: "text", text: JSON.stringify(edge, null, 2) }]
      }
    }
  )

  server.registerTool(
    "remove_task_dependency",
    {
      title: "Remove task dependency",
      description: "Remove edge blockedTaskId <- blockerTaskId",
      inputSchema: z.object({
        blockedTaskId: z.string(),
        blockerTaskId: z.string()
      })
    },
    async ({ blockedTaskId, blockerTaskId }) => {
      const [deleted] = await db
        .delete(taskDependenciesTable)
        .where(
          and(
            eq(taskDependenciesTable.blockedTaskId, blockedTaskId),
            eq(taskDependenciesTable.blockedTaskId, blockerTaskId),
          )
        )
        .returning()

      if(!deleted) {
        return {
          content: [{ type: "text", text: "Dependency not found" }]
        }
      }

      return {
        content: [{ type: "text", text: "Dependency rmeoved" }]
      }
    }
  )

  server.registerTool(
    "list_task_dependencies",
    {
      title: "List task dependency",
      description: "List all blockers for one task",
      inputSchema: z.object({
        taskId: z.string(),
      })
    },
    async ({ taskId }) => {
      const blockers = await db
        .select()
        .from(taskDependenciesTable)
        .where(eq(taskDependenciesTable.blockedTaskId, taskId))

      return {
        content: [{ type: "text", text: JSON.stringify(blockers, null, 2) }]
      }
    }
  )

  
}