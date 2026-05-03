import { Router } from "express"
import { createProject } from "@sprintflow/domain"

const router = Router()

router.get("/", async (req, res) => {
  try {
    const { name, description } = req.body

    if(!name) {
      return res.status(400).json({
        message: "name is required"
      })
    }

    const project = await createProject(name, description)

    res.status(201).json({
      message: "project created successfully",
      data: project
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: "Internal server error"
    })
  }
})

export default router;