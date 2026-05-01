import { db } from "../db/index.js";
import { 
  taskDependenciesTable, 
  tasksTable, 
  TaskDependenciesTable as TaskDependenciesTableSelect,
  TasksTable as TasksTableSelect
} from "../db/schema.js";
import { and, eq, isNull, inArray } from "drizzle-orm";

export type DependencyServiceResult<T> = 
  | { ok: true, data: T }
  | { ok: false, message: string }

export type BlockedTasksResult<T> = 
  | { ok: true, data: T }
  | { ok: false, message: string }

export async function addTaskDependency(
  blockedTaskId: string,
  blockerTaskId: string
) : Promise<DependencyServiceResult<TaskDependenciesTableSelect>> {
  if(blockedTaskId === blockerTaskId) {
    return { ok: false, message: "Task cannot depend on itself" }
  }

  const tasks = await db
    .select({ id: tasksTable.id, projectId: tasksTable.projectId })
    .from(tasksTable)
    .where(inArray(tasksTable.id, [blockedTaskId, blockerTaskId]))

  if (tasks.length !== 2) {
    return { ok: false, message: "One or both task ids not found" };
  }

  const blocked = tasks.find((t) => t.id === blockedTaskId)
  const blocker = tasks.find((t) => t.id === blockerTaskId)

  if(blocked?.projectId !== blocker?.projectId) {
    return { ok: false, message: "Dependencies must be inside same project" };
  } 

  const reverse = await db
    .select({ id: taskDependenciesTable.id })
    .from(taskDependenciesTable)
    .where(and(
      eq(taskDependenciesTable.blockedTaskId, blockerTaskId),
      eq(taskDependenciesTable.blockerTaskId, blockedTaskId),
    ))

  if(reverse.length > 0) {
    return { ok: false, message: "Reverse dependency already exists (cycle)" };
  }

  const [edge] = await db
    .insert(taskDependenciesTable)
    .values({
      id: crypto.randomUUID(),
      blockedTaskId,
      blockerTaskId
    })
    .returning();

  return { ok: true, data: edge }
}

export async function removeTaskDependency(
  blockedTaskId: string,
  blockerTaskId: string
) : Promise<DependencyServiceResult<TaskDependenciesTableSelect>> {
  const [deleted] = await db
    .delete(taskDependenciesTable)
    .where(
      and(
        eq(taskDependenciesTable.blockedTaskId, blockedTaskId),
        eq(taskDependenciesTable.blockerTaskId, blockerTaskId),
      )
    )
    .returning()

  if(!deleted) {
    return { ok: false, message: "Dependency not found" }
  }

  return { ok: true, data: deleted }
}

export async function listTaskDependency(
  taskId: string,
) : Promise<TaskDependenciesTableSelect[]> {
  const blockers = await db
    .select()
    .from(taskDependenciesTable)
    .where(eq(taskDependenciesTable.blockedTaskId, taskId))

  return blockers
}

export async function listBlockedTasks(
  projectId: string, 
  sprintId: string | undefined
) : Promise<BlockedTasksResult<TasksTableSelect[]>> {
  const allProjectTasks = await db
    .select({ id: tasksTable.id, sprintId: tasksTable.sprintId })
    .from(tasksTable)
    .where(eq(tasksTable.projectId, projectId))

  const laneTaskIds = allProjectTasks
    .filter((t) => (sprintId ? t.sprintId === sprintId : t.sprintId === null))
    .map((t) => t.id)

  if(laneTaskIds.length === 0) {
    return { ok: false, message: "[]" }
  }

  const blockedEdges = await db
    .select()
    .from(taskDependenciesTable)
    .where(inArray(taskDependenciesTable.blockedTaskId, laneTaskIds))

  const blockedSet = new Set(blockedEdges.map((e) => e.blockedTaskId))

  const blockedTasks = await db
    .select()
    .from(tasksTable)
    .where(inArray(tasksTable.id, [...blockedSet]))

  return { ok: true, data: blockedTasks }
}