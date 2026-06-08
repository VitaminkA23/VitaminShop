import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import type { CreateProductInput, UpdateProductInput } from '@vitamin/types';

export async function getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
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
}

export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { name, description, price, imageUrl, category, stock } =
      req.body as CreateProductInput;

    if (!name || !description || price == null || !imageUrl || !category) {
      res.status(400).json({
        message: 'name, description, price, imageUrl, and category are required',
      });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        imageUrl: imageUrl.trim(),
        category: category.trim(),
        stock: Number(stock ?? 0),
      },
    });

    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description, price, imageUrl, category, stock } =
      req.body as UpdateProductInput;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Validate numeric fields when provided
    if (price != null && (isNaN(Number(price)) || Number(price) < 0)) {
      res.status(400).json({ message: 'price must be a non-negative number' });
      return;
    }
    if (stock != null && (isNaN(Number(stock)) || Number(stock) < 0)) {
      res.status(400).json({ message: 'stock must be a non-negative integer' });
      return;
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name != null && { name: name.trim() }),
        ...(description != null && { description: description.trim() }),
        ...(price != null && { price: Number(price) }),
        ...(imageUrl != null && { imageUrl: imageUrl.trim() }),
        ...(category != null && { category: category.trim() }),
        ...(stock != null && { stock: Math.floor(Number(stock)) }),
      },
    });

    res.json({ product });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Protect order history — if product has been ordered, block hard deletion
    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
      res.status(409).json({
        message:
          'Cannot delete a product that appears in existing orders. Set stock to 0 to hide it instead.',
      });
      return;
    }

    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
}