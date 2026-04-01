import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

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

server.registerTool("get-github-repos", 
  {
    title: "Get GitHub Repos",
    description: "Get the repositories of a GitHub user",
    inputSchema: z.object({
      username: z.string().describe("The username of the GitHub user"),
    }),
  }, 
  async ({username}) => {
    const repos = await fetch(`https://api.github.com/users/${username}/repos`, {
      headers: {"User-Agent": "SprintFlow-MCP"}
    })

    if(!repos.ok) throw new Error("Github API Error");
    const resData = await repos.json();

    const repoList = resData.map((repo: any, i: number) => `${i+1}. ${repo.name}`).join("\n\n");
    
    return {
      content: [
        {
          type: "text", 
          text: `Github repos for ${username}: (${resData.length} repos): \n\n${repoList}`
        }
      ]
    };
  }
)

server.registerResource(
  "system-policies",
  "rules://all",
  {
    description: "resources for the system policies",
    mimeType: "text/plain",
  },
  async (uri) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const rules = await fs.readFile(
      path.resolve(__dirname, "../src/data/rules.doc"), "utf-8"
    );
    return {
      contents: [
        {
          uri: uri.toString(),
          mimeType: "text/plain",
          text: rules,
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