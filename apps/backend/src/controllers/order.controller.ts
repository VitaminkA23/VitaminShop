import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import type { ShippingAddressSnapshot, OrderStatus } from '@vitamin/types';

const ORDER_ITEM_INCLUDE = {
  product: {
    select: { id: true, name: true, imageUrl: true, price: true },
  },
} as const;

const ORDER_INCLUDE = {
  items: { include: ORDER_ITEM_INCLUDE, orderBy: { id: 'asc' as const } },
} as const;

function parseOrder(order: {
  shippingAddress: string;
  [key: string]: unknown;
  items: unknown[];
}) {
  return {
    ...order,
    shippingAddress: JSON.parse(order.shippingAddress) as ShippingAddressSnapshot,
  };
}

// ─── User: checkout ───────────────────────────────────────────────────────────

export async function checkout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.user!;
    const { addressId, paymentMethodId } = req.body as {
      addressId?: string;
      paymentMethodId?: string;
    };

    if (!addressId || !paymentMethodId) {
      res.status(400).json({ message: 'addressId and paymentMethodId are required' });
      return;
    }

    const order = await prisma.$transaction(
      async (tx) => {
        // 1. Fetch the user's cart
        const cart = await tx.cart.findUnique({
          where: { userId },
          include: {
            items: {
              include: { product: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        });

        if (!cart || cart.items.length === 0) {
          throw Object.assign(new Error('Your cart is empty'), { code: 'EMPTY_CART' });
        }

        // 2. Validate address ownership
        const address = await tx.address.findUnique({ where: { id: addressId } });
        if (!address || address.userId !== userId) {
          throw Object.assign(new Error('Invalid shipping address'), {
            code: 'INVALID_ADDRESS',
          });
        }

        // 3. Validate payment method ownership
        const pm = await tx.paymentMethod.findUnique({ where: { id: paymentMethodId } });
        if (!pm || pm.userId !== userId) {
          throw Object.assign(new Error('Invalid payment method'), {
            code: 'INVALID_PAYMENT',
          });
        }

        // 4. Atomic stock check + decrement per item (prevents overselling under concurrency).
        //    updateMany returns { count } — if count === 0 the WHERE clause didn't match,
        //    meaning stock was insufficient.
        for (const item of cart.items) {
          const result = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });

          if (result.count === 0) {
            throw Object.assign(
              new Error(`Insufficient stock for "${item.product.name}"`),
              { code: 'INSUFFICIENT_STOCK', productName: item.product.name },
            );
          }
        }

        // 5. Compute total using prices captured at cart time (server-side, not client-side)
        const totalAmount = cart.items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0,
        );

        // 6. Mock payment gateway — in production replace with Stripe/Braintree call
        const paymentSucceeded = true; // simulated successful charge
        if (!paymentSucceeded) {
          throw Object.assign(new Error('Payment processing failed'), {
            code: 'PAYMENT_FAILED',
          });
        }

        // 7. Snapshot the shipping address at purchase time
        const shippingSnapshot: ShippingAddressSnapshot = {
          street: address.street,
          city: address.city,
          postalCode: address.postalCode,
          country: address.country,
        };

        // 8. Persist order + order items
        const created = await tx.order.create({
          data: {
            userId,
            status: 'PAID',
            totalAmount,
            shippingAddress: JSON.stringify(shippingSnapshot),
            items: {
              create: cart.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                priceAtPurchase: item.product.price,
              })),
            },
          },
          include: ORDER_INCLUDE,
        });

        // 9. Clear the cart
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

        return created;
      },
      { isolationLevel: 'RepeatableRead' },
    );

    res.status(201).json({ order: parseOrder(order as Parameters<typeof parseOrder>[0]) });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err) {
      const e = err as { code: string; message: string };
      const statusMap: Record<string, number> = {
        EMPTY_CART: 400,
        INVALID_ADDRESS: 400,
        INVALID_PAYMENT: 400,
        INSUFFICIENT_STOCK: 409,
        PAYMENT_FAILED: 402,
      };
      const status = statusMap[e.code] ?? 500;
      if (status !== 500) {
        res.status(status).json({ message: e.message });
        return;
      }
    }
    next(err);
  }
}

// ─── User: order history ──────────────────────────────────────────────────────

export async function getOrders(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.user!;
    const orders = await prisma.order.findMany({
      where: { userId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders: orders.map((o) => parseOrder(o as Parameters<typeof parseOrder>[0])) });
  } catch (err) {
    next(err);
  }
}

export async function getOrderById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Users can only fetch their own orders; admins can fetch any
    if (role !== 'ADMIN' && order.userId !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.json({ order: parseOrder(order as Parameters<typeof parseOrder>[0]) });
  } catch (err) {
    next(err);
  }
}

// ─── Admin: all orders ────────────────────────────────────────────────────────

export async function getAllOrders(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orders = await prisma.order.findMany({
      include: {
        ...ORDER_INCLUDE,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders: orders.map((o) => parseOrder(o as Parameters<typeof parseOrder>[0])) });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };

    const valid: string[] = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!status || !valid.includes(status)) {
      res.status(400).json({
        message: `status must be one of: ${valid.join(', ')}`,
      });
      return;
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus },
      include: {
        ...ORDER_INCLUDE,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ order: parseOrder(order as Parameters<typeof parseOrder>[0]) });
  } catch (err) {
    next(err);
  }
}