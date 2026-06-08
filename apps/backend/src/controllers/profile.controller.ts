import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import type { AddAddressInput, AddPaymentMethodInput } from '@vitamin/types';

// ─── Addresses ────────────────────────────────────────────────────────────────

export async function getAddresses(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.user!;
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    res.json({ addresses });
  } catch (err) {
    next(err);
  }
}

export async function addAddress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.user!;
    const { street, city, postalCode, country, isDefault = false } =
      req.body as AddAddressInput;

    if (!street?.trim() || !city?.trim() || !postalCode?.trim() || !country?.trim()) {
      res.status(400).json({ message: 'street, city, postalCode, and country are required' });
      return;
    }

    const existingCount = await prisma.address.count({ where: { userId } });
    const makeDefault = isDefault || existingCount === 0;

    if (makeDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        street: street.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        isDefault: makeDefault,
      },
    });

    res.status(201).json({ address });
  } catch (err) {
    next(err);
  }
}

// ─── Payment Methods ──────────────────────────────────────────────────────────

function luhnCheck(digits: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function detectBrand(digits: string): string {
  if (/^4/.test(digits)) return 'visa';
  if (/^5[1-5]/.test(digits) || /^2(2[2-9][1-9]|[3-6]\d{2}|7[01]\d|720)/.test(digits))
    return 'mastercard';
  return 'other';
}

export async function getPaymentMethods(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.user!;
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    res.json({ paymentMethods });
  } catch (err) {
    next(err);
  }
}

export async function addPaymentMethod(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.user!;
    const { cardNumber, expMonth, expYear, isDefault = false } =
      req.body as AddPaymentMethodInput;

    if (!cardNumber) {
      res.status(400).json({ message: 'cardNumber is required' });
      return;
    }

    const digits = String(cardNumber).replace(/\D/g, '');

    if (digits.length !== 16) {
      res.status(400).json({ message: 'Card number must be 16 digits' });
      return;
    }

    if (!luhnCheck(digits)) {
      res.status(400).json({ message: 'Invalid card number' });
      return;
    }

    const monthNum = Number(expMonth);
    const yearNum = Number(expYear);

    if (!monthNum || monthNum < 1 || monthNum > 12) {
      res.status(400).json({ message: 'Invalid expiry month (1–12)' });
      return;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (
      yearNum < currentYear ||
      (yearNum === currentYear && monthNum < currentMonth)
    ) {
      res.status(400).json({ message: 'Card has expired' });
      return;
    }

    const cardBrand = detectBrand(digits);
    const last4 = digits.slice(-4);

    const existingCount = await prisma.paymentMethod.count({ where: { userId } });
    const makeDefault = isDefault || existingCount === 0;

    if (makeDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const paymentMethod = await prisma.paymentMethod.create({
      data: { userId, cardBrand, last4, expMonth: monthNum, expYear: yearNum, isDefault: makeDefault },
    });

    res.status(201).json({ paymentMethod });
  } catch (err) {
    next(err);
  }
}