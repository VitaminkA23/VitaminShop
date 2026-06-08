import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export async function getAdminStats(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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
}