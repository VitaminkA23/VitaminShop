import { Router } from 'express';
import {
  getAddresses,
  addAddress,
  getPaymentMethods,
  addPaymentMethod,
} from '../controllers/profile.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export const profileRouter = Router();

profileRouter.use(authMiddleware);

profileRouter.get('/addresses', getAddresses);
profileRouter.post('/address', addAddress);
profileRouter.get('/payment-methods', getPaymentMethods);
profileRouter.post('/payment-method', addPaymentMethod);