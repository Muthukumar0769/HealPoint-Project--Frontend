import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import API from "../../api/axios";
import type { UserProtectedRouteProps, ProtectedRouteProps } from "../../types/common.ts";

const isTokenExpired = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000 - 5000; // 5s buffer
  } catch {
    return true;
  }
};

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const [checking, setChecking] = useState(true);
  const [authOk, setAuthOk] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("accessToken");

      if (!storedUser || !token) {
        setChecking(false);
        setAuthOk(false);
        return;
      }

      if (!isTokenExpired(token)) {
        setChecking(false);
        setAuthOk(true);
        return;
      }

      try {
        const res = await API.post("/auth/refresh");
        const newAccessToken = res.data?.accessToken;
        if (newAccessToken) {
          localStorage.setItem("accessToken", newAccessToken);
          API.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          setAuthOk(true);
        } else {
          throw new Error("No token");
        }
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        window.dispatchEvent(new Event("authChanged"));
        setAuthOk(false);
      } finally {
        setChecking(false);
      }
    };
    verify();
  }, []);

  if (checking) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading...
      </div>
    );
  }

  if (!authOk) {
    return <Navigate to="/login" replace />;
  }

  const storedUser = localStorage.getItem("user");
  const user: UserProtectedRouteProps = JSON.parse(storedUser!);
  if (!allowedRoles.includes(user.role)) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "doctor") return <Navigate to="/doctor/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};