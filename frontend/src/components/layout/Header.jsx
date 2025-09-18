// src/components/layout/Header.jsx
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import {
  FaBars,
  FaTimes,
  FaBoxOpen,
  FaComments,
  FaUserCircle,
  FaSignOutAlt,
  FaSignInAlt,
  FaPlusCircle,
  FaCrown,
} from "react-icons/fa";
import NotificationBell from "../common/NotificationBell";

function NavItem({ to, icon: Icon, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isActive ? "bg-yellow-300/70 text-black" : "text-black hover:text-gray-800",
        ].join(" ")
      }
    >
      <Icon className="shrink-0" />
      <span className="truncate">{children}</span>
    </NavLink>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const { socket } = useChat();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    try {
      socket?.disconnect();
    } catch (error) {
      console.error("Error disconnecting socket:", error);
    }
    logout();
    setOpen(false);
  };

  // ปุ่ม hamburger
  const MobileToggle = (
    <button
      className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-black hover:bg-yellow-300/60 focus:outline-none"
      onClick={() => setOpen((s) => !s)}
      aria-label="Toggle menu"
      aria-expanded={open}
    >
      {open ? <FaTimes size={20} /> : <FaBars size={20} />}
    </button>
  );

  // avatar ผู้ใช้ (ถ้ามี)
  const Avatar = user?.avatar ? (
    <img
      src={user.avatar}
      alt={user.name || user.username}
      referrerPolicy="no-referrer"
      className="h-8 w-8 rounded-full object-cover border border-black/10"
    />
  ) : (
    <FaUserCircle className="h-8 w-8" />
  );

  return (
    <header className="bg-yellow-200 shadow-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-black hover:text-gray-800"
            onClick={() => setOpen(false)}
          >
            <img
              src="https://res.cloudinary.com/dmzmufy56/image/upload/v1756256872/image-Photoroom_zpj0ww.png"
              className="h-10 w-10 object-contain"
              alt="Arttoy Marketplace"
            />
            <span className="flex text-lg hidden lg:flex tracking-wide">BP Art Toy</span>
          </Link>

          {/* Right: Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <NavItem to="/products" icon={FaBoxOpen}>
              Products
            </NavItem>

            {user ? (
              <>
                <NavItem to="/post-product" icon={FaPlusCircle}>
                  Post Product
                </NavItem>

                <NavItem to="/chat" icon={FaComments}>
                  Chat
                </NavItem>

                <NavItem to={`/profile/${user?.username}`} icon={FaUserCircle}>
                  Profile
                </NavItem>

                {user.role === "admin" && (
                  <NavItem to="/admin" icon={FaCrown}>
                    Admin
                  </NavItem>
                )}

                <button
                  onClick={handleLogout}
                  className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-black hover:text-gray-800 hover:bg-yellow-300/60 transition-colors"
                >
                  <FaSignOutAlt />
                  Logout
                </button>

                <div className="ml-2">{Avatar}</div>
                <NotificationBell />
              </>
            ) : (
              <NavItem to="/login" icon={FaSignInAlt}>
                Login
              </NavItem>
            )}
          </nav>

          {/* Right: Mobile toggler */}
          {MobileToggle}
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={[
          "md:hidden bg-yellow-100 border-t border-yellow-300/60 transition-all overflow-hidden",
          open ? "max-h-[70vh] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="px-4 py-3 flex flex-col gap-1">
          <Link
            to="/products"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-yellow-300/60"
          >
            <FaBoxOpen /> Products
          </Link>

          {user ? (
            <>
              <Link
                to="/post-product"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-yellow-300/60"
              >
                <FaPlusCircle /> Post Product
              </Link>

              <Link
                to="/chat"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-yellow-300/60"
              >
                <FaComments /> Chat
              </Link>
              <Link
                to={`/profile/${user?.username}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-yellow-300/60"
              >
                <FaUserCircle /> Profile
              </Link>

              {user.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-yellow-300/60"
                >
                  <FaCrown /> Admin
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="mt-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-yellow-300/60 text-left"
              >
                <FaSignOutAlt /> Logout
              </button>
              <div className="flex items-center gap-2 px-3 py-2 mt-1">
                {Avatar}
                <div className="text-sm text-black/80 truncate">
                  {user?.name || user?.username}
                </div>
              </div>             
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-yellow-300/60"
            >
              <FaSignInAlt /> Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
