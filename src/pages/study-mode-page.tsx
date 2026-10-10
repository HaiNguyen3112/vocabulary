import { Navigate, useParams } from "react-router-dom";
import { ROUTES } from "@/app/nav-items";
import { isPracticeMode } from "@/constants/study-modes";
import { PracticeSession } from "@/features/study/practice-session";

/** `/study/:mode` — free practice; unknown modes go back to the hub. */
export function StudyModePage() {
  const { mode = "" } = useParams();
  if (!isPracticeMode(mode)) return <Navigate to={ROUTES.study} replace />;
  return <PracticeSession key={mode} mode={mode} />;
}
