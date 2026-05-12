import { Router } from "express";
import {
  createSprint,
  listSprints,
  updateSprint,
} from "@sprintflow/domain";

const router = Router();

router.post("/", async (req, res) => {
  console.log("[POST /sprints] body:", req.body);

  try {
    const input = req.body;

    if (!input.projectId) {
      return res.status(400).json({
        message: "projectId is required",
      });
    }

    if (!input.name) {
      return res.status(400).json({
        message: "name is required",
      });
    }

    if (!input.startDate) {
      return res.status(400).json({
        message: "startDate is required",
      });
    }

    if (!input.endDate) {
      return res.status(400).json({
        message: "endDate is required",
      });
    }

    const result = await createSprint(input);

    if (!result.ok) {
      return res.status(400).json({
        message: result.message,
      });
    }

    return res.status(201).json({
      message: "sprint created successfully",
      data: result.data,
    });
  } catch (err) {
    console.error("[POST /sprints] ERROR:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/", async (req, res) => {
  console.log("[GET /sprints] query:", req.query);

  try {
    const { projectId } = req.query;

    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({
        message: "projectId is required",
      });
    }

    const sprints = await listSprints(projectId);

    return res.status(200).json({
      message: "sprints fetched successfully",
      data: sprints,
    });
  } catch (err) {
    console.error("[GET /sprints] ERROR:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.patch("/:sprintId", async (req, res) => {
  console.log("[PATCH /sprints/:sprintId] params:", req.params);
  console.log("[PATCH /sprints/:sprintId] body:", req.body);

  try {
    const { sprintId } = req.params;

    if (!sprintId) {
      return res.status(400).json({
        message: "sprintId is required",
      });
    }

    const result = await updateSprint({
      sprintId,
      ...req.body,
    });

    if (!result.ok) {
      return res.status(400).json({
        message: result.message,
      });
    }

    return res.status(200).json({
      message: "sprint updated successfully",
      data: result.data,
    });
  } catch (err) {
    console.error("[PATCH /sprints/:sprintId] ERROR:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;