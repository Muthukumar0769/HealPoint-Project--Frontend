import { useState } from "react";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaHeartbeat, FaCheckCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useRef } from "react";
import toast from "react-hot-toast";
import usePageTitle from "../../hooks/usePageTitle";

//------Main Component-----------

export const Login = () => {
  usePageTitle("Login");
  const toastId = useRef<string | undefined>(undefined);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const isSubmitting = useRef(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    isSubmitting.current = false;
  };

//------Handle the login logic------------

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);
    setErrors({});
    toast.dismiss(toastId.current);
    try {
      const response = await API.post("/auth/login", { email: form.email, password: form.password });
      const user = response.data.user;
      const accessToken = response.data.accessToken;
      const isFirstLogin = response.data.is_first_login;
      const tokenPayload = JSON.parse(atob(accessToken.split(".")[1]));
      const loginUser = { ...user, doctorId: tokenPayload?.profile_id || null };
      localStorage.setItem("user", JSON.stringify(loginUser));
      localStorage.setItem("accessToken", accessToken);
      window.dispatchEvent(new Event("authChanged"));

      // Doctor logging in with a temporary password must reset it first
      if (loginUser.role === "doctor" && isFirstLogin) {
        toast.success("Please set a new password to continue");
        navigate("/doctor/reset-password", { replace: true });
        return;
      }

      toast.success("Login successful");
      if (loginUser.role === "admin") navigate("/admin/dashboard");
      else if (loginUser.role === "doctor") navigate("/doctor/dashboard");
      else navigate("/");
    } catch (error: any) {
      const errData = error.response?.data;
      if (Array.isArray(errData?.error)) {
        const fieldErrors: { email?: string; password?: string } = {};
        errData.error.forEach((e: { field: string; message: string }) => {
          if (e.field === "email") fieldErrors.email = e.message;
          if (e.field === "password") fieldErrors.password = e.message;
        });
        setErrors(fieldErrors);
      }
      toast.dismiss(toastId.current);
      toastId.current = toast.error(errData?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="fixed inset-0 top-16 flex items-center justify-center bg-[#f0f4fb] px-4 py-6 sm:px-6">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-sky-100">
        <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 p-8 text-white md:flex">
          <div className="pointer-events-none absolute -top-10 right-0 h-44 w-44 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute bottom-0 right-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/5" />

          <div className="relative z-10 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
              <FaHeartbeat className="text-base" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">HealPoint</span>
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl font-extrabold leading-snug sm:text-3xl">
              Your health,
              <br />
              managed smarter
            </h2>
            <p className="mt-3 max-w-xs text-sm font-medium text-blue-50/90">
              Connect with top doctors and manage all your appointments in one place.
            </p>

            <ul className="mt-6 space-y-3">
              <li className="flex items-center gap-2 text-sm font-semibold text-blue-50">
                <FaCheckCircle className="shrink-0 text-blue-200" />
                Book appointments instantly
              </li>
              <li className="flex items-center gap-2 text-sm font-semibold text-blue-50">
                <FaCheckCircle className="shrink-0 text-blue-200" />
                Video consultations
              </li>
              <li className="flex items-center gap-2 text-sm font-semibold text-blue-50">
                <FaCheckCircle className="shrink-0 text-blue-200" />
                Secure &amp; private
              </li>
            </ul>
          </div>

          <p className="relative z-10 text-[11px] font-medium text-blue-50/70">
            © {new Date().getFullYear()} HealPoint. All rights reserved.
          </p>
        </div>
        <div className="flex w-full flex-col justify-center px-5 py-6 sm:px-7 sm:py-7 md:w-1/2">
          <div className="mb-5 flex items-center justify-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
              <FaHeartbeat className="text-sm" />
            </div>
            <span className="text-base font-extrabold text-slate-900">HealPoint</span>
          </div>

          <div className="mb-5 text-center md:text-left">
            <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-md shadow-blue-100 md:mx-0">
              <FaLock className="text-sm" />
            </div>
            <h1 className="text-lg font-extrabold text-slate-900 sm:text-xl">Login Account</h1>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">Welcome back to HealPoint</p>
          </div>

          <form className="space-y-3" onSubmit={handleLogin} onKeyDown={(e) => { if (e.key === "Enter" && loading) e.preventDefault(); }}>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-700 sm:text-xs">Email Address</label>
              <div className={`flex h-10 items-center rounded-xl border bg-slate-50 px-3 transition focus-within:bg-white focus-within:shadow-sm ${errors.email ? "border-red-400 focus-within:border-red-400" : "border-slate-200 focus-within:border-blue-500"}`}>
                <FaEnvelope className="shrink-0 text-[11px] text-slate-400" />
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="Enter your email" required
                  className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm" />
              </div>
              {errors.email && <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-700 sm:text-xs">Password</label>
              <div className={`flex h-10 items-center rounded-xl border bg-slate-50 px-3 transition focus-within:bg-white focus-within:shadow-sm ${errors.password ? "border-red-400 focus-within:border-red-400" : "border-slate-200 focus-within:border-blue-500"}`}>
                <FaLock className="shrink-0 text-[11px] text-slate-400" />
                <input type={showPassword ? "text" : "password"} name="password" value={form.password}
                  onChange={handleChange} placeholder="Enter your password" required
                  className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="shrink-0 text-[11px] text-slate-400 transition hover:text-slate-600">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.password}</p>}
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-[11px] font-semibold text-slate-500 transition hover:text-blue-600 hover:underline sm:text-xs">
                Forgot Password?
              </Link>
            </div>
            <button type="submit" disabled={loading} onClick={(e) => { if (loading) e.preventDefault(); }}
              className="h-10 w-full cursor-pointer rounded-xl bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-100 transition hover:scale-[1.02] hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm">
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="pt-0.5 text-center text-[11px] text-slate-600 sm:text-xs">
              Don't have an account?{" "}
              <Link to="/register" className="cursor-pointer font-bold text-blue-600 hover:underline">
                Register Now
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
};