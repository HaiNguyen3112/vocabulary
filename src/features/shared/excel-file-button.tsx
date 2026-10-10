import { FileExcelOutlined } from "@ant-design/icons";
import { App, Button } from "antd";
import { useRef, useState, type ChangeEvent } from "react";
import { getErrorMessage } from "@/api/client";
import { EXCEL_ACCEPT } from "@/constants/words";
import type { ParsedWordRows } from "@/lib/excel-rows";
import { readWordsFromExcel } from "./read-excel";

type Props = {
  onParsed: (rows: ParsedWordRows) => void;
  label?: string;
};

export function ExcelFileButton({ onParsed, label = "Upload file" }: Props) {
  const { message } = App.useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isReading, setIsReading] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    // Reset so picking the same file again still fires onChange.
    input.value = "";
    if (!file) return;

    setIsReading(true);
    try {
      onParsed(await readWordsFromExcel(file));
    } catch (error) {
      message.error(getErrorMessage(error, "Could not read this file"));
    } finally {
      setIsReading(false);
    }
  };

  return (
    <>
      <Button
        type="primary"
        icon={<FileExcelOutlined />}
        loading={isReading}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
      <input ref={inputRef} type="file" accept={EXCEL_ACCEPT} hidden onChange={handleFileChange} />
    </>
  );
}
