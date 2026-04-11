"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    GraduationCap,
    User,
    BookOpen,
    Hash,
    Linkedin,
    FileText,
    ArrowRight,
    CheckCircle,
    Phone,
    MapPin,
    Trophy,
    Cpu,
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

const YEAR_OPTIONS = [
    "First Year (FY)",
    "Second Year (SY)",
    "Third Year (TY)",
    "Final Year (BE)",
];

const SEMESTER_OPTIONS = [
    "Semester I",
    "Semester II",
    "Semester III",
    "Semester IV",
    "Semester V",
    "Semester VI",
    "Semester VII",
    "Semester VIII",
];

export default function StudentRegistrationPage() {
    const { user, isLoading } = useUser();
    const router = useRouter();

    const [formData, setFormData] = useState({
        fullName: "",
        rollNumber: "",
        yearOfStudy: "",
        semester: "",
        department: "",
        course: "",
        phone: "",
        cgpa: "",
        linkedIn: "",
        bio: "",
        skills: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pre-fill name from Auth0 — but ONLY if user.name is not an email address.
    // Auth0 sets name = email when no display name is configured.
    useEffect(() => {
        if (user && !isLoading) {
            const auth0Name = user.name || "";
            const isEmail = auth0Name.includes("@");
            setFormData((prev) => ({
                ...prev,
                fullName: isEmail ? "" : auth0Name,
            }));
        }
    }, [user, isLoading]);

    // If already registered, redirect to dashboard
    useEffect(() => {
        const check = async () => {
            if (!user || isLoading) return;
            try {
                const resp = await fetch("/api/user/profile", { cache: "no-store" });
                if (!resp.ok) return;
                const data = await resp.json();
                const u = data?.user || {};
                if (u.registration_completed === true) {
                    router.push("/student/dashboard");
                }
                // Pre-fill if partially saved
                setFormData((prev) => ({
                    ...prev,
                    // If DB name looks like an email it means it was incorrectly saved — clear it so user enters their real name
                    fullName: (u.name && !u.name.includes('@')) ? u.name : (prev.fullName && !prev.fullName.includes('@') ? prev.fullName : ""),
                    rollNumber: u.roll_number || "",
                    yearOfStudy: u.year_of_study || "",
                    department: u.department || "",
                    course: u.major || "",
                    phone: u.phone || "",
                    cgpa: u.cgpa ? String(u.cgpa) : "",
                    linkedIn: u.linkedin_url || "",
                    bio: u.bio || "",
                    skills:
                        typeof u.skills === "string"
                            ? u.skills
                            : Array.isArray(u.skills)
                                ? u.skills.join(", ")
                                : "",
                }));
            } catch {
                // Ignore
            }
        };
        check();
    }, [user, isLoading, router]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            const origin = window.location.origin;
            const tokenResp = await fetch(`${origin}/api/auth/token`, {
                cache: "no-store",
            });
            if (!tokenResp.ok) throw new Error("Not authenticated");
            const { accessToken } = await tokenResp.json();

            const rawBase =
                process.env.NEXT_PUBLIC_API_BASE ||
                process.env.NEXT_PUBLIC_API_BASE_URL ||
                "http://localhost:4000";
            const base = rawBase.endsWith("/api")
                ? rawBase
                : `${rawBase.replace(/\/$/, "")}/api`;

            const payload = {
                name: formData.fullName,
                email: user?.email || "",
                phone: formData.phone,
                rollNumber: formData.rollNumber,
                yearOfStudy: formData.yearOfStudy,
                department: formData.department,
                course: formData.department, // also stored in major
                cgpa: formData.cgpa,
                linkedIn: formData.linkedIn,
                bio: formData.bio,
                skills: formData.skills,
            };

            const resp = await fetch(`${base}/users/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(text || "Failed to save profile");
            }

            router.push("/student/dashboard");
        } catch (err: any) {
            setError(err?.message || "Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-green-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-green-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-xl border-0">
                    <CardHeader className="text-center pb-6">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <GraduationCap className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            Student Sign-In Required
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <a href="/login" className="w-full">
                            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold shadow-lg">
                                <User className="w-5 h-5 mr-2" />
                                Sign In
                            </Button>
                        </a>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-green-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl">
                            <GraduationCap className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                        Complete Your Student Profile
                    </h1>
                    <p className="text-gray-600">
                        Signed in as{" "}
                        <span className="font-semibold text-blue-600">{user.email}</span>
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* ── Left: Form ── */}
                    <Card className="shadow-2xl border border-white/60 w-full lg:w-2/3 bg-white/90 backdrop-blur-sm">
                        <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl border-b border-blue-100">
                            <CardTitle className="text-lg flex items-center text-gray-900 font-bold">
                                <BookOpen className="w-6 h-6 mr-3 text-blue-600" />
                                Engineering Student Details
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                                Fill in your academic and personal information
                            </p>
                        </CardHeader>

                        <CardContent className="p-6">
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* ── Section 1: Personal Info ── */}
                                <div className="space-y-5">
                                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-5 py-3 rounded-xl shadow-md">
                                        <h3 className="text-sm font-bold uppercase tracking-wide flex items-center">
                                            <User className="w-4 h-4 mr-2" />
                                            Personal Information
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {/* Full Name */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                                required
                                                placeholder="e.g. Vinayak Gorivale"
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 transition-all hover:border-gray-300"
                                            />
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                                Phone Number
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 w-4 h-4" />
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="+91 9876543210"
                                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 transition-all hover:border-gray-300"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Section 2: Academic Info ── */}
                                <div className="border-t border-gray-100 pt-6 space-y-5">
                                    <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-5 py-3 rounded-xl shadow-md">
                                        <h3 className="text-sm font-bold uppercase tracking-wide flex items-center">
                                            <BookOpen className="w-4 h-4 mr-2" />
                                            Academic Information
                                        </h3>
                                    </div>

                                    {/* Roll Number */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-2">
                                            Enrollment / Roll Number *
                                        </label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 w-4 h-4" />
                                            <input
                                                type="text"
                                                name="rollNumber"
                                                value={formData.rollNumber}
                                                onChange={handleChange}
                                                required
                                                placeholder="e.g. VU4F2223050"
                                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 focus:border-green-500 bg-white text-gray-900 placeholder-gray-400 transition-all hover:border-gray-300"
                                            />
                                        </div>
                                    </div>

                                    {/* Branch */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-2">
                                            Branch / Department *
                                        </label>
                                        <div className="relative">
                                            <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 w-4 h-4" />
                                            <select
                                                name="department"
                                                value={formData.department}
                                                onChange={handleChange}
                                                required
                                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 focus:border-green-500 bg-white text-gray-900 transition-all hover:border-gray-300 appearance-none"
                                            >
                                                <option value="">Select branch</option>
                                                {ENGINEERING_BRANCHES.map((b) => (
                                                    <option key={b} value={b}>
                                                        {b}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {/* Year of Study */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                                Year of Study *
                                            </label>
                                            <select
                                                name="yearOfStudy"
                                                value={formData.yearOfStudy}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 focus:border-green-500 bg-white text-gray-900 transition-all hover:border-gray-300"
                                            >
                                                <option value="">Select year</option>
                                                {YEAR_OPTIONS.map((y) => (
                                                    <option key={y} value={y}>
                                                        {y}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Semester */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                                Current Semester
                                            </label>
                                            <select
                                                name="semester"
                                                value={formData.semester}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 focus:border-green-500 bg-white text-gray-900 transition-all hover:border-gray-300"
                                            >
                                                <option value="">Select semester</option>
                                                {SEMESTER_OPTIONS.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* CGPA */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                                Current CGPA
                                            </label>
                                            <div className="relative">
                                                <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 w-4 h-4" />
                                                <input
                                                    type="number"
                                                    name="cgpa"
                                                    value={formData.cgpa}
                                                    onChange={handleChange}
                                                    min="0"
                                                    max="10"
                                                    step="0.01"
                                                    placeholder="e.g. 8.5"
                                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 focus:border-green-500 bg-white text-gray-900 placeholder-gray-400 transition-all hover:border-gray-300"
                                                />
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                                Location
                                            </label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 w-4 h-4" />
                                                <input
                                                    type="text"
                                                    name="location"
                                                    value={(formData as any).location || ""}
                                                    onChange={handleChange}
                                                    placeholder="e.g. Mumbai, India"
                                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 focus:border-green-500 bg-white text-gray-900 placeholder-gray-400 transition-all hover:border-gray-300"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* LinkedIn */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-2">
                                            LinkedIn Profile
                                        </label>
                                        <div className="relative">
                                            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 w-4 h-4" />
                                            <input
                                                type="url"
                                                name="linkedIn"
                                                value={formData.linkedIn}
                                                onChange={handleChange}
                                                placeholder="https://linkedin.com/in/yourprofile"
                                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 transition-all hover:border-gray-300"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ── Section 3: Additional ── */}
                                <div className="border-t border-gray-100 pt-6 space-y-5">
                                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-3 rounded-xl shadow-md">
                                        <h3 className="text-sm font-bold uppercase tracking-wide flex items-center">
                                            <FileText className="w-4 h-4 mr-2" />
                                            Additional Information
                                        </h3>
                                    </div>

                                    {/* Bio */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-2">
                                            About Yourself
                                        </label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            rows={4}
                                            placeholder="Tell us about yourself — your interests, goals, projects, and what you're passionate about..."
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-400 transition-all hover:border-gray-300 resize-none"
                                        />
                                    </div>

                                    {/* Skills */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-2">
                                            Technical Skills
                                        </label>
                                        <input
                                            type="text"
                                            name="skills"
                                            value={formData.skills}
                                            onChange={handleChange}
                                            placeholder="e.g. Python, Java, React, Machine Learning, AutoCAD"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-400 transition-all hover:border-gray-300"
                                        />
                                        <p className="text-xs text-gray-500 mt-1.5">
                                            Separate skills with commas
                                        </p>
                                    </div>
                                </div>

                                {/* ── Submit ── */}
                                <div className="border-t border-gray-100 pt-6">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-4 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-[1.01]"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3" />
                                                Saving Profile...
                                            </>
                                        ) : (
                                            <>
                                                <span>Save & Go to Dashboard</span>
                                                <ArrowRight className="w-5 h-5 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* ── Right: Live Preview ── */}
                    <div className="w-full lg:w-1/3 lg:sticky lg:top-6">
                        <Card className="shadow-2xl border border-white/60 bg-white/90 backdrop-blur-sm">
                            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl border-b border-blue-100">
                                <CardTitle className="text-lg text-gray-900 font-bold flex items-center">
                                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                                    Live Preview
                                </CardTitle>
                                <p className="text-sm text-gray-500 mt-1">
                                    How your profile will look
                                </p>
                            </CardHeader>

                            <CardContent className="p-5 space-y-4">
                                {/* Avatar + Name */}
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                        <span className="text-white text-xl font-bold">
                                            {formData.fullName?.[0]?.toUpperCase() || "S"}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">
                                            {formData.fullName || "Your Name"}
                                        </p>
                                        <p className="text-sm text-blue-600 font-medium">
                                            {formData.yearOfStudy || "Year of Study"}
                                        </p>
                                    </div>
                                </div>

                                {/* Details grid */}
                                <div className="grid gap-2 text-sm text-gray-700">
                                    {formData.department && (
                                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                                            <Cpu className="w-4 h-4 text-green-600 shrink-0" />
                                            <span className="font-medium">{formData.department}</span>
                                        </div>
                                    )}
                                    {formData.rollNumber && (
                                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                                            <Hash className="w-4 h-4 text-blue-600 shrink-0" />
                                            <span>{formData.rollNumber}</span>
                                        </div>
                                    )}
                                    {formData.cgpa && (
                                        <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                                            <Trophy className="w-4 h-4 text-yellow-600 shrink-0" />
                                            <span>CGPA: {formData.cgpa} / 10</span>
                                        </div>
                                    )}
                                    {formData.semester && (
                                        <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg">
                                            <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                                            <span>{formData.semester}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Bio preview */}
                                {formData.bio && (
                                    <p className="text-sm text-gray-600 italic border-l-4 border-blue-200 pl-3">
                                        {formData.bio}
                                    </p>
                                )}

                                {/* Skills */}
                                {formData.skills && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.skills
                                            .split(",")
                                            .slice(0, 8)
                                            .map((s) => s.trim())
                                            .filter(Boolean)
                                            .map((s) => (
                                                <span
                                                    key={s}
                                                    className="px-2.5 py-1 rounded-full text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 font-medium"
                                                >
                                                    {s}
                                                </span>
                                            ))}
                                    </div>
                                )}

                                {/* LinkedIn */}
                                {formData.linkedIn && (
                                    <a
                                        href={formData.linkedIn}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                    >
                                        <Linkedin className="w-4 h-4" />
                                        LinkedIn Profile
                                    </a>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tip card */}
                        <div className="mt-4 p-4 bg-blue-600/10 border border-blue-200 rounded-2xl">
                            <p className="text-sm text-blue-800 font-semibold mb-1">
                                🎓 Why fill this out?
                            </p>
                            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                                <li>Get matched with the right mentors</li>
                                <li>Find job & internship opportunities</li>
                                <li>Connect with alumni in your branch</li>
                                <li>Personalised dashboard experience</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
