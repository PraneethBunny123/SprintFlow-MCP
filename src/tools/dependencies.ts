import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { 
  addTaskDependency, 
  listBlockedTasks, 
  listTaskDependency, 
  removeTaskDependency 
} from "@sprintflow/domain";

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
      const result = await addTaskDependency(blockedTaskId, blockerTaskId)

      if(!result.ok) {
        return {
          content: [{ type: "text", text: result.message }],
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }]
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
      const result = await removeTaskDependency(blockedTaskId, blockerTaskId)

      if(!result.ok) {
        return {
          content: [{ type: "text", text: result.message }]
        }
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }]
      }
    }
  )

  server.registerTool(
    "list_task_dependencies",
    {
      title: "List task dependencies",
      description: "List all blockers for one task",
      inputSchema: z.object({
        taskId: z.string(),
      })
    },
    async ({ taskId }) => {
      const blockers = await listTaskDependency(taskId)

      return {
        content: [{ type: "text", text: JSON.stringify(blockers, null, 2) }]
      }
    }
  )

  server.registerTool(
    "list_blocked_tasks",
    {
      title: "List blocked tasks",
      description: "List tasks that currently have at least one dependency, optionally by sprint/backlog lane",
      inputSchema: z.object({
        projectId: z.string(),
        sprintId: z.string().optional()
      })
    },
    async ({ projectId, sprintId }) => {
      const result = await listBlockedTasks(projectId, sprintId)

      if(!result.ok) {
        return {
          content: [{ type: "text", text: result.message }]
        }
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }]
      }
    }
  )
}