import { IParser } from './IParser';
import { ParsedData, ParsedSheet } from '../../types/ImportType';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

export class ExcelParser implements IParser {
  async parse(filePath: string): Promise<ParsedData> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado no caminho: ${filePath}`);
    }

    const fileStats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // Read the Excel workbook using XLSX
    const workbook = XLSX.readFile(filePath, {
      type: 'file',
      cellDates: true,
      cellNF: false,
      cellText: false,
    });

    const sheets: ParsedSheet[] = [];
    let totalRows = 0;
    let maxCols = 0;

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];

      // Convert sheet content to raw JSON objects
      // header: 1 returns array of arrays, header: def returns array of key-value objects
      const dataArr = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

      if (dataArr.length === 0) return;

      const headers = dataArr[0].map((h) => String(h || '').trim()).filter((h) => h !== '');
      const rows: Array<Record<string, any>> = [];

      // Loop through data rows (skip headers row at index 0)
      for (let i = 1; i < dataArr.length; i++) {
        const rowArr = dataArr[i];

        // Skip entirely empty rows
        if (rowArr.every((cell) => String(cell || '').trim() === '')) {
          continue;
        }

        const rowObj: Record<string, any> = {};
        headers.forEach((header, index) => {
          rowObj[header] = rowArr[index] !== undefined ? rowArr[index] : null;
        });

        rows.push(rowObj);
      }

      sheets.push({
        name: sheetName,
        headers,
        rows,
      });

      totalRows += rows.length;
      if (headers.length > maxCols) {
        maxCols = headers.length;
      }
    });

    return {
      format: ext.substring(1).toUpperCase(),
      encoding: 'UTF-8', // Excel internally handles unicode
      sheets,
      metadata: {
        totalRows,
        totalCols: maxCols,
        fileSize: fileStats.size,
      },
    };
  }
}

export default ExcelParser;
