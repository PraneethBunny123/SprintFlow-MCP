import { useState } from "react"

function App() {
  const [health, setHealth] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleButtonClick = async () => {
    setLoading(true)
    try {
      const response = await fetch("http://localhost:5000/health");
      const resData = await response.json()
      setHealth(resData.ok ? "Healthy" : "Unhealthy")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setHealth("Failed to connect")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col text-2xl gap-5 p-6">
      Hello SprintFlowMCP

      <div className="flex border rounded-lg bg-amber-100 p-6 items-center gap-5">
        <button onClick={handleButtonClick} className="bg-pink-300 text-white w-50 h-15 rounded-lg cursor-pointer">
          <p className="text-md">{loading ? "Checking..." : "Check Health"}</p>
        </button>
        {health && <p className="text-md text-slate-800">{health}</p>}
      </div>
    </div>
  )
}

export default App
