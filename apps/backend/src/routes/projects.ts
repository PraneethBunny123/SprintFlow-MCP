import { Router } from "express"
import { createProject } from "@sprintflow/domain"

const router = Router()

router.post("/create", async (req, res) => {
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

export default router;