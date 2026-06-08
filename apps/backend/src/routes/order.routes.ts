import { Router } from 'express';
import { checkout, getOrders, getOrderById } from '../controllers/order.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export const orderRouter = Router();

orderRouter.use(authMiddleware);

orderRouter.post('/checkout', checkout);
orderRouter.get('/', getOrders);
orderRouter.get('/:id', getOrderById);