"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative w-full bg-[#f6f3eb] pt-12 pb-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column Text content */}
        <div className="lg:col-span-7 space-y-8 text-left">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-teal-950 leading-[1.08]">
            Elite Pedigree <br />
            <span className="relative inline-block text-teal-955">
              Alumni Network
              <span className="absolute bottom-1 left-0 w-full h-[6px] bg-[#f3b13a] rounded-full z-[-1] opacity-60"></span>
            </span>
          </h1>
          
          <p className="text-teal-900/80 text-sm sm:text-base md:text-lg max-w-xl leading-relaxed">
            Boost your professional growth with our 1-to-1 active mentoring and direct referral pipelines. Connecting students with verified graduates.
          </p>

          {/* Email Input Node matching Sercio */}
          <div className="max-w-md w-full bg-white border border-teal-900/10 p-2 rounded-xl flex items-center shadow-md">
            <input 
              type="email" 
              placeholder="Type Your Email" 
              className="bg-transparent text-slate-800 placeholder:text-slate-405 text-sm outline-none px-3 py-2 flex-grow min-w-0"
            />
            <a href="/api/auth/login?screen_hint=signup">
              <Button className="bg-[#f3b13a] hover:bg-[#d89c30] text-teal-950 font-bold px-6 py-5 rounded-lg text-sm shadow-sm transition-transform active:scale-[0.98]">
                Contact Me
              </Button>
            </a>
          </div>
        </div>

        {/* Right Column Portrait Graphic surrounded by Sercio widgets */}
        <div className="lg:col-span-5 relative min-h-[500px] flex items-end justify-center">
          
          {/* Center Portrait Image (Graduate Student Cutout/Photo) */}
          <div className="relative z-10 w-80 sm:w-96 md:w-[390px] h-[480px] sm:h-[540px] overflow-visible mix-blend-multiply">
            <img 
              src="/graduating_student_cutout.png" 
              alt="Graduating Student"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Floating Widget 1: Alumni Directory Card (Upper Left - Closer) */}
          <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
              transition={{ 
                x: { duration: 0.5 },
                y: { repeat: Infinity, duration: 5, ease: "easeInOut" }
              }}
              className="absolute top-[12%] -left-4 sm:-left-8 z-30 bg-white border border-teal-900/10 p-3 sm:p-4 rounded-xl shadow-lg flex items-center space-x-3 max-w-[170px]"
            >
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 font-bold text-sm">A</div>
              <div className="text-left">
                <div className="text-[10px] font-bold text-slate-800">Alumni Directory</div>
                <div className="text-[8px] text-slate-450">Active search</div>
              </div>
          </motion.div>

          {/* Floating Widget 2: Referral accepted (Bottom Left - Higher Up & Closer) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, 6, 0] }}
            transition={{ 
              y: { repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.2 }
            }}
            className="absolute bottom-[35%] -left-8 sm:-left-12 z-30 bg-white border border-teal-900/10 p-3.5 rounded-xl shadow-lg text-left min-w-[150px]"
          >
            <div className="text-[12px] font-extrabold text-teal-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Referral Approved
            </div>
            <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-slate-100">
              <div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center text-[8px] text-teal-700 font-bold">M</div>
              <span className="text-[9px] text-slate-500 font-medium">Session Booked</span>
            </div>
          </motion.div>

          {/* Floating Widget 3: Spend Overview columns (Right Side - Higher Up & Closer) */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0, y: [0, -5, 0] }}
            transition={{ 
              x: { duration: 0.5 },
              y: { repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.1 }
            }}
            className="absolute top-[30%] -right-4 sm:-right-8 z-30 bg-white border border-teal-900/10 p-3.5 rounded-xl shadow-lg text-left min-w-[140px]"
          >
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Spend Overview</div>
            <div className="h-14 flex items-end gap-1.5 justify-center mt-3">
              <div className="w-2 h-6 bg-teal-100 rounded-t"></div>
              <div className="w-2 h-10 bg-teal-200 rounded-t"></div>
              <div className="w-2 h-14 bg-[#0f4c5c] rounded-t"></div>
              <div className="w-2 h-8 bg-teal-300 rounded-t"></div>
            </div>
          </motion.div>

          {/* Floating Widget 4: Round Graph Widget (Upper Right - Closer) */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0, y: [0, 5, 0] }}
            transition={{ 
              x: { duration: 0.5 },
              y: { repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 0.3 }
            }}
            className="absolute top-[8%] right-2 sm:right-4 z-30 bg-white border border-teal-900/10 p-3 rounded-xl shadow-lg flex items-center justify-center w-12 h-12"
          >
            <div className="w-8 h-8 rounded-full border-4 border-t-violet-650 border-r-slate-100 border-b-slate-100 border-l-slate-100 animate-spin" style={{ animationDuration: "3s" }} />
          </motion.div>

        </div>

      </div>
    </section>
  );
}
