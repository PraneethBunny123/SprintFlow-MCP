import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { db } from "./db/index.js";
import { projectsTable } from "./db/schema.js";

// Create server instance
const server = new McpServer({
  name: "sprintflow-mcp",
  version: "1.0.0",
});

server.registerTool(
  "create_project", 
  {
    title: "Create a new project",
    description: "Create a new project",
    inputSchema: z.object({
      name: z.string().describe("The name of the project"),
      description: z.string().optional().describe("The description of the project"),
    })
  }, 
  async ({name, description}) => {
    const [project] = await db
      .insert(projectsTable)
      .values({
        id: crypto.randomUUID(),
        name,
        description: description || ""
      })
      .returning();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(project, null, 2)
        }
      ]
    }
  }
)

server.registerTool(
  "list_projects",
  {
    title: "List all projects",
    description: "Fetch all existing projects",
    inputSchema: z.object({})
  },
  async () => {
    const allProjects = await db
      .select()
      .from(projectsTable);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(allProjects, null, 2)
        }
      ]
    }
  }
)

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SprintFlow MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});