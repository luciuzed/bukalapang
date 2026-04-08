import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  const links = [
    { to: "/", label: "Home" },
    { to: "/reserve", label: "Venue" },
    { to: "/about", label: "Contact" },
  ];

  const isActive = (path) => {
    if (path === "/reserve") return location.pathname === "/reserve" || location.pathname.startsWith("/venue");
    return location.pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
      <div className="max-w-[1100px] mx-auto px-6 h-[72px] flex items-center justify-between relative">
        <Link to="/" className="no-underline flex-shrink-0">
          <span className="text-[22px] font-extrabold text-[#00A859] italic tracking-tight leading-none">
            MAIN<br />YUK!
          </span>
        </Link>

        <ul className="hidden md:flex list-none gap-8 absolute left-1/2 -translate-x-1/2 m-0 p-0">
          {links.map(link => (
            <li key={link.to}>
              <Link to={link.to}
                className={`text-[15px] font-semibold no-underline pb-1 border-b-2 transition-all duration-200 ${
                  isActive(link.to)
                    ? "text-[#00A859] border-[#00A859]"
                    : "text-gray-500 border-transparent hover:text-[#00A859]"
                }`}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link to="/login" className="flex-shrink-0 text-[15px] font-semibold text-[#00A859] no-underline hover:text-[#008f4c] transition-colors">
          Login
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;