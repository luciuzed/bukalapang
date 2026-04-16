import React from "react";
import { Link } from "react-router-dom";
import logo from '../assets/logo.svg';
import { FaInstagram, FaEnvelope } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-[#e6f7ef] border-t border-gray-100 pt-16 pb-8 px-6 mt-20 w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-primary/20">
          
          {/* Brand Section */}
          <div className="space-y-6">
            <img src={logo} alt="MainYuk Logo" className="h-20 w-auto" />
            <p className="text-gray-500 text-[13px] leading-relaxed max-w-xs">
              Platform pemesanan venue olahraga terbaik di Indonesia. Cari, klik, dan main sepuasnya tanpa ribet.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-5 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/venue" className="text-gray-500 text-sm hover:text-primary transition-colors cursor-pointer">
                  Semua Venue
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-5 uppercase tracking-wider">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/contact" className="text-gray-500 text-sm hover:text-primary transition-colors cursor-pointer">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Socials & Contact */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-5 uppercase tracking-wider">Connect</h4>
            <div className="flex flex-col gap-4">
              
              {/* Instagram Row */}
              <div className="flex items-center gap-3 text-gray-500">
                <div className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                  <FaInstagram size={18} className="text-gray-400" />
                </div>
                <span className="text-sm font-medium">MainYuk.id</span>
              </div>
              
              {/* Email Row (Styled like Instagram) */}
              <div className="flex items-center gap-3 text-gray-500">
                <div className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                  <FaEnvelope size={16} className="text-gray-400" />
                </div>
                <span className="text-sm font-medium">mainyukapp@gmail.com</span>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Bar - Centered */}
        <div className="pt-8 flex justify-center items-center">
          <p className="text-primary text-[11px] font-medium tracking-[0.15em] uppercase text-center">
            &copy; 2026 MAINYUK INDONESIA.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;