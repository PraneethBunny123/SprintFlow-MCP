import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createSprint, listSprints, updateSprint, sprintStatus } from "@sprintflow/domain"

export function registerSprintTools(server: McpServer) {
  server.registerTool(
    "create_sprint",
    {
      title: "Create a sprint",
      description: "create a time-boxed sprint under a project",
      inputSchema: z.object({
        projectId: z.string().describe("project this sprint belongs to"),
        name: z.string().describe("sprint name (eg: sprint 3)"),
        goal: z.string().optional().describe("sprint goal"),
        startDate: z.string().datetime().describe("sprint start (ISO 8601)"),
        endDate: z.string().datetime().describe("Sprint end (ISO 8601)"),
        status: z.enum(sprintStatus).optional().describe("sprint status")
      })
    },
    async ({ projectId, name, goal, startDate, endDate, status }) => {
      const result = await createSprint({
        projectId,
        name,
        goal,
        startDate,
        endDate,
        status
      }) 

      if(!result.ok) {
        return { content: [{ type: "text", text: result.message }] };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }]
      }
    }
  )

  server.registerTool(
    "list_sprints",
    {
      title: "List sprints",
      description: "List all sprints for a project",
      inputSchema: z.object({
        projectId: z.string().describe("Project id"),
      }),
    },
    async ({ projectId }) => {
      const sprints = await listSprints(projectId)

      return {
        content: [{ type: "text", text: JSON.stringify(sprints, null, 2) }],
      };
    }
  );

  server.registerTool(
    "update_sprint",
    {
      title: "Update a sprint",
      description: "Update sprint metadata or status",
      inputSchema: z.object({
        sprintId: z.string(),
        name: z.string().optional(),
        goal: z.string().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        status: z.enum(sprintStatus).optional(),
      }),
    },
    async ({ sprintId, name, goal, startDate, endDate, status }) => {
      const result = await updateSprint({
        sprintId,
        name,
        goal,
        startDate,
        endDate,
        status
      })

      if (!result.ok) {
        return {
          content: [{ type: "text", text: result.message }],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
      };
    }
  );
}