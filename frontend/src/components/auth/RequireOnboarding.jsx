// src/routes/RequireOnboarding.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { onboardingRequired } from "../../utils/onboarding";

export default function RequireOnboarding({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // หรือสปินเนอร์

  // ยังไม่ล็อกอินก็ปล่อย (หรือจะบังคับไป login ก็ได้)
  if (!user) return children;

  // ถ้ายังไม่ได้กรอกความสนใจ และยังไม่ได้อยู่หน้า /onboarding
  if (onboardingRequired(user) && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
