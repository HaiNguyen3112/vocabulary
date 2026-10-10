import { Select } from "antd";
import { CATEGORY_FILTER_OPTIONS, type CategoryFilter } from "@/constants/categories";
import styles from "./category-select.module.scss";

type Props = {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
};

/** Category filter including the "All" option. */
export function CategoryFilterSelect({ value, onChange }: Props) {
  return (
    <Select
      className={styles.select}
      value={value}
      onChange={onChange}
      options={CATEGORY_FILTER_OPTIONS}
      aria-label="Category"
    />
  );
}
