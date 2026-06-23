import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaUserAlt, FaBell, FaBars, FaTimes } from "react-icons/fa";
import { IoChevronDown } from "react-icons/io5";
import Logo from "../../assets/images/New_logo-removebg-preview.png";
import API, { IMAGE_BASE_URL } from "../../api/axios";
import type { User } from "../../types/common.ts";
import type { Notification } from "../../types/patient.ts";

const useProfileImage = (raw?: string | null) => {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    if (!raw) { setSrc(""); return; }
    if (raw.startsWith("blob:")) { setSrc(raw); return; }
    const fullUrl = raw.startsWith("http") ? raw.replace(/^http:\/\//, "https://") : `${IMAGE_BASE_URL}/uploads/${raw}`;
    fetch(fullUrl, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.blob();
      })
      .then((blob) => setSrc(URL.createObjectURL(blob)))
      .catch(() => setSrc(""));
  }, [raw]);
  return src;
};

const APPT_DOT_KEY = "hasNewAppointment";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAuthPage = ["/login", "/register", "/forgot-password"].includes(location.pathname);
  const [user, setUser] = useState<User | null>(null);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [openNotification, setOpenNotification] = useState(false);
  const [hasNewAppointment, setHasNewAppointment] = useState(() => localStorage.getItem(APPT_DOT_KEY) === "true");

  const role = user?.role?.toLowerCase();
  const isAdmin = role === "admin";
  const isDoctor = role === "doctor";
  const isAdminOrDoctor = isAdmin || isDoctor;
  const unreadCount = notifications.filter((item) => !item.is_read).length;

  useEffect(() => {
    if (location.pathname === "/my-appointments" && hasNewAppointment) {
      setHasNewAppointment(false);
      localStorage.removeItem(APPT_DOT_KEY);
    }
  }, [location.pathname, hasNewAppointment]);

  useEffect(() => {
    const handleNewAppt = () => {
      setHasNewAppointment(true);
      localStorage.setItem(APPT_DOT_KEY, "true");
    };
    window.addEventListener("appointmentBooked", handleNewAppt);
    return () => window.removeEventListener("appointmentBooked", handleNewAppt);
  }, []);

  const closeMenus = () => {
    setOpenMobileMenu(false);
    setOpenDropdown(false);
    setOpenNotification(false);
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      const data = res.data?.notifications || res.data?.data?.notifications ||
        res.data?.data?.rows || res.data?.rows || res.data?.data || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Notification error:", error);
    }
  };

  useEffect(() => {
    const updateUser = () => {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };
    updateUser();
    window.addEventListener("authChanged", updateUser);
    return () => window.removeEventListener("authChanged", updateUser);
  }, []);

  useEffect(() => {
    if (!user || isAdminOrDoctor) return;
    fetchNotifications();
    window.addEventListener("notificationCreated", fetchNotifications);
    return () => {
      window.removeEventListener("notificationCreated", fetchNotifications);
    };
  }, [user, isAdminOrDoctor]);
  const logoutHandler = async () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    delete API.defaults.headers.common.Authorization;
    setUser(null);
    window.dispatchEvent(new Event("authChanged"));
    closeMenus();

    try {
      await API.post("/auth/logout");
    } catch {
    }
    navigate("/login", { replace: true });
  };

  const handleNotificationClick = async () => {
    setOpenNotification(!openNotification);
    setOpenDropdown(false);

    if (!openNotification && unreadCount > 0) {
      try {
        await API.patch("/notifications/read");
        setNotifications((prev) =>
          prev.map((item) => ({ ...item, is_read: true }))
        );
      } catch (error) {
        console.log(error);
      }
    }
  };

  const profileImageSrc = useProfileImage(user?.profile_picture);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative pb-1 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-blue-600 after:transition-all after:duration-300 after:content-[''] ${isActive ? "text-blue-600 after:w-full" : "text-gray-700 after:w-0 hover:text-blue-600 hover:after:w-full"}`;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-2xl px-4 py-3 text-base font-semibold transition ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`;

  const formatNotificationTime = (date?: string) => {
    if (!date) return "";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const patientLinks = (
    <>
      <NavLink to="/" onClick={closeMenus} className={mobileLinkClass}>Home</NavLink>
      <NavLink to="/doctors" onClick={closeMenus} className={mobileLinkClass}>Doctors</NavLink>
      <NavLink to="/about" onClick={closeMenus} className={mobileLinkClass}>About Us</NavLink>
      <NavLink to="/contact" onClick={closeMenus} className={mobileLinkClass}>Contact Us</NavLink>
      {user && (
        <NavLink to="/my-appointments" onClick={closeMenus} className={({ isActive }) => `relative block rounded-2xl px-4 py-3 text-base font-semibold transition ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>
          My Appointment
          {hasNewAppointment && (
            <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500" />
          )}
        </NavLink>
      )}
    </>
  );

  return (
    <>
      <header className="fixed left-0 top-0 z-50 w-full border-b border-sky-100 bg-white/95 shadow-md backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <NavLink to="/" onClick={closeMenus} className="flex items-center">
            <img src={Logo} alt="HealPoint Logo" className="h-14 cursor-pointer w-[150px] object-contain sm:w-[160px]" />
          </NavLink>

          {!isAdminOrDoctor && (
            <ul className="hidden items-center gap-8 text-base font-semibold lg:flex">
              <li><NavLink to="/" className={linkClass}>Home</NavLink></li>
              <li><NavLink to="/doctors" className={linkClass}>Doctors</NavLink></li>
              <li><NavLink to="/about" className={linkClass}>About Us</NavLink></li>
              <li><NavLink to="/contact" className={linkClass}>Contact Us</NavLink></li>
              {user && (
                <li>
                  <NavLink to="/my-appointments" className={linkClass}>
                    <span className="relative">
                      My Appointment
                      {hasNewAppointment && (
                        <span className="absolute -right-3 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                      )}
                    </span>
                  </NavLink>
                </li>
              )}
            </ul>
          )}

          <div className="flex items-center gap-3">
            {!isAdminOrDoctor && user && (
              <div className="relative">
                <button onClick={handleNotificationClick} className="relative flex h-11 w-11 items-center cursor-pointer justify-center rounded-full bg-blue-50 text-slate-700 transition hover:bg-blue-100 hover:text-blue-600 sm:h-12 sm:w-12">
                  <FaBell className="text-lg cursor-pointer" />
                  {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 h-3 w-3 rounded-full bg-red-500" />
                  )}
                </button>
                {openNotification && (
                  <div className="absolute right-0 top-14 z-50 w-[320px] overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl sm:w-96">
                    <div className="border-b border-gray-100 p-5">
                      <h2 className="text-lg font-bold text-blue-600">Notifications</h2>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-5 text-gray-500">No notifications</p>
                      ) : (
                        notifications.map((item) => (
                          <div key={item.id} className="border-b border-sky-50 p-5 transition hover:bg-sky-50">
                            <h3 className="font-bold text-gray-900">{item.title}</h3>
                            <p className="mt-1 text-sm text-gray-600">{item.message}</p>
                            <span className="mt-2 block text-xs font-semibold text-gray-400">
                              {formatNotificationTime(item.createdAt || item.created_at)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {user ? (
              <div className="relative hidden md:block" onMouseEnter={() => {
                if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
                setOpenDropdown(true);
              }}
                onMouseLeave={() => { dropdownTimeout.current = setTimeout(() => setOpenDropdown(false), 150); }}>
                <button className="flex items-center gap-3 rounded-2xl cursor-pointer px-2 py-2 transition hover:bg-blue-50">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-gray-100 bg-blue-50 shadow-lg shadow-gray-300 sm:h-12 sm:w-12">
                    {user.profile_picture ? (
                      <img src={profileImageSrc} alt={user.name} className="h-full w-full object-cover object-top" />
                    ) : (
                      <FaUserAlt className="text-lg text-gray-600 cursor-pointer" />
                    )}
                  </div>
                  <div className="hidden text-left lg:block">
                    <h3 className="text-sm font-bold text-slate-800">{user.name}</h3>
                    <p className="text-xs capitalize text-slate-500">{user.role}</p>
                  </div>
                  <IoChevronDown className={`text-lg text-slate-500 cursor-pointer transition-transform duration-200 ${openDropdown ? "rotate-180" : ""}`} />
                </button>

                {openDropdown && (
                  <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl shadow-gray-400">
                    <div className="absolute -top-3 left-0 h-3 w-full" />
                    <div className="bg-blue-500 px-6 py-5 text-white">
                      <h3 className="text-lg font-bold">{user.name}</h3>
                      <p className="mt-1 text-sm text-white">{user.email}</p>
                    </div>
                    <div className="p-3">
                      <NavLink to={isAdmin ? "/admin/dashboard" : isDoctor ? "/doctor-dashboard" : "/my-profile"} onClick={closeMenus}
                        className="block rounded-2xl px-4 cursor-pointer py-3 text-base font-medium text-gray-800 transition hover:bg-sky-50 hover:text-blue-500">
                        {isAdmin ? "Admin Dashboard" : isDoctor ? "Doctor Dashboard" : "My Profile"}
                      </NavLink>
                      <button onClick={logoutHandler} className="mt-2 block cursor-pointer w-full rounded-2xl px-4 py-3 text-left text-base font-medium text-red-500 transition hover:bg-red-50">
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : !isAuthPage ? (
              <NavLink to="/login" className="hidden rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-105 sm:block">
                Create Account
              </NavLink>
            ) : null}

            <button onClick={() => {
              setOpenMobileMenu(true);
              setOpenDropdown(false);
              setOpenNotification(false);
            }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 lg:hidden">
              <FaBars className="text-xl" />
            </button>
          </div>
        </div>
      </header>

      {openMobileMenu && (
        <div onClick={closeMenus} className="fixed inset-0 z-[60] bg-black/50 lg:hidden" />
      )}

      <aside className={`fixed right-0 top-0 z-[70] h-full w-[82%] max-w-sm bg-white shadow-2xl transition-transform duration-300 lg:hidden ${openMobileMenu ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between border-b border-gray-100 px-5">
          <img src={Logo} alt="HealPoint Logo" className="h-14 w-[150px] object-contain" />
          <button onClick={closeMenus} className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
            <FaTimes />
          </button>
        </div>
        <div className="h-[calc(100vh-80px)] overflow-y-auto px-5 py-6">
          {user && (
            <div className="mb-6 rounded-3xl bg-blue-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white">
                  {user.profile_picture ? (
                    <img src={profileImageSrc} alt={user.name} className="h-full w-full object-cover object-top" />
                  ) : (
                    <FaUserAlt className="text-xl text-gray-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-gray-900">{user.name}</h3>
                  <p className="truncate text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs font-semibold capitalize text-blue-600">{user.role}</p>
                </div>
              </div>
            </div>
          )}
          <nav className="space-y-2">
            {!isAdminOrDoctor && patientLinks}
            {isAdmin && (
              <NavLink to="/admin/dashboard" onClick={closeMenus} className={mobileLinkClass}>
                Admin Dashboard
              </NavLink>
            )}
            {isDoctor && (
              <NavLink to="/doctor-dashboard" onClick={closeMenus} className={mobileLinkClass}>
                Doctor Dashboard
              </NavLink>
            )}
            {user && !isAdminOrDoctor && (
              <NavLink to="/my-profile" onClick={closeMenus} className={mobileLinkClass}>
                My Profile
              </NavLink>
            )}
          </nav>
          <div className="mt-8">
            {user ? (
              <button onClick={logoutHandler} className="w-full rounded-2xl bg-red-50 px-4 py-3 text-left font-semibold text-red-500 transition hover:bg-red-100">
                Logout
              </button>
            ) : !isAuthPage ? (
              <NavLink to="/login" onClick={closeMenus} className="block rounded-2xl bg-blue-600 px-4 py-3 text-center font-semibold text-white shadow-lg">
                Create Account
              </NavLink>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
};