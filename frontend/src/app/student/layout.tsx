"use client";
import React from 'react';
import StudentNavigation from './StudentNavigation/StudentNavigation';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentNavigation>
      {children}
    </StudentNavigation>
  );
}
