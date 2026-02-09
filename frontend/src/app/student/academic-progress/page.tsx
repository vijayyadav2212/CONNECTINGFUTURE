"use client";

import React, { useEffect, useState, useRef } from "react";
import StudentNavigation from "../StudentNavigation";
import { GraduationCap, Pencil, Briefcase, TrendingUp, Award, BookOpen, Clock, CheckCircle, Circle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

/* ------------------ HOOKS ------------------ */
function useIntersectionObserver(elementRef: React.RefObject<Element | null>, threshold = 0.1) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(element);
    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [elementRef, threshold]);

  return isIntersecting;
}

function useAnimatedCounter(end: number, duration = 2000, trigger = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // specific for GPA which might be float
      if (end % 1 !== 0) {
        setCount(Number((progress * end).toFixed(2)));
      } else {
        setCount(Math.floor(progress * end));
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration, trigger]);

  return count;
}


/* ------------------ TYPES ------------------ */
interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  grade: string;
  status: "completed" | "in-progress" | "upcoming";
}

interface Semester {
  id: string;
  name: string;
  gpa: number;
  courses: Course[];
}

/* ------------------ SUB-COMPONENTS ------------------ */

const StatCard = ({ icon: Icon, value, label, color, delay, isVisible }: {
  icon: any;
  value: string | number;
  label: string;
  color: "blue" | "green" | "purple" | "orange";
  delay: string;
  isVisible: boolean;
}) => {
  const colorClasses = {
    blue: 'bg-blue-500 shadow-blue-200',
    green: 'bg-emerald-500 shadow-emerald-200',
    purple: 'bg-purple-500 shadow-purple-200',
    orange: 'bg-orange-500 shadow-orange-200'
  };

  const bgClasses = {
    blue: 'bg-blue-50 hover:bg-blue-100/80',
    green: 'bg-emerald-50 hover:bg-emerald-100/80',
    purple: 'bg-purple-50 hover:bg-purple-100/80',
    orange: 'bg-orange-50 hover:bg-orange-100/80'
  };

  return (
    <div
      className={`group relative p-6 rounded-2xl border-0 ${bgClasses[color]} transition-all duration-500 hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} />
        </div>
        {color === 'green' && <div className="text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full text-xs font-bold">+0.2</div>}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <h3 className="text-3xl font-bold text-gray-800 tracking-tight">{value}</h3>
      </div>
    </div>
  );
};


const CourseCard = ({ course, delay }: { course: Course, delay: number }) => {
  const statusConfig = {
    completed: { color: 'text-emerald-700 bg-emerald-100 border-emerald-200', icon: CheckCircle },
    'in-progress': { color: 'text-blue-700 bg-blue-100 border-blue-200', icon: Clock }, // animate-pulse removed from here to avoid text jitter, can add to dot
    upcoming: { color: 'text-gray-600 bg-gray-100 border-gray-200', icon: Circle },
  };

  const StatusIcon = statusConfig[course.status].icon;

  return (
    <div
      className="group flex flex-col md:flex-row md:items-center justify-between p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300 hover:-translate-x-1 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center gap-4 mb-4 md:mb-0">
        <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
          {course.code.replace(/[0-9]/g, '')}
        </div>
        <div>
          <h4 className="font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">{course.name}</h4>
          <p className="text-sm text-gray-500">{course.code} • {course.credits} Credits</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Grade</span>
          <span className={`font-bold ${course.grade === 'A' || course.grade === 'A+' ? 'text-emerald-600' : 'text-gray-700'}`}>
            {course.grade}
          </span>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border ${statusConfig[course.status].color}`}>
          <StatusIcon size={14} className={course.status === 'in-progress' ? 'animate-spin-slow' : ''} />
          <span className="capitalize">{course.status.replace('-', ' ')}</span>
        </div>
      </div>
    </div>
  );
};


/* ------------------ COMPONENT ------------------ */
export default function AcademicProgress() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [editOpen, setEditOpen] = useState(false);

  // Refs

  const statsRef = useRef<HTMLDivElement>(null);
  const semesterRef = useRef<HTMLDivElement>(null);
  const coursesRef = useRef<HTMLDivElement>(null);

  // Intersection Observers

  const showStats = useIntersectionObserver(statsRef);
  const showSemester = useIntersectionObserver(semesterRef);

  // Data
  const semesters: Semester[] = [
    {
      id: "sem6",
      name: "Semester 6",
      gpa: 8.5,
      courses: [
        { id: "c1", name: "Data Structures & Algorithms", code: "CS301", credits: 4, grade: "A", status: "completed" },
        { id: "c2", name: "Database Management Systems", code: "CS302", credits: 3, grade: "B+", status: "in-progress" },
        { id: "c3", name: "Operating Systems", code: "CS303", credits: 3, grade: "-", status: "in-progress" },
        { id: "c4", name: "Computer Networks", code: "CS304", credits: 4, grade: "-", status: "upcoming" },
      ],
    },
  ];

  const overallGpa = semesters.reduce((s, x) => s + x.gpa, 0) / semesters.length;
  // Ensure animatedGpa is treated as number for StatCard, although useAnimatedCounter returns number
  const animatedGpa = useAnimatedCounter(overallGpa, 1500, showStats);
  const totalCredits = 120; // Mock data
  const creditsEarned = useAnimatedCounter(86, 2000, showStats);

  // Mouse move effect for background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <StudentNavigation>
      <div className="relative min-h-screen overflow-hidden bg-gray-50/50">

        {/* ANIMATED BACKGROUND BLOBS */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-float"
            style={{ transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)` }}
          />
          <div
            className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-purple-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-float"
            style={{
              animationDelay: '2s',
              transform: `translate(${-mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
            }}
          />
          <div
            className="absolute bottom-[-10%] left-[20%] w-[45rem] h-[45rem] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-float"
            style={{
              animationDelay: '4s',
              transform: `translate(${mousePosition.x * 0.01}px, ${-mousePosition.y * 0.02}px)`
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="relative bg-gradient-to-br from-blue-100/60 via-green-100/50 to-orange-100/40 backdrop-blur-lg rounded-3xl p-8 lg:p-10 shadow-xl border border-white/30 overflow-hidden">
              {/* Subtle background pattern */}
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>

              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Label */}
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-700 font-semibold text-sm">Academic Journey</span>
                    </div>

                    {/* Main Title */}
                    <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3">
                      Academic Progress
                    </h1>

                    {/* Subtitle */}
                    <p className="text-gray-700 text-base lg:text-lg max-w-2xl mb-4">
                      Track your journey and achievements.
                    </p>
                  </div>

                  {/* Edit Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditOpen(true)}
                    className="hidden md:flex items-center gap-2 bg-white/70 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-white/40"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">Edit Goals</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* STATS GRID */}
          <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard
              icon={TrendingUp}
              value={animatedGpa} // Will display nicely even if float
              label="Overall CGPA"
              color="blue"
              delay="0"
              isVisible={showStats}
            />
            <StatCard
              icon={BookOpen}
              value={creditsEarned}
              label="Credits Earned"
              color="green"
              delay="100"
              isVisible={showStats}
            />
            <StatCard
              icon={Briefcase}
              value={semesters[0].name}
              label="Current Semester"
              color="purple"
              delay="200"
              isVisible={showStats}
            />
            <StatCard
              icon={Award}
              value="Top 10%"
              label="Class Rank"
              color="orange"
              delay="300"
              isVisible={showStats}
            />
          </div>

          {/* MAIN CONTENT SPLIT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT COLUMN: SEMESTER OVERVIEW & COURSES */}
            <div className="lg:col-span-2 space-y-8">

              {/* CURRENT SEMESTER HEADER */}
              <div
                ref={semesterRef}
                className={`bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-xl transition-all duration-700
                        ${showSemester ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Current Semester</h2>
                    <p className="text-indigo-500 font-medium">{semesters[0].name} • 2024-2025</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="text-3xl font-bold text-gray-800">{semesters[0].gpa}</span>
                    <span className="text-sm text-gray-400 block uppercase tracking-wider">Target GPA</span>
                  </div>
                </div>

                {/* Course List */}
                <div ref={coursesRef} className="space-y-4">
                  {semesters[0].courses.map((course, index) => (
                    <CourseCard key={course.id} course={course} delay={index * 100} />
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: INSIGHTS / ALERTS */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-2xl shadow-indigo-200 transform hover:scale-[1.02] transition-transform duration-500">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Award className="w-6 h-6 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">Scholarship Eligible</h3>
                    <p className="text-indigo-100 text-sm leading-relaxed">
                      Your GPA of 8.5 qualifies you for the "Dean's List" scholarship next semester!
                    </p>
                  </div>
                </div>
                <button className="w-full py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
                  Apply Now
                </button>
              </div>

              <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertCircle size={18} className="text-orange-500" />
                  Upcoming Deadlines
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-center min-w-[3rem]">
                      <span className="block text-xs text-gray-400 uppercase font-bold">Feb</span>
                      <span className="block text-lg font-bold text-gray-800">15</span>
                    </div>
                    <div className="w-px h-8 bg-gray-100"></div>
                    <div>
                      <p className="font-semibold text-gray-700 text-sm">Course Registration</p>
                      <p className="text-xs text-gray-400">Fall 2025 Semester</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-center min-w-[3rem]">
                      <span className="block text-xs text-gray-400 uppercase font-bold">Feb</span>
                      <span className="block text-lg font-bold text-gray-800">28</span>
                    </div>
                    <div className="w-px h-8 bg-gray-100"></div>
                    <div>
                      <p className="font-semibold text-gray-700 text-sm">Exam Schedule</p>
                      <p className="text-xs text-gray-400">Finals for Sem 6</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* EDIT MODAL */}
        {editOpen && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all scale-100">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Pencil className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Edit Mode</h3>
                <p className="text-gray-500 mt-2">
                  Backend connection is currently disabled for this demo.
                </p>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="w-full py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
              >
                Got it
              </button>
            </div>
          </div>
        )}

      </div>
    </StudentNavigation>
  );
}
