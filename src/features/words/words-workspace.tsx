import { PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Input, Table, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Word } from "@shared/word";
import { ROUTES, wordDetailPath, wordEditPath } from "@/app/nav-items";
import { WORDS_PAGE_SIZE } from "@/constants/words";
import { CategoryFilterSelect } from "@/features/shared/category-select";
import { ExcelFileButton } from "@/features/shared/excel-file-button";
import { useIsDesktop, useIsMobile } from "@/hooks/use-media-query";
import { useWords } from "@/hooks/use-words";
import type { ParsedWordRows } from "@/lib/excel-rows";
import { filterWords } from "@/lib/filter-words";
import { ImportPreviewModal } from "./import-preview-modal";
import { useWordListParams } from "./use-word-list-params";
import { WordCardList } from "./word-card-list";
import { getWordTableColumns } from "./word-table-columns";
import { WordsSplitView } from "./words-split-view";
import styles from "./words-workspace.module.scss";

/** Clicks on these inside a row keep their own behaviour instead of opening the word. */
const INTERACTIVE_SELECTOR = "button, a, input, .ant-tag, .ant-popover";

type Props = {
  /** Word shown in the desktop split view (`/vocabulary-management/:id`). */
  selectedId?: string;
};

export function WordsWorkspace({ selectedId }: Props) {
  const navigate = useNavigate();
  const { words, isLoading, error, reload } = useWords();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const [importRows, setImportRows] = useState<ParsedWordRows | null>(null);
  const { search, category, page, listSearch, updateParams } = useWordListParams();

  const filteredWords = filterWords(words, { search, category });
  const wordsById = new Map(words.map((word) => [word.id, word]));
  // Keep the filters in the URL so closing the word (or Back) restores the same list.
  const handleOpen = (id: string) => navigate(wordDetailPath(id) + listSearch);
  const handleEdit = (word: Word) => navigate(wordEditPath(word.id));
  const columns = getWordTableColumns({ wordsById, onOpen: handleOpen, onEdit: handleEdit });
  const pagination = {
    current: page,
    pageSize: WORDS_PAGE_SIZE,
    showSizeChanger: false,
    onChange: (nextPage: number) => updateParams({ page: nextPage > 1 ? String(nextPage) : "" }),
  };

  return (
    <div className={`${styles.workspace} ${isDesktop ? styles.desktop : ""}`}>
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

      {isDesktop ? (
        <WordsSplitView
          words={filteredWords}
          selectedId={selectedId}
          isLoading={isLoading}
          pagination={pagination}
          onOpen={handleOpen}
          onClose={() => navigate(ROUTES.words + listSearch)}
        />
      ) : isMobile ? (
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
