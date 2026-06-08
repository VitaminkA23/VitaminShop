'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import type {
  Address,
  PaymentMethod,
  AddAddressInput,
  AddPaymentMethodInput,
  AddressesResponse,
  AddressResponse,
  PaymentMethodsResponse,
  PaymentMethodResponse,
} from '@vitamin/types';

// ─── Card number utilities ────────────────────────────────────────────────────

function luhn(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function formatCardNumber(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function cardBrandLabel(brand: string): string {
  if (brand === 'visa') return 'Visa';
  if (brand === 'mastercard') return 'Mastercard';
  return 'Card';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-lg font-semibold text-gray-900">{children}</h2>;
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-gray-400">{text}</p>;
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [addrForm, setAddrForm] = useState<AddAddressInput>({
    street: '',
    city: '',
    postalCode: '',
    country: '',
    isDefault: false,
  });
  const [addrSubmitting, setAddrSubmitting] = useState(false);
  const [addrError, setAddrError] = useState<string | null>(null);
  const [addrSuccess, setAddrSuccess] = useState(false);

  const [cardDisplay, setCardDisplay] = useState('');
  const [pmForm, setPmForm] = useState<AddPaymentMethodInput & { expiry: string }>({
    cardNumber: '',
    expMonth: 0,
    expYear: 0,
    expiry: '',
    isDefault: false,
  });
  const [pmError, setPmError] = useState<string | null>(null);
  const [pmSubmitting, setPmSubmitting] = useState(false);
  const [pmSuccess, setPmSuccess] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      const data = await apiFetch<AddressesResponse>('/api/profile/addresses');
      setAddresses(data.addresses);
    } catch { /* silently ignore */ }
  }, []);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const data = await apiFetch<PaymentMethodsResponse>('/api/profile/payment-methods');
      setPaymentMethods(data.paymentMethods);
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => {
    fetchAddresses();
    fetchPaymentMethods();
  }, [fetchAddresses, fetchPaymentMethods]);

  // ── Address form ────────────────────────────────────────────────────────────

  async function handleAddressSubmit(e: FormEvent) {
    e.preventDefault();
    setAddrError(null);
    setAddrSuccess(false);
    setAddrSubmitting(true);
    try {
      const data = await apiFetch<AddressResponse>('/api/profile/address', {
        method: 'POST',
        body: JSON.stringify(addrForm),
      });
      setAddresses((prev) =>
        addrForm.isDefault
          ? [data.address, ...prev.map((a) => ({ ...a, isDefault: false }))]
          : [...prev, data.address],
      );
      setAddrForm({ street: '', city: '', postalCode: '', country: '', isDefault: false });
      setAddrSuccess(true);
    } catch (err) {
      setAddrError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setAddrSubmitting(false);
    }
  }

  // ── Payment method form ─────────────────────────────────────────────────────

  function handleCardInput(raw: string) {
    const formatted = formatCardNumber(raw);
    setCardDisplay(formatted);
    setPmForm((prev) => ({ ...prev, cardNumber: formatted.replace(/\s/g, '') }));
  }

  function handleExpiryInput(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    const month = parseInt(digits.slice(0, 2), 10);
    const year = digits.length === 4 ? 2000 + parseInt(digits.slice(2), 10) : 0;
    setPmForm((prev) => ({ ...prev, expiry: formatted, expMonth: month, expYear: year }));
  }

  function validateCard(): string | null {
    const digits = pmForm.cardNumber.replace(/\D/g, '');
    if (digits.length !== 16) return 'Card number must be 16 digits';
    if (!luhn(digits)) return 'Invalid card number';
    if (!pmForm.expMonth || pmForm.expMonth < 1 || pmForm.expMonth > 12) return 'Invalid expiry';
    if (!pmForm.expYear) return 'Invalid expiry year';
    const now = new Date();
    if (
      pmForm.expYear < now.getFullYear() ||
      (pmForm.expYear === now.getFullYear() && pmForm.expMonth < now.getMonth() + 1)
    ) return 'Card has expired';
    return null;
  }

  async function handlePaymentSubmit(e: FormEvent) {
    e.preventDefault();
    setPmError(null);
    setPmSuccess(false);
    const clientError = validateCard();
    if (clientError) { setPmError(clientError); return; }
    setPmSubmitting(true);
    try {
      const data = await apiFetch<PaymentMethodResponse>('/api/profile/payment-method', {
        method: 'POST',
        body: JSON.stringify({
          cardNumber: pmForm.cardNumber,
          expMonth: pmForm.expMonth,
          expYear: pmForm.expYear,
          isDefault: pmForm.isDefault,
        } satisfies AddPaymentMethodInput),
      });
      setPaymentMethods((prev) =>
        pmForm.isDefault
          ? [data.paymentMethod, ...prev.map((p) => ({ ...p, isDefault: false }))]
          : [...prev, data.paymentMethod],
      );
      setCardDisplay('');
      setPmForm({ cardNumber: '', expMonth: 0, expYear: 0, expiry: '', isDefault: false });
      setPmSuccess(true);
    } catch (err) {
      setPmError(err instanceof Error ? err.message : 'Failed to save card');
    } finally {
      setPmSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-700">← Back to shop</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* ── Shipping Addresses ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <SectionTitle>Shipping Addresses</SectionTitle>

            {addresses.length === 0 ? (
              <EmptyState text="No saved addresses yet." />
            ) : (
              <ul className="mb-4 space-y-3">
                {addresses.map((addr) => (
                  <li
                    key={addr.id}
                    className={`rounded-xl border p-3 text-sm ${addr.isDefault ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{addr.street}</p>
                        <p className="text-gray-500">{addr.city}, {addr.postalCode}</p>
                        <p className="text-gray-500">{addr.country}</p>
                      </div>
                      {addr.isDefault && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Default
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleAddressSubmit} className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium text-gray-700">Add new address</p>
              <input
                required
                placeholder="Street address"
                value={addrForm.street}
                onChange={(e) => setAddrForm((p) => ({ ...p, street: e.target.value }))}
                className="input-field"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="City"
                  value={addrForm.city}
                  onChange={(e) => setAddrForm((p) => ({ ...p, city: e.target.value }))}
                  className="input-field"
                />
                <input
                  required
                  placeholder="Postal code"
                  value={addrForm.postalCode}
                  onChange={(e) => setAddrForm((p) => ({ ...p, postalCode: e.target.value }))}
                  className="input-field"
                />
              </div>
              <input
                required
                placeholder="Country"
                value={addrForm.country}
                onChange={(e) => setAddrForm((p) => ({ ...p, country: e.target.value }))}
                className="input-field"
              />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={addrForm.isDefault ?? false}
                  onChange={(e) => setAddrForm((p) => ({ ...p, isDefault: e.target.checked }))}
                  className="rounded"
                />
                Set as default
              </label>
              {addrError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{addrError}</p>}
              {addrSuccess && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Address saved.</p>}
              <button
                type="submit"
                disabled={addrSubmitting}
                className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
              >
                {addrSubmitting ? 'Saving…' : 'Save Address'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Payment Methods ────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <SectionTitle>Payment Methods</SectionTitle>
            <p className="mb-4 text-xs text-gray-400">
              We store only the last 4 digits and card brand. CVV is never stored.
            </p>

            {paymentMethods.length === 0 ? (
              <EmptyState text="No saved payment methods yet." />
            ) : (
              <ul className="mb-4 space-y-3">
                {paymentMethods.map((pm) => (
                  <li
                    key={pm.id}
                    className={`flex items-center justify-between rounded-xl border p-3 text-sm ${pm.isDefault ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{pm.cardBrand === 'visa' ? '💳' : pm.cardBrand === 'mastercard' ? '🔵' : '💳'}</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {cardBrandLabel(pm.cardBrand)} •••• {pm.last4}
                        </p>
                        <p className="text-gray-500">
                          Expires {String(pm.expMonth).padStart(2, '0')}/{pm.expYear}
                        </p>
                      </div>
                    </div>
                    {pm.isDefault && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Default
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handlePaymentSubmit} className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium text-gray-700">Add test card</p>
              <div>
                <input
                  required
                  placeholder="Card number (16 digits)"
                  value={cardDisplay}
                  onChange={(e) => handleCardInput(e.target.value)}
                  maxLength={19}
                  inputMode="numeric"
                  className="input-field font-mono tracking-widest"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Try: 4111 1111 1111 1111 (Visa) or 5500 0055 5555 5559 (Mastercard)
                </p>
              </div>
              <input
                required
                placeholder="MM/YY"
                value={pmForm.expiry}
                onChange={(e) => handleExpiryInput(e.target.value)}
                maxLength={5}
                inputMode="numeric"
                className="input-field w-32 font-mono"
              />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={pmForm.isDefault ?? false}
                  onChange={(e) => setPmForm((p) => ({ ...p, isDefault: e.target.checked }))}
                  className="rounded"
                />
                Set as default
              </label>
              {pmError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{pmError}</p>}
              {pmSuccess && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Card saved.</p>}
              <button
                type="submit"
                disabled={pmSubmitting}
                className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
              >
                {pmSubmitting ? 'Saving…' : 'Save Card'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}