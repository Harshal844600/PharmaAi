import { motion } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import PharmaGuardLogo from "./PharmaGuardLogo";

const navItems = [
  { label: "Analyze", path: "/" },
  { label: "History", path: "/history" },
  { label: "Settings", path: "/settings" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-white/[0.04] bg-[#030303]/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#030303]/50"
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

      <div className="container flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3 group">
          <PharmaGuardLogo size={36} className="group-hover:scale-105 transition-transform" />
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold tracking-tight text-white">
              Pharma<span className="text-red-500">Guard</span>
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-red-500/60 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
              v2
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative text-sm font-medium px-4 py-2 rounded-lg transition-all duration-300 ${isActive
                  ? "text-white bg-white/[0.06]"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                  }`}
              >
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}

          <div className="w-px h-6 bg-white/[0.06] mx-2" />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-xs font-semibold text-white shadow-lg glow-red-sm hover:glow-red transition-all duration-300"
          >
            <Zap className="h-3.5 w-3.5" />
            Sign In
          </motion.button>
        </nav>

        {/* Mobile Menu Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </motion.button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-white/[0.04] bg-[#050505]/95 backdrop-blur-xl px-6 py-4 space-y-1"
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-base font-medium px-4 py-3 rounded-lg transition-all ${location.pathname === item.path
                ? "text-red-500 bg-red-500/10"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
            >
              {item.label}
            </Link>
          ))}
        </motion.div>
      )}
    </motion.header>
  );
}
