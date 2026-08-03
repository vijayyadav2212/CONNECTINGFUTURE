"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0f4c5c] text-white/80 py-16 border-t border-teal-900/10">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/NEWCNLOGO.png" 
              alt="Connecting Future Logo" 
              className="h-10 w-auto object-contain brightness-0 invert"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white leading-none">Alumnex</span>
              <span className="text-[9px] text-teal-200/80 font-medium tracking-wide mt-1">Connecting Future</span>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            Bridging the gap between active alumni and current students to create lasting connections.
          </p>
        </div>

        <div>
          <h5 className="font-bold text-sm tracking-wider uppercase text-[#f3b13a] mb-4">Platform</h5>
          <ul className="space-y-2 text-sm text-slate-200">
            <li><Link href="/alumni/Directory" className="hover:text-white">Alumni Directory</Link></li>
            <li><Link href="/alumni/mentorship" className="hover:text-white">Mentorship Portal</Link></li>
            <li><Link href="/alumni/job-posting" className="hover:text-white">Job Hub</Link></li>
            <li><Link href="/alumni/events" className="hover:text-white">Events Directory</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-sm tracking-wider uppercase text-[#f3b13a] mb-4">Resources</h5>
          <ul className="space-y-2 text-sm text-slate-200">
            <li><Link href="/alumni/blog" className="hover:text-white">Success Stories</Link></li>
            <li><Link href="/alumni/roadmap" className="hover:text-white">Career Roadmaps</Link></li>
            <li><Link href="/alumni/donation" className="hover:text-white">Donations & Support</Link></li>
            <li><Link href="/alumni/ama" className="hover:text-white">AMA Forums</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-sm tracking-wider uppercase text-[#f3b13a] mb-4">Support</h5>
          <ul className="space-y-2 text-sm text-slate-200">
            <li><Link href="/alumni/settings" className="hover:text-white">Account Settings</Link></li>
            <li><Link href="#" className="hover:text-white">Help Desk</Link></li>
            <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link href="#" className="hover:text-white">Terms of Use</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-300">
        <p>&copy; {new Date().getFullYear()} Alumnex Portal. All rights reserved.</p>
        <p className="flex items-center mt-2 sm:mt-0">
          Made with <Heart className="w-3.5 h-3.5 mx-1 text-rose-500 fill-rose-500 animate-pulse" /> for future generations.
        </p>
      </div>
    </footer>
  );
}
