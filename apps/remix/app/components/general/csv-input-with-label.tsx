import { type ChangeEvent, useRef } from 'react';

import { CheckIcon, Eye, FileText, Trash2Icon, Upload, X } from 'lucide-react';

import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import { Popover, PopoverContent, PopoverTrigger } from '@documenso/ui/primitives/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@documenso/ui/primitives/table';

import { useCsvFilesStore } from '../../storage/store-csv';

export interface CSVFile {
  file: File;
  content: string[][];
  headers: string[];
  id: string;
  rowCount: number;
  columnCount: number;
  label: string;
}

type InputCSVProps = {
  onUpload?: (file: File | null) => void;
  uploadFilesVoid: (file: File) => void;
  onMultipleUpload?: (files: File[]) => void;
  multiple: boolean;
  isSubmitting: boolean;
  label: string;
  // csvFiles: CSVFile[];
  // setCsvFiles: React.Dispatch<React.SetStateAction<CSVFile[]>>;
};

export default function CsvUploadInputWithLabel({
  label,
  onUpload,
  onMultipleUpload,
  multiple,
  uploadFilesVoid,
  isSubmitting,
}: InputCSVProps) {
  // const [csvFiles, setCsvFiles] = useState<CSVFile[]>([]);
  const { csvFiles, addCsvFiles, removeCsvFile, clearCsvFiles } = useCsvFilesStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (content: string): string[][] => {
    const lines = content.split('\n').filter((line) => line.trim() !== '');
    return lines.map((line) => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }

      result.push(current.trim());
      return result;
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newCSVFiles: CSVFile[] = [];

    Array.from(files).forEach((file) => {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const parsedData = parseCSV(content);
          const headers = parsedData[0] || [];
          const dataRows = parsedData.slice(1);

          if (onUpload) {
            onUpload(file);
          } else if (onMultipleUpload) {
            onMultipleUpload(Array.from(files));
          }

          newCSVFiles.push({
            file,
            content: dataRows,
            headers,
            id: Math.random().toString(36).substr(2, 9),
            rowCount: dataRows.length,
            columnCount: headers.length,
            label: label,
          });

          if (newCSVFiles.length === files.length) {
            addCsvFiles(newCSVFiles); // Use store method instead of setCsvFiles
          }
        };
        reader.readAsText(file);
      }
    });
  };

  const removeFile = (id: string) => {
    removeCsvFile(id); // Use store method instead of setCsvFiles
  };

  const clearAll = () => {
    clearCsvFiles(); // Use store method instead of setCsvFiles
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={
              isSubmitting ||
              (csvFiles.length > 0 && !!csvFiles[0]?.label && csvFiles[0].label !== label)
            }
            onClick={triggerFileInput}
            className={`flex w-full flex-1 items-center bg-transparent ${csvFiles.length > 0 ? 'justify-between' : 'justify-center'}`}
          >
            <div className="flex items-center">{label}</div>
            {csvFiles.length > 0 && csvFiles[0]?.label === label && (
              <Badge className="ml-2" variant="secondary">
                {csvFiles.length} file
              </Badge>
            )}
          </Button>

          {csvFiles.length > 0 && csvFiles[0]?.label && csvFiles[0].label === label && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button disabled={isSubmitting} variant="outline" className="p-3">
                    <Eye className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[600px] p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Vista Previa de CSV</h4>
                      <Badge variant="secondary">
                        {csvFiles.length} {csvFiles.length === 1 ? 'archivo' : 'archivos'}
                      </Badge>
                    </div>
                    <div className="max-h-96 space-y-4 overflow-y-auto">
                      {csvFiles.map((csvFile) => (
                        <div key={csvFile.id} className="space-y-2 rounded-lg border p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="max-w-[200px] truncate text-sm font-medium">
                                {csvFile.file.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="text-xs">
                                {csvFile.columnCount} columnas
                              </Badge>
                              <button
                                onClick={() => removeFile(csvFile.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="overflow-hidden rounded border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {csvFile.headers.slice(0, 4).map((header, index) => (
                                    <TableHead key={index} className="text-xs font-medium">
                                      {header || `Columna ${index + 1}`}
                                    </TableHead>
                                  ))}
                                  {csvFile.headers.length > 4 && (
                                    <TableHead className="text-muted-foreground text-xs">
                                      +{csvFile.headers.length - 4} más
                                    </TableHead>
                                  )}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {csvFile.content.slice(0, 3).map((row, rowIndex) => (
                                  <TableRow key={rowIndex}>
                                    {row.slice(0, 4).map((cell, cellIndex) => (
                                      <TableCell
                                        key={cellIndex}
                                        className="max-w-[100px] truncate text-xs"
                                      >
                                        {cell || '-'}
                                      </TableCell>
                                    ))}
                                    {row.length > 4 && (
                                      <TableCell className="text-muted-foreground text-xs">
                                        ...
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))}
                                {csvFile.content.length > 3 && (
                                  <TableRow>
                                    <TableCell
                                      colSpan={Math.min(csvFile.headers.length, 5)}
                                      className="text-muted-foreground text-center text-xs"
                                    >
                                      ...
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                onClick={clearAll}
                disabled={isSubmitting}
                size={'default'}
                className="bg-transparent p-3 text-red-600 hover:text-red-700"
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                loading={isSubmitting}
                disabled={isSubmitting || csvFiles.length === 0}
                onClick={() => uploadFilesVoid(csvFiles[0].file)}
                size={'default'}
                className="text-foreground bg-transparent p-3"
              >
                <CheckIcon className={`h-4 w-4 ${isSubmitting ? 'hidden' : ''}`} />
              </Button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          disabled={isSubmitting}
          type="file"
          multiple={multiple}
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
