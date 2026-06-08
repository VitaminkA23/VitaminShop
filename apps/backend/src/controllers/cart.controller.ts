import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

const CART_INCLUDE = {
  items: {
    include: { product: true },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

function computeTotalPrice(items: Array<{ product: { price: number }; quantity: number }>) {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findUnique({
    where: { userId },
    include: CART_INCLUDE,
  });
  if (existing) return existing;

  return prisma.cart.create({
    data: { userId },
    include: CART_INCLUDE,
  });
}

export async function getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!;
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: CART_INCLUDE,
    });

    const items = cart?.items ?? [];
    res.json({ cart: { items, totalPrice: computeTotalPrice(items) } });
  } catch (err) {
    next(err);
  }
}

export async function addToCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!;
    const { productId } = req.body as { productId?: string };

    if (!productId) {
      res.status(400).json({ message: 'productId is required' });
      return;
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const cart = await getOrCreateCart(userId);

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + 1 },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity: 1 },
      });
    }

    const updated = await prisma.cart.findUnique({
      where: { userId },
      include: CART_INCLUDE,
    });

    const items = updated!.items;
    res.json({ cart: { items, totalPrice: computeTotalPrice(items) } });
  } catch (err) {
    next(err);
  }
}

export async function removeFromCart(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.user!;
    const { productId } = req.body as { productId?: string };

    if (!productId) {
      res.status(400).json({ message: 'productId is required' });
      return;
    }

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }

    const item = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (!item) {
      res.status(404).json({ message: 'Item not in cart' });
      return;
    }

    if (item.quantity > 1) {
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity: item.quantity - 1 },
      });
    } else {
      await prisma.cartItem.delete({ where: { id: item.id } });
    }

    const updated = await prisma.cart.findUnique({
      where: { userId },
      include: CART_INCLUDE,
    });

    const items = updated?.items ?? [];
    res.json({ cart: { items, totalPrice: computeTotalPrice(items) } });
  } catch (err) {
    next(err);
  }
}