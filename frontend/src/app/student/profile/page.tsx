"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StudentNavigation from "../StudentNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap, User, BookOpen, Hash, Linkedin, FileText,
  ArrowLeft, CheckCircle, ArrowRight, Phone, MapPin, Trophy, Cpu,
} from "lucide-react";

const ENGINEERING_BRANCHES = [
  "Computer Science Engineering (CSE)",
  "Information Technology (IT)",
  "Electronics & Telecommunication Engineering (ENTC)",
  "Mechanical Engineering (ME)",
  "Civil Engineering (CE)",
  "Electrical Engineering (EE)",
  "Electronics & Computer Science (ECS)",
  "Artificial Intelligence & Data Science (AIDS)",
  "Computer Engineering (CE)",
  "Chemical Engineering",
  "Instrumentation Engineering",
  "Other",
];
const YEAR_OPTIONS = ["First Year (FY)", "Second Year (SY)", "Third Year (TY)", "Final Year (BE)"];
const SEMESTER_OPTIONS = ["Semester I", "Semester II", "Semester III", "Semester IV", "Semester V", "Semester VI", "Semester VII", "Semester VIII"];

const EMPTY = { fullName: "", rollNumber: "", yearOfStudy: "", semester: "", department: "", phone: "", cgpa: "", linkedIn: "", bio: "", skills: "", location: "" };

export default function StudentProfilePage() {
  const { user } = useUser();
  const router = useRouter();

  const [formData, setFormData] = useState(EMPTY);
  const [dataLoaded, setDataLoaded] = useState(false);   // controls input disabled state only
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fetchedRef = useRef(false);

  // ── Fetch immediately on mount — no auth gate ──────────────────────────────
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetch("/api/user/profile", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user || {};
        const rawName = u.name || "";
        setFormData({
          fullName: rawName.includes("@") ? "" : rawName,
          rollNumber: u.roll_number || "",
          yearOfStudy: u.year_of_study || "",
          semester: u.semester || "",
          department: u.department || u.major || "",
          phone: u.phone || "",
          cgpa: u.cgpa ? String(u.cgpa) : "",
          linkedIn: u.linkedin_url || "",
          bio: u.bio || "",
          skills: typeof u.skills === "string" ? u.skills : Array.isArray(u.skills) ? u.skills.join(", ") : "",
          location: u.location || "",
        });
      })
      .catch(() => { })
      .finally(() => setDataLoaded(true));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const tokenResp = await fetch(`${window.location.origin}/api/auth/token`, { cache: "no-store" });
      if (!tokenResp.ok) throw new Error("Not authenticated");
      const { accessToken } = await tokenResp.json();

      const rawBase = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
      const base = rawBase.endsWith("/api") ? rawBase : `${rawBase.replace(/\/$/, "")}/api`;

      const resp = await fetch(`${base}/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          name: formData.fullName, email: user?.email || "", phone: formData.phone,
          rollNumber: formData.rollNumber, yearOfStudy: formData.yearOfStudy,
          semester: formData.semester, department: formData.department, course: formData.department,
          cgpa: formData.cgpa, linkedIn: formData.linkedIn, bio: formData.bio,
          skills: formData.skills, location: formData.location,
        }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      setSuccess(true);
      router.refresh(); // invalidate Next.js cache so sidebar re-fetches fresh name
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err?.message || "Save failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Input class helper ──────────────────────────────────────────────────────
  const input = (ring = "blue") =>
    `w-full px-4 py-3 border-2 rounded-xl bg-white shadow-sm text-gray-900 placeholder-gray-400 transition-all hover:border-gray-400 focus:outline-none focus:ring-2 ${dataLoaded
      ? `border-gray-300 focus:border-${ring}-500 focus:ring-${ring}-200`
      : "border-gray-200 opacity-60 cursor-wait"
    }`;

  const inputWithIcon = (ring = "blue") => input(ring).replace("px-4", "pl-10 pr-4");

  const initials = formData.fullName
    ? formData.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "S";

  return (
    <StudentNavigation>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-6 px-2 sm:px-4">
        <div className="max-w-6xl mx-auto">

          {/* Header — renders instantly */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Update Your Profile</h1>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {user?.email ? <>Signed in as <span className="font-medium text-green-700">{user.email}</span></> : <span className="inline-block w-40 h-4 bg-gray-200 rounded animate-pulse" />}
                  </p>
                </div>
              </div>
              <button onClick={() => router.push("/student/dashboard")} className="flex items-center gap-2 text-gray-600 hover:text-green-700 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>

            {success && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 font-medium flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Profile saved successfully!
              </div>
            )}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}
            {!dataLoaded && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                Loading your details…
              </div>
            )}
          </div>

          {/* Two-column layout — rendered immediately, inputs disabled while loading */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* Left: Form */}
            <Card className="shadow-xl border border-gray-100 w-full lg:w-2/3 bg-white">
              <CardHeader className="pb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg border-b border-green-100">
                <CardTitle className="text-lg sm:text-xl flex items-center text-gray-900 font-bold">
                  <User className="w-6 h-6 mr-3 text-green-600" />
                  Student Profile Details
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Keep your profile up to date for the best mentor and job matches</p>
              </CardHeader>

              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-8">

                  {/* Personal Info */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg shadow-md">
                      <h3 className="text-sm font-bold uppercase tracking-wide flex items-center"><User className="w-5 h-5 mr-3" />Personal Information</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3">Full Name *</label>
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="e.g. Vinayak Gorivale" disabled={!dataLoaded} className={input()} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
                          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 9876543210" disabled={!dataLoaded} className={inputWithIcon()} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3">Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
                          <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Mumbai, India" disabled={!dataLoaded} className={inputWithIcon()} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3">LinkedIn Profile</label>
                        <div className="relative">
                          <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 w-5 h-5" />
                          <input type="url" name="linkedIn" value={formData.linkedIn} onChange={handleChange} placeholder="https://linkedin.com/in/yourprofile" disabled={!dataLoaded} className={inputWithIcon()} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Info */}
                  <div className="border-t border-gray-200 pt-8 space-y-6">
                    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg shadow-md">
                      <h3 className="text-sm font-bold uppercase tracking-wide flex items-center"><BookOpen className="w-5 h-5 mr-3" />Academic Information</h3>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">Enrollment / Roll Number *</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                        <input type="text" name="rollNumber" value={formData.rollNumber} onChange={handleChange} required placeholder="e.g. VU4F2223050" disabled={!dataLoaded} className={inputWithIcon("green")} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">Branch / Department *</label>
                      <div className="relative">
                        <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                        <select name="department" value={formData.department} onChange={handleChange} required disabled={!dataLoaded} className={`${inputWithIcon("green")} appearance-none`}>
                          <option value="">Select branch</option>
                          {ENGINEERING_BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3">Year of Study *</label>
                        <select name="yearOfStudy" value={formData.yearOfStudy} onChange={handleChange} required disabled={!dataLoaded} className={`${input("green")} appearance-none`}>
                          <option value="">Select year</option>
                          {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3">Current Semester</label>
                        <select name="semester" value={formData.semester} onChange={handleChange} disabled={!dataLoaded} className={`${input("green")} appearance-none`}>
                          <option value="">Select semester</option>
                          {SEMESTER_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3">Current CGPA</label>
                        <div className="relative">
                          <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                          <input type="number" name="cgpa" value={formData.cgpa} onChange={handleChange} min="0" max="10" step="0.01" placeholder="e.g. 8.5" disabled={!dataLoaded} className={inputWithIcon("green")} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="border-t border-gray-200 pt-8 space-y-6">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg shadow-md">
                      <h3 className="text-sm font-bold uppercase tracking-wide flex items-center"><FileText className="w-5 h-5 mr-3" />Additional Information</h3>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">About Yourself</label>
                      <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} placeholder="Tell us about yourself — your interests, goals, and projects..." disabled={!dataLoaded} className={`${input("purple")} resize-none`} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">Technical Skills</label>
                      <input type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g. Python, Java, React, Machine Learning" disabled={!dataLoaded} className={input("purple")} />
                      <p className="text-xs text-gray-500 mt-2 font-medium">Separate skills with commas</p>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="border-t border-gray-200 pt-8">
                    <Button type="submit" disabled={isSubmitting || !dataLoaded} className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-60 disabled:scale-100">
                      {isSubmitting ? (
                        <><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3" />Saving...</>
                      ) : (
                        <><span>Save Profile</span><ArrowRight className="w-5 h-5 ml-2" /></>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Right: Live Preview — sticky */}
            <div className="w-full lg:w-1/3 lg:sticky lg:top-6">
              <Card className="shadow-xl border border-gray-100 bg-white">
                <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-lg border-b border-gray-100">
                  <CardTitle className="text-lg text-gray-900 font-bold flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Live Profile Preview
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">How your profile looks to others</p>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {!dataLoaded ? (
                    // Skeleton while loading
                    <div className="space-y-3 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                      <div className="flex gap-2">
                        <div className="h-6 w-16 bg-gray-200 rounded-full" />
                        <div className="h-6 w-20 bg-gray-200 rounded-full" />
                        <div className="h-6 w-14 bg-gray-200 rounded-full" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                          <span className="text-green-700 text-lg font-bold">{initials}</span>
                        </div>
                        <div>
                          <div className="text-base font-semibold text-gray-900">{formData.fullName || "Your name"}</div>
                          <div className="text-gray-600 text-sm">
                            {formData.yearOfStudy || "Year"}{formData.department ? ` · ${formData.department}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        {formData.rollNumber && <div className="flex items-center gap-2"><Hash className="w-4 h-4 text-gray-400 shrink-0" />{formData.rollNumber}</div>}
                        {formData.cgpa && <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500 shrink-0" />CGPA: {formData.cgpa}</div>}
                        {formData.location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400 shrink-0" />{formData.location}</div>}
                        {formData.semester && <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-gray-400 shrink-0" />{formData.semester}</div>}
                        {formData.linkedIn && (
                          <a href={formData.linkedIn} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline col-span-2">
                            <Linkedin className="w-4 h-4 shrink-0" />LinkedIn
                          </a>
                        )}
                      </div>
                      {formData.bio && <p className="text-sm text-gray-700 leading-relaxed border-l-4 border-green-200 pl-3 italic">{formData.bio}</p>}
                      {formData.skills && (
                        <div className="flex flex-wrap gap-2">
                          {formData.skills.split(",").slice(0, 8).map((s) => s.trim()).filter(Boolean).map((s) => (
                            <span key={s} className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700 font-medium">{s}</span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="mt-4 p-4 bg-green-600/10 border border-green-200 rounded-2xl">
                <p className="text-sm text-green-800 font-semibold mb-1">🎓 Why keep this up to date?</p>
                <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
                  <li>Get matched with the right mentors</li>
                  <li>Find relevant job & internship listings</li>
                  <li>Connect with alumni in your branch</li>
                  <li>Personalised dashboard experience</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentNavigation>
  );
}