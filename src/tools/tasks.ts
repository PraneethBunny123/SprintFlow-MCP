import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { db } from "@sprintflow/domain/src/db/index.js";
import { projectsTable, sprintsTable, taskPriority, tasksTable, taskStatus } from "@sprintflow/domain/src/db/schema.js";
import { and, asc, eq, isNull, sql, inArray } from "drizzle-orm";

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
      
      let nextSortOrder = 0;

      if(sprintId) {
        const rows = await db
          .select({ sortOrder: tasksTable.sortOrder })
          .from(tasksTable)
          .where(eq(tasksTable.sprintId, sprintId))

        const maxOrder = rows.reduce((acc, r) => Math.max(acc, r.sortOrder ?? -1), -1)
        nextSortOrder = maxOrder + 1;
      } else {
        const rows = await db 
          .select({ sortOrder: tasksTable.sortOrder })
          .from(tasksTable)
          .where(and(eq(tasksTable.projectId, projectId), isNull(tasksTable.sprintId)))

        const maxOrder = rows.reduce((acc, r) => Math.max(acc, r.sortOrder ?? -1), -1)
        nextSortOrder = maxOrder + 1;
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
          sortOrder: nextSortOrder,
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
        .orderBy(
          asc(tasksTable.sortOrder),
          statusOrder, 
          asc(tasksTable.createdAt)
        )
      
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
        .orderBy(
          asc(tasksTable.sortOrder),
          statusOrder, 
          asc(tasksTable.createdAt)
        );

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
        .orderBy(
          asc(tasksTable.sortOrder),
          statusOrder, 
          asc(tasksTable.createdAt)
        );
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

      const laneRows = await db
        .select({ sortOrder: tasksTable.sortOrder })
        .from(tasksTable)
        .where(eq(tasksTable.sprintId, sprintId));

      const maxOrder = laneRows.reduce((acc, r) => Math.max(acc, r.sortOrder ?? -1),-1);
      const nextSortOrder = maxOrder + 1;

      const [updated] = await db
        .update(tasksTable)
        .set({ sprintId, sortOrder: nextSortOrder, updatedAt: new Date() })
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

      // Backlog lane = same project + sprintId is null
      const laneRows = await db
        .select({ sortOrder: tasksTable.sortOrder })
        .from(tasksTable)
        .where(and(eq(tasksTable.projectId, task.projectId), isNull(tasksTable.sprintId)));

      const maxOrder = laneRows.reduce((acc, r) => Math.max(acc, r.sortOrder ?? -1),-1);
      const nextSortOrder = maxOrder + 1;

      const [updated] = await db  
        .update(tasksTable)
        .set({ sprintId: null, sortOrder: nextSortOrder, updatedAt: new Date() })
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
    "reorder_tasks",
    {
      title: "Reorder tasks",
      description: "Rewrite sort order for tasks in one lane (either backlog of project or one sprint)",
      inputSchema: z.object({
        projectId: z.string().describe("Project id for validation"),
        sprintId: z.string().optional().describe("If provided reorder inside this sprint lane"),
        taskIds: z.array(z.string()).min(1).describe("Task ids in desired top-to-bottom order") 
      })
    },
    async ({ projectId, sprintId, taskIds }) => {
      // Fetch and validate tasks exist
      const tasks = await db
        .select({ id: tasksTable.id, projectId: tasksTable.projectId, sprintId: tasksTable.sprintId })
        .from(tasksTable)
        .where(inArray(tasksTable.id, taskIds))
      
      if(tasks.length !== taskIds.length) {
        return {
          content: [{ type: "text", text: "One or more taskIds were not found" }]
        }
      }

      // Validate lane + project consistency
      for(const t of tasks) {
        if(t.projectId !== projectId) {
          return {
            content: [{ type: "text", text: "All tasks must belong to the provided projectId" }]
          }
        }

        if(sprintId) {
          if(t.sprintId !== sprintId) {
            return {
              content: [{ type: "text", text: "All tasks must belong to the provided sprintId lane" }]
            }
          }
        } else {
          if(t.sprintId !== null) {
            return {
              content: [{ type: "text", text: "When sprintId is omitted, all tasks must be backlog tasks" }],
            };
          }
        }
      }

      // Apply order according to taskIds sequence
      for(let i=0; i<taskIds.length; i++) {
        await db
          .update(tasksTable)
          .set({ sortOrder: i , updatedAt: new Date()})
          .where(eq(tasksTable.id, taskIds[i]))
      }

      // Return ordered lane for confirmation
      const ordered = await db
        .select()
        .from(tasksTable)
        .where(
          sprintId 
            ? and(eq(tasksTable.projectId, projectId), eq(tasksTable.sprintId, sprintId))
            : and(eq(tasksTable.projectId, projectId), isNull(tasksTable.sprintId))
        )
        .orderBy(asc(tasksTable.sortOrder), asc(tasksTable.createdAt))

      return {
        content: [{ type: "text", text: JSON.stringify(ordered, null, 2) }]
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