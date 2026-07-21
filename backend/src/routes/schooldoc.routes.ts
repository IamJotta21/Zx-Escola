import { Router } from 'express';
import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  uploadDocumentFile,
} from '../controllers/schooldoc.controller';
import { authenticate, authorize, Role } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();
router.use(authenticate);

const staff: Role[] = ['ADMIN', 'DIRETOR', 'STAFF'];

router.get('/', authorize(staff), listDocuments);
router.get('/:id', authorize(staff), getDocument);
router.post('/', authorize(staff), createDocument);
router.put('/:id', authorize(staff), updateDocument);
router.delete('/:id', authorize(staff), deleteDocument);
router.post('/:id/upload', authorize(staff), upload.single('file'), uploadDocumentFile);

export default router;
