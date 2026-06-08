import { Router } from 'express';
import { getCart, addToCart, removeFromCart } from '../controllers/cart.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export const cartRouter = Router();

cartRouter.use(authMiddleware);

cartRouter.get('/', getCart);
cartRouter.post('/add', addToCart);
cartRouter.post('/remove', removeFromCart);