import { PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Input, Table, Typography } from "antd";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isCategory } from "@shared/categories";
import type { Word } from "@shared/word";
import { ROUTES, wordDetailPath, wordEditPath } from "@/app/nav-items";
import { ALL_CATEGORIES, type CategoryFilter } from "@/constants/categories";
import { WORDS_PAGE_SIZE } from "@/constants/words";
import { CategoryFilterSelect } from "@/features/shared/category-select";
import { ExcelFileButton } from "@/features/shared/excel-file-button";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useWords } from "@/hooks/use-words";
import type { ParsedWordRows } from "@/lib/excel-rows";
import { filterWords } from "@/lib/filter-words";
import { ImportPreviewModal } from "./import-preview-modal";
import { WordCardList } from "./word-card-list";
import { getWordTableColumns } from "./word-table-columns";
import styles from "./words-workspace.module.scss";

/** Clicks on these inside a row keep their own behaviour instead of opening the word. */
const INTERACTIVE_SELECTOR = "button, a, input, .ant-tag, .ant-popover";

export function WordsWorkspace() {
  const navigate = useNavigate();
  const { words, isLoading, error, reload } = useWords();
  const isMobile = useIsMobile();
  const [importRows, setImportRows] = useState<ParsedWordRows | null>(null);

  // Filters + page live in the URL so Back from a word page restores the list.
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const categoryParam = params.get("category");
  const category: CategoryFilter = isCategory(categoryParam) ? categoryParam : ALL_CATEGORIES;
  const page = Number(params.get("page")) || 1;
  const updateParams = (changes: Record<string, string>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
        return next;
      },
      { replace: true },
    );

  const filteredWords = filterWords(words, { search, category });
  const wordsById = new Map(words.map((word) => [word.id, word]));
  const handleOpen = (id: string) => navigate(wordDetailPath(id));
  const handleEdit = (word: Word) => navigate(wordEditPath(word.id));
  const columns = getWordTableColumns({ wordsById, onOpen: handleOpen, onEdit: handleEdit });
  const pagination = {
    current: page,
    pageSize: WORDS_PAGE_SIZE,
    showSizeChanger: false,
    onChange: (nextPage: number) => updateParams({ page: nextPage > 1 ? String(nextPage) : "" }),
  };

  return (
    <div className={styles.workspace}>
      <Typography.Title level={3} className={styles.title}>
        Word List <span className={styles.count}>({words.length})</span>
      </Typography.Title>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <Input.Search
            allowClear
            placeholder="Search word, definition or example"
            value={search}
            onChange={(event) => updateParams({ q: event.target.value, page: "" })}
          />
          <CategoryFilterSelect value={category} onChange={(value) => updateParams({ category: value, page: "" })} />
        </div>
        <div className={styles.actions}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(ROUTES.wordNew)}>
            Add word
          </Button>
          <ExcelFileButton onParsed={setImportRows} />
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          action={<Button size="small" onClick={() => void reload()}>Retry</Button>}
        />
      )}

      {isMobile ? (
        <WordCardList
          words={filteredWords}
          wordsById={wordsById}
          isLoading={isLoading}
          pagination={pagination}
          onOpen={handleOpen}
          onEdit={handleEdit}
        />
      ) : (
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={filteredWords}
          pagination={pagination}
          scroll={{ x: true }}
          rowClassName={styles.row}
          onRow={(word) => ({
            onClick: (event) => {
              if (!(event.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) handleOpen(word.id);
            },
          })}
        />
      )}

      <ImportPreviewModal rows={importRows} onClose={() => setImportRows(null)} />
    </div>
  );
}
