import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerTaskTools } from "./tools/tasks.js";
import { registerSprintTools } from "./tools/sprints.js";
import { registerDependencyTools } from "./tools/dependencies.js";

// Create server instance
const server = new McpServer({
  name: "sprintflow-mcp",
  version: "1.0.0",
});

registerProjectTools(server);
registerTaskTools(server);
registerSprintTools(server);
registerDependencyTools(server);


async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SprintFlow MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});