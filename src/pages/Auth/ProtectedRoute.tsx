import { Navigate, Outlet } from "react-router-dom";
import type {UserProtectedRouteProps, ProtectedRouteProps} from "../../types/common.ts";

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("accessToken");

  if (!storedUser || !token) {
    return <Navigate to="/login" replace />;
  }

  const user: UserProtectedRouteProps = JSON.parse(storedUser);
  if (!allowedRoles.includes(user.role)) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "doctor") return <Navigate to="/doctor/dashboard" replace />;
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};