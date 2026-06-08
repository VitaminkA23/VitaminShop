import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export async function toggleLike(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id: productId } = req.params;

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
}