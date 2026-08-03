"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  user: any;
}

export default function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#f6f3eb]/95 backdrop-blur-md border-b border-teal-900/5 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-3 group">
          <img 
            src="/NEWCNLOGO.png" 
            alt="Connecting Future Logo" 
            className="h-10 w-auto object-contain transition-transform group-hover:scale-102 mix-blend-multiply"
          />
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-teal-950 font-sans leading-none">Alumnex</span>
            <span className="text-[9px] text-teal-900/65 font-medium tracking-wide mt-1">Connecting Future</span>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-sm font-semibold text-teal-900/80 hover:text-teal-950 transition-colors">What we do</Link>
          <Link href="#about" className="text-sm font-semibold text-teal-900/80 hover:text-teal-950 transition-colors">Our Impact</Link>
          <Link href="#features" className="text-sm font-semibold text-teal-900/80 hover:text-teal-950 transition-colors">Our Services</Link>
          <Link href="#timeline" className="text-sm font-semibold text-teal-900/80 hover:text-teal-950 transition-colors">Our Process</Link>
        </nav>
        
        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <Link href="/api/auth/login?returnTo=/post-login">
                <Button className="bg-[#0f4c5c] hover:bg-[#0b3a47] text-white rounded-lg px-6 py-5 font-semibold text-sm shadow-md">
                  Dashboard
                </Button>
              </Link>
              <a href="/api/auth/logout">
                <Button variant="outline" className="border-teal-900/10 text-teal-950 rounded-lg hover:bg-teal-950/5">
                  Logout
                </Button>
              </a>
            </>
          ) : (
            <a href="/api/auth/login">
              <Button className="bg-[#0f4c5c] hover:bg-[#0b3a47] text-white rounded-lg px-6 py-5 font-semibold text-sm shadow-md">
                Contact Us
              </Button>
            </a>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-teal-950 focus:outline-none hover:text-teal-700"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu Container */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden bg-[#f6f3eb] border-t border-teal-900/5 px-6 py-6 space-y-4 shadow-inner"
          >
            <nav className="flex flex-col space-y-3">
              <Link 
                href="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-teal-900/80 hover:text-teal-950 py-1"
              >
                What we do
              </Link>
              <Link 
                href="#about" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-teal-900/80 hover:text-teal-950 py-1"
              >
                Our Impact
              </Link>
              <Link 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-teal-900/80 hover:text-teal-950 py-1"
              >
                Our Services
              </Link>
              <Link 
                href="#timeline" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-teal-900/80 hover:text-teal-950 py-1"
              >
                Our Process
              </Link>
            </nav>
            <div className="pt-4 border-t border-teal-900/10 flex flex-col gap-3">
              {user ? (
                <>
                  <Link href="/api/auth/login?returnTo=/post-login" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-[#0f4c5c] hover:bg-[#0b3a47] text-white rounded-lg py-5 font-semibold text-sm shadow-md">
                      Dashboard
                    </Button>
                  </Link>
                  <a href="/api/auth/logout" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-teal-900/20 text-teal-950 rounded-lg py-5 hover:bg-teal-950/5">
                      Logout
                    </Button>
                  </a>
                </>
              ) : (
                <a href="/api/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-[#0f4c5c] hover:bg-[#0b3a47] text-white rounded-lg py-5 font-semibold text-sm shadow-md">
                    Contact Us
                  </Button>
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
