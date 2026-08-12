"use client";
import React from 'react';
import AlumniNavigation from './AluminaNavigation/AlumniNavigation';

export default function AlumniLayout({ children }: { children: React.ReactNode }) {
  return (
    <AlumniNavigation>
      {children}
    </AlumniNavigation>
  );
}
