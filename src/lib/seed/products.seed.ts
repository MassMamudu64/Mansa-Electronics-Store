import type { Product } from '@/types/product';

// Stable IDs preserved from the legacy data/products.json so any cart items in
// existing localStorage continue to resolve after migration.
const now = '2026-04-25T00:00:00.000Z';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface SeedInput {
  id: string;
  category: Product['category'];
  deviceType: Product['deviceType'];
  name: string;
  storage?: string;
  condition?: Product['condition'];
  price: number;
  compareAtPrice?: number;
  stock: number;
  image: string;
  compatibility?: string[];
  bullets?: string[];
  description?: string;
  tags?: string[];
  isBestSeller?: boolean;
  salesCount?: number;
}

function build(input: SeedInput): Product {
  const slugBase = `${input.name}${input.storage && input.storage !== '-' ? `-${input.storage}` : ''}-${input.condition ?? ''}`;
  return {
    id: input.id,
    slug: slugify(slugBase) || slugify(input.name),
    name: input.name.trim(),
    category: input.category,
    deviceType: input.deviceType,
    compatibility: input.compatibility ?? [],
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    currency: 'USD',
    condition: input.condition,
    storage: input.storage && input.storage !== '-' ? input.storage : undefined,
    stock: input.stock,
    lowStockThreshold: 3,
    images: [{ url: input.image, alt: input.name.trim() }],
    description: input.description ?? '',
    bullets: input.bullets ?? [],
    tags: input.tags ?? [],
    isBestSeller: input.isBestSeller ?? false,
    salesCount: input.salesCount ?? 0,
    views7d: 0,
    bundleIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export const seedProducts: Product[] = [
  build({
    id: 'p_001',
    category: 'iPhone',
    deviceType: 'iPhone',
    name: 'iPhone 13 Pro',
    storage: '128GB',
    condition: 'A',
    price: 749,
    compareAtPrice: 999,
    stock: 4,
    image: '/placeholder.svg',
    bullets: ['Battery health 90%+', 'Unlocked, all carriers', '27-point inspection'],
    isBestSeller: true,
    salesCount: 42,
  }),
  build({
    id: 'p_002',
    category: 'iPhone',
    deviceType: 'iPhone',
    name: 'iPhone 13 Pro',
    storage: '256GB',
    condition: 'A',
    price: 829,
    compareAtPrice: 1099,
    stock: 3,
    image: '/placeholder.svg',
    salesCount: 31,
  }),
  build({
    id: 'p_003',
    category: 'iPhone',
    deviceType: 'iPhone',
    name: 'iPhone 13 Pro Max',
    storage: '256GB',
    condition: 'B',
    price: 879,
    compareAtPrice: 1199,
    stock: 2,
    image: '/placeholder.svg',
    salesCount: 18,
  }),
  build({
    id: 'p_004',
    category: 'iPhone',
    deviceType: 'iPhone',
    name: 'iPhone 14 Pro',
    storage: '128GB',
    condition: 'A',
    price: 949.07,
    compareAtPrice: 1199,
    stock: 5,
    image: '/placeholder.svg',
    isBestSeller: true,
    salesCount: 56,
  }),
  build({
    id: 'p_005',
    category: 'iPhone',
    deviceType: 'iPhone',
    name: 'iPhone 14 Pro Max',
    storage: '256GB',
    condition: 'A',
    price: 1149,
    compareAtPrice: 1499,
    stock: 1,
    image: '/placeholder.svg',
    salesCount: 22,
  }),
  build({
    id: 'p_006',
    category: 'iPhone',
    deviceType: 'iPhone',
    name: 'iPhone 12',
    storage: '64GB',
    condition: 'C',
    price: 399,
    compareAtPrice: 699,
    stock: 6,
    image: '/placeholder.svg',
    salesCount: 27,
  }),
  build({
    id: 'p_007',
    category: 'Chargers',
    deviceType: 'Universal',
    name: 'Apple 20W USB-C Charger',
    condition: 'New',
    price: 19,
    stock: 19,
    image: '/placeholder.svg',
    compatibility: ['iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15'],
    bullets: ['Fast charge', 'USB-C output', 'Apple-original'],
    isBestSeller: true,
    salesCount: 84,
  }),
  build({
    id: 'p_008',
    category: 'Cables',
    deviceType: 'Universal',
    name: 'Lightning Cable 1m',
    condition: 'New',
    price: 12,
    stock: 40,
    image: '/placeholder.svg',
    compatibility: ['iPhone 12', 'iPhone 13', 'iPhone 14'],
    salesCount: 110,
  }),
  build({
    id: 'p_009',
    category: 'Audio',
    deviceType: 'iPhone',
    name: 'AirPods Pro (2nd gen)',
    condition: 'A',
    price: 199,
    compareAtPrice: 249,
    stock: 8,
    image: '/placeholder.svg',
    bullets: ['Active noise cancellation', 'MagSafe charging case'],
    isBestSeller: true,
    salesCount: 47,
  }),
  build({
    id: 'p_a4651fb5',
    category: 'iPhone',
    deviceType: 'iPhone',
    name: 'iPhone 17 Pro Max',
    storage: '2TB',
    condition: 'A',
    price: 1400,
    compareAtPrice: 1799,
    stock: 4,
    image: '/Apple-iPhone-13-Pro-Unlocked.png',
    salesCount: 9,
  }),
];
