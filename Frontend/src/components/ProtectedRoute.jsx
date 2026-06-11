import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../services/auth";
import { Loader } from "./ui";

export default function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();
  if (authLoading) return <Loader label="Checking your session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
