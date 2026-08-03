"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function SplitSections() {
  return (
    <section id="features" className="py-24 bg-[#f6f3eb] px-6 space-y-28">
      <div className="max-w-6xl mx-auto space-y-28">

        {/* Block 1: Left Card List, Right Text */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Card: Freelancer Select List */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 bg-white border border-teal-900/10 p-6 sm:p-8 rounded-3xl shadow-xl space-y-4 text-left"
          >
            <div className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">Select a Mentor to hire</div>
            
            {/* Profile Item 1 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" className="object-cover w-full h-full" alt="" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-805">Arjun Kumar</h5>
                  <p className="text-[10px] text-slate-400">Software at Google</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">Verified</span>
              </div>
            </div>

            {/* Profile Item 2 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" className="object-cover w-full h-full" alt="" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-805">Sneha Kumar</h5>
                  <p className="text-[10px] text-slate-400">Product at Microsoft</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">Verified</span>
              </div>
            </div>

            {/* Profile Item 3 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100" className="object-cover w-full h-full" alt="" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-805">Vikram Dev</h5>
                  <p className="text-[10px] text-slate-400">Data at Netflix</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">Verified</span>
              </div>
            </div>

          </motion.div>

          {/* Right Text */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-6 space-y-6 text-left"
          >
            <h3 className="text-4xl font-bold tracking-tight text-teal-950">
              Hire Faster with Trusted Talent
            </h3>
            <p className="text-teal-900/80 leading-relaxed text-sm">
              Unlock direct career placements and referral pipelines. Connect with verified alumni inside elite tech entities who actively post openings and mentor the student cohort.
            </p>
            <div>
              <Link href="/api/auth/login">
                <Button className="bg-[#f3b13a] hover:bg-[#d89c30] text-teal-950 font-bold px-8 py-4 rounded-lg text-sm flex items-center gap-2">
                  <span>Meet Now</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

        </div>

        {/* Block 2: Left Text, Right Graph Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Text */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 order-2 lg:order-1 space-y-6 text-left"
          >
            <h3 className="text-4xl font-bold tracking-tight text-teal-950">
              Reduce career risks & friction
            </h3>
            <p className="text-teal-900/80 leading-relaxed text-sm">
              Skip cold outreach paradigms and blind online applications. Rely on verified credentials, peer preparation blocks, and structured learning roadmaps built by specialists.
            </p>
          </motion.div>

          {/* Right Card: Referrals Chart indicator */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-6 order-1 lg:order-2 bg-white border border-teal-900/10 p-6 rounded-3xl shadow-xl text-left"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Career Referrals Overview</span>
              <span className="text-xs font-bold text-teal-700">Active Pipelines</span>
            </div>
            <div className="h-40 bg-teal-50/50 rounded-2xl flex items-center justify-center p-6 border border-teal-900/5 mt-4">
              <BarChart3 className="w-12 h-12 text-[#0f4c5c]" />
            </div>
          </motion.div>

        </div>

        {/* Block 3: Left Account Summary Card, Right Text */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Card: Account Summary Card widget */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 bg-white border border-teal-900/10 p-8 rounded-3xl shadow-xl text-left max-w-sm mx-auto"
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Active Member Profile</div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" className="object-cover w-full h-full" alt="" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-808">Sofia Lopez</h4>
                <p className="text-xs text-slate-400 mt-0.5">VP Engineering at Stripe</p>
              </div>
              <div className="text-sm font-semibold text-teal-950 bg-teal-50 px-3 py-1 rounded-full">Pedigree Verified</div>
              <Button className="bg-[#0f4c5c] hover:bg-[#0b3a47] text-white w-full rounded-lg py-2.5 text-xs">
                Active Member
              </Button>
            </div>
          </motion.div>

          {/* Right Text */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-6 space-y-6 text-left"
          >
            <h3 className="text-4xl font-bold tracking-tight text-teal-950">
              Unlock pedigree verified credentials
            </h3>
            <p className="text-teal-900/80 leading-relaxed text-sm">
              Ensure absolute identity trust. Every single alumnus is verified against graduation registers before being authorized to submit referrals or host video syncs.
            </p>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
