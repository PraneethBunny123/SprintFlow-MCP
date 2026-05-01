import { 
  projectsTable, 
  sprintsTable, 
  sprintStatus,  
  SprintsTable as SprintsTableSelect
} from "../db/schema.js";
import { db } from "@sprintflow/domain/src/db/index.js";
import { eq, asc } from "drizzle-orm";

export type SprintServiceResult<T> = 
  | {ok: true, data: T}
  | {ok: false, message: string}

export async function createSprint(input: {
  projectId: string, 
  name: string, 
  goal: string | undefined, 
  startDate: string, 
  endDate: string, 
  status: typeof sprintStatus[number] | undefined
}) : Promise<SprintServiceResult<SprintsTableSelect>>{
  const {
    projectId,
    name,
    goal,
    startDate,
    endDate,
    status
  } = input

  const [project] = await db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId))
    .limit(1)
  
  if(!project) {
    return { ok: false, message: `project with id: ${projectId} not found` }
  }

  const [sprint] = await db
    .insert(sprintsTable)
    .values({
      id: crypto.randomUUID(),
      projectId,
      name,
      goal: goal ?? "",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: status ?? "planned"
    })
    .returning()

  return { ok: true, data: sprint }
}

export async function listSprints(
  projectId: string
) : Promise<SprintsTableSelect[]>{
  const sprints = await db
    .select()
    .from(sprintsTable)
    .where(eq(sprintsTable.projectId, projectId))
    .orderBy(asc(sprintsTable.startDate));

  return sprints
}

export async function updateSprint(input: {
  sprintId: string, 
  name: string | undefined, 
  goal: string | undefined, 
  startDate: string | undefined, 
  endDate: string | undefined, 
  status: typeof sprintStatus[number] | undefined
}) : Promise<SprintServiceResult<SprintsTableSelect>>{
  const {
    sprintId,
    name,
    goal,
    startDate,
    endDate,
    status
  } = input

  const patch: Partial<{
    name: string;
    goal: string;
    startDate: Date;
    endDate: Date;
    status: (typeof sprintStatus)[number];
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (name !== undefined) patch.name = name;
  if (goal !== undefined) patch.goal = goal;
  if (startDate !== undefined) patch.startDate = new Date(startDate);
  if (endDate !== undefined) patch.endDate = new Date(endDate);
  if (status !== undefined) patch.status = status;

  const [sprint] = await db
    .update(sprintsTable)
    .set(patch)
    .where(eq(sprintsTable.id, sprintId))
    .returning();

  if (!sprint) {
    return { ok: false, message: `Sprint with id: ${sprintId} not found` };
  }

  return { ok: true, data: sprint }
}