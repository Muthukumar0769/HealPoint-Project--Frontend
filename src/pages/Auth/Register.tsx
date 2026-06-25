import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaEnvelope, FaLock, FaPhone, FaUser, FaEye, FaEyeSlash, FaHeartbeat, FaCheckCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import type { InputBoxProps, PasswordBoxProps } from "../../types/common.ts";
import usePageTitle from "../../hooks/usePageTitle";

//-----Main component--------

export const Register = () => {
  usePageTitle("Register");
  const navigate = useNavigate();
  const isSubmitting = useRef(false);
  const toastId = useRef<string | undefined>(undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", phone_number: "", gender: "", password: "", confirm_password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone_number") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 10) return;
    }
    setForm({ ...form, [name]: value });
    isSubmitting.current = false;
  };

//----------Handle the Register logic here-----------------

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSubmitting.current) return;
    if (form.phone_number.length !== 10) { toast.error("Phone number must be exactly 10 digits"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (form.password !== form.confirm_password) { toast.error("Password and confirm password do not match"); return; }
    isSubmitting.current = true;
    setLoading(true);
    try {
      await API.post("/auth/register", form);
      isSubmitting.current = false;
      toast.success("Registered successfully");
      navigate("/login");
    } catch (error: any) {
      isSubmitting.current = false;
      toast.dismiss(toastId.current);
      toastId.current = toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f0f4fb] px-4 py-8 pt-20 sm:px-6 lg:pt-20">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-sky-100">
        <div className="relative hidden w-2/5 flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 p-8 text-white md:flex">
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
              Join HealPoint
              <br />
              today
            </h2>
            <p className="mt-3 max-w-xs text-sm font-medium text-blue-50/90">
              Create your account and get access to trusted doctors, instant booking, and secure consultations.
            </p>

            <ul className="mt-6 space-y-3">
              <li className="flex items-center gap-2 text-sm font-semibold text-blue-50">
                <FaCheckCircle className="shrink-0 text-blue-200" />
                Free to join, no hidden fees
              </li>
              <li className="flex items-center gap-2 text-sm font-semibold text-blue-50">
                <FaCheckCircle className="shrink-0 text-blue-200" />
                Verified, experienced doctors
              </li>
              <li className="flex items-center gap-2 text-sm font-semibold text-blue-50">
                <FaCheckCircle className="shrink-0 text-blue-200" />
                Your data stays private
              </li>
            </ul>
          </div>

          <p className="relative z-10 text-[11px] font-medium text-blue-50/70">
            © {new Date().getFullYear()} HealPoint. All rights reserved.
          </p>
        </div>
        <div className="w-full p-5 sm:p-7 md:w-3/5">
          <div className="mb-5 flex items-center justify-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
              <FaHeartbeat className="text-sm" />
            </div>
            <span className="text-base font-extrabold text-slate-900">HealPoint</span>
          </div>

          <div className="mb-5 text-center md:text-left">
            <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-md md:mx-0">
              <FaUser className="text-sm" />
            </div>
            <h1 className="text-lg font-extrabold text-gray-800 sm:text-xl">Create Account</h1>
            <p className="mt-0.5 text-[11px] text-gray-500">Register to HealPoint</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InputBox label="Full Name" icon={<FaUser />} type="text" name="name" value={form.name}
                placeholder="Enter full name" onChange={handleChange} />
              <InputBox label="Email" icon={<FaEnvelope />} type="email" name="email" value={form.email}
                placeholder="Enter email" onChange={handleChange} />
              <div>
                <InputBox label="Phone" icon={<FaPhone />} type="text" name="phone_number" value={form.phone_number}
                  placeholder="Enter phone number" onChange={handleChange} />
                {form.phone_number.length > 0 && form.phone_number.length !== 10 && (
                  <p className="mt-1 text-[11px] font-semibold text-red-500">
                    Phone number must be exactly 10 digits ({form.phone_number.length}/10)
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700 sm:text-xs">Gender</label>
                <div className="flex min-h-10 flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-slate-50 px-3 py-2.5 transition focus-within:border-blue-500">
                  {["Male", "Female", "Others"].map((gender) => (
                    <label key={gender} className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-700">
                      <input type="radio" name="gender" value={gender} checked={form.gender === gender}
                        onChange={handleChange} required className="accent-sky-500" />
                      {gender}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <PasswordBox label="Password" name="password" value={form.password} placeholder="Enter password"
                  showPassword={showPassword} setShowPassword={setShowPassword} onChange={handleChange} />
                {form.password.length > 0 && form.password.length < 6 && (
                  <p className="mt-1 text-[11px] font-semibold text-red-500">
                    Password must be at least 6 characters ({form.password.length}/6)
                  </p>
                )}
                {form.password.length >= 6 && (
                  <p className="mt-1 text-[11px] font-semibold text-green-500">✓ Password looks good</p>
                )}
              </div>
              <div>
                <PasswordBox label="Confirm Password" name="confirm_password" value={form.confirm_password}
                  placeholder="Confirm password" showPassword={showConfirmPassword}
                  setShowPassword={setShowConfirmPassword} onChange={handleChange} />
                {form.confirm_password.length > 0 && form.password !== form.confirm_password && (
                  <p className="mt-1 text-[11px] font-semibold text-red-500">Passwords do not match</p>
                )}
                {form.confirm_password.length > 0 && form.password === form.confirm_password && (
                  <p className="mt-1 text-[11px] font-semibold text-green-500">✓ Passwords match</p>
                )}
              </div>
            </div>
            <button type="submit" disabled={loading} className="h-10 w-full cursor-pointer rounded-xl bg-blue-500 text-sm font-bold text-white shadow-md shadow-blue-100 transition hover:scale-[1.01] hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Registering..." : "Register"}
            </button>
            <p className="text-center text-[11px] text-gray-600 sm:text-xs">
              Already have an account?{" "}
              <Link to="/login" className="cursor-pointer font-bold text-blue-600 hover:underline">Login Now</Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
};

const InputBox = ({ label, icon, type, name, value, placeholder, onChange }: InputBoxProps) => (
  <div>
    <label className="mb-1 block text-[11px] font-bold text-slate-700 sm:text-xs">{label}</label>
    <div className="flex h-10 items-center rounded-xl border border-gray-100 bg-slate-50 px-3 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      <span className="shrink-0 text-[11px] text-slate-400">{icon}</span>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required
        className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm" />
    </div>
  </div>
);

const PasswordBox = ({ label, name, value, placeholder, showPassword, setShowPassword, onChange }: PasswordBoxProps) => (
  <div>
    <label className="mb-1 block text-[11px] font-bold text-slate-700 sm:text-xs">{label}</label>
    <div className="flex h-10 items-center rounded-xl border border-gray-100 bg-slate-50 px-3 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      <FaLock className="shrink-0 text-[11px] text-slate-400" />
      <input type={showPassword ? "text" : "password"} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required
        className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm" />
      <button type="button" onClick={() => setShowPassword(!showPassword)}
        className="shrink-0 text-[11px] text-slate-400 hover:text-sky-600">
        {showPassword ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  </div>
);