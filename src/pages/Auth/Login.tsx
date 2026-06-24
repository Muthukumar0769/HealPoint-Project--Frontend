import { useState } from "react";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useRef } from "react";
import toast from "react-hot-toast";
import usePageTitle from "../../hooks/usePageTitle";

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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);
    setErrors({});
    toast.dismiss(toastId.current);
    try {
      const response = await API.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      const user = response.data.user;
      const accessToken = response.data.accessToken;
      const tokenPayload = JSON.parse(atob(accessToken.split(".")[1]));
      const loginUser = {...user,doctorId: tokenPayload?.profile_id || null};
      localStorage.setItem("user", JSON.stringify(loginUser));
      localStorage.setItem("accessToken", accessToken);
      window.dispatchEvent(new Event("authChanged"));
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

    <main className="fixed inset-0 top-16 flex items-center justify-center bg-[#f0f4fb] px-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white px-6 py-7 shadow-2xl shadow-sky-100 sm:px-8">
        <div className="mb-2 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-md shadow-blue-100">
            <FaLock className="text-base" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
            Login Account
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Welcome back to HealPoint
          </p>
        </div>

        <form className="space-y-3.5" onSubmit={handleLogin} onKeyDown={(e) => { if (e.key === "Enter" && loading) e.preventDefault(); }}>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm">
              Email Address
            </label>
            <div className={`flex h-11 items-center rounded-2xl border bg-slate-50 px-4 transition focus-within:bg-white focus-within:shadow-sm ${errors.email ? "border-red-400 focus-within:border-red-400" : "border-slate-200 focus-within:border-blue-500"}`}>
              <FaEnvelope className="shrink-0 text-xs text-slate-400" />
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email"
                required className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" />
            </div>
            {errors.email && <p className="mt-1 text-xs font-semibold text-red-500">{errors.email}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm">
              Password
            </label>
            <div className={`flex h-11 items-center rounded-2xl border bg-slate-50 px-4 transition focus-within:bg-white focus-within:shadow-sm ${errors.password ? "border-red-400 focus-within:border-red-400" : "border-slate-200 focus-within:border-blue-500"}`}>
              <FaLock className="shrink-0 text-xs text-slate-400" />
              <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="Enter your password"
                required className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0 text-slate-400 transition hover:text-slate-600">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs font-semibold text-red-500">{errors.password}</p>}
          </div>
          <div className="text-right">
            <Link to="/forgot-password" className="text-xs font-semibold text-slate-500 transition hover:text-blue-600 hover:underline sm:text-sm">
              Forgot Password?
            </Link>
          </div>
          <button type="submit" disabled={loading} onClick={(e) => { if (loading) e.preventDefault(); }} className="h-11 w-full cursor-pointer rounded-2xl bg-blue-500 text-sm font-bold text-white shadow-md shadow-blue-100 transition duration-300 hover:scale-[1.02] hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Logging in..." : "Login"}
          </button>
          <p className="pt-0.5 text-center text-xs text-slate-600 sm:text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="cursor-pointer font-bold text-blue-600 hover:underline">
              Register Now
            </Link>
          </p>
        </form>
      </div >
    </main >
  );
};