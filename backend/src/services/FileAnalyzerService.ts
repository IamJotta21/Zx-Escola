import { IFileAnalyzerService } from '../interfaces/ImportInterface';
import { prisma } from '../config/database';
import { ParserFactory } from './parsers/ParserFactory';
import { getEntityFields } from '../utils/import.utils';
import { TargetEntity } from '../types/ImportType';
import path from 'path';

export class FileAnalyzerService implements IFileAnalyzerService {
  async analyzeHeaders(
    fileId: string,
    modelId: string
  ): Promise<{
    isValid: boolean;
    rowCount: number;
    missingHeaders: string[];
    matchedHeaders: Record<string, string>;
  }> {
    // 1. Fetch file and mapping model details from database
    const fileRecord = await prisma.uploadedFile.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      throw new Error('Arquivo não encontrado no banco de dados');
    }

    const modelRecord = await prisma.importModel.findUnique({
      where: { id: modelId },
    });

    if (!modelRecord) {
      throw new Error('Modelo de mapeamento não encontrado no banco de dados');
    }

    const ext = path.extname(fileRecord.fileName).toLowerCase();

    // 2. Open and parse file using the dynamic parsing factory engine
    const parser = ParserFactory.getParser(ext);
    const parsedData = await parser.parse(fileRecord.filePath);

    if (parsedData.sheets.length === 0) {
      throw new Error('Nenhuma planilha ou planilha vazia encontrada no arquivo');
    }

    // Inspect first worksheet parsed
    const firstSheet = parsedData.sheets[0];
    const sheetHeaders = firstSheet.headers.map((h) => h.toLowerCase().trim());

    // 3. Inspect target model template settings mapping
    const mapping = JSON.parse(modelRecord.mapping) as Record<string, string>;
    const matchedHeaders: Record<string, string> = {};
    const missingHeaders: string[] = [];

    // Get model target entity fields requirements (e.g. STUDENT)
    const entityFields = getEntityFields(modelRecord.targetEntity as TargetEntity);

    entityFields.forEach((field) => {
      // Find Excel column mapping in model mapping config
      const excelCol = Object.keys(mapping).find((key) => mapping[key] === field.field);

      if (excelCol) {
        const isMatched = sheetHeaders.includes(excelCol.toLowerCase().trim());
        if (isMatched) {
          matchedHeaders[excelCol] = field.field;
        } else if (field.required) {
          missingHeaders.push(excelCol);
        }
      } else if (field.required) {
        // If required but not mapped in template configurator
        missingHeaders.push(field.label);
      }
    });

    return {
      isValid: missingHeaders.length === 0,
      rowCount: parsedData.metadata.totalRows,
      missingHeaders,
      matchedHeaders,
    };
  }
}

export default FileAnalyzerService;
