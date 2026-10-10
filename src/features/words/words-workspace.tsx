import { PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Input, Table, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Word } from "@shared/word";
import { ROUTES, wordDetailPath, wordEditPath } from "@/app/nav-items";
import { WORDS_PAGE_SIZE } from "@/constants/words";
import { CategoryFilterSelect } from "@/features/shared/category-select";
import { ExcelFileButton } from "@/features/shared/excel-file-button";
import { useGoBack } from "@/hooks/use-go-back";
import { useIsDesktop, useIsMobile } from "@/hooks/use-media-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useWordPage } from "@/hooks/use-word-page";
import type { ParsedWordRows } from "@/lib/excel-rows";
import { ImportPreviewModal } from "./import-preview-modal";
import { useWordListParams } from "./use-word-list-params";
import { WordCardList } from "./word-card-list";
import { WordDetailDrawer } from "./word-detail-drawer";
import { WordListPager } from "./word-list-pager";
import { getWordTableColumns } from "./word-table-columns";
import { WordsSplitView } from "./words-split-view";
import { OfflineHint } from "@/features/shared/offline-hint";
import styles from "./words-workspace.module.scss";

/** Clicks on these inside a row keep their own behaviour instead of opening the word. */
const INTERACTIVE_SELECTOR = "button, a, input, .ant-tag, .ant-popover";
const SEARCH_DEBOUNCE_MS = 300;

type Props = {
  /** Open word (`/vocabulary-management/:id`): split view ≥992px, drawer below. */
  selectedId?: string;
};

export function WordsWorkspace({ selectedId }: Props) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const [importRows, setImportRows] = useState<ParsedWordRows | null>(null);
  const { search, category, page, listSearch, updateParams } = useWordListParams();
  // Drawer close = history back when the list opened it, so Back and X land on the same entry.
  const closeDrawer = useGoBack(ROUTES.words + listSearch);

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const { data, isLoading, error, reload } = useWordPage({
    search: debouncedSearch,
    category,
    page,
    pageSize: WORDS_PAGE_SIZE,
  });
  const words = data?.words ?? [];
  const wordsById = new Map([...words, ...(data?.related ?? [])].map((word) => [word.id, word]));
  // Keep the filters in the URL so closing the word (or Back) restores the same list.
  const handleOpen = (id: string) => navigate(wordDetailPath(id) + listSearch);
  const handleEdit = (word: Word) => navigate(wordEditPath(word.id));
  const columns = getWordTableColumns({ wordsById, onOpen: handleOpen, onEdit: handleEdit });
  const pager = {
    // The server answers with the last page when the URL asks for one past the end.
    page: data?.page ?? page,
    pageSize: WORDS_PAGE_SIZE,
    total: data?.total ?? 0,
    isLarge: isMobile,
    isStacked: isMobile,
    onChange: (nextPage: number) => {
      updateParams({ page: nextPage > 1 ? String(nextPage) : "" });
      if (!isDesktop) window.scrollTo({ top: 0 });
    },
  };

  return (
    <div className={`${styles.workspace} ${isDesktop ? styles.desktop : ""}`}>
      <Typography.Title level={3} className={styles.title}>
        Word List {data && <span className={styles.count}>({data.total.toLocaleString()})</span>}
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
          <OfflineHint>
            {(isOnline) => (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                disabled={!isOnline}
                onClick={() => navigate(ROUTES.wordNew)}
              >
                Add word
              </Button>
            )}
          </OfflineHint>
          <OfflineHint>
            {(isOnline) => <ExcelFileButton onParsed={setImportRows} disabled={!isOnline} />}
          </OfflineHint>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          action={<Button size="small" onClick={reload}>Retry</Button>}
        />
      )}

      {isDesktop ? (
        <WordsSplitView
          words={words}
          selectedId={selectedId}
          isLoading={isLoading}
          pager={pager}
          onOpen={handleOpen}
          onClose={() => navigate(ROUTES.words + listSearch)}
        />
      ) : isMobile ? (
        <WordCardList
          words={words}
          wordsById={wordsById}
          isLoading={isLoading}
          onOpen={handleOpen}
          onEdit={handleEdit}
        />
      ) : (
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={words}
          pagination={false}
          scroll={{ x: true }}
          rowClassName={styles.row}
          onRow={(word) => ({
            onClick: (event) => {
              if (!(event.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) handleOpen(word.id);
            },
          })}
        />
      )}

      {!isDesktop && pager.total > 0 && <WordListPager {...pager} className={styles.pager} />}

      {!isDesktop && (
        <WordDetailDrawer
          id={selectedId}
          placement={isMobile ? "bottom" : "right"}
          onClose={closeDrawer}
          // Replace, so related words browsed inside the drawer do not pile up in history.
          onOpenRelated={(id) => navigate(wordDetailPath(id) + listSearch, { replace: true })}
        />
      )}

      <ImportPreviewModal rows={importRows} onClose={() => setImportRows(null)} />
    </div>
  );
}
