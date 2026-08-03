"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-teal-900/10 py-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left focus:outline-none"
      >
        <span className="font-sans font-bold text-lg md:text-xl text-teal-955 hover:text-teal-700 transition-colors">
          {question}
        </span>
        <ChevronDown className={`w-5 h-5 text-teal-700 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="text-slate-650 text-sm md:text-base mt-3 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function FAQSection() {
  const faqs = [
    {
      question: "How is the integrity of registered alumni ensured?",
      answer: "All registering alumni must provide their academic emails or link their LinkedIn profile. Our admin team manually reviews and verifies registration details against university graduation registries before granting posting privileges on the portal."
    },
    {
      question: "Are mentorship engagements financially structured?",
      answer: "No, all mentorship engagements, resume evaluations, and AMA panels are offered voluntarily without financial expectations, upholding our foundational mission of fostering corporate-student synergy."
    },
    {
      question: "Can alumni post career openings directly?",
      answer: "Absolutely. Verified alumni access a personalized dashboard to publish vacancies, intern slots, or project milestones to recruit promising talent from the student body."
    },
    {
      question: "What is the process to schedule virtual sessions?",
      answer: "Alumni publish calendar blocks to the portal. Students can select available times, outline their discussion topics (e.g., mock interview or resume feedback), and instantly reserve a meeting slot."
    }
  ];

  return (
    <section id="faq" className="py-24 bg-[#f6f3eb] px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block bg-teal-50 text-teal-800 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider mb-2">
            FAQ
          </div>
          <h2 className="text-4xl font-bold text-teal-950">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <FAQItem key={idx} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
