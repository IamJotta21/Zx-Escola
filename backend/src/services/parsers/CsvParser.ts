import { IParser } from './IParser';
import { ParsedData, ParsedSheet } from '../../types/ImportType';
import fs from 'fs';
import path from 'path';

export class CsvParser implements IParser {
  // Detects the delimiter in raw text lines
  private detectDelimiter(lines: string[]): string {
    const delimiters = [',', ';', '\t', '|'];
    const candidates = delimiters.map((delim) => {
      // Calculate variance of counts across the first lines to verify consistency
      const counts = lines.map((line) => line.split(delim).length - 1);
      const avg = counts.reduce((acc, c) => acc + c, 0) / counts.length;

      // Variance calculation
      const variance = counts.reduce((acc, c) => acc + Math.pow(c - avg, 2), 0) / counts.length;

      return {
        delim,
        avg,
        variance,
      };
    });

    // Pick candidate with consistent non-zero counts (low variance) and highest avg counts
    const validCandidates = candidates.filter((c) => c.avg > 0);
    if (validCandidates.length === 0) {
      return ';'; // default fallback delimiter
    }

    // Sort by lowest variance and highest average count
    validCandidates.sort((a, b) => {
      if (a.variance !== b.variance) {
        return a.variance - b.variance;
      }
      return b.avg - a.avg;
    });

    return validCandidates[0].delim;
  }

  // Detects file encoding (UTF-8, UTF-16LE, UTF-16BE, ISO-8859-1) based on BOM bytes
  private detectEncoding(buffer: Buffer): string {
    if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      return 'UTF-8';
    }
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
      return 'UTF-16LE';
    }
    if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
      return 'UTF-16BE';
    }

    // Check if buffer contains valid UTF-8 sequences. If not, default to ISO-8859-1.
    try {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      decoder.decode(buffer);
      return 'UTF-8';
    } catch (e) {
      return 'ISO-8859-1';
    }
  }

  async parse(filePath: string): Promise<ParsedData> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado no caminho: ${filePath}`);
    }

    const fileStats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // Read raw buffer for encoding check
    const buffer = fs.readFileSync(filePath);
    const encoding = this.detectEncoding(buffer);

    // Convert to javascript string using appropriate encoding
    let rawText = '';
    if (encoding === 'UTF-16LE') {
      rawText = buffer.toString('utf16le');
    } else if (encoding === 'UTF-16BE') {
      // Node has no direct support for utf16be, we swap bytes to LE
      const swapped = Buffer.from(buffer);
      for (let i = 0; i < swapped.length; i += 2) {
        const temp = swapped[i];
        swapped[i] = swapped[i + 1];
        swapped[i + 1] = temp;
      }
      rawText = swapped.toString('utf16le');
    } else if (encoding === 'ISO-8859-1') {
      rawText = buffer.toString('latin1');
    } else {
      rawText = buffer.toString('utf8');
      // Strip BOM if present
      if (rawText.charCodeAt(0) === 0xfeff) {
        rawText = rawText.substring(1);
      }
    }

    // Split text into lines, clean carriage returns, and filter empty ones
    const lines = rawText
      .split('\n')
      .map((line) => line.replace('\r', '').trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      throw new Error('O arquivo CSV/TXT está vazio.');
    }

    // Detect delimiter
    const sampleLines = lines.slice(0, Math.min(5, lines.length));
    const delimiter = this.detectDelimiter(sampleLines);

    // Extract headers
    const rawHeaders = lines[0].split(delimiter);
    const headers = rawHeaders
      .map((h) => {
        // strip enclosing double quotes if present
        let clean = h.trim();
        if (clean.startsWith('"') && clean.endsWith('"')) {
          clean = clean.substring(1, clean.length - 1);
        }
        return clean;
      })
      .filter((h) => h.length > 0);

    const rows: Array<Record<string, any>> = [];

    // Simple CSV parser handling quotes
    const parseCSVLine = (line: string, delim: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delim && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    // Loop through lines (skip header)
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i], delimiter);

      const rowObj: Record<string, any> = {};
      headers.forEach((header, index) => {
        let val = cols[index] !== undefined ? cols[index] : null;
        // strip double quotes if present
        if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        rowObj[header] = val;
      });

      rows.push(rowObj);
    }

    const sheets: ParsedSheet[] = [
      {
        name: 'CSV_Data',
        headers,
        rows,
      },
    ];

    return {
      format: ext.substring(1).toUpperCase() === 'TXT' ? 'TXT_DELIMITED' : 'CSV',
      encoding,
      sheets,
      metadata: {
        totalRows: rows.length,
        totalCols: headers.length,
        fileSize: fileStats.size,
      },
    };
  }
}

export default CsvParser;
