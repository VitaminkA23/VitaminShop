import { Router } from 'express';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';
import { toggleLike } from '../controllers/like.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';
import { roleCheckMiddleware } from '../middleware/roleCheck.middleware';
import { Role } from '@vitamin/types';

export const productRouter = Router();

productRouter.get('/', optionalAuthMiddleware, getProducts);
productRouter.post('/', authMiddleware, roleCheckMiddleware([Role.ADMIN]), createProduct);
productRouter.put('/:id', authMiddleware, roleCheckMiddleware([Role.ADMIN]), updateProduct);
productRouter.delete('/:id', authMiddleware, roleCheckMiddleware([Role.ADMIN]), deleteProduct);
productRouter.post('/:id/like', authMiddleware, toggleLike);