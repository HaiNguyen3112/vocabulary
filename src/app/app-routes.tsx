import { Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "@/app/nav-items";
import { StudyPage } from "@/pages/study-page";
import { WordEditPage } from "@/pages/word-edit-page";
import { WordsPage } from "@/pages/words-page";

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.study} element={<StudyPage />} />
      <Route path={ROUTES.words} element={<WordsPage />} />
      <Route path={ROUTES.wordNew} element={<WordEditPage />} />
      <Route path={ROUTES.wordDetail} element={<WordsPage />} />
      <Route path={ROUTES.wordEdit} element={<WordEditPage />} />
      <Route path="/vocabulary" element={<Navigate to={ROUTES.study} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.study} replace />} />
    </Routes>
  );
}
