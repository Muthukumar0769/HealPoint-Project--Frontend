import { useRef, useState } from "react";
import { FaLock, FaEye, FaEyeSlash, FaHeartbeat, FaShieldAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import toast from "react-hot-toast";
import usePageTitle from "../../hooks/usePageTitle";

type FormState = {
  old_password: string;
  new_password: string;
  confirm_password: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

//------Main Component-----------

export const ResetPassword = () => {
  usePageTitle("Reset Password");
  const navigate = useNavigate();
  const toastId = useRef<string | undefined>(undefined);
  const isSubmitting = useRef(false);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    isSubmitting.current = false;
  };

  //------Client side validation before hitting the API------------

  const validate = () => {
    const newErrors: FormErrors = {};

    if (!form.old_password.trim()) {
      newErrors.old_password = "Current password is required";
    }

    if (!form.new_password.trim()) {
      newErrors.new_password = "New password is required";
    } else if (form.new_password.length < 6) {
      newErrors.new_password = "Password must be at least 6 characters";
    }

    if (!form.confirm_password.trim()) {
      newErrors.confirm_password = "Please confirm your new password";
    } else if (form.new_password && form.confirm_password !== form.new_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    if (
      form.old_password &&
      form.new_password &&
      form.old_password === form.new_password
    ) {
      newErrors.new_password = "New password cannot be the same as the old password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //------Handle the reset password logic------------

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSubmitting.current) return;

    if (!validate()) return;

    isSubmitting.current = true;
    setLoading(true);
    toast.dismiss(toastId.current);

    try {
      await API.post("/doctors/change-password", {
        old_password: form.old_password,
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      });

      toast.success("Password changed successfully. Please login again.");

      // Force a fresh login with the new password
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      window.dispatchEvent(new Event("authChanged"));

      navigate("/login", { replace: true });
    } catch (error: any) {
      const errData = error.response?.data;

      if (Array.isArray(errData?.error)) {
        const fieldErrors: FormErrors = {};
        errData.error.forEach((e: { field: string; message: string }) => {
          if (e.field === "old_password") fieldErrors.old_password = e.message;
          if (e.field === "new_password") fieldErrors.new_password = e.message;
          if (e.field === "confirm_password") fieldErrors.confirm_password = e.message;
        });
        setErrors(fieldErrors);
      }

      toast.dismiss(toastId.current);
      toastId.current = toast.error(errData?.message || "Failed to change password");
    } finally {
      setLoading(false);
      isSubmitting.current = false;
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
              Secure your
              <br />
              account first
            </h2>
            <p className="mt-3 max-w-xs text-sm font-medium text-blue-50/90">
              This is your first login. Please set a new password before continuing to your dashboard.
            </p>
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
              <FaShieldAlt className="text-sm" />
            </div>
            <h1 className="text-lg font-extrabold text-slate-900 sm:text-xl">Reset Password</h1>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              Update your temporary password to continue
            </p>
          </div>

          <form
            className="space-y-3"
            onSubmit={handleResetPassword}
            onKeyDown={(e) => {
              if (e.key === "Enter" && loading) e.preventDefault();
            }}
          >
            {/* Current Password */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-700 sm:text-xs">
                Current Password
              </label>
              <div
                className={`flex h-10 items-center rounded-xl border bg-slate-50 px-3 transition focus-within:bg-white focus-within:shadow-sm ${
                  errors.old_password
                    ? "border-red-400 focus-within:border-red-400"
                    : "border-slate-200 focus-within:border-blue-500"
                }`}
              >
                <FaLock className="shrink-0 text-[11px] text-slate-400" />
                <input
                  type={showOld ? "text" : "password"}
                  name="old_password"
                  value={form.old_password}
                  onChange={handleChange}
                  placeholder="Enter the temporary password"
                  required
                  className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="shrink-0 text-[11px] text-slate-400 transition hover:text-slate-600"
                >
                  {showOld ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.old_password && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.old_password}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-700 sm:text-xs">
                New Password
              </label>
              <div
                className={`flex h-10 items-center rounded-xl border bg-slate-50 px-3 transition focus-within:bg-white focus-within:shadow-sm ${
                  errors.new_password
                    ? "border-red-400 focus-within:border-red-400"
                    : "border-slate-200 focus-within:border-blue-500"
                }`}
              >
                <FaLock className="shrink-0 text-[11px] text-slate-400" />
                <input
                  type={showNew ? "text" : "password"}
                  name="new_password"
                  value={form.new_password}
                  onChange={handleChange}
                  placeholder="Enter a new password"
                  required
                  className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="shrink-0 text-[11px] text-slate-400 transition hover:text-slate-600"
                >
                  {showNew ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.new_password && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.new_password}</p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-700 sm:text-xs">
                Confirm New Password
              </label>
              <div
                className={`flex h-10 items-center rounded-xl border bg-slate-50 px-3 transition focus-within:bg-white focus-within:shadow-sm ${
                  errors.confirm_password
                    ? "border-red-400 focus-within:border-red-400"
                    : "border-slate-200 focus-within:border-blue-500"
                }`}
              >
                <FaLock className="shrink-0 text-[11px] text-slate-400" />
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirm_password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder="Re-enter the new password"
                  required
                  className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="shrink-0 text-[11px] text-slate-400 transition hover:text-slate-600"
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.confirm_password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              onClick={(e) => {
                if (loading) e.preventDefault();
              }}
              className="h-10 w-full cursor-pointer rounded-xl bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-100 transition hover:scale-[1.02] hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>

            <p className="pt-0.5 text-center text-[11px] text-slate-500 sm:text-xs">
              You'll be redirected to login after a successful update.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
};