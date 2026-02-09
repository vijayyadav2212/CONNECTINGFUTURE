"use client";

import { UserProvider } from "@auth0/nextjs-auth0/client";
import { ThemeProvider } from "next-themes";
import { AuthTokenProvider } from "../../contexts/AuthTokenContext";
import { ProfileGate } from "@/contexts/ProfileGate";
import { Toaster } from "react-hot-toast";

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
            <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
          </ThemeProvider>
        </ProfileGate>
      </AuthTokenProvider>
    </UserProvider>
  );
}

