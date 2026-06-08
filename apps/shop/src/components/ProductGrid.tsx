import type { ProductWithLike } from '@vitamin/types';
import ProductCard from './ProductCard';

interface Props {
  products: ProductWithLike[];
  emptyTitle?: string;
  emptySubtitle?: string;
}

export default function ProductGrid({ products, emptyTitle, emptySubtitle }: Props) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium text-gray-500">
          {emptyTitle ?? 'No products yet.'}
        </p>
        <p className="mt-1 text-sm text-gray-400">
          {emptySubtitle ?? 'Check back soon for new arrivals.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}