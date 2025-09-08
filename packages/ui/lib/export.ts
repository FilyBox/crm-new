import type { Table } from '@tanstack/react-table';

export function exportTableToCSV<TData>(
  table: Table<TData>,
  opts: {
    filename?: string;
    excludeColumns?: string[];
    onlySelected?: boolean;
  } = {},
): void {
  const { filename = 'table', excludeColumns = [], onlySelected = false } = opts;

  const headers = table
    .getAllLeafColumns()
    .map((column) => column.id)
    .filter((id) => !excludeColumns.includes(id));
  const csvContent = [
    headers.join(','),
    ...(onlySelected ? table.getFilteredSelectedRowModel().rows : table.getRowModel().rows).map(
      (row) =>
        headers
          .map((header) => {
            let cellValue = row.getValue(header);
            if (
              header === 'isrcArtists' ||
              header === 'tuStreamsArtists' ||
              header === 'releasesArtists'
            ) {
              if (Array.isArray(cellValue)) {
                cellValue = cellValue.map((artist) => artist.artistName).join(', ');
              } else {
                cellValue = '';
              }
            } else if (header === 'artists' || header === 'productDisplayArtist') {
              if (Array.isArray(cellValue)) {
                cellValue = cellValue.map((artist) => artist.name).join(', ');
              } else {
                cellValue = '';
              }
            } else if (header === 'distributionStatementTerritories') {
              if (Array.isArray(cellValue)) {
                cellValue = cellValue.map((territory) => territory.name).join(', ');
              } else {
                cellValue = '';
              }
            } else if (header === 'distributionStatementMusicPlatforms') {
              if (Array.isArray(cellValue)) {
                cellValue = cellValue.map((platform) => platform.name).join(', ');
              } else {
                cellValue = '';
              }
            } else {
              cellValue = row.getValue(header);
            }
            return typeof cellValue === 'string' ? `"${cellValue.replace(/"/g, '""')}"` : cellValue;
          })
          .join(','),
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
