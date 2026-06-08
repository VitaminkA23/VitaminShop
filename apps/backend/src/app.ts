import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes';
import { productRouter } from './routes/product.routes';
import { cartRouter } from './routes/cart.routes';
import { profileRouter } from './routes/profile.routes';
import { orderRouter } from './routes/order.routes';
import { adminRouter } from './routes/admin.routes';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/profile', profileRouter);
app.use('/api/orders', orderRouter);
app.use('/api/admin', adminRouter);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler — must have 4 params so Express recognises it as an error handler.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

export { app };