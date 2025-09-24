"use client";

import React, { useState } from 'react';
import StudentNavigation from '../StudentNavigation';
import { BookOpen, Calendar, CheckCircle, Clock, AlertCircle, TrendingUp, Award, FileText, BarChart3 } from 'lucide-react';

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

export default function AcademicProgress() {
  const [selectedSemester, setSelectedSemester] = useState<string>('current');

  const semesters: Semester[] = [
    {
      id: 'current',
      name: 'Semester 6 (Current)',
      gpa: 8.5,
      totalCredits: 20,
      courses: [
        { id: '1', name: 'Data Structures & Algorithms', code: 'CS301', credits: 4, grade: 'A-', status: 'in-progress', progress: 75 },
        { id: '2', name: 'Database Management Systems', code: 'CS302', credits: 3, grade: 'B+', status: 'in-progress', progress: 60 },
        { id: '3', name: 'Computer Networks', code: 'CS303', credits: 4, grade: 'A', status: 'in-progress', progress: 80 },
        { id: '4', name: 'Software Engineering', code: 'CS304', credits: 3, grade: 'A-', status: 'in-progress', progress: 70 },
        { id: '5', name: 'Operating Systems', code: 'CS305', credits: 4, grade: 'B+', status: 'in-progress', progress: 65 },
        { id: '6', name: 'Machine Learning', code: 'CS306', credits: 2, grade: 'A', status: 'in-progress', progress: 85 }
      ]
    },
    {
      id: 'sem5',
      name: 'Semester 5',
      gpa: 8.7,
      totalCredits: 22,
      courses: [
        { id: '7', name: 'Computer Graphics', code: 'CS201', credits: 4, grade: 'A', status: 'completed', progress: 100 },
        { id: '8', name: 'Artificial Intelligence', code: 'CS202', credits: 4, grade: 'A-', status: 'completed', progress: 100 },
        { id: '9', name: 'Web Development', code: 'CS203', credits: 3, grade: 'A+', status: 'completed', progress: 100 },
        { id: '10', name: 'Mobile App Development', code: 'CS204', credits: 3, grade: 'A', status: 'completed', progress: 100 },
        { id: '11', name: 'Digital Signal Processing', code: 'EE301', credits: 4, grade: 'B+', status: 'completed', progress: 100 },
        { id: '12', name: 'Technical Communication', code: 'HS201', credits: 2, grade: 'A+', status: 'completed', progress: 100 }
      ]
    }
  ];

  const overallStats = {
    gpa: 8.6,
    creditsCompleted: 142,
    totalCredits: 160,
    completionRate: 88.75
  };

  const currentSemester = semesters.find(s => s.id === selectedSemester) || semesters[0];

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Progress</h1>
          <p className="text-gray-600">Track your academic journey and performance</p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Overall GPA</p>
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
                <p className="text-gray-600 text-sm font-medium">Credits Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{overallStats.creditsCompleted}</p>
                <p className="text-blue-600 text-sm mt-1">of {overallStats.totalCredits}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{overallStats.completionRate}%</p>
                <p className="text-purple-600 text-sm mt-1">On Track</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Current Semester</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">6th</p>
                <p className="text-orange-600 text-sm mt-1">In Progress</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Degree Progress</h2>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-600">{overallStats.completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${overallStats.completionRate}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{overallStats.creditsCompleted} credits earned</span>
              <span>{overallStats.totalCredits - overallStats.creditsCompleted} credits remaining</span>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Semester GPA</h3>
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{currentSemester.gpa}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Total Credits</h3>
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{currentSemester.totalCredits}</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Courses</h3>
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">{currentSemester.courses.length}</p>
            </div>
          </div>

          {/* Courses List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Courses</h3>
            <div className="grid gap-4">
              {currentSemester.courses.map(course => (
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
                        <span>{course.credits} Credits</span>
                        {course.grade && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(course.grade)}`}>
                            Grade: {course.grade}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {course.status === 'in-progress' && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm text-gray-600">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StudentNavigation>
  );
}