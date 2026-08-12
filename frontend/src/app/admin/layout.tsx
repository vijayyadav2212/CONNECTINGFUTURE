"use client";
import React from 'react';
import AdminNavigation from './AdminNavigation/AdminNavigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminNavigation>
      {children}
    </AdminNavigation>
  );
}
