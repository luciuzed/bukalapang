import React from "react";
import { Link } from "react-router-dom";
import "./navbar.css";

const Navbar = () => {
  return (
    <div className="navbar">
      <div className="navbar-content">
        <div className="logo">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h1>BUKALAPANG</h1>
            </Link>
        </div>
        <ul className="menu">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/#reserve" onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                document.getElementById('reserve')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}>Reserve</Link></li>
        </ul>

        <div>
            <button>Login</button>
        </div>
      </div>
    </div>
  )
}

export default Navbar;