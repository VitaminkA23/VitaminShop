import { Router } from 'express';
import { getAllOrders, updateOrderStatus } from '../controllers/order.controller';
import { getAdminStats } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleCheckMiddleware } from '../middleware/roleCheck.middleware';
import { Role } from '@vitamin/types';

export const adminRouter = Router();

adminRouter.use(authMiddleware, roleCheckMiddleware([Role.ADMIN]));

adminRouter.get('/stats', getAdminStats);
adminRouter.get('/orders', getAllOrders);
adminRouter.patch('/orders/:id/status', updateOrderStatus);