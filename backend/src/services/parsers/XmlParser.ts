import { IParser } from './IParser';
import { ParsedData, ParsedSheet } from '../../types/ImportType';
import xml2js from 'xml2js';
import fs from 'fs';

export class XmlParser implements IParser {
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

    // Setup parser merging attributes into the main key-value objects for cleanliness
    const xmlParser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      trim: true,
    });

    let xmlObj: any;
    try {
      xmlObj = await xmlParser.parseStringPromise(rawContent);
    } catch (err: any) {
      throw new Error(`Arquivo XML inválido ou mal formatado: ${err.message}`);
    }

    const sheets: ParsedSheet[] = [];
    let totalRows = 0;
    let maxCols = 0;

    // Helper to process arrays of elements
    const processArray = (arr: any[], sheetName: string) => {
      if (arr.length === 0) return;

      const flattenedRows = arr.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return this.flattenObject(item);
        }
        return { value: item };
      });

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

    // XML roots usually have a single wrapper root tag
    const rootKey = Object.keys(xmlObj)[0];
    const rootContent = xmlObj[rootKey];

    if (rootContent && typeof rootContent === 'object') {
      let processedAnyArray = false;

      Object.keys(rootContent).forEach((key) => {
        const val = rootContent[key];

        // If it contains a list of children elements
        if (Array.isArray(val)) {
          processArray(val, key);
          processedAnyArray = true;
        } else if (val && typeof val === 'object') {
          // If it is a single child object, wrap as a single-row sheet
          processArray([val], key);
          processedAnyArray = true;
        }
      });

      if (!processedAnyArray) {
        // Treat whole root content as a single row
        processArray([rootContent], rootKey || 'XML_Data');
      }
    } else {
      // Direct key values in root
      processArray([xmlObj], 'XML_Data');
    }

    return {
      format: 'XML',
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

export default XmlParser;
