import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create server instance
const server = new McpServer({
  name: "sprintflow-mcp",
  version: "1.0.0",
});

server.tool("add-numbers", 
  {
    a: z.number().describe("First Number"),
    b: z.number().describe("second Number"),
  }, 
  ({a,b}) => {
    return {
      content: [{type: "text", text: `Total is ${a+b}`}]
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