import { useState } from "react";
import { FaCalendarAlt, FaUserMd, FaBars, FaTimes, FaVideo,FaMoneyBill, FaSignOutAlt, FaUserAlt,} from "react-icons/fa";
import { FaUserDoctor } from "react-icons/fa6";
import { MdDashboard } from "react-icons/md";
import { IoChevronUp } from "react-icons/io5";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import API, { IMAGE_BASE_URL } from "../../api/axios";
import { useEffect } from "react";

const useDocProfileImage = (raw?: string | null) => {
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

export const DoctorSidebar = () => {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const navigate = useNavigate();
  const notifications = useAppSelector((state) => state.doctorNotifications);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const updateUser = () => {
      const stored = localStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    };
    window.addEventListener("authChanged", updateUser);
    return () => window.removeEventListener("authChanged", updateUser);
  }, []);

  const profileImageSrc = useDocProfileImage(user?.profile_picture);

  const menuItems = [
    { name: "Dashboard", icon: <MdDashboard className="text-gray-800" />, path: "/doctor/dashboard" },
    { name: "Appointments", icon: <FaUserDoctor className="text-violet-500" />, path: "/doctor/appointments", showDot: notifications.appointments },
    { name: "Consultations", icon: <FaVideo className="text-cyan-500" />, path: "/doctor/consultations", showDot: notifications.consultations || notifications.videoConsultations?.video || notifications.videoConsultations?.clinic },
    { name: "Earnings", icon: <FaMoneyBill className="text-emerald-500" />, path: "/doctor/earnings", showDot: notifications.earnings },
    { name: "Profile", icon: <FaUserMd className="text-pink-500" />, path: "/doctor/my-profile" },
    { name: "Schedule", icon: <FaCalendarAlt className="text-orange-500" />, path: "/doctor/schedule" },
  ];

  const closeSidebar = () => setOpenSidebar(false);

  const handleLogout = async () => {
    try { await API.post("/auth/logout"); }
    catch (error: any) { console.log("Logout error:", error.response?.data || error); }
    finally {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      delete API.defaults.headers.common.Authorization;
      window.dispatchEvent(new Event("authChanged"));
      closeSidebar();
      setOpenProfileMenu(false);
      navigate("/login", { replace: true });
    }
  };

  const NavItem = ({ item, onClick }: { item: typeof menuItems[0]; onClick?: () => void }) => (
    <NavLink to={item.path} onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); onClick?.(); }}
      className={({ isActive }) =>`group relative flex items-center gap-3.5 px-3.5 py-2.5 text-[14px] font-semibold transition-all duration-300 rounded-xl overflow-hidden
        ${isActive ? "bg-blue-500 text-white shadow-md shadow-blue-200" : "text-slate-600 hover:text-white"}`}>
      {({ isActive }) => (
        <>
          {!isActive && (
            <span className="pointer-events-none absolute inset-0 rounded-xl overflow-hidden">
              <span className="absolute inset-y-0 left-0 w-0 bg-blue-500 group-hover:w-1/2 transition-all duration-300 ease-out" />
              <span className="absolute inset-y-0 right-0 w-0 bg-blue-500 group-hover:w-1/2 transition-all duration-300 ease-out" />
            </span>
          )}
          <span className="relative z-10 text-[17px] shrink-0">
            {item.icon}
            {item.showDot && (
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500 border border-white animate-pulse" />
            )}
          </span>
          <span className="relative z-10">{item.name}</span>
        </>
      )}
    </NavLink>
  );

  const ProfileFooter = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="relative">
      {openProfileMenu && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-300 overflow-hidden z-[110]">
          <NavLink to="/doctor/dashboard" onClick={() => { setOpenProfileMenu(false); onNavigate?.(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className={({ isActive }) =>`flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition
              ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-sky-50 hover:text-blue-500"}`
            }>
            <MdDashboard className="text-base text-blue-500" />
            Doctor Dashboard
          </NavLink>
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50 border-t border-gray-50">
            <FaSignOutAlt className="text-base" />
            Logout
          </button>
        </div>
      )}
      <button type="button" onClick={() => setOpenProfileMenu((prev) => !prev)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-blue-100/60 cursor-pointer">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-blue-100 shadow-md">
          {user?.profile_picture && profileImageSrc ? (
            <img src={profileImageSrc} alt={user?.name} className="h-full w-full object-cover object-top" />
          ) : (
            <FaUserAlt className="text-sm text-gray-500" />
          )}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-[13px] font-bold text-slate-800 leading-tight">{user?.name ?? "Doctor"}</p>
          <p className="truncate text-[10px] text-slate-400">{user?.email ?? ""}</p>
          <p className="text-[10px] font-semibold capitalize text-blue-500">{user?.role ?? "doctor"}</p>
        </div>
        <IoChevronUp className={`shrink-0 text-sm text-slate-400 transition-transform duration-200 ${openProfileMenu ? "rotate-180" : ""}`} />
      </button>
    </div>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <h2 className="text-[14px] font-extrabold text-blue-600">Doctor Panel</h2>
        <p className="mb-5 mt-0.5 text-[11px] font-medium text-slate-500">Manage Your Account</p>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavItem key={item.path} item={item} onClick={closeSidebar} />
          ))}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      <button type="button" onClick={() => setOpenSidebar(true)} className="fixed right-4 top-4 z-[80] flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-md lg:hidden">
        <FaBars className="text-base" />
      </button>
      <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-56 shrink-0 border-r border-sky-100 bg-[#f0f4fb] px-4 py-4 shadow-lg lg:flex lg:flex-col lg:justify-between">
        <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
        <div className="shrink-0 border-t border-sky-100 pt-3">
          <ProfileFooter />
        </div>
      </aside>
      {openSidebar && (
        <div onClick={closeSidebar} className="fixed inset-0 z-[90] bg-black/50 lg:hidden" />
      )}
      <aside className={`fixed right-0 top-0 z-[100] flex h-full w-[80%] max-w-xs flex-col bg-[#f0f4fb] px-4 py-4 shadow-2xl transition-transform duration-300 lg:hidden ${openSidebar ? "translate-x-0" : "translate-x-full"}`} >
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h2 className="text-base font-extrabold text-blue-600">Doctor Menu</h2>
          <button type="button" onClick={closeSidebar} className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500">
            <FaTimes className="text-sm" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <NavItem key={item.path} item={item} onClick={closeSidebar} />
            ))}
          </nav>
        </div>
        <div className="shrink-0 border-t border-sky-100 pt-3">
          <ProfileFooter onNavigate={closeSidebar} />
        </div>
      </aside>
    </>
  );
};