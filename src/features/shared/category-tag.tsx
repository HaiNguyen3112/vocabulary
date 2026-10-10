import { Tag } from "antd";
import type { Category } from "@shared/categories";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "@/constants/categories";

export function CategoryTag({ category }: { category: Category }) {
  return <Tag color={CATEGORY_COLOR[category]}>{CATEGORY_LABEL[category].toUpperCase()}</Tag>;
}
