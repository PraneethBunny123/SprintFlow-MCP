import { db } from "../db/index.js"
import { 
  projectsTable, 
  ProjectsTable as ProjectsTableSelect 
} from "../db/schema.js";

export async function createProject(
  name: string, 
  description: string | undefined
) : Promise<ProjectsTableSelect> {
  const [project] = await db
    .insert(projectsTable)
    .values({
      id: crypto.randomUUID(),
      name,
      description: description || ""
    })
    .returning();

  return project;
}

export async function listProjects() : Promise<ProjectsTableSelect[]> {
  const allProjects = await db
    .select()
    .from(projectsTable);

  return allProjects;
}
