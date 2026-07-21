import { IParser } from './IParser';
import { ParsedData, ParsedSheet } from '../../types/ImportType';
import { ParserFactory } from './ParserFactory';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

export class ZipParser implements IParser {
  async parse(filePath: string): Promise<ParsedData> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado no caminho: ${filePath}`);
    }

    const fileStats = fs.statSync(filePath);
    const tempExtractDir = path.join(
      path.dirname(filePath),
      `temp_zip_${Date.now()}_${Math.round(Math.random() * 1e9)}`
    );

    // Create temp directory for extraction
    fs.mkdirSync(tempExtractDir, { recursive: true });

    const combinedSheets: ParsedSheet[] = [];
    let totalRows = 0;
    let maxCols = 0;

    try {
      // Decompress ZIP using adm-zip
      const zip = new AdmZip(filePath);
      zip.extractAllTo(tempExtractDir, true);

      // Recursive scan helper
      const scanDir = async (dir: string) => {
        const entries = fs.readdirSync(dir);

        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            // Ignore macOS metadata folders
            if (entry !== '__MACOSX') {
              await scanDir(fullPath);
            }
          } else {
            // Ignore system trash files
            if (entry === '.DS_Store' || entry.startsWith('._')) {
              continue;
            }

            const ext = path.extname(entry).toLowerCase();

            // Skip zip inside zip to prevent zip bombs
            if (ext === '.zip') {
              continue;
            }

            try {
              // Resolve parser from extension
              const subParser = ParserFactory.getParser(ext);
              const result = await subParser.parse(fullPath);

              // Merge sheets, prefixing sheet name with the file prefix to prevent collisions
              result.sheets.forEach((sheet) => {
                combinedSheets.push({
                  name: `${entry.replace(/[^a-zA-Z0-9]/g, '_')}_${sheet.name}`,
                  headers: sheet.headers,
                  rows: sheet.rows,
                });
              });

              totalRows += result.metadata.totalRows;
              if (result.metadata.totalCols > maxCols) {
                maxCols = result.metadata.totalCols;
              }
            } catch (err) {
              // Skip failed internal files but continue parsing others
              console.error(`Falha ao ler arquivo compactado ${entry}:`, err);
            }
          }
        }
      };

      await scanDir(tempExtractDir);
    } finally {
      // Always cleanup extracted folder to free space
      if (fs.existsSync(tempExtractDir)) {
        try {
          fs.rmSync(tempExtractDir, { recursive: true, force: true });
        } catch (err) {
          // Ignored
        }
      }
    }

    return {
      format: 'ZIP',
      encoding: 'UTF-8',
      sheets: combinedSheets,
      metadata: {
        totalRows,
        totalCols: maxCols,
        fileSize: fileStats.size,
      },
    };
  }
}

export default ZipParser;
