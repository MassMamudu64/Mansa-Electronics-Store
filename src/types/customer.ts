export interface Customer {
  name: string;
  phone: string;
  city: string;
  address: string;
  email?: string;
}

export const customerInvariants = {
  nameMin: 2,
  phoneRegex: /^\+?[0-9 ()-]{7,}$/,
  cityMin: 2,
  addressMin: 5,
  emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};
