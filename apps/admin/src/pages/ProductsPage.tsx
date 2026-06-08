import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { CreateProductInput, Product, UpdateProductInput } from '@vitamin/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'create' | 'edit';

const EMPTY_FORM: CreateProductInput = {
  name: '',
  description: '',
  price: 0,
  imageUrl: '',
  category: '',
  stock: 0,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
}

function Field({ label, error, ...rest }: FieldProps) {
  return (
    <div>
      <label htmlFor={rest.name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={rest.name}
        {...rest}
        className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-400'
            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface DeleteConfirmProps {
  product: Product;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function DeleteConfirmModal({ product, onConfirm, onCancel, loading }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">Delete product?</h3>
        <p className="mt-2 text-sm text-gray-500">
          <span className="font-medium text-gray-800">{product.name}</span> will be permanently
          removed. Products with existing orders cannot be deleted.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────

interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
  stock?: string;
  imageUrl?: string;
  category?: string;
}

function validate(form: CreateProductInput): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!form.description.trim()) errors.description = 'Description is required';
  if (form.price <= 0) errors.price = 'Price must be greater than 0';
  if (form.stock < 0) errors.stock = 'Stock cannot be negative';
  if (!form.imageUrl.trim()) errors.imageUrl = 'Image URL is required';
  if (!form.category.trim()) errors.category = 'Category is required';
  return errors;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // Create / edit form state
  const [mode, setMode] = useState<Mode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateProductInput>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Delete
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  // ── Data fetching ──

  async function fetchProducts() {
    setListLoading(true);
    try {
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data.products);
    } catch {
      // table stays empty
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Form helpers ──

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value,
    }));
    // Clear the field error on change
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function resetForm() {
    setMode('create');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormFeedback(null);
  }

  function startEdit(product: Product) {
    setMode('edit');
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
      stock: product.stock,
    });
    setFormErrors({});
    setFormFeedback(null);
    // Scroll to form
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  // ── Submit (create or edit) ──

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormFeedback(null);

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      let res: Response;
      if (mode === 'create') {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        });
      } else {
        const body: UpdateProductInput = {
          name: form.name,
          description: form.description,
          price: form.price,
          imageUrl: form.imageUrl,
          category: form.category,
          stock: form.stock,
        };
        res = await fetch(`/api/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Request failed');

      setFormFeedback({
        type: 'success',
        message: mode === 'create' ? 'Product created successfully.' : 'Product updated.',
      });

      if (mode === 'create') {
        setForm(EMPTY_FORM);
      }
      await fetchProducts();
    } catch (err) {
      setFormFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete ──

  async function confirmDelete() {
    if (!deletingProduct) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Delete failed');
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleteLoading(false);
      setDeletingProduct(null);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <>
      {deletingProduct && (
        <DeleteConfirmModal
          product={deletingProduct}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingProduct(null)}
          loading={deleteLoading}
        />
      )}

      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white px-6 py-4 shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold text-indigo-600">Vitamin Admin</h1>
              <nav className="flex items-center gap-1">
                <a href="/dashboard" className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100">
                  Dashboard
                </a>
                <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
                  Products
                </span>
                <a href="/orders" className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100">
                  Orders
                </a>
              </nav>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-gray-800 px-4 py-1.5 text-sm text-white transition-colors hover:bg-gray-700"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-10">
          <h2 className="mb-8 text-2xl font-semibold text-gray-900">Products</h2>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">

            {/* ── Form panel ── */}
            <div className="lg:col-span-2" ref={formRef}>
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">
                    {mode === 'create' ? 'Add New Product' : 'Edit Product'}
                  </h3>
                  {mode === 'edit' && (
                    <button
                      onClick={resetForm}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      ✕ Cancel edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <Field
                    label="Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    error={formErrors.name}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      required
                      rows={3}
                      className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                        formErrors.description
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-400'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                      }`}
                    />
                    {formErrors.description && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.description}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Price ($)"
                      name="price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      required
                      error={formErrors.price}
                    />
                    <Field
                      label="Stock"
                      name="stock"
                      type="number"
                      min="0"
                      step="1"
                      value={form.stock}
                      onChange={handleChange}
                      required
                      error={formErrors.stock}
                    />
                  </div>
                  <Field
                    label="Image URL"
                    name="imageUrl"
                    type="url"
                    value={form.imageUrl}
                    onChange={handleChange}
                    required
                    error={formErrors.imageUrl}
                  />
                  <Field
                    label="Category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    error={formErrors.category}
                  />

                  {formFeedback && (
                    <p
                      className={`rounded-lg px-3 py-2 text-sm ${
                        formFeedback.type === 'success'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {formFeedback.message}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {submitting
                      ? 'Saving…'
                      : mode === 'create'
                        ? 'Create Product'
                        : 'Save Changes'}
                  </button>
                </form>
              </div>
            </div>

            {/* ── Product table ── */}
            <div className="lg:col-span-3">
              <div className="rounded-xl border bg-white shadow-sm">
                <div className="flex items-center justify-between border-b px-6 py-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    Catalog{' '}
                    <span className="ml-1 text-sm font-normal text-gray-500">
                      ({products.length})
                    </span>
                  </h3>
                  <button
                    onClick={fetchProducts}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Refresh
                  </button>
                </div>

                {listLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="px-6 py-12 text-center text-sm text-gray-400">
                    No products yet. Add one using the form.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          <th className="px-6 py-3">Product</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3 text-right">Price</th>
                          <th className="px-4 py-3 text-right">Stock</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {products.map((p) => (
                          <tr
                            key={p.id}
                            className={`transition-colors hover:bg-gray-50 ${
                              editingId === p.id ? 'bg-indigo-50' : ''
                            }`}
                          >
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                                />
                                <div>
                                  <p className="font-medium text-gray-900">{p.name}</p>
                                  <p className="line-clamp-1 text-xs text-gray-400">
                                    {p.description}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                                {p.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900">
                              ${p.price.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`font-medium ${p.stock === 0 ? 'text-red-500' : 'text-gray-700'}`}
                              >
                                {p.stock}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => startEdit(p)}
                                  className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeletingProduct(p)}
                                  className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}