import { Router } from "express";
import {
  addTaskDependency,
  removeTaskDependency,
  listTaskDependency,
  listBlockedTasks,
} from "@sprintflow/domain";

const router = Router();

router.post("/", async (req, res) => {
  console.log("[POST /dependencies] body:", req.body);

  try {
    const { blockedTaskId, blockerTaskId } = req.body;

    if (!blockedTaskId) {
      return res.status(400).json({
        message: "blockedTaskId is required",
      });
    }

    if (!blockerTaskId) {
      return res.status(400).json({
        message: "blockerTaskId is required",
      });
    }

    const result = await addTaskDependency(
      blockedTaskId,
      blockerTaskId,
    );

    if (!result.ok) {
      return res.status(400).json({
        message: result.message,
      });
    }

    return res.status(201).json({
      message: "dependency added successfully",
      data: result.data,
    });
  } catch (err) {
    console.error("[POST /dependencies] ERROR:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.delete("/", async (req, res) => {
  console.log("[DELETE /dependencies] body:", req.body);

  try {
    const { blockedTaskId, blockerTaskId } = req.body;

    if (!blockedTaskId) {
      return res.status(400).json({
        message: "blockedTaskId is required",
      });
    }

    if (!blockerTaskId) {
      return res.status(400).json({
        message: "blockerTaskId is required",
      });
    }

    const result = await removeTaskDependency(
      blockedTaskId,
      blockerTaskId,
    );

    if (!result.ok) {
      return res.status(404).json({
        message: result.message,
      });
    }

    return res.status(200).json({
      message: "dependency removed successfully",
      data: result.data,
    });
  } catch (err) {
    console.error("[DELETE /dependencies] ERROR:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/:taskId", async (req, res) => {
  console.log("[GET /dependencies/:taskId] params:", req.params);

  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({
        message: "taskId is required",
      });
    }

    const dependencies = await listTaskDependency(taskId);

    return res.status(200).json({
      message: "dependencies fetched successfully",
      data: dependencies,
    });
  } catch (err) {
    console.error("[GET /dependencies/:taskId] ERROR:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

//
// LIST BLOCKED TASKS
//
router.get("/blocked/list", async (req, res) => {
  console.log("[GET /dependencies/blocked/list] query:", req.query);

  try {
    const { projectId, sprintId } = req.query;

    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({
        message: "projectId is required",
      });
    }

    const result = await listBlockedTasks(
      projectId,
      typeof sprintId === "string" ? sprintId : undefined,
    );

    if (!result.ok) {
      return res.status(400).json({
        message: result.message,
      });
    }

    return res.status(200).json({
      message: "blocked tasks fetched successfully",
      data: result.data,
    });
  } catch (err) {
    console.error("[GET /dependencies/blocked/list] ERROR:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;