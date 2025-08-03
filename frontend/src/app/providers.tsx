"use client";

import { UserProvider } from "@auth0/nextjs-auth0/client";
import { ThemeProvider } from "next-themes";
import { AuthTokenProvider } from "../../contexts/AuthTokenContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <AuthTokenProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </AuthTokenProvider>
    </UserProvider>
  );
}
 
