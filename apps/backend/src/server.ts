import "dotenv/config"
import express from "express"

const app = express()
const PORT = process.env.PORT || 5000

// middleware
app.use(express.json())

app.get('/health', (_, res) => {
  res.json({ok: true, timestamp: new Date().toISOString()})
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})