import { Router } from "express"
import { createProject, listProjects } from "@sprintflow/domain"

const router = Router()

router.post("/", async (req, res) => {
  console.log("[/projects/create] body:", req.body);
  try {
    const { name, description } = req.body;
    if(!name) {
      return res.status(400).json({ message: "name is required" });
    }
    console.log("[/projects/create] calling createProject...");
    const project = await createProject(name, description);
    console.log("[/projects/create] success:", project);
    res.status(201).json({ message: "project created successfully", data: project });
  } catch (err) {
    console.error("[/projects/create] ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", async (_, res) => {
  try {
    console.log("[/projects/list] calling listProjects...");
    const allProjects = await listProjects()
    console.log("[/projects/list] success:", allProjects);
    res.status(200).json({ message: "get all projects", data: allProjects });
  } catch(err) {
    console.error("[/projects/list] ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
})

export default router;