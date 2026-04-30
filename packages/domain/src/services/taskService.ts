import { db } from "../db/index.js";
import {
  projectsTable,
  sprintsTable,
  taskPriority,
  tasksTable,
  taskStatus,
  TasksTable as TasksTableSelect
} from "../db/schema.js";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";

export type TaskServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

function statusOrderClause() {
  return sql`
    CASE ${tasksTable.status}
      WHEN 'pending' THEN 0
      WHEN 'in_progress' THEN 1
      WHEN 'completed' THEN 2
      ELSE 3
    END`;
}

/** Create a task after validating project and optional sprint. */
export async function createTask(input: {
  projectId: string;
  title: string;
  description?: string | undefined;
  status?: (typeof taskStatus)[number] | undefined;
  priority?: (typeof taskPriority)[number] | undefined;
  sprintId?: string | undefined;
  estimatedPoints?: number | undefined;
  assignee?: string | undefined;
}): Promise<TaskServiceResult<TasksTableSelect>> {
  const {
    projectId,
    title,
    description,
    status,
    priority,
    sprintId,
    estimatedPoints,
    assignee,
  } = input;

  const [project] = await db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId))
    .limit(1);

  if (!project) {
    return {
      ok: false,
      message: `project with id: ${projectId} not found`,
    };
  }

  if (sprintId) {
    const [sprint] = await db
      .select({ id: sprintsTable.id, projectId: sprintsTable.projectId })
      .from(sprintsTable)
      .where(eq(sprintsTable.id, sprintId))
      .limit(1);

    if (!sprint) {
      return { ok: false, message: `Sprint with id: ${sprintId} not found` };
    }

    if (sprint.projectId !== projectId) {
      return {
        ok: false,
        message: "Task projectId and sprint projectId must match",
      };
    }
  }

  let nextSortOrder = 0;

  if (sprintId) {
    const rows = await db
      .select({ sortOrder: tasksTable.sortOrder })
      .from(tasksTable)
      .where(eq(tasksTable.sprintId, sprintId));

    const maxOrder = rows.reduce((acc, r) => Math.max(acc, r.sortOrder ?? -1), -1);
    nextSortOrder = maxOrder + 1;
  } else {
    const rows = await db
      .select({ sortOrder: tasksTable.sortOrder })
      .from(tasksTable)
      .where(and(eq(tasksTable.projectId, projectId), isNull(tasksTable.sprintId)));

    const maxOrder = rows.reduce((acc, r) => Math.max(acc, r.sortOrder ?? -1), -1);
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

  if (!task) {
    return { ok: false, message: "Failed to create task" };
  }

  return { ok: true, data: task };
}

export async function listTasks(
  projectId: string
): Promise<TasksTableSelect[]> {
  const order = statusOrderClause();
  return db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.projectId, projectId))
    .orderBy(asc(tasksTable.sortOrder), order, asc(tasksTable.createdAt));
}

export async function listBacklogTasks(
  projectId: string,
): Promise<TasksTableSelect[]> {
  const order = statusOrderClause();
  return db
    .select()
    .from(tasksTable)
    .where(and(eq(tasksTable.projectId, projectId), isNull(tasksTable.sprintId)))
    .orderBy(asc(tasksTable.sortOrder), order, asc(tasksTable.createdAt));
}

export async function listSprintTasks(
  sprintId: string,
): Promise<TasksTableSelect[]> {
  const order = statusOrderClause();
  return db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.sprintId, sprintId))
    .orderBy(asc(tasksTable.sortOrder), order, asc(tasksTable.createdAt));
}

export async function moveTaskToSprint(
  taskId: string,
  sprintId: string,
): Promise<TaskServiceResult<TasksTableSelect>> {
  const [task] = await db
    .select({ id: tasksTable.id, projectId: tasksTable.projectId })
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId))
    .limit(1);

  if (!task) {
    return { ok: false, message: `Task with id: ${taskId} not found` };
  }

  const [sprint] = await db
    .select({ id: sprintsTable.id, projectId: sprintsTable.projectId })
    .from(sprintsTable)
    .where(eq(sprintsTable.id, sprintId))
    .limit(1);

  if (!sprint) {
    return { ok: false, message: `Sprint with id: ${sprintId} not found` };
  }

  if (task.projectId !== sprint.projectId) {
    return {
      ok: false,
      message: "Task and sprint must belong to the same project",
    };
  }

  const laneRows = await db
    .select({ sortOrder: tasksTable.sortOrder })
    .from(tasksTable)
    .where(eq(tasksTable.sprintId, sprintId));

  const maxOrder = laneRows.reduce((acc, r) => Math.max(acc, r.sortOrder ?? -1), -1);
  const nextSortOrder = maxOrder + 1;

  const [updated] = await db
    .update(tasksTable)
    .set({ sprintId, sortOrder: nextSortOrder, updatedAt: new Date() })
    .where(eq(tasksTable.id, taskId))
    .returning();

  if (!updated) {
    return { ok: false, message: `Unable to move the task with id: ${taskId}` };
  }

  return { ok: true, data: updated };
}

export async function moveTaskToBacklog(
  taskId: string,
): Promise<TaskServiceResult<TasksTableSelect>> {
  const [task] = await db
    .select({ id: tasksTable.id, projectId: tasksTable.projectId })
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId))
    .limit(1);

  if (!task) {
    return { ok: false, message: `Task with id: ${taskId} not found` };
  }

  const laneRows = await db
    .select({ sortOrder: tasksTable.sortOrder })
    .from(tasksTable)
    .where(and(eq(tasksTable.projectId, task.projectId), isNull(tasksTable.sprintId)));

  const maxOrder = laneRows.reduce((acc, r) => Math.max(acc, r.sortOrder ?? -1), -1);
  const nextSortOrder = maxOrder + 1;

  const [updated] = await db
    .update(tasksTable)
    .set({
      sprintId: null,
      sortOrder: nextSortOrder,
      updatedAt: new Date(),
    })
    .where(eq(tasksTable.id, taskId))
    .returning();

  if (!updated) {
    return { ok: false, message: `Unable to update the task with id: ${taskId}` };
  }

  return { ok: true, data: updated };
}

export async function reorderTasks(input: {
  projectId: string;
  sprintId?: string | undefined;
  taskIds: string[];
}): Promise<TaskServiceResult<TasksTableSelect[]>> {
  const { projectId, sprintId, taskIds } = input;

  const rows = await db
    .select({
      id: tasksTable.id,
      projectId: tasksTable.projectId,
      sprintId: tasksTable.sprintId,
    })
    .from(tasksTable)
    .where(inArray(tasksTable.id, taskIds));

  if (rows.length !== taskIds.length) {
    return { ok: false, message: "One or more taskIds were not found" };
  }

  for (const t of rows) {
    if (t.projectId !== projectId) {
      return {
        ok: false,
        message: "All tasks must belong to the provided projectId",
      };
    }

    if (sprintId) {
      if (t.sprintId !== sprintId) {
        return {
          ok: false,
          message: "All tasks must belong to the provided sprintId lane",
        };
      }
    } else if (t.sprintId !== null) {
      return {
        ok: false,
        message: "When sprintId is omitted, all tasks must be backlog tasks",
      };
    }
  }

  for (let i = 0; i < taskIds.length; i++) {
    await db
      .update(tasksTable)
      .set({ sortOrder: i, updatedAt: new Date() })
      .where(eq(tasksTable.id, taskIds[i]!));
  }

  const ordered = await db
    .select()
    .from(tasksTable)
    .where(
      sprintId
        ? and(eq(tasksTable.projectId, projectId), eq(tasksTable.sprintId, sprintId))
        : and(eq(tasksTable.projectId, projectId), isNull(tasksTable.sprintId)),
    )
    .orderBy(asc(tasksTable.sortOrder), asc(tasksTable.createdAt));

  return { ok: true, data: ordered };
}

export async function updateTask(input: {
  taskId: string;
  title?: string | undefined;
  description?: string | undefined;
  status?: (typeof taskStatus)[number] | undefined;
  priority?: (typeof taskPriority)[number] | undefined;
  sprintId?: string | undefined;
  estimatedPoints?: number | undefined;
  assignee?: string | undefined;
}): Promise<TaskServiceResult<TasksTableSelect>> {
  const {
    taskId,
    title,
    description,
    status,
    priority,
    sprintId,
    estimatedPoints,
    assignee,
  } = input;

  const [currentTask] = await db
    .select({ id: tasksTable.id, projectId: tasksTable.projectId })
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId))
    .limit(1);

  if (!currentTask) {
    return { ok: false, message: `Task with id: ${taskId} not found` };
  }

  if (sprintId !== undefined) {
    const [sprint] = await db
      .select({ id: sprintsTable.id, projectId: sprintsTable.projectId })
      .from(sprintsTable)
      .where(eq(sprintsTable.id, sprintId))
      .limit(1);

    if (!sprint) {
      return {
        ok: false,
        message: `Sprint with id: ${sprintId} not found`,
      };
    }

    if (sprint.projectId !== currentTask.projectId) {
      return {
        ok: false,
        message: "Task and sprint must belong to the same project",
      };
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
    .returning();

  if (!task) {
    return { ok: false, message: `Unable to update the task with id: ${taskId}` };
  }

  return { ok: true, data: task };
}

export async function deleteTask(
  taskId: string,
): Promise<TaskServiceResult<TasksTableSelect>> {
  const [task] = await db
    .delete(tasksTable)
    .where(eq(tasksTable.id, taskId))
    .returning();

  if (!task) {
    return { ok: false, message: `Unable to delete the task` };
  }

  return { ok: true, data: task };
}
