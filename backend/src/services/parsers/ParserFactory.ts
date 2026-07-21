import { IParser } from './IParser';
import { ExcelParser } from './ExcelParser';
import { CsvParser } from './CsvParser';
import { JsonParser } from './JsonParser';
import { XmlParser } from './XmlParser';
import { ZipParser } from './ZipParser';

export class ParserFactory {
  static getParser(extension: string): IParser {
    const ext = extension.toLowerCase().trim();

    switch (ext) {
      case '.xlsx':
      case '.xls':
      case '.ods':
        return new ExcelParser();
      case '.csv':
      case '.txt':
        return new CsvParser();
      case '.json':
        return new JsonParser();
      case '.xml':
        return new XmlParser();
      case '.zip':
        return new ZipParser();
      default:
        throw new Error(`Sem parser disponível para extensão "${extension}"`);
    }
  }
}

export default ParserFactory;
