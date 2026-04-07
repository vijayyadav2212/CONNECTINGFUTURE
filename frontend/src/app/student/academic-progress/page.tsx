"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import StudentNavigation from "../StudentNavigation/StudentNavigation";
import { useAuthToken } from '../../../../contexts/AuthTokenContext';
import apiClient from '../../../lib/apiClient';
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
  semester_key?: string;
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
  const [reloadCounter, setReloadCounter] = useState(0);

  const [semesterForm, setSemesterForm] = useState({
    semester_key: '',
    name: '',
    gpa: '',
    total_credits: '',
    is_current: true,
  });
  const [selectedSemesterKey, setSelectedSemesterKey] = useState('');
  const [courseForm, setCourseForm] = useState({
    course_key: '',
    name: '',
    code: '',
    credits: '',
    grade: '',
    status: 'upcoming',
    progress: '',
  });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [showCourseForm, setShowCourseForm] = useState(false);

  // Refs

  const statsRef = useRef<HTMLDivElement>(null);
  const semesterRef = useRef<HTMLDivElement>(null);
  const coursesRef = useRef<HTMLDivElement>(null);

  // Intersection Observers

  const showStats = useIntersectionObserver(statsRef);
  const showSemester = useIntersectionObserver(semesterRef);

  // Data
  const { user, isAuthenticated } = useAuthToken();
  const [semesters, setSemesters] = useState<Semester[]>([
    {
      id: 'sem6',
      semester_key: 'sem6',
      name: 'Semester 6',
      gpa: 8.5,
      courses: [
        { id: 'c1', name: 'Data Structures & Algorithms', code: 'CS301', credits: 4, grade: 'A', status: 'completed' },
        { id: 'c2', name: 'Database Management Systems', code: 'CS302', credits: 3, grade: 'B+', status: 'in-progress' },
        { id: 'c3', name: 'Operating Systems', code: 'CS303', credits: 3, grade: '-', status: 'in-progress' },
        { id: 'c4', name: 'Computer Networks', code: 'CS304', credits: 4, grade: '-', status: 'upcoming' },
      ],
    },
  ]);

  const overallGpa = semesters.length ? semesters.reduce((s, x) => s + (Number(x.gpa) || 0), 0) / semesters.length : 0;
  // Ensure animatedGpa is treated as number for StatCard, although useAnimatedCounter returns number
  const animatedGpa = useAnimatedCounter(overallGpa, 1500, showStats);
  const totalCredits = 120; // Keep as fallback
  const creditsEarned = useAnimatedCounter(semesters.reduce((acc, s) => acc + (s.courses ? s.courses.reduce((a,c)=>a+(c.credits||0),0) : 0), 0), 2000, showStats);

  // Fetch real data from backend when user is available
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) return;
      try {
        const auth0Id = user.sub || user.user_id || user?.id;
        if (!auth0Id) return;
        const resp = await apiClient.get(`/academic/semesters?auth0_id=${encodeURIComponent(auth0Id)}`);
        if (cancelled) return;
          if (resp && resp.semesters && Array.isArray(resp.semesters) && resp.semesters.length) {
            const mapped = resp.semesters.map((s: any) => ({
              id: s.id || s.semester_key || String(Math.random()),
              semester_key: s.semester_key || (s.id ? String(s.id) : ''),
              name: s.name || s.semester_key || '',
              gpa: s.gpa != null ? Number(s.gpa) : 0,
              courses: [],
            }));
            setSemesters(mapped);
            // default select the first semester
            setSelectedSemesterKey(mapped[0].semester_key || mapped[0].id);

          // Fetch courses for the first semester as an initial load
          const first = resp.semesters[0];
            if (first && first.semester_key) {
            try {
              const cResp = await apiClient.get(`/academic/courses?auth0_id=${encodeURIComponent(auth0Id)}&semester_key=${encodeURIComponent(first.semester_key)}`);
              if (!cancelled && cResp && Array.isArray(cResp.courses)) {
                  setSemesters(prev => prev.map(p => ((p.semester_key === first.semester_key || p.id === (first.id || first.semester_key) || p.name === first.name) ? { ...p, courses: cResp.courses.map((c: any) => ({ id: String(c.id), name: c.name, code: c.code, credits: Number(c.credits || 0), grade: c.grade || '-', status: c.status || 'upcoming' })) } : p)));
              }
            } catch (e) {
              console.error('Failed fetching courses for semester', e);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load academic progress:', e);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user, reloadCounter]);

  const handleSemesterFormChange = (k: string, v: any) => setSemesterForm(s => ({ ...s, [k]: v }));

  const submitSemester = async (e?: React.FormEvent) => {
    e && e.preventDefault();
    if (!user) return;
    try {
      const auth0Id = user.sub || user.user_id || user?.id;
      if (!auth0Id) return;
      const payload = {
        auth0_id: auth0Id,
        semester_key: String(semesterForm.semester_key || semesterForm.name || 'sem-' + Date.now()).trim(),
        name: String(semesterForm.name || semesterForm.semester_key || '').trim(),
        gpa: semesterForm.gpa ? Number(semesterForm.gpa) : null,
        total_credits: semesterForm.total_credits ? Number(semesterForm.total_credits) : 0,
        is_current: !!semesterForm.is_current,
      };
      await apiClient.post('/academic/semesters', payload);
      setEditOpen(false);
      setSemesterForm({ semester_key: '', name: '', gpa: '', total_credits: '', is_current: true });
      setReloadCounter(c => c + 1);
    } catch (err) {
      console.error('Failed to save semester', err);
      // keep modal open for retry
    }
  };

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
                    onClick={() => {
                      // open modal and default-select currently loaded semester
                      const first = semesters && semesters.length ? (semesters[0].semester_key || semesters[0].id) : '';
                      setSelectedSemesterKey(first);
                      setEditOpen(true);
                    }}
                    className="hidden md:flex items-center gap-2 bg-white/70 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-white/40"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">Edit Goals</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Edit Goals Modal */}
          {editOpen && typeof window !== 'undefined' && createPortal(
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[99999] flex items-start justify-center pt-8 px-4 overflow-y-auto"
              style={{ zIndex: 99999 }}
            >
              <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-md" onClick={() => setEditOpen(false)} />
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 w-full max-w-5xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl mb-8 overflow-hidden border border-white/20"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600/90 to-purple-600/90 backdrop-blur-lg px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Pencil className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Edit Academic Goals</h3>
                        <p className="text-indigo-100 text-sm">Manage your semesters and courses</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setEditOpen(false)}
                      className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-8 bg-gradient-to-br from-white/50 to-gray-50/50 backdrop-blur-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Semester Form */}
                    <form onSubmit={submitSemester} className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                        <h4 className="text-lg font-semibold text-gray-800">Semester Information</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Semester Key</label>
                            <input 
                              placeholder="e.g., sem7" 
                              value={semesterForm.semester_key} 
                              onChange={e => handleSemesterFormChange('semester_key', e.target.value)} 
                              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm" 
                            />
                          </div> */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Semester Name</label>
                            <input 
                              placeholder="e.g., Semester 7" 
                              value={semesterForm.name} 
                              onChange={e => handleSemesterFormChange('name', e.target.value)} 
                              className="w-full px-4 py-3 bg-Black/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm" 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Target GPA</label>
                            <input 
                              type="number"
                              step="0.01"
                              placeholder="e.g., 8.5" 
                              value={semesterForm.gpa} 
                              onChange={e => handleSemesterFormChange('gpa', e.target.value)} 
                              className="w-full px-4 py-3 bg-black/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm" 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Total Credits</label>
                            <input 
                              type="number"
                              placeholder="e.g., 24" 
                              value={semesterForm.total_credits} 
                              onChange={e => handleSemesterFormChange('total_credits', e.target.value)} 
                              className="w-full px-4 py-3 bg-black/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm" 
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-3 p-4 bg-indigo-50/80 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-indigo-100/80 transition-colors border border-indigo-200/50">
                          <input 
                            type="checkbox" 
                            checked={semesterForm.is_current} 
                            onChange={e => handleSemesterFormChange('is_current', e.target.checked)}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Mark as current semester</span>
                        </label>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button 
                          type="button" 
                          onClick={() => setEditOpen(false)} 
                          className="flex-1 px-6 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-300/50 text-gray-700 font-semibold rounded-xl hover:bg-gray-50/80 transition-all shadow-sm"
                        >
                          Close
                        </button>
                        <button 
                          type="submit" 
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all backdrop-blur-sm"
                        >
                          Save Semester
                        </button>
                      </div>
                    </form>

                    {/* Right Column: Courses */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        <h4 className="text-lg font-semibold text-gray-800">Course Management</h4>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Semester</label>
                        <select 
                          value={selectedSemesterKey} 
                          onChange={async e => {
                            const key = e.target.value;
                            setSelectedSemesterKey(key);
                            if (!user) return;
                            try {
                              const auth0Id = user.sub || user.user_id || user?.id;
                              if (!auth0Id) return;
                              const cResp = await apiClient.get(`/academic/courses?auth0_id=${encodeURIComponent(auth0Id)}&semester_key=${encodeURIComponent(key)}`);
                              if (cResp && Array.isArray(cResp.courses)) {
                                setSemesters(prev => prev.map(p => (p.semester_key === key ? { ...p, courses: cResp.courses.map((c: any) => ({ id: String(c.id), name: c.name, code: c.code, credits: Number(c.credits||0), grade: c.grade||'-', status: c.status||'upcoming' })) } : p)));
                              }
                            } catch (e) { console.error('Failed loading courses', e); }
                          }} 
                          className="w-full px-4 py-3 bg-black/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                        >
                          <option value="">-- Choose semester --</option>
                          {semesters.map(s => <option key={s.id} value={s.semester_key || s.id}>{s.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {(semesters.find(s => (s.semester_key || s.id) === selectedSemesterKey)?.courses || []).map((c, idx) => (
                          <motion.div 
                            key={c.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group relative bg-white/60 backdrop-blur-md p-4 rounded-xl border border-gray-200/50 hover:border-indigo-300/80 hover:shadow-lg transition-all"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">{c.name}</div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span className="font-mono bg-white px-2 py-1 rounded">{c.code}</span>
                                  <span>•</span>
                                  <span>{c.credits} credits</span>
                                  <span>•</span>
                                  <span className="font-semibold text-indigo-600">{c.grade}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setEditingCourseId(c.id);
                                    setCourseForm({ course_key: c.id, name: c.name, code: c.code, credits: String(c.credits || ''), grade: c.grade || '', status: (c as any).status || 'upcoming', progress: '' });
                                    setShowCourseForm(true);
                                  }} 
                                  className="px-3 py-1.5 text-xs bg-white/90 backdrop-blur-sm border border-gray-300/50 text-gray-700 font-medium rounded-lg hover:bg-indigo-50/90 hover:border-indigo-300/80 transition-all shadow-sm"
                                >
                                  Edit
                                </button>
                                <button 
                                  type="button" 
                                  onClick={async () => {
                                    setSemesters(prev => prev.map(p => p.semester_key === (p.semester_key || p.id) && (p.semester_key || p.id) === selectedSemesterKey ? { ...p, courses: p.courses.filter(x => x.id !== c.id) } : p));
                                  }} 
                                  className="px-3 py-1.5 text-xs bg-white/90 backdrop-blur-sm border border-red-200/50 text-red-600 font-medium rounded-lg hover:bg-red-50/90 hover:border-red-300/80 transition-all shadow-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        
                        {selectedSemesterKey && (semesters.find(s => (s.semester_key || s.id) === selectedSemesterKey)?.courses || []).length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No courses added yet</p>
                          </div>
                        )}
                      </div>

                      <button 
                        type="button" 
                        onClick={() => {
                          setEditingCourseId(null);
                          setCourseForm({ course_key: '', name: '', code: '', credits: '', grade: '', status: 'upcoming', progress: '' });
                          setShowCourseForm(true);
                        }} 
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Course
                      </button>
                    </div>
                  </div>

                  {/* Course Form */}
                  {showCourseForm && (
                    <motion.form 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={async e => {
                        e.preventDefault();
                        if (!user) return;
                        try {
                          const auth0Id = user.sub || user.user_id || user?.id;
                          if (!auth0Id) return;
                          const semesterKey = selectedSemesterKey || (semesterForm.semester_key || semesterForm.name || (semesters[0] && (semesters[0].semester_key || semesters[0].id)));
                          if (!semesterKey) { alert('Please select or save a semester first'); return; }
                          const payload = {
                            auth0_id: auth0Id,
                            semester_key: semesterKey,
                            course_key: String(courseForm.course_key || courseForm.name || ('course-' + Date.now())).trim(),
                            name: String(courseForm.name || '').trim(),
                            code: String(courseForm.code || '').trim(),
                            credits: courseForm.credits ? Number(courseForm.credits) : 0,
                            grade: courseForm.grade || null,
                            status: courseForm.status || 'upcoming',
                            progress: courseForm.progress ? Number(courseForm.progress) : 0,
                          };
                          await apiClient.post('/academic/courses', payload);
                          setReloadCounter(c => c + 1);
                          setShowCourseForm(false);
                        } catch (err) {
                          console.error('Failed saving course', err);
                        }
                      }} 
                      className="mt-8 pt-8 border-t-2 border-gray-200/50 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-blue-100/80 backdrop-blur-sm rounded-lg">
                          <Pencil className="w-5 h-5 text-blue-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800">
                          {editingCourseId ? 'Edit Course Details' : 'New Course Details'}
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Course Key</label>
                          <input 
                            placeholder="e.g., cs401" 
                            value={courseForm.course_key} 
                            onChange={e => setCourseForm(f => ({ ...f, course_key: e.target.value }))} 
                            className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm" 
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Course Name</label>
                          <input 
                            placeholder="e.g., Artificial Intelligence" 
                            value={courseForm.name} 
                            onChange={e => setCourseForm(f => ({ ...f, name: e.target.value }))} 
                            className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Course Code</label>
                          <input 
                            placeholder="e.g., CS401" 
                            value={courseForm.code} 
                            onChange={e => setCourseForm(f => ({ ...f, code: e.target.value }))} 
                            className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Credits</label>
                          <input 
                            type="number"
                            placeholder="e.g., 4" 
                            value={courseForm.credits} 
                            onChange={e => setCourseForm(f => ({ ...f, credits: e.target.value }))} 
                            className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                          <input 
                            placeholder="e.g., A" 
                            value={courseForm.grade} 
                            onChange={e => setCourseForm(f => ({ ...f, grade: e.target.value }))} 
                            className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <select 
                            value={courseForm.status} 
                            onChange={e => setCourseForm(f => ({ ...f, status: e.target.value }))} 
                            className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                          >
                            <option value="upcoming">📅 Upcoming</option>
                            <option value="in-progress">📚 In Progress</option>
                            <option value="completed">✅ Completed</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button 
                          type="button" 
                          onClick={() => setShowCourseForm(false)} 
                          className="flex-1 px-6 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-300/50 text-gray-700 font-semibold rounded-xl hover:bg-gray-50/80 transition-all shadow-sm"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all backdrop-blur-sm"
                        >
                          {editingCourseId ? 'Update Course' : 'Add Course'}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </div>
              </motion.div>
            </motion.div>,
            document.body
          )}

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

        {/* Legacy modal removed; new Edit Goals modal is rendered above header when `editOpen` is true. */}

      </div>
    </StudentNavigation>
  );
}
