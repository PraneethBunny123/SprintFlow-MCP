import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { db } from "../db/index.js";
import { projectsTable, sprintsTable, taskPriority, tasksTable, taskStatus } from "../db/schema.js";
import { and, asc, eq, isNull, sql } from "drizzle-orm";

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
      })
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

      if(sprintId) {
        const [sprint] = await db
          .select({ id: sprintsTable.id, projectId: sprintsTable.projectId })
          .from(sprintsTable)
          .where(eq(sprintsTable.id, sprintId))
          .limit(1)

        if(!sprint) {
          return {
            content: [{ type: "text", text: `Sprint with id: ${sprintId} not found` }],
          };
        }

        if(sprint.projectId !== projectId) {
          return {
            content: [{ type: "text", text: "Task projectId and sprint projectId must match" }]
          }
        }
      }
      

      const [task] = await db
        .insert(tasksTable)
        .values({
          id: crypto.randomUUID(),
          projectId,
          sprintId: sprintId ?? null,
          title,
          description: description ?? "",
          status: status ?? "pending",
          priority: priority ?? "medium",
          estimatedPoints: estimatedPoints ?? null,
          assignee: assignee ?? null,
        })
        .returning();

      return {
        content: [{type: "text", text: JSON.stringify(task, null, 2)}]
      }
    }
  )

  server.registerTool(
    "list_tasks",
    {
      title: "List tasks",
      description: "List all tasks for the specific project",
      inputSchema: z.object({
        projectId: z.string().describe("The project to list tasks for"),
      })
    },
    async ({ projectId }) => {
      const statusOrder = sql`
        CASE ${tasksTable.status}
        WHEN 'pending' THEN 0
        WHEN 'in_progress' THEN 1
        WHEN 'completed' THEN 2
        ELSE 3
        END`;

      const tasks = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.projectId, projectId))
        .orderBy(statusOrder, asc(tasksTable.createdAt))
      
      return {
        content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }]
      }
    }
  )

  server.registerTool(
    "list_backlog_tasks",
    {
      title: "List backlog tasks",
      description: "List project tasks that are not assigned to a sprint",
      inputSchema: z.object({
        projectId: z.string().describe("Project id")
      })
    },
    async ({ projectId }) => {
      const statusOrder = sql`
        CASE ${tasksTable.status}
        WHEN 'pending' THEN 0
        WHEN 'in_progress' THEN 1
        WHEN 'completed' THEN 2
        ELSE 3
        END`;

      const tasks = await db
        .select()
        .from(tasksTable)
        .where(and(eq(tasksTable.projectId, projectId), isNull(tasksTable.sprintId)))
        .orderBy(statusOrder, asc(tasksTable.createdAt));

      return {
        content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }]
      }
    }
  )

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
      const statusOrder = sql`CASE ${tasksTable.status}
        WHEN 'pending' THEN 0
        WHEN 'in_progress' THEN 1
        WHEN 'completed' THEN 2
        ELSE 3
      END`;
      const tasks = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.sprintId, sprintId))
        .orderBy(statusOrder, asc(tasksTable.createdAt));
      return {
        content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }],
      };
    }
  );

  server.registerTool(
    "move_task_to_sprint",
    {
      title: "Move task to sprint",
      description: "Assign a task to a sprint",
      inputSchema: z.object({
        taskId: z.string().describe("Task id"),
        sprintId: z.string().describe("sprint id")
      })
    },
    async ({ taskId, sprintId }) => {
      const [task] = await db
        .select({ id: tasksTable.id, projectId: tasksTable.projectId })
        .from(tasksTable)
        .where(eq(tasksTable.id, taskId))
        .limit(1);

      if (!task) {
        return {
          content: [{ type: "text", text: `Task with id: ${taskId} not found` }],
        };
      }

      const [sprint] = await db
        .select({ id: sprintsTable.id, projectId: sprintsTable.projectId })
        .from(sprintsTable)
        .where(eq(sprintsTable.id, sprintId))
        .limit(1);

      if (!sprint) {
        return {
          content: [{ type: "text", text: `Sprint with id: ${sprintId} not found` }],
        };
      }

      if (task.projectId !== sprint.projectId) {
        return {
          content: [
            { type: "text", text: "Task and sprint must belong to the same project" },
          ],
        };
      }

      const [updated] = await db
        .update(tasksTable)
        .set({ sprintId, updatedAt: new Date() })
        .where(eq(tasksTable.id, taskId))
        .returning();

      return {
        content: [{ type: "text", text: JSON.stringify(updated, null, 2) }]
      }
    }
  )

  server.registerTool(
    "move_task_to_backlog",
    {
      title: "move task to backlog",
      description: "Remove a task from sprint assignment",
      inputSchema: z.object({
        taskId: z.string().describe("Task Id")
      })
    },
    async ({ taskId }) => {
      const [updated] = await db  
        .update(tasksTable)
        .set({ sprintId: null, updatedAt: new Date() })
        .where(eq(tasksTable.id, taskId))
        .returning()

      if(!updated) {
        return {
          content: [{ type: "text", text: `Task with id: ${taskId} not found` }]
        }
      }

      return {
        content: [{ type: "text", text: JSON.stringify(updated, null, 2) }]
      }
    }
  )

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
      })
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
      const [currentTask] = await db
        .select({ id: tasksTable.id, projectId: tasksTable.projectId })
        .from(tasksTable)
        .where(eq(tasksTable.id, taskId))
        .limit(1)

      if(!currentTask) {
        return {
          content: [{ type: "text", text: `Task with id: ${taskId} not found` }]
        }
      }

      if(sprintId !== undefined) {
        const [sprint] = await db
          .select({ id: sprintsTable.id, projectId: sprintsTable.projectId })
          .from(sprintsTable)
          .where(eq(sprintsTable.id, sprintId))
          .limit(1)

        if(!sprint) {
          return {
            content: [{ type: "text", text: `Sprint with id: ${sprintId} not found` }]
          }
        }

        if(sprint.projectId !== currentTask.projectId) {
          return {
            content: [{ type: "text", text: "Task and sprint must belong to the same project" }]
          }
        }
      }

      const patch: Partial<{
        title: string;
        description: string;
        status: (typeof taskStatus)[number];
        priority: (typeof taskPriority)[number];
        sprintId: string | null;
        estimatedPoints: number | null;
        assignee: string | null;
        updatedAt: Date;
      }> = { updatedAt: new Date() };

      if (title !== undefined) patch.title = title;
      if (description !== undefined) patch.description = description;
      if (status !== undefined) patch.status = status;
      if (priority !== undefined) patch.priority = priority;
      if (sprintId !== undefined) patch.sprintId = sprintId;
      if (estimatedPoints !== undefined) patch.estimatedPoints = estimatedPoints;
      if (assignee !== undefined) patch.assignee = assignee;

      const [task] = await db
        .update(tasksTable)
        .set(patch)
        .where(eq(tasksTable.id, taskId))
        .returning()

      return {
        content: [{ type: "text", text: JSON.stringify(task, null, 2) }]
      }
    }
  )

  server.registerTool(
    "delete_task",
    {
      title: "Delete a task",
      description: "Delete a task by id",
      inputSchema: z.object({
        taskId: z.string().describe("The task to delete")
      })
    },
    async ({ taskId }) => {
      const [task] = await db
        .delete(tasksTable)
        .where(eq(tasksTable.id, taskId))
        .returning()

      if (!task) {
        return {
          content: [
            { type: "text", text: `Task not found` },
          ],
        };
      }

      return {
        content: [{ type: "text", text:  `Task ${task.title} deleted successfully` }]
      }
    }
  )
}