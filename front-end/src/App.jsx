import { Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import LoginPage from "./page/LoginPage"
import Dashboard from "./page/Dashboard"

function App() {
  return (
    <div className="container mx-auto px-10">
      <Navbar />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  )
}

export default App