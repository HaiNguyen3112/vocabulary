import { useState, ChangeEvent } from "react";
import * as XLSX from "xlsx";

const useFileInput = <T,>() => {
  const [data, setData] = useState<T[]>([]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const binaryStr = event.target?.result;
      if (typeof binaryStr !== "string") return;

      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json<T>(sheet);

      setData(sheetData);
    };

    reader.readAsBinaryString(file);
  };

  return { data, handleFileUpload };
};

export default useFileInput;
