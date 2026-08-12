"use client";

import { Users, Briefcase, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FeaturesStrip() {
  return (
    <section className="bg-[#0f4c5c] py-16 text-white px-6 relative z-30">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Heading */}
        <div className="lg:col-span-4 space-y-5 text-left">
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
            Build your dream career with us!
          </h2>
          <a href="/api/auth/login?screen_hint=signup">
            <Button className="bg-black hover:bg-gray-900 text-white font-bold px-8 py-5 rounded-lg text-sm shadow-md transition-transform hover:scale-102">
              Get In Touch
            </Button>
          </a>
        </div>

        {/* Right Overlapping Cards Grid */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white text-teal-950 p-6 rounded-xl border border-teal-900/5 shadow-lg flex flex-col justify-between space-y-4">
            <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center text-teal-700">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-sm">1-on-1 Mentorship</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed mt-2">
                Meet directly with verified grads for mock evaluations and detailed prep reviews.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white text-teal-950 p-6 rounded-xl border border-teal-900/5 shadow-lg flex flex-col justify-between space-y-4">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-sm">Direct Referrals</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed mt-2">
                Submit referral requests for jobs published directly by internal corporate alumni.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white text-teal-950 p-6 rounded-xl border border-teal-900/5 shadow-lg flex flex-col justify-between space-y-4">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-sm">AMA Panels</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed mt-2">
                Ask questions during virtual tech sessions and alumni advisory group chats.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
