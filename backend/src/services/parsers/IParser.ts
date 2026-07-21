import { ParsedData } from '../../types/ImportType';

export interface IParser {
  parse(filePath: string): Promise<ParsedData>;
}
