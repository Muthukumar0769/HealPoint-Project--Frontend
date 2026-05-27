import { Navigate, Outlet } from "react-router-dom";

type ProtectedRouteProps = {
  allowedRoles: string[];
};

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "doctor" | "patient";
};

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("accessToken");

  if (!storedUser || !token) {
    return <Navigate to="/login" replace />;
  }

  const user: User = JSON.parse(storedUser);
  if (!allowedRoles.includes(user.role)) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "doctor") return <Navigate to="/doctor/dashboard" replace />;
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};