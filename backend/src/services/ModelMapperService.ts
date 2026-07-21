import { IModelMapperService } from '../interfaces/ImportInterface';

export class ModelMapperService implements IModelMapperService {
  mapRowToEntity(row: Record<string, any>, mapping: Record<string, string>): Record<string, any> {
    const entityData: Record<string, any> = {};

    Object.keys(row).forEach((excelHeader) => {
      const dbFieldName = mapping[excelHeader];
      if (dbFieldName) {
        entityData[dbFieldName] = row[excelHeader];
      }
    });

    return entityData;
  }
}
export default ModelMapperService;
