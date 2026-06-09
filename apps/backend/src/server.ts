import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import type { JwtPayload } from '@vitamin/types';

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET ?? 'vitamin-dev-secret-change-in-prod';

// ─── CORS + body parsing ──────────────────────────────────────────────────────

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: false,
  }),
);
app.use(express.json());

// ─── Auth helpers ─────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function signToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authorization token required' });
    return;
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET) as JwtPayload;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), JWT_SECRET) as JwtPayload;
    } catch {
      // silently ignore invalid tokens for optional-auth routes
    }
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }
    next();
  });
}

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email || !password || !name) {
      res.status(400).json({ message: 'email, password, and name are required' });
      return;
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, password: hash, name } });

    res.status(201).json({
      token: signToken(user),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ message: 'email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    res.json({
      token: signToken(user),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/auth/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// ─── Products ─────────────────────────────────────────────────────────────────

app.get('/api/products', optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (userId) {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: { likes: { where: { userId }, select: { id: true } } },
      });
      res.json({
        products: products.map(({ likes, ...p }) => ({ ...p, liked: likes.length > 0 })),
      });
    } else {
      const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
      res.json({ products: products.map((p) => ({ ...p, liked: false })) });
    }
  } catch (err) {
    next(err);
  }
});

app.get('/api/products/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    if (userId) {
      const like = await prisma.like.findUnique({
        where: { userId_productId: { userId, productId: id } },
      });
      res.json({ product: { ...product, liked: !!like } });
    } else {
      res.json({ product: { ...product, liked: false } });
    }
  } catch (err) {
    next(err);
  }
});

app.post('/api/products', requireAdmin, async (req, res, next) => {
  try {
    const { name, description, price, imageUrl, category, stock } = req.body as {
      name?: string;
      description?: string;
      price?: number;
      imageUrl?: string;
      category?: string;
      stock?: number;
    };

    if (!name || !description || price == null || !imageUrl || !category) {
      res
        .status(400)
        .json({ message: 'name, description, price, imageUrl, and category are required' });
      return;
    }
    if (Number(price) <= 0) {
      res.status(400).json({ message: 'price must be greater than 0' });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        imageUrl: imageUrl.trim(),
        category: category.trim(),
        stock: Math.max(0, Math.floor(Number(stock ?? 0))),
      },
    });
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
});

app.put('/api/products/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, imageUrl, category, stock } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name != null && { name: String(name).trim() }),
        ...(description != null && { description: String(description).trim() }),
        ...(price != null && { price: Number(price) }),
        ...(imageUrl != null && { imageUrl: String(imageUrl).trim() }),
        ...(category != null && { category: String(category).trim() }),
        ...(stock != null && { stock: Math.max(0, Math.floor(Number(stock))) }),
      },
    });
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/products/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const orderCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderCount > 0) {
      res.status(409).json({
        message:
          'Cannot delete a product that appears in existing orders. Set stock to 0 to hide it.',
      });
      return;
    }

    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
});

// ─── Likes ────────────────────────────────────────────────────────────────────

app.post('/api/products/:id/like', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const productId = req.params.id;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const existing = await prisma.like.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      res.json({ liked: false });
    } else {
      await prisma.like.create({ data: { userId, productId } });
      res.json({ liked: true });
    }
  } catch (err) {
    next(err);
  }
});

// ─── Orders ───────────────────────────────────────────────────────────────────

const ORDER_INCLUDE = {
  items: {
    include: {
      product: { select: { id: true, name: true, imageUrl: true, price: true } },
    },
    orderBy: { id: 'asc' as const },
  },
} as const;

function parseOrder<T extends { shippingAddress: string }>(order: T) {
  return { ...order, shippingAddress: JSON.parse(order.shippingAddress) };
}

app.post('/api/orders/checkout', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { items, shippingAddress } = req.body as {
      items?: Array<{ productId: string; quantity: number }>;
      shippingAddress?: { street: string; city: string; postalCode: string; country: string };
    };

    if (!items?.length) {
      res.status(400).json({ message: 'At least one item is required' });
      return;
    }
    if (!shippingAddress?.street || !shippingAddress?.city) {
      res.status(400).json({ message: 'shippingAddress with street and city is required' });
      return;
    }

    const order = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData: Array<{
        productId: string;
        quantity: number;
        priceAtPurchase: number;
      }> = [];

      for (const { productId, quantity } of items) {
        if (!productId || quantity < 1) {
          throw Object.assign(new Error('Invalid item data'), { code: 'INVALID_ITEM' });
        }

        const result = await tx.product.updateMany({
          where: { id: productId, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });

        if (result.count === 0) {
          const product = await tx.product.findUnique({ where: { id: productId } });
          throw Object.assign(
            new Error(
              product
                ? `Insufficient stock for "${product.name}"`
                : `Product not found: ${productId}`,
            ),
            { code: 'INSUFFICIENT_STOCK' },
          );
        }

        const product = await tx.product.findUnique({ where: { id: productId } });
        totalAmount += product!.price * quantity;
        orderItemsData.push({ productId, quantity, priceAtPurchase: product!.price });
      }

      return tx.order.create({
        data: {
          userId,
          status: 'PAID',
          totalAmount,
          shippingAddress: JSON.stringify(shippingAddress),
          items: { create: orderItemsData },
        },
        include: ORDER_INCLUDE,
      });
    });

    res.status(201).json({ order: parseOrder(order) });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === 'INSUFFICIENT_STOCK' || e.code === 'INVALID_ITEM') {
      res.status(409).json({ message: e.message ?? 'Checkout failed' });
      return;
    }
    next(err);
  }
});

app.get('/api/orders', requireAuth, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.userId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders: orders.map(parseOrder) });
  } catch (err) {
    next(err);
  }
});

app.get('/api/orders/:id', requireAuth, async (req, res, next) => {
  try {
    const { userId, role } = req.user!;
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    if (role !== 'ADMIN' && order.userId !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.json({ order: parseOrder(order) });
  } catch (err) {
    next(err);
  }
});

// ─── Admin ────────────────────────────────────────────────────────────────────

app.get('/api/admin/stats', requireAdmin, async (_req, res, next) => {
  try {
    const [totalOrders, revenueAgg, outOfStockCount, totalUsers] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
      }),
      prisma.product.count({ where: { stock: 0 } }),
      prisma.user.count({ where: { role: 'USER' } }),
    ]);

    res.json({
      stats: {
        totalOrders,
        totalRevenue: revenueAgg._sum.totalAmount ?? 0,
        outOfStockCount,
        totalUsers,
      },
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/admin/orders', requireAdmin, async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        ...ORDER_INCLUDE,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders: orders.map(parseOrder) });
  } catch (err) {
    next(err);
  }
});

app.patch('/api/admin/orders/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body as { status?: string };
    const valid = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

    if (!status || !valid.includes(status)) {
      res.status(400).json({ message: `status must be one of: ${valid.join(', ')}` });
      return;
    }

    const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        ...ORDER_INCLUDE,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({ order: parseOrder(order) });
  } catch (err) {
    next(err);
  }
});

// ─── 404 + error handler ──────────────────────────────────────────────────────

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => console.log(`[backend] http://localhost:${PORT}`));