import "./load-env.js"
import cors from "cors"
import express from "express";
import projectsRoute from "./routes/projects.js"
import tasksRoute from "./routes/tasks.js"

// Catch anything that escapes try/catch
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 UNHANDLED REJECTION:', reason);
});

const app = express()
const PORT = process.env.PORT

// middleware
app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(express.json())

// routes
app.use("/projects", projectsRoute);
app.use("/tasks", tasksRoute);

app.get('/health', (_, res) => {
  res.json({ok: true, timestamp: new Date().toISOString()})
})

const server = app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})

server.on('error', (err) => {
  console.error('🔥 SERVER ERROR:', err);
})