'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShoppingBag, ChevronLeft, ShieldCheck, Truck, RotateCcw, Minus, Plus } from 'lucide-react';
import { cartService } from '@/services/cartService';
import { formatPrice } from '@/lib/money';
import ProductCard from '@/components/ProductCard';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error('Product not found');
      const data = await res.json();
      return data.product ?? data;
    },
    enabled: !!id,
  });

  // Read inventory status from the inventory API
  const { data: inventory } = useQuery({
    queryKey: ['inventory', product?.sku ?? product?.id],
    queryFn: async () => {
      const key = product?.sku ?? product?.id;
      const res = await fetch(`/api/inventory/${key}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!product,
  });

  const { data: related = [] } = useQuery({
    queryKey: ['products', 'related', product?.category],
    queryFn: async () => {
      const res = await fetch(`/api/products?category=${product.category}&limit=4`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.products ?? data).filter((p) => p.id !== id).slice(0, 4);
    },
    enabled: !!product?.category,
  });

  if (isLoading) {
    return (
      <div className="container-site py-16">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-3xl bg-charcoal-100" />
          <div className="space-y-4">
            <div className="h-6 w-1/3 animate-pulse rounded-full bg-charcoal-100" />
            <div className="h-10 animate-pulse rounded-xl bg-charcoal-100" />
            <div className="h-8 w-1/4 animate-pulse rounded-full bg-charcoal-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-site py-24 text-center">
        <p className="text-2xl font-black text-charcoal-300">Product not found</p>
        <Link href="/shop" className="mt-6 btn-secondary inline-flex">
          Back to Shop
        </Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [{ url: product.image_url ?? '/placeholder.svg', alt: product.name }];
  const price = product.price ?? product.selling_price;
  const compareAt = product.compareAtPrice ?? product.compare_at_price;
  const savings = compareAt && compareAt > price ? compareAt - price : 0;

  // Prefer live inventory data; fall back to product.stock
  const stockQty = inventory?.stock_quantity ?? inventory?.quantity ?? product.stock ?? 0;
  const stockStatus = inventory?.availability_status ?? (stockQty <= 0 ? 'out_of_stock' : stockQty <= 3 ? 'low_stock' : 'in_stock');
  const oos = stockStatus === 'out_of_stock' || stockQty <= 0;
  const lowStock = !oos && (stockStatus === 'low_stock' || stockQty <= 3);

  const maxQty = Math.min(stockQty, 10);

  function handleAddToCart() {
    if (oos) return;
    cartService.addProductDirect({ ...product, stock: stockQty }, qty);
    toast.success(`${product.name} added to cart`, {
      description: `Qty: ${qty}`,
      duration: 2500,
    });
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container-site py-8">
        {/* Breadcrumb */}
        <Link
          href="/shop"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-900"
        >
          <ChevronLeft size={15} />
          Back to Shop
        </Link>

        <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
          {/* Image gallery */}
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-3xl bg-charcoal-50 aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[activeImg]?.url ?? '/placeholder.svg'}
                alt={images[activeImg]?.alt ?? product.name}
                className="h-full w-full object-cover"
              />
              {oos && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                  <span className="rounded-full bg-charcoal-900 px-4 py-2 text-sm font-semibold text-white">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      i === activeImg ? 'border-charcoal-900' : 'border-transparent hover:border-charcoal-200'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col">
            <p className="eyebrow mb-3">{product.category}{product.brand ? ` · ${product.brand}` : ''}</p>

            <h1 className="text-3xl font-black leading-tight tracking-tight text-charcoal-900 md:text-4xl">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-charcoal-900">
                {formatPrice(price, product.currency ?? 'USD')}
              </span>
              {savings > 0 && (
                <>
                  <span className="text-lg text-charcoal-400 line-through">
                    {formatPrice(compareAt, product.currency ?? 'USD')}
                  </span>
                  <span className="badge badge-green">
                    Save {Math.round((savings / compareAt) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Stock status */}
            <div className="mt-3">
              {oos ? (
                <span className="badge badge-red">Out of Stock</span>
              ) : lowStock ? (
                <span className="badge badge-amber">Only {stockQty} left</span>
              ) : (
                <span className="badge badge-green">In Stock</span>
              )}
            </div>

            {/* SKU */}
            {product.sku && (
              <p className="mt-2 text-xs text-charcoal-400">SKU: {product.sku}</p>
            )}

            <div className="my-5 border-t border-charcoal-100" />

            {/* Description */}
            {product.description && (
              <p className="text-sm leading-relaxed text-charcoal-600">{product.description}</p>
            )}

            {/* Bullets */}
            {product.bullets?.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {product.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-charcoal-700">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-charcoal-900" />
                    {b}
                  </li>
                ))}
              </ul>
            )}

            {/* Compatibility */}
            {product.compatibility?.length > 0 && (
              <p className="mt-4 text-xs text-charcoal-500">
                Compatible with: {product.compatibility.join(', ')}
              </p>
            )}

            <div className="my-5 border-t border-charcoal-100" />

            {/* Quantity + Add to cart */}
            {!oos && (
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-xl border border-charcoal-200 overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex h-11 w-11 items-center justify-center text-charcoal-700 transition hover:bg-charcoal-50"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-charcoal-900">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    className="flex h-11 w-11 items-center justify-center text-charcoal-700 transition hover:bg-charcoal-50"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={oos}
                  className="btn-primary flex-1 gap-2 py-3"
                >
                  <ShoppingBag size={16} />
                  Add to Cart
                </button>
              </div>
            )}

            {oos && (
              <button disabled className="btn-secondary w-full cursor-not-allowed opacity-50 py-3">
                Out of Stock
              </button>
            )}

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Free Delivery', sub: 'Orders over $50' },
                { icon: ShieldCheck, label: 'Secure', sub: 'Encrypted checkout' },
                { icon: RotateCcw, label: '30-day Returns', sub: 'Hassle-free' },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-charcoal-100 p-3 text-center"
                >
                  <Icon size={16} className="text-charcoal-700" />
                  <p className="text-[11px] font-semibold text-charcoal-800">{label}</p>
                  <p className="text-[10px] text-charcoal-500">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-20 border-t border-charcoal-100 pt-16">
            <h2 className="mb-8 text-2xl font-black tracking-tight text-charcoal-900">
              You might also like
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
