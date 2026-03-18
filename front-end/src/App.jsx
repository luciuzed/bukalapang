import { Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import LoginPage from "./page/LoginPage"
import HomePage from "./page/HomePage"
import BookingDetailPage from "./page/BookingDetailPage"

function App() {
  return (
    <div className="container mx-auto px-10">
      <Navbar />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<HomePage />} />
        <Route path="/about/:id" element={<BookingDetailPage />} />
      </Routes>
    </div>
    
  )
}

export default App