import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  createTask,
  deleteTask,
  listBacklogTasks,
  listSprintTasks,
  listTasks,
  moveTaskToBacklog,
  moveTaskToSprint,
  reorderTasks,
  taskPriority,
  taskStatus,
  updateTask,
} from "@sprintflow/domain";

export function registerTaskTools(server: McpServer) {
  server.registerTool(
    "create_task",
    {
      title: "Create a task",
      description: "Create a new task under a project",
      inputSchema: z.object({
        projectId: z.string().describe("The project this task belongs to"),
        title: z.string().describe("The title of the task"),
        description: z.string().optional().describe("The description of the task"),
        status: z.enum(taskStatus).optional().describe("Task status"),
        priority: z.enum(taskPriority).optional().describe("Task priority"),
        sprintId: z.string().optional().describe("Optional sprint id"),
        estimatedPoints: z.number().int().nonnegative().optional().describe("Story points estimated"),
        assignee: z.string().optional().describe("Task assignee"),
      }),
    },
    async ({
      projectId,
      title,
      description,
      status,
      priority,
      sprintId,
      estimatedPoints,
      assignee,
    }) => {
      const result = await createTask({
        projectId,
        title,
        description,
        status,
        priority,
        sprintId,
        estimatedPoints,
        assignee,
      });

      if (!result.ok) {
        return { content: [{ type: "text", text: result.message }] };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
      };
    },
  );

  server.registerTool(
    "list_tasks",
    {
      title: "List tasks",
      description: "List all tasks for the specific project",
      inputSchema: z.object({
        projectId: z.string().describe("The project to list tasks for"),
      }),
    },
    async ({ projectId }) => {
      const tasks = await listTasks(projectId);
      return {
        content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }],
      };
    },
  );

  server.registerTool(
    "list_backlog_tasks",
    {
      title: "List backlog tasks",
      description: "List project tasks that are not assigned to a sprint",
      inputSchema: z.object({
        projectId: z.string().describe("Project id"),
      }),
    },
    async ({ projectId }) => {
      const tasks = await listBacklogTasks(projectId);
      return {
        content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }],
      };
    },
  );

  server.registerTool(
    "list_sprint_tasks",
    {
      title: "List sprint tasks",
      description: "List tasks assigned to a sprint",
      inputSchema: z.object({
        sprintId: z.string().describe("Sprint id"),
      }),
    },
    async ({ sprintId }) => {
      const tasks = await listSprintTasks(sprintId);
      return {
        content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }],
      };
    },
  );

  server.registerTool(
    "move_task_to_sprint",
    {
      title: "Move task to sprint",
      description: "Assign a task to a sprint",
      inputSchema: z.object({
        taskId: z.string().describe("Task id"),
        sprintId: z.string().describe("sprint id"),
      }),
    },
    async ({ taskId, sprintId }) => {
      const result = await moveTaskToSprint(taskId, sprintId);

      if (!result.ok) {
        return { content: [{ type: "text", text: result.message }] };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
      };
    },
  );

  server.registerTool(
    "move_task_to_backlog",
    {
      title: "move task to backlog",
      description: "Remove a task from sprint assignment",
      inputSchema: z.object({
        taskId: z.string().describe("Task Id"),
      }),
    },
    async ({ taskId }) => {
      const result = await moveTaskToBacklog(taskId);

      if (!result.ok) {
        return { content: [{ type: "text", text: result.message }] };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
      };
    },
  );

  server.registerTool(
    "reorder_tasks",
    {
      title: "Reorder tasks",
      description:
        "Rewrite sort order for tasks in one lane (either backlog of project or one sprint)",
      inputSchema: z.object({
        projectId: z.string().describe("Project id for validation"),
        sprintId: z.string().optional().describe("If provided reorder inside this sprint lane"),
        taskIds: z.array(z.string()).min(1).describe("Task ids in desired top-to-bottom order"),
      }),
    },
    async ({ projectId, sprintId, taskIds }) => {
      const result = await reorderTasks({ projectId, sprintId, taskIds });

      if (!result.ok) {
        return { content: [{ type: "text", text: result.message }] };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
      };
    },
  );

  server.registerTool(
    "update_task",
    {
      title: "Update a task",
      description: "Update teh status, priority or details of the task",
      inputSchema: z.object({
        taskId: z.string().describe("The task to be updated"),
        title: z.string().optional().describe("New title"),
        description: z.string().optional().describe("New description"),
        status: z.enum(taskStatus).optional().describe("New status"),
        priority: z.enum(taskPriority).optional().describe("New priority"),
        sprintId: z.string().optional().describe("New sprint id"),
        estimatedPoints: z.number().int().nonnegative().optional().describe("New estimate"),
        assignee: z.string().optional().describe("New assignee"),
      }),
    },
    async ({
      taskId,
      title,
      description,
      status,
      priority,
      sprintId,
      estimatedPoints,
      assignee,
    }) => {
      const result = await updateTask({
        taskId,
        title,
        description,
        status,
        priority,
        sprintId,
        estimatedPoints,
        assignee,
      });

      if (!result.ok) {
        return { content: [{ type: "text", text: result.message }] };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
      };
    },
  );

  server.registerTool(
    "delete_task",
    {
      title: "Delete a task",
      description: "Delete a task by id",
      inputSchema: z.object({
        taskId: z.string().describe("The task to delete"),
      }),
    },
    async ({ taskId }) => {
      const result = await deleteTask(taskId);

      if (!result.ok) {
        return { content: [{ type: "text", text: result.message }] };
      }

      return {
        content: [
          { type: "text", text: `Task ${result.data.title} deleted successfully` },
        ],
      };
    },
  );
}
