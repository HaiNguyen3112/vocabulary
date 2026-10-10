import { useSearchParams } from "react-router-dom";
import { isCategory } from "@shared/categories";
import { ALL_CATEGORIES, type CategoryFilter } from "@/constants/categories";

/** Word-list filters + page live in the URL so Back (or closing the split-view panel) restores the list. */
export function useWordListParams() {
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const categoryParam = params.get("category");
  const category: CategoryFilter = isCategory(categoryParam) ? categoryParam : ALL_CATEGORIES;
  const page = Number(params.get("page")) || 1;
  const query = params.toString();
  const listSearch = query ? `?${query}` : "";

  const updateParams = (changes: Record<string, string>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
        return next;
      },
      { replace: true },
    );

  return { search, category, page, listSearch, updateParams };
}
