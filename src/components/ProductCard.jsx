'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { cartService } from '@/services/cartService';
import { formatPrice } from '@/lib/money';

export default function ProductCard({ product }) {
  const oos = (product.stock ?? 0) <= 0;
  const lowStock = !oos && (product.stock ?? 0) <= (product.lowStockThreshold ?? 3);
  const image = product.images?.[0]?.url ?? product.image_url ?? '/placeholder.svg';
  const compareAt = product.compareAtPrice ?? product.compare_at_price;
  const price = product.price ?? product.selling_price;
  const savings = compareAt && compareAt > price ? compareAt - price : 0;

  function handleAddToCart(e) {
    e.preventDefault();
    cartService.addProductDirect(product, 1);
    toast.success(`${product.name} added to cart`, { duration: 2000 });
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-product transition-all duration-200 hover:-translate-y-1 hover:shadow-product-hover">
      <Link href={`/product/${product.id}`} className="relative block aspect-square overflow-hidden bg-charcoal-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isBestSeller && (
            <span className="badge badge-dark text-[10px]">Best Seller</span>
          )}
          {savings > 0 && (
            <span className="badge badge-green text-[10px]">
              -{Math.round((savings / compareAt) * 100)}%
            </span>
          )}
        </div>

        {/* Out of stock overlay */}
        {oos && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
            <span className="rounded-full bg-charcoal-900 px-3 py-1 text-xs font-semibold text-white">
              Out of Stock
            </span>
          </div>
        )}

        {/* Quick add — visible on hover */}
        {!oos && (
          <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={handleAddToCart}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-charcoal-900/90 py-2.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-charcoal-900"
            >
              <ShoppingBag size={13} />
              Quick Add
            </button>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-charcoal-400">
          {product.category}
        </p>

        <Link href={`/product/${product.id}`}>
          <h3 className="text-sm font-semibold leading-snug text-charcoal-900 hover:text-charcoal-600">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div>
            <span className="text-base font-extrabold text-charcoal-900">
              {formatPrice(price, product.currency ?? 'USD')}
            </span>
            {savings > 0 && (
              <span className="ml-2 text-xs text-charcoal-400 line-through">
                {formatPrice(compareAt, product.currency ?? 'USD')}
              </span>
            )}
          </div>
          {lowStock && !oos && (
            <span className="badge badge-amber text-[10px]">Low stock</span>
          )}
        </div>
      </div>
    </article>
  );
}
