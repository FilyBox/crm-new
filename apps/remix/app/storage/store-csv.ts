import { create } from 'zustand/react';

import { type CSVFile } from '~/components/general/csv-input';

interface CsvFilesStore {
  csvFiles: CSVFile[];
  setCsvFiles: (files: CSVFile[] | ((prev: CSVFile[]) => CSVFile[])) => void;
  addCsvFiles: (files: CSVFile[]) => void;
  removeCsvFile: (id: string) => void;
  clearCsvFiles: () => void;
}

export const useCsvFilesStore = create<CsvFilesStore>((set) => ({
  csvFiles: [],

  setCsvFiles: (files) =>
    set((state) => ({
      csvFiles: typeof files === 'function' ? files(state.csvFiles) : files,
    })),

  addCsvFiles: (files) =>
    set((state) => ({
      csvFiles: [...state.csvFiles, ...files],
    })),

  removeCsvFile: (id) =>
    set((state) => ({
      csvFiles: state.csvFiles.filter((file) => file.id !== id),
    })),

  clearCsvFiles: () =>
    set(() => ({
      csvFiles: [],
    })),
}));
