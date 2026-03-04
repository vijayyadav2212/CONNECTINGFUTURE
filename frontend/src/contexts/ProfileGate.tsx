"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function ProfileGate({ children }: { children: React.ReactNode }) {
  // Profile gating logic removed — rendering children directly.
  return <>{children}</>;
}
