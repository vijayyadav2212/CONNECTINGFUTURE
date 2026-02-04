"use client";

import React, { useEffect, useMemo, useState } from 'react';
import StudentNavigation from '../StudentNavigation';
import Link from 'next/link';
import { Calendar, Award, FileText, AlertCircle, RefreshCw, Pencil, Plus, Save, Trash2, X, CheckCircle } from 'lucide-react';
import apiClient from '../../../../lib/auth/apiClient';
import { useAuth0Token } from '../../../../hooks/useAuth0Token';

interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  grade: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  progress: number;
}

interface Semester {
  id: string;
  name: string;
  gpa: number;
  courses: Course[];
  totalCredits: number;
}

interface OverallStats {
  gpa: number;
  creditsCompleted: number;
  totalCredits: number;
  completionRate: number;
  currentSemesterLabel?: string | null;
}

type CourseStatus = Course['status'];

export default function AcademicProgress() {
  const { tokenLoading, isAuthenticated, refreshToken } = useAuth0Token() as any;

  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats>({
    gpa: 0,
    creditsCompleted: 0,
    totalCredits: 0,
    completionRate: 0,
    currentSemesterLabel: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [draftSemesters, setDraftSemesters] = useState<Semester[]>([]);
  const [draftSelectedSemesterId, setDraftSelectedSemesterId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadAcademicProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/academic-progress/me');
      const nextOverall: OverallStats = data?.overallStats || {
        gpa: 0,
        creditsCompleted: 0,
        totalCredits: 0,
        completionRate: 0,
      };
      const nextSemesters: Semester[] = Array.isArray(data?.semesters) ? data.semesters : [];

      setOverallStats(nextOverall);
      setSemesters(nextSemesters);

      setSelectedSemester((prev) => {
        const ids = new Set(nextSemesters.map((s) => s.id));
        if (prev && ids.has(prev)) return prev;
        if (ids.has('current')) return 'current';
        return nextSemesters[0]?.id || '';
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to load academic progress');
    } finally {
      setLoading(false);
    }
  };

  const openEditor = () => {
    setFormError(null);
    // deep copy to avoid mutating live state while editing
    const copy: Semester[] = JSON.parse(JSON.stringify(semesters || []));
    setDraftSemesters(copy);
    setDraftSelectedSemesterId(selectedSemester || copy[0]?.id || '');
    setEditOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditOpen(false);
    setFormError(null);
  };

  const draftCurrentSemester = useMemo(() => {
    if (!draftSemesters.length) return null;
    return draftSemesters.find((s) => s.id === draftSelectedSemesterId) || draftSemesters[0];
  }, [draftSemesters, draftSelectedSemesterId]);

  const updateDraftSemester = (semesterId: string, patch: Partial<Semester>) => {
    setDraftSemesters((prev) => prev.map((s) => (s.id === semesterId ? { ...s, ...patch } : s)));
  };

  const updateDraftCourse = (semesterId: string, courseId: string, patch: Partial<Course>) => {
    setDraftSemesters((prev) =>
      prev.map((s) => {
        if (s.id !== semesterId) return s;
        return {
          ...s,
          courses: (s.courses || []).map((c) => (c.id === courseId ? { ...c, ...patch } : c)),
        };
      })
    );
  };

  const deleteDraftCourse = (semesterId: string, courseId: string) => {
    setDraftSemesters((prev) =>
      prev.map((s) => {
        if (s.id !== semesterId) return s;
        return { ...s, courses: (s.courses || []).filter((c) => c.id !== courseId) };
      })
    );
  };

  const addDraftCourse = (semesterId: string) => {
    const newId = `course-${Date.now()}`;
    const newCourse: Course = {
      id: newId,
      name: 'New Course',
      code: '',
      credits: 0,
      grade: '',
      status: 'upcoming',
      progress: 0,
    };
    setDraftSemesters((prev) =>
      prev.map((s) => (s.id === semesterId ? { ...s, courses: [...(s.courses || []), newCourse] } : s))
    );
  };

  const addDraftSemester = () => {
    const nextNum = draftSemesters.length + 1;
    const newSemester: Semester = {
      id: `sem-${Date.now()}`,
      name: `Semester ${nextNum}`,
      gpa: 0,
      totalCredits: 0,
      courses: [],
    };
    setDraftSemesters((prev) => [newSemester, ...prev]);
    setDraftSelectedSemesterId(newSemester.id);
  };

  const validateDraft = () => {
    if (!draftSemesters.length) return 'Please add at least one semester.';
    for (const s of draftSemesters) {
      if (!String(s.name || '').trim()) return 'Semester name is required.';
      const courses = s.courses || [];
      for (const c of courses) {
        if (!String(c.name || '').trim()) return 'Course name is required.';
      }
    }
    return null;
  };

  const saveDraft = async () => {
    setFormError(null);
    const msg = validateDraft();
    if (msg) {
      setFormError(msg);
      return;
    }

    setSaving(true);
    try {
      const payloadSemesters: Semester[] = (draftSemesters || []).map((s) => {
        const courses = Array.isArray(s.courses) ? s.courses : [];
        const computedCredits = courses.reduce((sum, c) => sum + Number(c.credits || 0), 0);
        return {
          ...s,
          totalCredits: computedCredits,
        };
      });

      const resp = await apiClient.put('/academic-progress/me', { semesters: payloadSemesters });
      const nextOverall: OverallStats = resp?.overallStats || overallStats;
      const nextSemesters: Semester[] = Array.isArray(resp?.semesters) ? resp.semesters : semesters;

      setOverallStats(nextOverall);
      setSemesters(nextSemesters);

      setSelectedSemester((prev) => {
        const ids = new Set(nextSemesters.map((s) => s.id));
        if (prev && ids.has(prev)) return prev;
        if (ids.has('current')) return 'current';
        return nextSemesters[0]?.id || '';
      });

      setEditOpen(false);
      setSuccessPopup(true);
      window.setTimeout(() => setSuccessPopup(false), 2500);
    } catch (e: any) {
      setFormError(e?.message || 'Failed to save academic progress');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (tokenLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadAcademicProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenLoading, isAuthenticated]);

  const currentSemester = useMemo(() => {
    if (!semesters.length) return null;
    return semesters.find((s) => s.id === selectedSemester) || semesters[0];
  }, [semesters, selectedSemester]);

  const currentSemesterLabel = useMemo(() => {
    if (overallStats.currentSemesterLabel) return String(overallStats.currentSemesterLabel);
    const name = currentSemester?.name || '';
    const m = name.match(/Semester\s+(\d+)/i);
    if (m?.[1]) return `${m[1]}th`;
    return 'Current';
  }, [currentSemester?.name, overallStats.currentSemesterLabel]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'upcoming': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100';
    if (grade.startsWith('C')) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <StudentNavigation>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Progress</h1>
            <p className="text-gray-600">Track your academic journey and performance</p>
          </div>

          {isAuthenticated && !tokenLoading && !loading && !error && (
            <button
              onClick={openEditor}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              title="Edit academic data"
            >
              <Pencil className="w-4 h-4 text-white" />
              Edit
            </button>
          )}
        </div>

        {tokenLoading || loading ? (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
            <div className="animate-pulse">
              <div className="h-5 w-48 bg-gray-200 rounded mb-3" />
              <div className="h-3 w-72 bg-gray-100 rounded" />
            </div>
          </div>
        ) : !isAuthenticated ? (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">Login required</h2>
                <p className="text-sm text-gray-600 mt-1">Please sign in to view your academic progress.</p>
                <div className="mt-4 flex items-center gap-3">
                  <Link
                    href="/api/auth/login"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700"
                  >
                    Sign in
                  </Link>
                  <button
                    onClick={() => refreshToken?.()}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-50"
                  >
                    Refresh session
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-red-200 mb-8">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">Couldn’t load academic progress</h2>
                <p className="text-sm text-gray-600 mt-1">{error}</p>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={loadAcademicProgress}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                  <button
                    onClick={() => refreshToken?.()}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-50"
                  >
                    Refresh token
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Backend must be running and `NEXT_PUBLIC_API_BASE` should point to it (default: `http://localhost:4000`).
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Overall CGPA</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{overallStats.gpa}</p>
                <p className="text-green-600 text-sm mt-1">Excellent</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Current Semester</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{currentSemesterLabel}</p>
                <p className="text-orange-600 text-sm mt-1">In Progress</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Semester Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Semester Details</h2>
            <select 
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              disabled={!currentSemester || semesters.length === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {semesters.map(semester => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Semester CGPA</h3>
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{currentSemester?.gpa ?? 0}</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Courses</h3>
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">{currentSemester?.courses?.length ?? 0}</p>
            </div>
          </div>

          {/* Courses List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Courses</h3>
            <div className="grid gap-4">
              {(currentSemester?.courses || []).map(course => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-gray-900">{course.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                          {course.status.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{course.code}</span>
                        {course.grade && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(course.grade)}`}>
                            Grade: {course.grade}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Success Popup */}
        {successPopup && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-green-200 p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">Saved successfully</div>
                <div className="text-xs text-gray-600">Academic progress updated.</div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Edit Academic Data</h3>
                  <p className="text-sm text-gray-600">Update semesters, courses, grades, and progress.</p>
                </div>
                <button
                  onClick={closeEditor}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
                  aria-label="Close"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
                {/* Left: Semesters */}
                <div className="border-b lg:border-b-0 lg:border-r border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-bold text-gray-900">Semesters</div>
                    <button
                      onClick={addDraftSemester}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-black"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[62vh] overflow-auto pr-1">
                    {draftSemesters.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setDraftSelectedSemesterId(s.id)}
                        className={
                          `w-full text-left px-3 py-3 rounded-xl border transition-colors ` +
                          (draftSelectedSemesterId === s.id
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-200 hover:bg-gray-50')
                        }
                      >
                        <div className="text-sm font-bold text-gray-900 truncate">{s.name}</div>
                        <div className="text-xs text-gray-600 mt-1 flex items-center justify-between">
                          <span>CGPA: {s.gpa ?? 0}</span>
                          <span>Courses: {(s.courses || []).length}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Details */}
                <div className="p-6 overflow-auto max-h-[75vh]">
                  {!draftCurrentSemester ? (
                    <div className="text-sm text-gray-600">Add a semester to start editing.</div>
                  ) : (
                    <>
                      {formError && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                              <div className="text-sm font-bold text-gray-900">Fix before saving</div>
                              <div className="text-sm text-gray-700 mt-1">{formError}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Semester Name</label>
                          <input
                            value={draftCurrentSemester.name}
                            onChange={(e) => updateDraftSemester(draftCurrentSemester.id, { name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">CGPA</label>
                          <input
                            type="number"
                            step="0.01"
                            key={draftCurrentSemester.id}
                            defaultValue={draftCurrentSemester.gpa ?? 0}
                            onBlur={(e) => {
                              const raw = String(e.target.value || '').trim();
                              const parsed = raw === '' ? 0 : Number.parseFloat(raw);
                              updateDraftSemester(draftCurrentSemester.id, { gpa: Number.isFinite(parsed) ? parsed : 0 });
                            }}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-bold text-gray-900">Courses</h4>
                        <button
                          onClick={() => addDraftCourse(draftCurrentSemester.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
                        >
                          <Plus className="w-4 h-4" />
                          Add Course
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(draftCurrentSemester.courses || []).map((c) => (
                          <div key={c.id} className="border border-gray-200 rounded-2xl p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 mb-1">Course Name</label>
                                  <input
                                    value={c.name}
                                    onChange={(e) => updateDraftCourse(draftCurrentSemester.id, c.id, { name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 mb-1">Code</label>
                                  <input
                                    value={c.code}
                                    onChange={(e) => updateDraftCourse(draftCurrentSemester.id, c.id, { code: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3 md:col-span-2">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
                                    <select
                                      value={c.status}
                                      onChange={(e) => updateDraftCourse(draftCurrentSemester.id, c.id, { status: e.target.value as CourseStatus })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    >
                                      <option value="completed">Completed</option>
                                      <option value="in-progress">In Progress</option>
                                      <option value="upcoming">Upcoming</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Grade</label>
                                    <input
                                      value={c.grade}
                                      onChange={(e) => updateDraftCourse(draftCurrentSemester.id, c.id, { grade: e.target.value })}
                                      placeholder="A, B+, ..."
                                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => deleteDraftCourse(draftCurrentSemester.id, c.id)}
                                className="p-2 rounded-xl hover:bg-red-50 text-red-600"
                                title="Remove course"
                                aria-label="Remove course"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={closeEditor}
                          disabled={saving}
                          className="px-5 py-2.5 rounded-xl border border-gray-300 font-semibold text-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveDraft}
                          disabled={saving}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          {saving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save changes
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentNavigation>
  );
}