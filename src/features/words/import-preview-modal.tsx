import { Alert, App, Modal, Table, Typography } from "antd";
import { useState } from "react";
import type { WordInput } from "@shared/word";
import { getErrorMessage } from "@/api/client";
import { IMPORT_PREVIEW_PAGE_SIZE } from "@/constants/words";
import { getWordColumns } from "@/features/shared/word-columns";
import type { ParsedWordRows } from "@/lib/excel-rows";
import { useWordsStore } from "@/store/words-store";

type Props = {
  rows: ParsedWordRows | null;
  onClose: () => void;
};

type PreviewRow = WordInput & { key: number };

const columns = getWordColumns<PreviewRow>();

export function ImportPreviewModal({ rows, onClose }: Props) {
  const { message } = App.useApp();
  const importWords = useWordsStore((state) => state.importWords);
  const [isSaving, setIsSaving] = useState(false);
  const validCount = rows?.valid.length ?? 0;

  const handleConfirm = async () => {
    if (!rows || validCount === 0) {
      onClose();
      return;
    }
    setIsSaving(true);
    try {
      const { inserted, skipped } = await importWords(rows.valid);
      message.success(
        `Added ${inserted.length} words` +
          (skipped.length > 0 ? `, skipped ${skipped.length} already in the list` : ""),
      );
      onClose();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title={`Preview Word List (${validCount})`}
      open={rows !== null}
      okText="Import"
      okButtonProps={{ disabled: validCount === 0 }}
      confirmLoading={isSaving}
      onOk={handleConfirm}
      onCancel={onClose}
      width={720}
    >
      {rows && rows.invalid.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`${rows.invalid.length} rows will be skipped`}
          description={
            <Typography.Paragraph ellipsis={{ rows: 3, expandable: true }}>
              {rows.invalid.map((row) => `Row ${row.rowNumber}: ${row.error}`).join(" · ")}
            </Typography.Paragraph>
          }
        />
      )}
      <Table
        columns={columns}
        dataSource={rows?.valid.map((row, index) => ({ ...row, key: index })) ?? []}
        pagination={{ pageSize: IMPORT_PREVIEW_PAGE_SIZE, showSizeChanger: false }}
        size="small"
      />
    </Modal>
  );
}
