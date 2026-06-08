import { serverApiFetch } from '../lib/serverApi';
import ProductGrid from '../components/ProductGrid';
import type { ProductsResponse } from '@vitamin/types';

export default async function HomePage() {
  let products: ProductsResponse['products'] = [];

  try {
    const data = await serverApiFetch<ProductsResponse>('/api/products');
    products = data.products;
  } catch {
    // Products failed to load — show empty state rather than crashing
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Our Products</h1>
        <p className="mt-1 text-sm text-gray-500">
          Premium vitamins and supplements, delivered to your door.
        </p>
      </div>
      <ProductGrid products={products} />
    </main>
  );
}