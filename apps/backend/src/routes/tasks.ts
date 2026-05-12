import { Router } from "express"
import { createTask, deleteTask, listBacklogTasks, listSprintTasks, listTasks, moveTaskToBacklog, moveTaskToSprint, reorderTasks, updateTask } from "@sprintflow/domain"

const router = Router()

router.post("/", async (req, res) => {
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

    console.log("[/tasks/create] success:", result.data);
    res.status(201).json({ message: "task created successfully", data: result.data });
  } catch (err) {
    console.error("[/tasks/create] ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  console.log("[/tasks?projectId] query:", req.query);
  try {
    const { projectId } = req.query;

    if(!projectId || typeof projectId !== "string") {
      return res.status(400).json({ message: "please select a project. projectId required" });
    }

    console.log("[/tasks?projectId] calling listTasks...");
    const tasks = await listTasks(projectId);

    console.log("[/tasks?projectId] success:", tasks);
    res.status(200).json({ message: "get all tasks", data: tasks });
  } catch (err) {
    console.error("[/tasks?projectId] ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/backlog", async (req, res) => {
  console.log("[/tasks/backlog?projectId] query:", req.query);
  try {
    const { projectId } = req.query;

    if(!projectId || typeof projectId !== "string") {
      return res.status(400).json({ message: "please select a project. projectId required" });
    }

    console.log("[/tasks/backlog?projectId] calling listBacklogTasks...");
    const backlogs = await listBacklogTasks(projectId);

    console.log("[/tasks/backlog?projectId] success:", backlogs);
    res.status(200).json({ message: "get backlog tasks", data: backlogs });
  } catch (err) {
    console.error("[/tasks/backlog?projectId] ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/reorder", async (req, res) => {
  try {
    const { projectId, sprintId, taskIds } = req.body;

    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({
        message: "projectId is required",
      });
    }

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        message: "taskIds must be a non-empty array",
      });
    }

    const result = await reorderTasks({
      projectId,
      sprintId,
      taskIds,
    });

    if (!result.ok) {
      return res.status(400).json({
        message: result.message,
      });
    }

    res.status(200).json({
      message: "Tasks reordered successfully",
      data: result.data,
    });
  } catch (err) {
    console.error("[/tasks/reorder] ERROR:", err);

    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.patch("/:id/move", async (req, res) => {
  try {
    const { id } = req.params
    const { sprintId } = req.body

    if(!sprintId) {
      return res.status(400).json({ message: "sprintId required" });
    }

    const result = await moveTaskToSprint(id, sprintId)

    if (!result.ok) {
      return res.status(400).json({
        message: result.message,
      });
    }

    res.json({
      message: "Task moved successfully",
      data: result.data,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Internal server error",
    });
  }
})

router.patch("/:id/backlog", async (req, res) => {
  try {
    const { id } = req.params

    const result = await moveTaskToBacklog(id)

    if (!result.ok) {
      return res.status(400).json({
        message: result.message,
      });
    }

    res.json({
      message: "Task moved successfully",
      data: result.data,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Internal server error",
    });
  }
})

router.get("/sprint/:sprintId", async (req, res) => {
  console.log("[GET /tasks/sprint/:sprintId] params:", req.params);
  try {
    const { sprintId } = req.params;

    if (!sprintId) {
      return res.status(400).json({ message: "sprintId is required" });
    }

    const tasks = await listSprintTasks(sprintId);

    return res.status(200).json({
      message: "sprint tasks fetched successfully",
      data: tasks,
    });
  } catch (err) {
    console.error("[GET /tasks/sprint/:sprintId] ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:taskId", async (req, res) => {
  console.log("[PATCH /tasks/:taskId] params:", req.params);
  console.log("[PATCH /tasks/:taskId] body:", req.body);

  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({
        message: "taskId is required",
      });
    }

    const result = await updateTask({
      taskId,
      ...req.body,
    });

    if (!result.ok) {
      return res.status(400).json({
        message: result.message,
      });
    }

    return res.status(200).json({
      message: "task updated successfully",
      data: result.data,
    });
  } catch (err) {
    console.error("[PATCH /tasks/:taskId] ERROR:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.delete("/:taskId", async (req, res) => {
  console.log("[DELETE /tasks/:taskId] params:", req.params);

  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({
        message: "taskId is required",
      });
    }

    const result = await deleteTask(taskId);

    if (!result.ok) {
      return res.status(400).json({
        message: result.message,
      });
    }

    return res.status(200).json({
      message: "task deleted successfully",
      data: result.data,
    });
  } catch (err) {
    console.error("[DELETE /tasks/:taskId] ERROR:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router