import { Routes, Route } from "react-router-dom"
import LoginPage from "./page/LoginPage"
import Dashboard from "./page/Dashboard"

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  )
}

export default App