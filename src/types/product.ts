export type DeviceType = 'iPhone' | 'Android' | 'Laptop' | 'Universal';

export type Category =
  | 'iPhone'
  | 'Samsung'
  | 'Android'
  | 'Accessories'
  | 'Cases'
  | 'Chargers'
  | 'Cables'
  | 'Audio'
  | 'PowerBanks'
  | 'LaptopGear';

export type Condition = 'New' | 'A' | 'B' | 'C';

export interface ProductImage {
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: Category;
  deviceType: DeviceType;
  compatibility: string[];

  price: number;
  compareAtPrice?: number;
  currency: 'USD' | 'XOF' | 'EUR';

  condition?: Condition;
  storage?: string;

  stock: number;
  lowStockThreshold: number;

  images: ProductImage[];
  description: string;
  bullets: string[];

  tags: string[];
  isBestSeller: boolean;
  salesCount: number;
  views7d: number;

  bundleIds: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export const productInvariants = {
  nameMinLength: 3,
  pricePositive: (p: number) => p >= 0,
  stockPositive: (s: number) => Number.isInteger(s) && s >= 0,
  imagesRequired: (imgs: ProductImage[]) => imgs.length >= 1,
  slugFormat: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};
