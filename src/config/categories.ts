// Single source of truth for the product category taxonomy.
// `value` is the canonical string stored in Product.category (DB).
// `label` is the human-readable display string used in dropdowns and chips.
//
// Adding a category here flows through the admin product form, the shop
// filter dropdown, and every place that imports CATEGORIES — no other edits
// required.

export interface CategoryOption {
  readonly value: string;
  readonly label: string;
}

export const CATEGORIES: readonly CategoryOption[] = [
  { value: 'iPhone',      label: 'iPhone' },
  { value: 'Samsung',     label: 'Samsung' },
  { value: 'Chargers',    label: 'Chargers' },
  { value: 'Audio',       label: 'Audio' },
  { value: 'Cases',       label: 'Cases' },
  { value: 'Cables',      label: 'Cables' },
  { value: 'PowerBanks',  label: 'Power Banks' },
  { value: 'Accessories', label: 'Accessories' },
];

export const CATEGORY_VALUES: readonly string[] = CATEGORIES.map((c) => c.value);

export const DEFAULT_CATEGORY = 'Accessories';

export function categoryLabel(value: string | null | undefined): string {
  if (!value) return '';
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
