import "dotenv/config"
import cors from "cors"
import express from "express"

const app = express()
const PORT = process.env.PORT

// middleware
app.use(cors({
  origin: process.env.CLIENT_URL
}))
app.use(express.json())

app.get('/health', (_, res) => {
  res.json({ok: true, timestamp: new Date().toISOString()})
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})