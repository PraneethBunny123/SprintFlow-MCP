import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { projectsTable, sprintsTable, sprintStatus } from "@sprintflow/domain/src/db/schema.js";
import { db } from "@sprintflow/domain/src/db/index.js";
import { eq, asc } from "drizzle-orm";

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
      const sprints = await db
        .select()
        .from(sprintsTable)
        .where(eq(sprintsTable.projectId, projectId))
        .orderBy(asc(sprintsTable.startDate));
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
      const patch: Partial<{
        name: string;
        goal: string;
        startDate: Date;
        endDate: Date;
        status: (typeof sprintStatus)[number];
        updatedAt: Date;
      }> = { updatedAt: new Date() };
      if (name !== undefined) patch.name = name;
      if (goal !== undefined) patch.goal = goal;
      if (startDate !== undefined) patch.startDate = new Date(startDate);
      if (endDate !== undefined) patch.endDate = new Date(endDate);
      if (status !== undefined) patch.status = status;
      const [sprint] = await db
        .update(sprintsTable)
        .set(patch)
        .where(eq(sprintsTable.id, sprintId))
        .returning();
      if (!sprint) {
        return {
          content: [{ type: "text", text: `Sprint with id: ${sprintId} not found` }],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(sprint, null, 2) }],
      };
    }
  );
}