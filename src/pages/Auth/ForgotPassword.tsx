import { useState, useEffect, useRef } from "react";
import { FaArrowLeft, FaEnvelope, FaEye, FaEyeSlash, FaLock, FaCheckCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle";

type Step = "email" | "otp" | "reset" | "success";

export const ForgotPassword = () => {
    const location = useLocation();
    usePageTitle(location.pathname.includes("reset") ? "Reset Password" : "Forgot Password");
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(50);
    const [canResend, setCanResend] = useState(false);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (step !== "otp") return;
        setTimer(50);
        setCanResend(false);
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [step]);

    const handleSendOtp = async () => {
        if (!email.trim()) return toast.error("Please enter your email");
        setLoading(true);
        try {
            await API.post("/auth/forgot-password", { email });
            toast.success("OTP sent to your email");
            setStep("otp");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!canResend) return;
        setLoading(true);
        try {
            await API.post("/auth/forgot-password", { email });
            toast.success("OTP resent");
            setOtp(["", "", "", "", "", ""]);
            setStep("otp");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to resend OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        const otpValue = otp.join("");
        if (otpValue.length < 6) return toast.error("Please enter the full 6-digit OTP");
        setLoading(true);
        try {
            await API.post("/auth/verify-reset-otp", { email, otp: otpValue });
            toast.success("OTP verified");
            setStep("reset");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Invalid or expired OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) return toast.error("Please fill all fields");
        if (password !== confirmPassword) return toast.error("Passwords do not match");
        if (password.length < 6) return toast.error("Password must be at least 6 characters");
        setLoading(true);
        try {
            await API.post("/auth/reset-password", {
                email,
                password,
                confirmPassword,
                confirm_password: confirmPassword
            });
            toast.success("Password reset successfully");
            setStep("success");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (value: string, index: number) => {
        if (!/^[0-9]?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const newOtp = [...otp];
        pasted.split("").forEach((char, i) => { newOtp[i] = char; });
        setOtp(newOtp);
        otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    return (
        <div className="min-h-screen bg-[#f0f4fb] flex items-center justify-center px-4 py-10 pt-24">
            <div className="w-full max-w-md">
                {step === "email" && (
                    <div className="rounded-3xl bg-white p-8 shadow-xl shadow-sky-100 border border-blue-50">
                        <Link to="/login" className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600">
                            <FaArrowLeft className="text-xs" /> Back to Login
                        </Link>
                        <div className="mb-8 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-100">
                                <FaLock className="text-2xl" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-slate-900">Forgot Password?</h1>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Enter your registered email and we'll send you an OTP to reset your password.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Email Address</label>
                                <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-sm">
                                    <FaEnvelope className="shrink-0 text-xs text-slate-400" />
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                                        placeholder="Enter your email"
                                        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" />
                                </div>
                            </div>
                            <button onClick={handleSendOtp} disabled={loading}
                                className="h-12 w-full cursor-pointer rounded-2xl bg-blue-500 text-sm font-bold text-white shadow-md shadow-blue-100 transition hover:bg-blue-600 disabled:opacity-60">
                                {loading ? "Sending OTP..." : "Send OTP"}
                            </button>
                        </div>
                    </div>
                )}
                {step === "otp" && (
                    <div className="rounded-3xl bg-white p-8 shadow-xl shadow-sky-100 border border-blue-50">
                        <button onClick={() => setStep("email")} className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600">
                            <FaArrowLeft className="text-xs" /> Back
                        </button>
                        <div className="mb-8 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-100">
                                <FaEnvelope className="text-2xl" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-slate-900">Verify OTP</h1>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                We sent a 6-digit OTP to <span className="font-bold text-slate-700">{email}</span>
                            </p>
                        </div>

                        <div className="flex justify-center gap-2 mb-6" onPaste={handleOtpPaste}>
                            {otp.map((digit, index) => (
                                <input key={index} ref={(el) => { otpRefs.current[index] = el; }} value={digit} maxLength={1}
                                    onChange={(e) => handleOtpChange(e.target.value, index)}
                                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                    className={`h-13 w-11 rounded-xl border-2 text-center text-lg font-extrabold outline-none transition sm:h-14 sm:w-12 ${digit ? "border-blue-500 bg-blue-50 text-blue-600" : "border-slate-200 bg-slate-50 text-slate-800"
                                        } focus:border-blue-500 focus:bg-white`} />
                            ))}
                        </div>

                        <div className="mb-6 text-center">
                            {!canResend ? (
                                <p className="text-sm text-slate-500">
                                    Resend OTP in{" "}
                                    <span className="font-bold text-blue-600">
                                        00:{String(timer).padStart(2, "0")}
                                    </span>
                                </p>
                            ) : (
                                <button onClick={handleResendOtp} disabled={loading} className="text-sm font-bold text-blue-600 transition hover:underline disabled:opacity-60">
                                    Resend OTP
                                </button>
                            )}
                        </div>
                        <button onClick={handleVerifyOtp} disabled={loading || otp.join("").length < 6}
                            className="h-12 w-full cursor-pointer rounded-2xl bg-blue-500 text-sm font-bold text-white shadow-md shadow-blue-100 transition hover:bg-blue-600 disabled:opacity-60">
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>
                    </div>
                )}
                {step === "reset" && (
                    <div className="rounded-3xl bg-white p-8 shadow-xl shadow-sky-100 border border-blue-50">
                        <button onClick={() => setStep("otp")} className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600">
                            <FaArrowLeft className="text-xs" /> Back
                        </button>
                        <div className="mb-8 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-100">
                                <FaLock className="text-2xl" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-slate-900">Reset Password</h1>
                            <p className="mt-2 text-sm leading-6 text-slate-500">Create a strong new password for your account.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">New Password</label>
                                <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-sm">
                                    <FaLock className="shrink-0 text-xs text-slate-400" />
                                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 transition hover:text-slate-600">
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Confirm Password</label>
                                <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-sm">
                                    <FaLock className="shrink-0 text-xs text-slate-400" />
                                    <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-slate-400 transition hover:text-slate-600">
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                            <button onClick={handleResetPassword} disabled={loading} className="h-12 w-full cursor-pointer rounded-2xl bg-blue-500 text-sm font-bold text-white shadow-md shadow-blue-100 transition hover:bg-blue-600 disabled:opacity-60">
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>
                        </div>
                    </div>
                )}
                {step === "success" && (
                    <div className="rounded-3xl bg-white p-8 shadow-xl shadow-sky-100 border border-blue-50 text-center">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                            <FaCheckCircle className="text-4xl text-green-500" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-900">Password Reset!</h1>
                        <p className="mt-3 text-sm leading-6 text-slate-500">
                            Your password has been reset successfully. You can now log in with your new password.
                        </p>
                        <button onClick={() => navigate("/login")} className="mt-8 h-12 w-full cursor-pointer rounded-2xl bg-blue-500 text-sm font-bold text-white shadow-md shadow-blue-100 transition hover:bg-blue-600">
                            Back to Login
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};