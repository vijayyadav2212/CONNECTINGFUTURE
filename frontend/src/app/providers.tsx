"use client";

import { UserProvider } from "@auth0/nextjs-auth0/client";
import { ThemeProvider } from "next-themes";
import { AuthTokenProvider } from "../../contexts/AuthTokenContext";
import { ProfileGate } from "@/contexts/ProfileGate";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <AuthTokenProvider>
        <ProfileGate>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </ProfileGate>
      </AuthTokenProvider>
    </UserProvider>
  );
}
 
