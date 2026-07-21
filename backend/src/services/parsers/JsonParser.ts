import { IParser } from './IParser';
import { ParsedData, ParsedSheet } from '../../types/ImportType';
import fs from 'fs';

export class JsonParser implements IParser {
  // Helper to flatten nested objects recursively
  private flattenObject(obj: any, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {};

    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    });

    return flattened;
  }

  async parse(filePath: string): Promise<ParsedData> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado no caminho: ${filePath}`);
    }

    const fileStats = fs.statSync(filePath);
    const rawContent = fs.readFileSync(filePath, 'utf8');

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch (err: any) {
      throw new Error(`Arquivo JSON corrompido ou sintaxe inválida: ${err.message}`);
    }

    const sheets: ParsedSheet[] = [];
    let totalRows = 0;
    let maxCols = 0;

    // Helper function to process an array of items as a worksheet
    const processArray = (arr: any[], sheetName: string) => {
      if (arr.length === 0) return;

      const flattenedRows = arr.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return this.flattenObject(item);
        }
        return { value: item };
      });

      // Collect all unique header keys across all objects
      const headerSet = new Set<string>();
      flattenedRows.forEach((row) => {
        Object.keys(row).forEach((k) => headerSet.add(k));
      });
      const headers = Array.from(headerSet);

      sheets.push({
        name: sheetName,
        headers,
        rows: flattenedRows,
      });

      totalRows += flattenedRows.length;
      if (headers.length > maxCols) {
        maxCols = headers.length;
      }
    };

    if (Array.isArray(parsedJson)) {
      // If root is an array of objects
      processArray(parsedJson, 'JSON_Data');
    } else if (typeof parsedJson === 'object' && parsedJson !== null) {
      // If root is an object, look for child arrays or treat root object as 1-row sheet
      let processedAnyArray = false;

      Object.keys(parsedJson).forEach((key) => {
        const val = parsedJson[key];
        if (Array.isArray(val)) {
          processArray(val, key);
          processedAnyArray = true;
        }
      });

      if (!processedAnyArray) {
        // Treat single object as a 1-row sheet
        processArray([parsedJson], 'JSON_Data');
      }
    } else {
      throw new Error('Formato JSON não suportado. Deve ser um array ou objeto.');
    }

    return {
      format: 'JSON',
      encoding: 'UTF-8',
      sheets,
      metadata: {
        totalRows,
        totalCols: maxCols,
        fileSize: fileStats.size,
      },
    };
  }
}

export default JsonParser;
