import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaEnvelope,
  FaLock,
  FaPhone,
  FaUser,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/axios";

export const Register = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    gender: "",
    password: "",
    confirm_password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (form.password !== form.confirm_password) {
      toast.error("Password and confirm password do not match");
      return;
    }

    try {
      setLoading(true);
      await API.post("/auth/register", form);
      toast.success("Registered successfully");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-4 py-10 pt-24 sm:px-6 lg:px-8 lg:pt-28">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-5 shadow-xl shadow-sky-100 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500 text-white sm:h-16 sm:w-16">
            <FaUser className="text-2xl sm:text-3xl" />
          </div>

          <h1 className="text-2xl font-extrabold text-gray-800 sm:text-3xl">
            Create Account
          </h1>

          <p className="mt-1 text-sm text-gray-500">Register to HealPoint</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputBox
              label="Full Name"
              icon={<FaUser />}
              type="text"
              name="name"
              value={form.name}
              placeholder="Enter full name"
              onChange={handleChange}
            />

            <InputBox
              label="Email"
              icon={<FaEnvelope />}
              type="email"
              name="email"
              value={form.email}
              placeholder="Enter email"
              onChange={handleChange}
            />

            <InputBox
              label="Phone"
              icon={<FaPhone />}
              type="text"
              name="phone_number"
              value={form.phone_number}
              placeholder="Enter phone number"
              onChange={handleChange}
            />

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Gender
              </label>

              <div className="flex min-h-11 flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-slate-50 px-4 py-3 transition focus-within:border-blue-500">
                {["Male", "Female", "Others"].map((gender) => (
                  <label
                    key={gender}
                    className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={gender}
                      checked={form.gender === gender}
                      onChange={handleChange}
                      required
                      className="accent-sky-500"
                    />
                    {gender}
                  </label>
                ))}
              </div>
            </div>

            <PasswordBox
              label="Password"
              name="password"
              value={form.password}
              placeholder="Enter password"
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              onChange={handleChange}
            />

            <PasswordBox
              label="Confirm Password"
              name="confirm_password"
              value={form.confirm_password}
              placeholder="Confirm password"
              showPassword={showConfirmPassword}
              setShowPassword={setShowConfirmPassword}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-blue-500 text-base font-bold text-white shadow-lg shadow-gray-100 transition hover:scale-[1.01] hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Registering..." : "Register"}
          </button>

          <p className="text-center text-sm leading-6 text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-blue-600 hover:underline"
            >
              Login Now
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
};

type InputBoxProps = {
  label: string;
  icon: React.ReactNode;
  type: string;
  name: string;
  value: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const InputBox = ({
  label,
  icon,
  type,
  name,
  value,
  placeholder,
  onChange,
}: InputBoxProps) => {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div className="flex h-11 items-center rounded-xl border border-gray-100 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <span className="shrink-0 text-sm text-slate-400">{icon}</span>

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
};

type PasswordBoxProps = {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const PasswordBox = ({
  label,
  name,
  value,
  placeholder,
  showPassword,
  setShowPassword,
  onChange,
}: PasswordBoxProps) => {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div className="flex h-11 items-center rounded-xl border border-gray-100 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <FaLock className="shrink-0 text-sm text-slate-400" />

        <input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-slate-400"
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="shrink-0 text-slate-400 hover:text-sky-600"
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  );
};