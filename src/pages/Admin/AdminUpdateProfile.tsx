import { useState, useEffect } from "react";
import { FaUserAlt, FaLock, FaEye, FaEyeSlash, FaCamera, FaEnvelope } from "react-icons/fa";
import { AdminSidebar } from "../Admin/AdminSidebar";
import API, { IMAGE_BASE_URL } from "../../api/axios";
import usePageTitle from "../../hooks/usePageTitle";

const useAdminProfileImage = (raw?: string | null) => {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    if (!raw) { setSrc(""); return; }
    if (raw.startsWith("blob:")) { setSrc(raw); return; }
    const fullUrl = raw.startsWith("http")
      ? raw.replace(/^http:\/\//, "https://")
      : `${IMAGE_BASE_URL}/uploads/${raw}`;
    fetch(fullUrl, { headers: { "ngrok-skip-browser-warning": "true" } })
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.blob(); })
      .then((blob) => setSrc(URL.createObjectURL(blob)))
      .catch(() => setSrc(""));
  }, [raw]);
  return src;
};

export const AdminUpdateProfile = () => {
  usePageTitle("My Profile");

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const profileImageSrc = useAdminProfileImage(user?.profile_picture);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setMessage(null);

    if (showChangePassword) {
      if (!oldPassword || !newPassword || !confirmPassword) {
        setMessage({ type: "error", text: "All password fields are required" });
        return;
      }
      if (newPassword.length < 6) {
        setMessage({ type: "error", text: "New password must be at least 6 characters" });
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage({ type: "error", text: "Passwords do not match" });
        return;
      }
    }

    if (!imageFile && !showChangePassword) {
      setMessage({ type: "error", text: "No changes to save" });
      return;
    }

    try {
      setLoading(true);
      let res;

      if (imageFile) {
        const formData = new FormData();
        formData.append("profile_picture", imageFile);
        if (showChangePassword) {
          formData.append("old_password", oldPassword);
          formData.append("new_password", newPassword);
          formData.append("confirm_password", confirmPassword);
        }
        res = await API.put("/auth/update-admin-profile", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const payload: Record<string, string> = {};
        if (showChangePassword) {
          payload.old_password = oldPassword;
          payload.new_password = newPassword;
          payload.confirm_password = confirmPassword;
        }
        res = await API.put("/auth/update-admin-profile", payload);
      }

      const updatedUser = { ...user, ...res.data.data };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event("authChanged"));

      setMessage({ type: "success", text: res.data.message || "Profile updated successfully" });
      setShowChangePassword(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setImageFile(null);
      setPreviewImage("");
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.message || "Update failed" });
    } finally {
      setLoading(false);
    }
  };

  const pwdCount = Math.min(newPassword.length, 6);
  const pwdValid = newPassword.length >= 6;

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f4fb] pt-16 lg:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-5 lg:px-6 xl:px-7">
        <div className="mx-auto w-full max-w-xl">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-0.5">Account</p>
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl">My Profile</h1>
          <p className="mt-0.5 mb-4 text-[11px] text-slate-400 sm:text-xs">Manage your account details and password</p>

          {message && (
            <div className={`mb-4 rounded-xl px-3.5 py-2.5 text-xs font-semibold sm:text-sm ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-red-50 text-red-500 border border-red-200"}`}>
              {message.text}
            </div>
          )}

          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
            {/* Profile image */}
            <div className="flex flex-col items-center border-b border-slate-100 pb-4">
              <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-blue-50 bg-blue-50 shadow-sm sm:h-20 sm:w-20">
                  {previewImage || (user?.profile_picture && profileImageSrc) ? (
                    <img src={previewImage || profileImageSrc} alt={user?.name} className="h-full w-full object-cover object-top" />
                  ) : (
                    <FaUserAlt className="text-xl text-slate-400 sm:text-2xl" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-blue-500 text-white shadow-md transition hover:bg-blue-600 sm:h-7 sm:w-7">
                  <FaCamera className="text-[9px] sm:text-[10px]" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>

              <h2 className="mt-2.5 text-sm font-bold text-slate-800">{user?.name ?? "Admin"}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                <FaEnvelope className="text-[9px]" /> {user?.email ?? ""}
              </p>
              <span className="mt-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] font-semibold capitalize text-blue-500">
                {user?.role ?? "admin"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2 sm:gap-4">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">Name</label>
                <input type="text" value={user?.name ?? ""} disabled
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-500" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">Email</label>
                <input type="email" value={user?.email ?? ""} disabled
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-500" />
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              {!showChangePassword ? (
                <button type="button" onClick={() => setShowChangePassword(true)}
                  className="flex cursor-pointer w-full items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 sm:w-auto">
                  <FaLock className="text-[11px]" /> Change Password
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 sm:text-sm">Change Password</h3>
                    <button type="button" onClick={() => { setShowChangePassword(false); setOldPassword(""); setNewPassword(""); setConfirmPassword(""); }}
                      className="text-[11px] cursor-pointer font-semibold text-slate-400 hover:text-red-500">
                      Cancel
                    </button>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-500">Current Password</label>
                    <div className="relative">
                      <FaLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                      <input type={showOld ? "text" : "password"} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white" />
                      <button type="button" onClick={() => setShowOld((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        {showOld ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-500">New Password</label>
                    <div className="relative">
                      <FaLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                      <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white" />
                      <button type="button" onClick={() => setShowNew((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        {showNew ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {newPassword.length > 0 && (
                      <p className={`mt-1 text-[10px] font-semibold ${pwdValid ? "text-emerald-500" : "text-red-500"}`}>
                        Password must be at least 6 characters ({pwdCount}/6)
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-500">Confirm New Password</label>
                    <div className="relative">
                      <FaLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                      <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white" />
                      <button type="button" onClick={() => setShowConfirm((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        {showConfirm ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                      <p className="mt-1 text-[10px] font-semibold text-red-500">Passwords do not match</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="w-full cursor-pointer rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-600 disabled:opacity-60 sm:w-auto">
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};