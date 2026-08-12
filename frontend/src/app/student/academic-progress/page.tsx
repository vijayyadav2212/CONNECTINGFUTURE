"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

import { useAuthToken } from '../../../../contexts/AuthTokenContext';
import apiClient from '../../../lib/apiClient';
import { GraduationCap, Pencil, TrendingUp, BookOpen, CheckCircle, AlertCircle } from "lucide-react";
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

function getGradeFromMarks(marks: number) {
  if (!Number.isFinite(marks)) return '';
  if (marks >= 90) return 'A+';
  if (marks >= 80) return 'A';
  if (marks >= 70) return 'B+';
  if (marks >= 60) return 'B';
  if (marks >= 50) return 'C';
  if (marks >= 40) return 'D';
  return 'F';
}

function ensureAllSemesters(semesters: Semester[]): Semester[] {
  // Deduplicate by semester number and ensure semesters 1-8 all exist
  const semesterMap = new Map<number, Semester>();

  for (const sem of semesters) {
    const semesterNumber = parseInt(sem.name.match(/\d+/)?.[0] || '0', 10);
    if (semesterNumber >= 1 && semesterNumber <= 8 && !semesterMap.has(semesterNumber)) {
      semesterMap.set(semesterNumber, sem);
    }
  }

  for (let semesterNumber = 1; semesterNumber <= 8; semesterNumber++) {
    if (!semesterMap.has(semesterNumber)) {
      semesterMap.set(semesterNumber, {
        id: `semester-${semesterNumber}`,
        semester_key: `semester-${semesterNumber}`,
        name: `Semester ${semesterNumber}`,
        gpa: 0,
        is_current: false,
        courses: []
      });
    }
  }

  return Array.from(semesterMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, semester]) => semester);
}


/* ------------------ TYPES ------------------ */
interface Course {
  id: string;
  course_key?: string;
  name: string;
  code: string;
  credits: number;
  backlog_count: number;
  grade: string;
  progress: number;
  status: "completed" | "in-progress" | "upcoming";
}

interface Semester {
  id: string;
  semester_key?: string;
  name: string;
  gpa: number;
  is_current?: boolean;
  courses: Course[];
}

/* ------------------ SUB-COMPONENTS ------------------ */

const StatCard = ({ icon: Icon, value, label, color, delay, isVisible }: {
  icon: any;
  value: string | number;
  label: string;
  color: string;
  delay: string;
  isVisible: boolean;
}) => {
  return (
    <div
      className={`group relative p-6 bg-white border border-gray-200 rounded-[32px] transition-all duration-500 hover:scale-[1.02] hover:shadow-xl shadow-sm
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-2xl bg-gray-100 text-teal-950 group-hover:bg-teal-900 group-hover:text-white transition-all duration-300">
          <Icon size={24} />
        </div>
        {color === 'green' && <div className="text-teal-950 bg-emerald-100 px-2 py-1 rounded-full text-xs font-bold">+0.2</div>}
      </div>
      <div>
        <p className="text-[11px] font-bold text-[#8a94a6] uppercase tracking-[0.1em] mb-1">{label}</p>
        <h3 className="text-4xl font-black text-teal-950 tracking-tight">{value}</h3>
      </div>
    </div>
  );
};


const SubjectCard = ({ course, delay }: { course: Course, delay: number }) => {
  const marks = Math.max(0, Math.min(100, Number(course.progress || 0)));
  const derivedGrade = getGradeFromMarks(marks);
  const backlogCount = Math.max(0, Number(course.backlog_count || 0));

  return (
    <div
      className="group flex flex-col md:flex-row md:items-center justify-between p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all duration-300 hover:-translate-x-1 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center gap-4 mb-4 md:mb-0">
        <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
          {course.code.replace(/[0-9]/g, '')}
        </div>
        <div>
          <h4 className="font-bold text-gray-800 group-hover:text-teal-700 transition-colors">{course.name}</h4>
          <p className="text-sm text-gray-500">{course.code}</p>
          <div className="mt-3 w-full max-w-sm">
            <div className="flex items-center justify-between mb-2 text-xs font-medium text-gray-500">
              <span>Marks</span>
              <span>{course.progress ? `${marks}%` : '-'}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-500 transition-all duration-500"
                style={{ width: `${marks}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Subject Mark</span>
          <span className={`font-bold ${marks >= 75 ? 'text-teal-950' : marks >= 50 ? 'text-amber-600' : 'text-gray-700'}`}>
            {course.progress ? `${marks}%` : '-'}
          </span>
          <span className="text-xs text-gray-400 mt-1">{derivedGrade || course.grade || 'Grade pending'}</span>
          {backlogCount > 0 && (
            <span className="mt-1 text-xs font-semibold text-red-600">Backlogs: {backlogCount}</span>
          )}
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
    is_current: true,
  });
  const [selectedSemesterKey, setSelectedSemesterKey] = useState('');
  const [courseForm, setCourseForm] = useState({
    course_key: '',
    name: '',
    code: '',
    credits: '',
    backlog_count: '',
    grade: '',
    status: 'upcoming',
    progress: '',
  });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [selectedSemesterGpa, setSelectedSemesterGpa] = useState('');
  const [isSavingSemesterGpa, setIsSavingSemesterGpa] = useState(false);
  const [isTogglingCurrentSemester, setIsTogglingCurrentSemester] = useState(false);
  const [subjectNotice, setSubjectNotice] = useState<{ title: string; message: string } | null>(null);

  // Refs

  const statsRef = useRef<HTMLDivElement>(null);
  const semesterRef = useRef<HTMLDivElement>(null);
  const coursesRef = useRef<HTMLDivElement>(null);

  // Intersection Observers

  const showStats = useIntersectionObserver(statsRef);
  const showSemester = useIntersectionObserver(semesterRef);

  // Data
  const { user } = useAuthToken();
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const semesterOptions = ensureAllSemesters(semesters);
  const overallGpa = semesters.length ? semesters.reduce((s, x) => s + (Number(x.gpa) || 0), 0) / semesters.length : 0;
  const selectedSemester = semesterOptions.find(s => (s.semester_key || s.id) === selectedSemesterKey);
  const activeSemester = selectedSemester || null;
  const currentSemester = semesterOptions.find(s => s.is_current);
  const allCourses = semesters.flatMap(s => s.courses || []);
  const backlogCount = allCourses.reduce((sum, c) => {
    const explicitBacklog = Math.max(0, Number(c.backlog_count || 0));
    if (explicitBacklog > 0) return sum + explicitBacklog;
    return ['F', 'RA', 'BACKLOG'].includes((c.grade || '').toUpperCase()) ? sum + 1 : sum;
  }, 0);
  const attendancePercent = allCourses.length ? Math.round((allCourses.filter(c => c.status !== 'upcoming').length / allCourses.length) * 100) : 0;

  const animatedGpa = useAnimatedCounter(overallGpa, 1500, showStats);
  const formInputClass = "w-full px-4 py-3 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm";
  const formSelectClass = "w-full px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm";

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
              is_current: !!s.is_current,
              courses: [],
            }));
            setSemesters(mapped);
        }
      } catch (e) {
        console.error('Failed to load academic progress:', e);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user, reloadCounter]);

  useEffect(() => {
    const loadSemesterCourses = async () => {
      if (!user || !semesters.length) return;
      try {
        const auth0Id = user.sub || user.user_id || user?.id;
        if (!auth0Id) return;
        const semesterKeys = semesters.map(semester => semester.semester_key || semester.id).filter(Boolean);

        const courseResults = await Promise.all(
          semesterKeys.map(async semesterKey => {
            const cResp = await apiClient.get(`/academic/courses?auth0_id=${encodeURIComponent(auth0Id)}&semester_key=${encodeURIComponent(semesterKey)}`);
            return {
              semesterKey,
              courses: cResp && Array.isArray(cResp.courses)
                ? cResp.courses.map((c: any) => ({
                    id: String(c.id),
                    course_key: c.course_key || '',
                    name: c.name,
                    code: c.code,
                    credits: Number(c.credits || 0),
                    backlog_count: Number(c.backlog_count || 0),
                    grade: c.grade || '-',
                    progress: Number(c.progress || 0),
                    status: c.status || 'upcoming',
                  }))
                : [],
            };
          })
        );

        setSemesters(prev => prev.map(p => {
          const match = courseResults.find(result => result.semesterKey === (p.semester_key || p.id));
          return match ? { ...p, courses: match.courses } : p;
        }));
      } catch (e) {
        console.error('Failed loading semester courses', e);
      }
    };

    loadSemesterCourses();
  }, [user, semesters.length, reloadCounter]);

  useEffect(() => {
    if (!selectedSemesterKey) {
      setSelectedSemesterGpa('');
      return;
    }
    const selected = semesterOptions.find(s => (s.semester_key || s.id) === selectedSemesterKey);
    setSelectedSemesterGpa(selected && selected.gpa != null ? String(selected.gpa) : '');
  }, [selectedSemesterKey]);

  const saveSelectedSemesterGpa = async () => {
    if (!user || !selectedSemesterKey) return;

    const gpaValue = selectedSemesterGpa.trim() === '' ? null : Number(selectedSemesterGpa);
    if (gpaValue != null && !Number.isFinite(gpaValue)) return;

    const selected = semesterOptions.find(s => (s.semester_key || s.id) === selectedSemesterKey);
    if (!selected) return;

    const semesterKey = selected.semester_key || selected.id;
    const normalizedGpa = gpaValue ?? 0;

    // Reflect CGPA immediately in the academic overview UI.
    setSemesters(prev => {
      const exists = prev.some(p => (p.semester_key || p.id) === selectedSemesterKey);
      if (exists) {
        return prev.map(p => (
          (p.semester_key || p.id) === selectedSemesterKey
            ? { ...p, gpa: normalizedGpa }
            : p
        ));
      }
      return [
        ...prev,
        {
          id: selected.id || semesterKey,
          semester_key: semesterKey,
          name: selected.name,
          gpa: normalizedGpa,
          courses: []
        }
      ];
    });

    try {
      setIsSavingSemesterGpa(true);
      const auth0Id = user.sub || user.user_id || user?.id;
      if (!auth0Id) return;
      const response = await apiClient.post('/academic/semesters', {
        auth0_id: auth0Id,
        semester_key: semesterKey,
        name: selected.name,
        gpa: gpaValue,
        is_current: false,
      });

      const savedSemester = response && response.semester ? response.semester : null;
      if (savedSemester && savedSemester.gpa != null) {
        setSelectedSemesterGpa(String(savedSemester.gpa));
      }

      setReloadCounter(c => c + 1);
    } catch (err) {
      console.error('Failed to save semester CGPA', err);
    } finally {
      setIsSavingSemesterGpa(false);
    }
  };

  const toggleSelectedSemesterCurrent = async (nextIsCurrent: boolean) => {
    if (!user || !selectedSemesterKey) return;

    const selected = semesterOptions.find(s => (s.semester_key || s.id) === selectedSemesterKey);
    if (!selected) return;

    try {
      setIsTogglingCurrentSemester(true);
      const auth0Id = user.sub || user.user_id || user?.id;
      if (!auth0Id) return;

      await apiClient.post('/academic/semesters', {
        auth0_id: auth0Id,
        semester_key: selected.semester_key || selected.id,
        name: selected.name,
        gpa: selected.gpa,
        is_current: nextIsCurrent,
      });

      setSemesters(prev => prev.map(p => {
        if (nextIsCurrent) {
          return {
            ...p,
            is_current: (p.semester_key || p.id) === selectedSemesterKey,
          };
        }
        return (p.semester_key || p.id) === selectedSemesterKey
          ? { ...p, is_current: false }
          : p;
      }));
      setReloadCounter(c => c + 1);
    } catch (err) {
      console.error('Failed to mark current semester', err);
    } finally {
      setIsTogglingCurrentSemester(false);
    }
  };

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
        is_current: !!semesterForm.is_current,
      };
      await apiClient.post('/academic/semesters', payload);
      setEditOpen(false);
      setSemesterForm({ semester_key: '', name: '', gpa: '', is_current: true });
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
    <>
      <div className="relative min-h-screen overflow-hidden bg-[#f6f3eb]">

        {/* ANIMATED BACKGROUND BLOBS */}


        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="bg-teal-950 text-white rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-8">
              <svg className="absolute right-0 bottom-0 w-[300px] h-full pointer-events-none opacity-50" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M40,70 C60,70 70,30 90,30 C110,30 120,60 140,60 C160,60 170,20 190,20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <div className="relative z-10 flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 text-gray-300 font-bold text-[12px] bg-white/10 w-fit px-3 py-1.5 rounded-full border border-white/20 uppercase tracking-[0.15em]">
                  <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422M12 14v7m-3-7v7m6-7v7" />
                  </svg>
                  Academic Journey
                </div>
                <h1 className="text-4xl md:text-[46px] font-extrabold text-white mb-4 tracking-tight leading-[1.05]">
                  Academic Progress
                </h1>
                <p className="text-[#8F93A3] text-[16px] md:text-[17px] font-medium leading-[1.6] max-w-2xl mb-6">
                  Track your journey and achievements.
                </p>
              </div>
              <div className="relative z-10">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditOpen(true)}
                    className="flex items-center gap-2 bg-white text-slate-800 px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="text-sm font-bold">Edit Goals</span>
                  </motion.button>
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
                className="relative z-10 w-full max-w-2xl bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl mb-8 overflow-hidden border border-white/20"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600/90 to-teal-600/90 backdrop-blur-lg px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Pencil className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Edit Academic Goals</h3>
                        <p className="text-teal-100 text-sm">Manage your semesters and subjects</p>
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

                <div className="p-6 bg-gradient-to-br from-slate-50 via-white to-white backdrop-blur-sm">
                  {subjectNotice && (
                    <div className="mb-6 rounded-2xl border border-emerald-200 bg-[#f6f3eb]/90 px-4 py-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-teal-950">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-700">
                            {subjectNotice.title}
                          </h4>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {subjectNotice.message}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSubjectNotice(null)}
                          className="rounded-lg px-2 py-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
                          aria-label="Dismiss notification"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-8">
                    {/* Subject Management */}
                    <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] space-y-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-teal-600" />
                        <h4 className="text-lg font-semibold text-slate-900">Subject Management</h4>
                        {currentSemester && (currentSemester.semester_key || currentSemester.id) === selectedSemesterKey && (
                          <span className="ml-auto rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-700">
                            Current Semester
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Semester</label>
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
                                setSemesters(prev => prev.map(p => ((p.semester_key || p.id) === key ? { ...p, courses: cResp.courses.map((c: any) => ({ id: String(c.id), course_key: c.course_key || '', name: c.name, code: c.code, credits: Number(c.credits||0), backlog_count: Number(c.backlog_count||0), grade: c.grade||'-', progress: Number(c.progress||0), status: c.status||'upcoming' })) } : p)));
                              }
                            } catch (e) { console.error('Failed loading courses', e); }
                          }}
                          className={formSelectClass}
                        >
                          <option value="">-- Choose semester --</option>
                          {semesterOptions.map(s => <option key={s.id} value={s.semester_key || s.id}>{s.name}</option>)}
                        </select>
                      </div>

                      {selectedSemesterKey && (
                        <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
                          <label className="block text-sm font-semibold text-slate-700 mb-2">CGPA</label>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              value={selectedSemesterGpa}
                              onChange={e => setSelectedSemesterGpa(e.target.value)}
                              placeholder="e.g., 8.50"
                              className={formInputClass}
                            />
                            <button
                              type="button"
                              onClick={saveSelectedSemesterGpa}
                              disabled={isSavingSemesterGpa}
                              className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isSavingSemesterGpa ? 'Saving...' : 'Save CGPA'}
                            </button>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <p className="text-xs font-medium text-slate-500">
                              {selectedSemester?.is_current ? 'This semester is currently marked as active.' : 'You can mark this semester as current.'}
                            </p>
                            <label className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white/90 px-3 py-2 text-sm font-semibold text-emerald-700">
                              <input
                                type="checkbox"
                                checked={!!selectedSemester?.is_current}
                                onChange={e => toggleSelectedSemesterCurrent(e.target.checked)}
                                disabled={isTogglingCurrentSemester}
                                className="h-4 w-4 rounded border-emerald-300 text-teal-950 focus:ring-emerald-500"
                              />
                              <span>{isTogglingCurrentSemester ? 'Updating...' : 'Mark as Current Semester'}</span>
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {(semesters.find(s => (s.semester_key || s.id) === selectedSemesterKey)?.courses || []).map((c, idx) => (
                          <motion.div 
                            key={c.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group relative bg-[#f6f3eb]/80 backdrop-blur-md p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">{c.name}</div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                  <span className="font-mono bg-white px-2 py-1 rounded">{c.code}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-teal-600">{c.progress ? `${Math.max(0, Math.min(100, Number(c.progress || 0)))}% marks` : 'Marks pending'}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setEditingCourseId(c.id);
                                    setSubjectNotice(null);
                                    setCourseForm({ course_key: c.course_key || c.id, name: c.name, code: c.code, credits: '', backlog_count: String(c.backlog_count || ''), grade: c.grade || getGradeFromMarks(Number(c.progress || 0)), status: (c as any).status || 'upcoming', progress: String(c.progress || '') });
                                    setShowCourseForm(true);
                                  }} 
                                  className="px-3 py-1.5 text-xs bg-white backdrop-blur-sm border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-all shadow-sm"
                                >
                                  Edit
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        
                        {selectedSemesterKey && (semesters.find(s => (s.semester_key || s.id) === selectedSemesterKey)?.courses || []).length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No subjects added yet</p>
                          </div>
                        )}
                      </div>

                      <button 
                        type="button" 
                        onClick={() => {
                          setEditingCourseId(null);
                          setSubjectNotice(null);
                          setCourseForm({ course_key: '', name: '', code: '', credits: '', backlog_count: '', grade: '', status: 'upcoming', progress: '' });
                          setShowCourseForm(true);
                        }} 
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Subject
                      </button>
                    </div>
                  </div>

                  {/* Subject Form */}
                  {showCourseForm && (
                    <motion.form
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={async e => {
                        e.preventDefault();
                        if (!user) return;
                        try {
                          const isEditingSubject = !!editingCourseId;
                          const auth0Id = user.sub || user.user_id || user?.id;
                          if (!auth0Id) return;
                          const semesterKey = selectedSemesterKey || (semesterForm.semester_key || semesterForm.name || (semesters[0] && (semesters[0].semester_key || semesters[0].id)));
                          if (!semesterKey) {
                            alert('Please select or save a semester first');
                            return;
                          }

                          const marks = Number(courseForm.progress || 0);
                          const backlogCountValue = Math.max(0, Number(courseForm.backlog_count || 0));
                          const payload = {
                            auth0_id: auth0Id,
                            semester_key: semesterKey,
                            course_key: String(courseForm.course_key || courseForm.name || ('course-' + Date.now())).trim(),
                            name: String(courseForm.name || '').trim(),
                            code: String(courseForm.code || '').trim() || null,
                            grade: getGradeFromMarks(marks) || null,
                            status: courseForm.status || 'upcoming',
                            progress: Number.isFinite(marks) ? marks : 0,
                          };

                          const resp = await apiClient.post('/academic/courses', payload);
                          const saved = resp && resp.course ? resp.course : null;

                          if (saved) {
                            const normalized = {
                              id: String(saved.id),
                              course_key: saved.course_key || payload.course_key,
                              name: saved.name || payload.name,
                              code: saved.code || payload.code || '',
                              credits: Number(saved.credits || 0),
                              backlog_count: Number(courseForm.backlog_count || 0),
                              grade: saved.grade || payload.grade || '-',
                              progress: Number(saved.progress || payload.progress || 0),
                              status: saved.status || payload.status || 'upcoming',
                            };

                            setSemesters(prev => prev.map(p => {
                              if ((p.semester_key || p.id) !== semesterKey) return p;
                              const existing = (p.courses || []).findIndex(x => x.id === normalized.id || x.course_key === normalized.course_key);
                              if (existing >= 0) {
                                const updatedCourses = [...(p.courses || [])];
                                updatedCourses[existing] = normalized as any;
                                return { ...p, courses: updatedCourses };
                              }
                              return { ...p, courses: [...(p.courses || []), normalized as any] };
                            }));
                          } else {
                            setReloadCounter(c => c + 1);
                          }

                          setShowCourseForm(false);
                          setEditingCourseId(null);

                          setSubjectNotice({
                            title: isEditingSubject ? 'Successfully Edited' : 'Successfully Added',
                            message: isEditingSubject
                              ? 'Your subject changes have been saved.'
                              : 'Your new subject has been added to the semester.',
                          });
                        } catch (err) {
                          console.error('Failed saving course', err);
                        }
                      }}
                      className="mt-8 pt-8 border-t border-slate-200"
                    >
                      <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <Pencil className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-slate-900">
                            {editingCourseId ? 'Edit Subject Details' : 'New Subject Details'}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Grade is assigned automatically from marks: {getGradeFromMarks(Number(courseForm.progress || 0)) || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Subject Name</label>
                          <input
                            placeholder="e.g., Artificial Intelligence"
                            value={courseForm.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCourseForm(f => ({ ...f, name: e.target.value }))}
                            className={formInputClass}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Marks (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="e.g., 88"
                            value={courseForm.progress}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCourseForm(f => ({ ...f, progress: e.target.value }))}
                            className={formInputClass}
                          />
                          <p className="mt-2 text-xs text-slate-500">
                            Current grade preview: {getGradeFromMarks(Number(courseForm.progress || 0)) || '-'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Backlogs</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g., 1"
                            value={courseForm.backlog_count}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCourseForm(f => ({ ...f, backlog_count: e.target.value }))}
                            className={formInputClass}
                          />
                          <p className="mt-2 text-xs text-slate-500">Enter 0 if no backlog for this subject.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowCourseForm(false)}
                          className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-[#f6f3eb] transition-all shadow-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-600 text-white font-semibold rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all backdrop-blur-sm"
                        >
                          {editingCourseId ? 'Update Subject' : 'Add Subject'}
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
              value={animatedGpa}
              label="Overall CGPA"
              color="blue"
              delay="0"
              isVisible={showStats}
            />
            <StatCard
              icon={BookOpen}
              value={allCourses.length}
              label="Total Subjects"
              color="purple"
                delay="100"
              isVisible={showStats}
            />
            <StatCard
              icon={AlertCircle}
              value={backlogCount}
              label="Backlogs"
              color="orange"
                delay="200"
              isVisible={showStats}
            />
          </div>

          {/* MAIN CONTENT SPLIT */}
          <div className="grid grid-cols-1 gap-8">

            {/* LEFT COLUMN: SEMESTER OVERVIEW & COURSES */}
            <div className="space-y-8">

              {/* CURRENT SEMESTER HEADER */}
              <div
                ref={semesterRef}
                className={`bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-teal-900/100 shadow-xl transition-all duration-700
                        ${showSemester ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6 border-b border-gray-100 pb-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gray-800">Semester Overview</h2>
                    <p className="text-teal-500 font-medium">Select a semester to view its data</p>
                  </div>
                  <div className="w-full sm:w-72">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Semester
                    </label>
                    <select
                      value={selectedSemesterKey}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedSemesterKey(e.target.value)}
                      className={formSelectClass}
                    >
                      <option value="">-- Select semester --</option>
                      {semesterOptions.map(s => (
                        <option key={s.id} value={s.semester_key || s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="text-3xl font-bold text-gray-800">{activeSemester?.gpa ?? '-'}</span>
                    <span className="text-sm text-gray-400 block uppercase tracking-wider">CGPA</span>
                    {activeSemester?.is_current && (
                      <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-700">
                        Current Semester
                      </span>
                    )}
                  </div>
                </div>

                {/* Subject List */}
                <div ref={coursesRef} className="space-y-4">
                  {(activeSemester?.courses || []).map((course, index) => (
                    <SubjectCard key={course.id} course={course} delay={index * 100} />
                  ))}
                  {(!activeSemester || (activeSemester.courses || []).length === 0) && (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                      No subjects available for this semester.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Legacy modal removed; new Edit Goals modal is rendered above header when `editOpen` is true. */}

      </div>
    </>
  );
}
