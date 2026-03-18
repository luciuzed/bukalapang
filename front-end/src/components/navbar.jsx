import React from 'react'
import { Link } from "react-router-dom"

const Navbar = () => {
  return (
    <div className="navbar py-5 flex items-center justify-between">
        <div className="logo">
            <h1>Logo</h1>
        </div>
        <ul className="menu flex items-center justify-center gap-15">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
        </ul>

        <div>
            <Link to="/login">
                <button className="bg-primary text-white font-semibold px-4 py-2 rounded-full hover:opacity-90 transition duration-300 cursor-pointer ">Login</button>
            </Link>
        </div>
    </div>
  )
}

export default Navbar