import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Pass-through since we use src/middleware.ts
}

export const config = {
  matcher: [],
};