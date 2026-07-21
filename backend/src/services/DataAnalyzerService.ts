import {
  ParsedData,
  FileAnalysisResult,
  ColumnTypeInfo,
  InconsistencyInfo,
  EntityDetectionInfo,
} from '../types/ImportType';

export class DataAnalyzerService {
  // Checks cell value types
  private detectCellType(
    val: any
  ): 'EMAIL' | 'PHONE' | 'CPF' | 'DATE' | 'NUMBER' | 'STRING' | 'BOOLEAN' {
    if (val === null || val === undefined || val === '') return 'STRING';

    const strVal = String(val).trim();
    if (
      strVal.toLowerCase() === 'true' ||
      strVal.toLowerCase() === 'false' ||
      typeof val === 'boolean'
    ) {
      return 'BOOLEAN';
    }

    // CPF regex
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (cpfRegex.test(strVal) || (strVal.length === 11 && !isNaN(Number(strVal)))) {
      return 'CPF';
    }

    // Email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(strVal)) {
      return 'EMAIL';
    }

    // Date checks
    if (val instanceof Date && !isNaN(val.getTime())) {
      return 'DATE';
    }
    const dateRegex = /^\d{2}[-/]\d{2}[-/]\d{4}$/;
    if (
      dateRegex.test(strVal) ||
      (!isNaN(Date.parse(strVal)) && isNaN(Number(strVal)) && strVal.length >= 8)
    ) {
      return 'DATE';
    }

    // Number check
    if (!isNaN(Number(strVal)) && strVal !== '') {
      return 'NUMBER';
    }

    // Phone checks
    const phoneRegex = /^(\+?\d{1,3})?\s?\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}$/;
    if (phoneRegex.test(strVal)) {
      return 'PHONE';
    }

    return 'STRING';
  }

  // Analyzes column header matching to entities
  private analyzeEntities(headers: string[]): EntityDetectionInfo[] {
    const cleanHeaders = headers.map((h) => h.toLowerCase().trim());
    const entitiesList: { type: string; keywords: string[] }[] = [
      {
        type: 'Aluno (STUDENT)',
        keywords: [
          'aluno',
          'nome',
          'sobrenome',
          'cpf',
          'rg',
          'nascimento',
          'matricula',
          'whatsapp',
          'pai',
          'mae',
        ],
      },
      {
        type: 'Professor (TEACHER)',
        keywords: ['professor', 'docente', 'materia', 'disciplina', 'carga', 'aula', 'email'],
      },
      {
        type: 'Responsável (GUARDIAN)',
        keywords: ['responsavel', 'familiar', 'parentesco', 'financeiro', 'telefone', 'whatsapp'],
      },
      { type: 'Turma (CLASS)', keywords: ['turma', 'serie', 'ano', 'sala', 'periodo', 'regente'] },
      { type: 'Sala de Aula (ROOM)', keywords: ['sala', 'bloco', 'capacidade', 'andar'] },
      {
        type: 'Financeiro (BILLING)',
        keywords: [
          'valor',
          'vencimento',
          'pagamento',
          'boleto',
          'multa',
          'desconto',
          'mensalidade',
        ],
      },
      {
        type: 'Biblioteca (LIBRARY)',
        keywords: ['livro', 'isbn', 'autor', 'titulo', 'editora', 'tombo'],
      },
    ];

    const detections: EntityDetectionInfo[] = [];

    entitiesList.forEach((ent) => {
      const matchedFields = cleanHeaders.filter((header) =>
        ent.keywords.some((keyword) => header.includes(keyword) || keyword.includes(header))
      );

      if (matchedFields.length > 0) {
        const confidence = Math.round((matchedFields.length / ent.keywords.length) * 100);
        detections.push({
          entityType: ent.type,
          confidence,
          matchedFields,
        });
      }
    });

    // Sort by confidence percentage
    return detections.sort((a, b) => b.confidence - a.confidence);
  }

  public analyze(
    parsed: ParsedData,
    fileName: string,
    fileSize: number,
    parsingTimeMs: number
  ): FileAnalysisResult {
    if (parsed.sheets.length === 0) {
      throw new Error('Nenhuma planilha encontrada para análise.');
    }

    const sheet = parsed.sheets[0];
    const { headers, rows } = sheet;

    // 1. Column analysis (Types & Samples)
    const columns: ColumnTypeInfo[] = headers.map((header) => {
      const typeCounts: Record<string, number> = {};
      const samples: string[] = [];

      rows.forEach((row) => {
        const val = row[header];
        if (val !== null && val !== undefined && val !== '') {
          const detected = this.detectCellType(val);
          typeCounts[detected] = (typeCounts[detected] || 0) + 1;
          if (samples.length < 3 && !samples.includes(String(val))) {
            samples.push(String(val));
          }
        }
      });

      // Pick dominant type
      let dominantType: any = 'STRING';
      let maxCount = 0;
      Object.keys(typeCounts).forEach((type) => {
        if (typeCounts[type] > maxCount) {
          maxCount = typeCounts[type];
          dominantType = type;
        }
      });

      return {
        name: header,
        detectedType: dominantType,
        sampleValues: samples,
      };
    });

    // 2. Apparent Relationships & Entities
    const detectedEntities = this.analyzeEntities(headers);

    // 3. Duplicate checks within sheet
    const rowStrings = rows.map((r) => JSON.stringify(r));
    const uniqueRowStrings = new Set(rowStrings);
    const duplicateCount = rowStrings.length - uniqueRowStrings.size;

    // 4. Validation inconsistencies warnings (empty values in essential columns etc)
    const inconsistencies: InconsistencyInfo[] = [];

    // Check CPF and Email fields formats for inconsistencies
    columns.forEach((col) => {
      if (col.detectedType === 'EMAIL') {
        rows.forEach((row, idx) => {
          const val = String(row[col.name] || '').trim();
          if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            inconsistencies.push({
              rowNumber: idx + 2, // 1-indexed + header row
              columnName: col.name,
              type: 'WARNING',
              message: `Formato de e-mail inválido: "${val}".`,
            });
          }
        });
      }

      if (col.detectedType === 'CPF') {
        rows.forEach((row, idx) => {
          const val = String(row[col.name] || '').replace(/\D/g, '');
          if (val && val.length !== 11) {
            inconsistencies.push({
              rowNumber: idx + 2,
              columnName: col.name,
              type: 'WARNING',
              message: `CPF deve possuir 11 dígitos numéricos: "${row[col.name]}".`,
            });
          }
        });
      }
    });

    // Limit inconsistencies list to 50 for memory safety
    const limitedInconsistencies = inconsistencies.slice(0, 50);

    // 5. Select 20 rows for Preview
    const previewRows = rows.slice(0, 20);

    return {
      fileName,
      fileSize,
      format: parsed.format,
      encoding: parsed.encoding,
      parsingTimeMs,
      totalRows: rows.length,
      totalCols: headers.length,
      detectedEntities,
      columns,
      inconsistencies: limitedInconsistencies,
      duplicateCount,
      previewRows,
    };
  }
}

export default DataAnalyzerService;
