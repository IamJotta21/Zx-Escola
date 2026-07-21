import { Request, Response, NextFunction } from 'express';
import { ModelRepository } from '../repositories/ModelRepository';

const modelRepository = new ModelRepository();

export const createModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, targetEntity, mapping, originSystem } = req.body;

    const model = await modelRepository.create({
      name,
      description,
      targetEntity,
      mapping: typeof mapping === 'string' ? mapping : JSON.stringify(mapping),
      originSystem,
    });

    return res.status(201).json({
      status: 'success',
      data: model,
    });
  } catch (error) {
    return next(error);
  }
};

export const getModelDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const model = await modelRepository.findById(id);

    if (!model) {
      return res.status(404).json({
        status: 'error',
        message: 'Modelo de mapeamento não encontrado',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: model,
    });
  } catch (error) {
    return next(error);
  }
};

export const listModels = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const models = await modelRepository.listAll();
    return res.status(200).json({
      status: 'success',
      data: models,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deleted = await modelRepository.delete(id);
    return res.status(200).json({
      status: 'success',
      data: deleted,
    });
  } catch (error) {
    return next(error);
  }
};
