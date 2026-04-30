import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createProject, listProjects } from "@sprintflow/domain";

export function registerProjectTools(server: McpServer) {
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
      const project = await createProject(name, description)
  
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
      const allProjects = await listProjects()
      
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
}