import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { projectsTable, sprintsTable, sprintStatus } from "../db/schema.js";
import { db } from "../db/index.js";
import { eq } from "drizzle-orm";

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

      const [sprint] = await db
        .insert(sprintsTable)
        .values({
          id: crypto.randomUUID(),
          projectId,
          name,
          goal: goal ?? "",
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: status ?? "planned"
        })
        .returning()

      return {
        content: [{ type: "text", text: JSON.stringify(sprint, null,2) }]
      }
    }
  )
}