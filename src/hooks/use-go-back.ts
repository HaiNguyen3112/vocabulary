import { useLocation, useNavigate } from "react-router-dom";

/** Browser back when we navigated here inside the app, otherwise go to `fallback`. */
export function useGoBack(fallback: string) {
  const navigate = useNavigate();
  const location = useLocation();
  // react-router marks the first entry of a session with key "default".
  const hasHistory = location.key !== "default";
  return () => (hasHistory ? navigate(-1) : navigate(fallback, { replace: true }));
}
