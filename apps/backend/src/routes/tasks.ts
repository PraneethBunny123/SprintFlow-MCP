import { Router } from "express"
import { createTask } from "@sprintflow/domain"

const router = Router()

router.post("/create", async (req, res) => {
  console.log("[/projects/create] body:", req.body);
  try {
    const input = req.body;

    if(!input.projectId) {
      return res.status(400).json({ message: "please select a project. projectId required" });
    }

    if(!input.title) {
      return res.status(400).json({ message: "title is required" });
    }

    console.log("[/tasks/create] calling createTask...");
    const result = await createTask(input);

    if(!result.ok) {
      return res.status(400).json({ message: result.message });
    }

    console.log("[/projects/create] success:", result.data);
    res.status(201).json({ message: "task created successfully", data: result.data });
  } catch (err) {
    console.error("[/tasks/create] ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router