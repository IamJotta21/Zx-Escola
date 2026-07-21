import { z } from 'zod';

export const createModelSchema = z.object({
  name: z
    .string({
      required_error: 'O nome do modelo é obrigatório',
    })
    .min(3, 'O nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  targetEntity: z.enum(['STUDENT', 'TEACHER', 'GUARDIAN', 'CLASS', 'ROOM'], {
    errorMap: () => ({ message: 'Entidade de destino inválida' }),
  }),
  mapping: z.record(z.string(), {
    required_error: 'O mapeamento de colunas é obrigatório',
  }),
  originSystem: z.string().optional(),
});

export const startImportSchema = z.object({
  modelId: z
    .string({
      required_error: 'O ID do modelo é obrigatório',
    })
    .uuid('ID do modelo inválido'),
  fileId: z.string().uuid('ID do arquivo inválido').optional(),
});

export const analyzeFileSchema = z.object({
  fileId: z
    .string({
      required_error: 'O ID do arquivo é obrigatório',
    })
    .uuid('ID do arquivo inválido'),
  modelId: z.string().uuid('ID do modelo inválido').optional(),
});
