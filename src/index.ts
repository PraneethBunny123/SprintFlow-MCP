import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Project } from "./lib/types.js";

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
    const projectId = crypto.randomUUID();
    const project: Project = {
      id: projectId,
      name,
      description: description || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SprintFlow MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});