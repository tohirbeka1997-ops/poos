/**
 * Export Utilities - Ma'lumotlarni eksport qilish uchun yordamchi funksiyalar
 * CSV, Excel (XLSX), va PDF formatlarida eksport qilish
 */

import { format } from 'date-fns';

/**
 * CSV formatida eksport qilish
 * UTF-8 BOM bilan (Excel uchun)
 */
export function exportToCsv(
  data: Record<string, unknown>[],
  headers: Record<string, string>,
  filename: string
): void {
  if (!data || data.length === 0) {
    throw new Error('NO_DATA');
  }

  // CSV sarlavhalarini yaratish
  const headerKeys = Object.keys(headers);
  const headerValues = Object.values(headers);
  const csvHeader = headerValues.join(',');

  // CSV qatorlarini yaratish
  const csvRows = data.map((row) => {
    return headerKeys
      .map((key) => {
        const value = row[key];
        // Qiymatni formatlash
        if (value === null || value === undefined) {
          return '';
        }
        // Raqamlarni formatlash
        if (typeof value === 'number') {
          return value.toString();
        }
        // Sanalarni formatlash
        if (value instanceof Date) {
          return format(value, 'dd.MM.yyyy HH:mm');
        }
        // Matnni qo'shtirnoq ichiga olish (vergul bo'lsa)
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });

  // CSV mazmunini birlashtirish
  const csvContent = [csvHeader, ...csvRows].join('\n');

  // UTF-8 BOM qo'shish (Excel uchun)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Faylni yuklab olish
  downloadFile(blob, filename);
}

/**
 * Faylni yuklab olish
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Fayl nomini yaratish (timestamp bilan)
 */
export function generateFilename(prefix: string, extension: string): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Ma'lumotlarni chunklarga bo'lish (katta ma'lumotlar uchun)
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
