"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import styles from "./login.module.css";
import Image from "next/image";

export default function LoginPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/alumni/dashboard");
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className={styles.leftPanel}>
        <Image 
          src="/logo.png" 
          alt="Connecting Future Logo" 
          width={150} 
          height={150} 
          className={styles.logo} 
        />
        <h1 className={styles.title}>Connecting Future</h1>
        <p className={styles.subtitle}>Connect with alumina, share experiences, and build your career path</p>
      </div>
      
      <div className={styles.rightPanel}>
        <Card className={styles.card}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <GraduationCap className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <p className="text-gray-600">Sign in to your account</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <a href="/api/auth/login" className="w-full">
              <Button className="w-full" size="lg">
                Sign In with Auth0
              </Button>
            </a>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/registration" className="text-blue-600 hover:underline">
                  Sign up here
                </Link>
              </p>
            </div>
            
            <div className="text-center">
              <Link href="/" className="text-sm text-gray-600 hover:underline">
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
         