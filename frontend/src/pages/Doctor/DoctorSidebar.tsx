import { useState } from "react";
import {FaCalendarAlt,FaUserMd,FaBars,FaTimes,FaSignOutAlt, FaUser,} from "react-icons/fa";
import { FaUserDoctor } from "react-icons/fa6";
import { MdDashboard } from "react-icons/md";
import { NavLink, useNavigate } from "react-router-dom";
import API from "../../api/axios";

export const DoctorSidebar = () => {
  const [openSidebar, setOpenSidebar] = useState(false);
  const navigate = useNavigate();

   
  const menuItems = [
    { name: "Dashboard", icon: <MdDashboard />, path: "/doctor/dashboard" },
    { name: "Appointments", icon: <FaUserDoctor />, path: "/doctor/appointments" },
    { name: "Patients", icon: <FaUser/>, path: "/doctor/patients" },
    { name: "Profile", icon: <FaUserMd />, path: "/doctor/my-profile" },
    { name: "Schedule", icon: <FaCalendarAlt />, path: "/doctor/schedule" },
  ];

  const closeSidebar = () => setOpenSidebar(false);
  const logoutHandler = async () => {
    try {
      await API.post("/auth/logout");
    } catch (error) {
      console.log("Logout error:", error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      delete API.defaults.headers.common.Authorization;
      window.dispatchEvent(new Event("authChanged"));
      closeSidebar();
      navigate("/login", { replace: true });
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div>
        <div className="mb-6 rounded-3xl bg-white p-5 shadow-md">
          <h2 className="text-2xl font-extrabold text-blue-600">Doctor Panel</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage Your Account</p>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink key={item.path} to={item.path} onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                closeSidebar();
              }}
              className={({ isActive }) =>
                `flex items-center gap-4 rounded-2xl px-4 py-3 text-base font-semibold transition-all duration-300 ${
                  isActive? "bg-blue-500 text-white shadow-lg shadow-gray-300": "text-slate-700 hover:bg-white hover:text-blue-500 hover:shadow-md"}`}>
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <button type="button" onClick={logoutHandler} className="mt-6 flex w-full items-center gap-4 rounded-2xl bg-red-50 px-4 py-3 text-base font-semibold text-red-600 transition hover:bg-red-500 hover:text-white lg:mt-auto">
        <FaSignOutAlt className="text-xl" />
        <span>Logout</span>
      </button>
    </div>
  );

  return (
    <>
      <button type="button" onClick={() => setOpenSidebar(true)} className="fixed right-5 top-5 z-[80] flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-md lg:hidden">
        <FaBars className="text-xl" />
      </button>
      <aside className="sticky top-20 hidden h-[calc(100vh-80px)] w-72 shrink-0 border-r border-sky-100 bg-gray-100 px-5 py-5 shadow-xl lg:block">
        <SidebarContent />
      </aside>
      {openSidebar && (
        <div onClick={closeSidebar} className="fixed inset-0 z-[90] bg-black/50 lg:hidden"/>
      )}

      <aside className={`fixed right-0 top-0 z-[100] h-full w-[84%] max-w-sm bg-gray-100 px-5 py-5 shadow-2xl transition-transform duration-300 lg:hidden ${
          openSidebar ? "translate-x-0" : "translate-x-full"}`}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-blue-600">
            Doctor Menu
          </h2>
          <button type="button" onClick={closeSidebar} className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
            <FaTimes />
          </button>
        </div>
        <SidebarContent />
      </aside>
    </>
  );
};