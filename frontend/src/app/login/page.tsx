"use client";

import React, { useState } from 'react';
import { useMockAuth } from "@/lib/mockAuth0";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Mail, User, Briefcase, Calendar, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

export default function LoginPage() {
  const { login } = useMockAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Modal States
  const [modalState, setModalState] = useState<{
    show: boolean;
    success: boolean;
    title: string;
    message: string;
    action?: () => void;
  }>({
    show: false,
    success: true,
    title: "",
    message: ""
  });

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [major, setMajor] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'alumni'>('student');

  // Generate Year range (e.g. 2010 to 2035) for graduation year dropdown
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => String(currentYear - 15 + i));

  // Determine user type / portal role based on email domain or selection
  const getRoleByEmail = (emailVal: string) => {
    return selectedRole || (emailVal.trim().toLowerCase().endsWith('@pvppcoe.ac.in') ? 'student' : 'alumni');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setModalState({
        show: true,
        success: false,
        title: "Validation Error",
        message: "Please fill in all required fields."
      });
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/api/v2/auth/login' : '/api/v2/auth/register';
    const computedUserType = isLogin ? getRoleByEmail(email) : selectedRole;

    const payload = isLogin
      ? { email, password }
      : {
        email,
        password,
        name,
        user_type: selectedRole,
        graduation_year: gradYear ? Number(gradYear) : null,
        major
      };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data: any = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textText = await response.text();
        throw new Error(textText || `Server error: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Authentication failed');
      }

      // Success
      const isAlumniPending = !isLogin && computedUserType === 'alumni' && !data.token;

      setModalState({
        show: true,
        success: true,
        title: isAlumniPending ? "Registration Successful" : (isLogin ? "Success!" : "Welcome Aboard!"),
        message: isAlumniPending
          ? "Your alumni registration has been submitted successfully. However, your profile must be approved by the administrator before you can log in. You will receive an email notification once approved."
          : (isLogin
              ? "You have logged in successfully. Preparing your dashboard..."
              : `Account created successfully as a Student. Redirecting...`),
        action: () => {
          if (!isAlumniPending) {
            login(data.token, data.refreshToken, data.user);
            router.push('/post-login');
          } else {
            setIsLogin(true); // Switch to login view
          }
        }
      });
    } catch (err: any) {
      setModalState({
        show: true,
        success: false,
        title: "Authentication Failed",
        message: err.message || "Something went wrong. Please check your credentials."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f3eb] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative blurred circles matching portal style */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-2xl p-2 shadow-lg border border-teal-900/10 flex items-center justify-center overflow-hidden">
             <img src="/NEWCNLOGO.png" alt="Alumnex Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-teal-950 sm:text-4xl">
            Alumnex
          </h2>
          <p className="mt-1 text-xs text-teal-800 font-bold uppercase tracking-widest">
            Connecting Future
          </p>
        </div>

        <Card className="border-teal-900/10 bg-white shadow-xl backdrop-blur-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-teal-950 text-center">
              {isLogin ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription className="text-teal-800/80 text-center">
              {isLogin
                ? "Enter credentials to access your dashboard"
                : "Select your role and sign up below"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form onSubmit={handleSubmit} className="space-y-4">

              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label className="text-teal-900 font-medium">Account Type</Label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-teal-50 border border-teal-900/10 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('student')}
                        className={`py-2 text-xs font-bold rounded-md transition ${selectedRole === 'student' ? 'bg-teal-950 text-white shadow' : 'text-teal-800 hover:text-teal-950'}`}
                      >
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('alumni')}
                        className={`py-2 text-xs font-bold rounded-md transition ${selectedRole === 'alumni' ? 'bg-teal-950 text-white shadow' : 'text-teal-800 hover:text-teal-950'}`}
                      >
                        Alumni
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-teal-900 font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4.5 w-4.5 text-teal-600" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 border-teal-900/10 bg-white text-teal-950 focus:border-teal-500 focus:ring-teal-500"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-teal-900 font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-teal-600" />
                  <Input
                    id="email"
                    placeholder="name@university.edu"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-teal-900/10 bg-white text-teal-950 focus:border-teal-500 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-teal-900 font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-teal-600" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 border-teal-900/10 bg-white text-teal-950 focus:border-teal-500 focus:ring-teal-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-teal-600 hover:text-teal-800 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="major" className="text-teal-900 font-medium">
                      Branch/Department
                    </Label>
                    <select
                      id="major"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      className="w-full h-10 border border-teal-900/10 bg-white rounded-md px-3 py-2 text-sm text-teal-950 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-sm cursor-pointer"
                      required
                    >
                      <option value="" disabled>Select your branch</option>
                      <option value="Computer Engineering">Computer Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Artificial Intelligence and Data Science">Artificial Intelligence and Data Science</option>
                      <option value="Electronics and Telecommunication Engineering">Electronics and Telecommunication Engineering</option>
                      <option value="Mechatronics Engineering">Mechatronics Engineering</option>
                      <option value="Electronics and Computer Science">Electronics and Computer Science</option>
                      <option value="CSE(AI&ML)">CSE(AI&ML)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gradYear" className="text-teal-900 font-medium">
                      Graduation Year
                    </Label>
                    <select
                      id="gradYear"
                      value={gradYear}
                      onChange={(e) => setGradYear(e.target.value)}
                      className="w-full h-10 border border-teal-900/10 bg-white rounded-md px-3 py-2 text-sm text-teal-950 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-sm cursor-pointer"
                      required
                    >
                      <option value="" disabled>Select Year</option>
                      {years.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-950 text-white hover:bg-teal-900 font-bold shadow-md transition duration-200 mt-6 h-11"
              >
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Register"}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-teal-900/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-teal-700">
                  Or
                </span>
              </div>
            </div>

            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-teal-900 hover:text-teal-700 text-sm font-semibold transition"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Success / Failure Modal */}
      {modalState.show && (
        <div className="fixed inset-0 bg-teal-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-teal-900/5 flex flex-col items-center text-center">
            <div className="mb-4">
              {modalState.success ? (
                <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500 animate-shake" />
              )}
            </div>
            <h3 className="text-xl font-bold text-teal-950 mb-2">{modalState.title}</h3>
            <p className="text-sm text-teal-800 mb-6">{modalState.message}</p>
            <Button
              onClick={() => {
                setModalState(prev => ({ ...prev, show: false }));
                if (modalState.action) {
                  modalState.action();
                }
              }}
              className={`w-full ${modalState.success ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white h-11 rounded-xl shadow-md`}
            >
              {modalState.success ? "Proceed" : "Close"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}