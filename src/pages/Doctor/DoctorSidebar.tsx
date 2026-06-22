import { useState } from "react";
import {
  FaCalendarAlt, FaUserMd, FaBars, FaTimes,
  FaVideo, FaMoneyBill, FaSignOutAlt,
} from "react-icons/fa";
import { FaUserDoctor } from "react-icons/fa6";
import { MdDashboard } from "react-icons/md";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import API from "../../api/axios";

export const DoctorSidebar = () => {
  const [openSidebar, setOpenSidebar] = useState(false);
  const navigate = useNavigate();
  const notifications = useAppSelector((state) => state.doctorNotifications);
  const menuItems = [
    { name: "Dashboard", icon: <MdDashboard />, path: "/doctor/dashboard" },
    { name: "Appointments", icon: <FaUserDoctor />, path: "/doctor/appointments", showDot: notifications.appointments, },
    {
      name: "Consultations", icon: <FaVideo />, path: "/doctor/consultations", showDot:
        notifications.consultations ||
        notifications.videoConsultations.video ||
        notifications.videoConsultations.clinic,
    },
    { name: "Earnings", icon: <FaMoneyBill />, path: "/doctor/earnings", showDot: notifications.earnings },
    { name: "Profile", icon: <FaUserMd />, path: "/doctor/my-profile" },
    { name: "Schedule", icon: <FaCalendarAlt />, path: "/doctor/schedule" },
  ];

  const closeSidebar = () => setOpenSidebar(false);
  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (error: any) {
      console.log("Logout error:", error.response?.data || error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      delete API.defaults.headers.common.Authorization;
      window.dispatchEvent(new Event("authChanged"));
      closeSidebar();
      navigate("/login", { replace: true });
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <h2 className="text-2xl font-extrabold text-blue-600">Doctor Panel</h2>
        <p className="mb-5 mt-1 text-sm font-medium text-slate-500">
          Manage Your Account
        </p>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink key={item.path} to={item.path} onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              closeSidebar();
            }}
              className={({ isActive }) => `flex items-center gap-4 rounded-2xl px-4 py-3 text-base font-semibold transition-all duration-300 ${isActive ? "bg-blue-500 text-white shadow-lg shadow-gray-300" : "text-slate-700 hover:bg-white hover:text-blue-500 hover:shadow-md"}`}>
              <span className="relative text-xl">
                {item.icon}
                {item.showDot && (
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white animate-pulse" />
                )}
              </span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      <button type="button" onClick={() => setOpenSidebar(true)} className="fixed right-5 top-5 z-[80] flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-md lg:hidden">
        <FaBars className="text-xl" />
      </button>
      <aside className="sticky top-20 hidden h-[calc(100vh-80px)] w-72 shrink-0 border-r border-sky-100 bg-[#f0f4fb] px-5 py-5 shadow-xl lg:block">
        {sidebarContent}
      </aside>
      {openSidebar && (
        <div onClick={closeSidebar} className="fixed inset-0 z-[90] bg-black/50 lg:hidden" />
      )}
      <aside className={`fixed right-0 top-0 z-[100] flex h-full w-[84%] max-w-sm flex-col bg-gray-100 px-5 py-5 shadow-2xl transition-transform duration-300 lg:hidden ${openSidebar ? "translate-x-0" : "translate-x-full"}`}>
        <div className="mb-5 flex shrink-0 items-center justify-between">
          <h2 className="text-xl font-extrabold text-blue-600">Doctor Menu</h2>
          <button type="button" onClick={closeSidebar} className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
            <FaTimes />
          </button>
        </div>
        {sidebarContent}
        <div className="shrink-0 border-t border-sky-100 pt-3">
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-base font-semibold text-red-500 hover:bg-red-500 hover:text-white cursor-pointer transition-all duration-300 hover:shadow-md">
            <span className="text-xl"><FaSignOutAlt /></span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};