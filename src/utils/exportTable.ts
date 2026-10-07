/**
 * Export table helpers for HR and Masters
 */
import * as XLSX from 'xlsx';

export interface ExportColumn<T = any> {
  header: string;
  key?: keyof T | string;
  get?: (row: T) => any;
  format?: (value: any, row: T) => string | number;
  width?: number;
}

export const footerRow = (label: string, totals: Record<string, any>) => {
  return {
    isFooter: true,
    label,
    ...totals
  };
};

export const exportTableToCsv = <T = any>(
  columns: ExportColumn<T>[],
  data: T[],
  filename: string = 'export.csv'
) => {
  const headers = columns.map(c => c.header);
  const rows = data.map(row =>
    columns.map(col => {
      let val = col.get ? col.get(row) : col.key ? (row as any)[col.key] : '';
      if (col.format) val = col.format(val, row);
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  );

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportTableToExcel = <T = any>(
  columns: ExportColumn<T>[],
  data: T[],
  filename: string = 'export.xlsx',
  sheetName: string = 'Data'
) => {
  const formatted = data.map(row => {
    const obj: Record<string, any> = {};
    columns.forEach(col => {
      let val = col.get ? col.get(row) : col.key ? (row as any)[col.key] : '';
      if (col.format) val = col.format(val, row);
      obj[col.header] = val ?? '';
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(formatted);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
};
