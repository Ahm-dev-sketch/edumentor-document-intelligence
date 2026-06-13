import * as XLSX from 'xlsx';

export interface ExcelParseResult {
  sheets: {
    name: string;
    headers: string[];
    rows: Record<string, any>[];
    rowCount: number;
  }[];
  summary: string;
}

/**
 * Parses an Excel or CSV buffer and extracts sheet information, headers, row count, and data rows.
 * @param buffer - The file buffer.
 * @returns ExcelParseResult structure.
 */
export function parseExcel(buffer: Buffer): ExcelParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheets: ExcelParseResult['sheets'] = [];
    let totalRows = 0;

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      // Convert to JSON
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      
      // Get headers from first row keys or sheet range if available
      let headers: string[] = [];
      if (rows.length > 0) {
        headers = Object.keys(rows[0]);
      } else {
        // Try getting headers from sheet cells directly
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ r: range.s.r, c: C });
          const cell = sheet[address];
          if (cell && cell.v !== undefined) {
            headers.push(String(cell.v));
          }
        }
      }

      sheets.push({
        name: sheetName,
        headers,
        rows,
        rowCount: rows.length,
      });
      totalRows += rows.length;
    });

    const summary = `${workbook.SheetNames.length} sheet${workbook.SheetNames.length > 1 ? 's' : ''}, ${totalRows} row${totalRows !== 1 ? 's' : ''} total`;

    return {
      sheets,
      summary,
    };
  } catch (error) {
    console.error('Error parsing Excel/CSV:', error);
    throw new Error('Failed to parse Excel/CSV document. Ensure the file is not corrupted.');
  }
}
