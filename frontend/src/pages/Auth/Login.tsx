import { useState } from "react";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import toast from "react-hot-toast";

export const Login = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await API.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      const user = response.data.user;
      const accessToken = response.data.accessToken;

      const loginUser = {
        ...user,
        doctorId:
          response.data.doctor?.id ||
          response.data.data?.doctor?.id ||
          user.doctorId ||
          user.doctor?.id ||
          null,
      };

      localStorage.setItem("user", JSON.stringify(loginUser));
      localStorage.setItem("accessToken", accessToken);

      window.dispatchEvent(new Event("authChanged"));

      toast.success("Login successful");

      if (loginUser.role === "admin") {
        navigate("/admin/dashboard");
      } else if (loginUser.role === "doctor") {
        navigate("/doctor/dashboard");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-4 py-10 pt-24 sm:px-6 lg:px-8 lg:pt-28">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-5 shadow-2xl shadow-sky-100 sm:p-8">
        <div className="mb-7 text-center sm:mb-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-gray-200 sm:h-16 sm:w-16">
            <FaLock className="text-xl sm:text-2xl" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Login Account
          </h1>

          <p className="mt-2 text-sm font-medium text-slate-500">
            Welcome back to HealPoint
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email Address
            </label>

            <div className="flex h-13 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-md focus-within:shadow-gray-100 sm:h-14">
              <FaEnvelope className="shrink-0 text-base text-slate-400 sm:text-lg" />

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:px-4 sm:text-base"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <div className="flex h-13 items-center rounded-2xl border border-gray-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-md focus-within:shadow-gray-100 sm:h-14">
              <FaLock className="shrink-0 text-base text-slate-400 sm:text-lg" />

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-gray-800 outline-none placeholder:text-slate-400 sm:px-4 sm:text-base"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="shrink-0 text-gray-400 transition hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-gray-600 hover:text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-13 w-full rounded-2xl bg-blue-500 text-base font-bold text-white shadow-lg shadow-gray-200 transition duration-300 hover:scale-[1.02] hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:text-lg"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="pt-2 text-center text-sm leading-6 text-gray-600">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-blue-600 hover:underline"
            >
              Register Now
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
};