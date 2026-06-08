// Role is implemented as a const object + union type for maximum compatibility
// with Prisma's generated types (both resolve to the same string union at runtime).
export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicUser = Omit<User, 'createdAt' | 'updatedAt'>;

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  createdAt: Date;
}

export interface ProductWithLike extends Product {
  liked: boolean;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalPrice: number;
}

// ─── Order status ────────────────────────────────────────────────────────────

export const OrderStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Address {
  id: string;
  userId: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// SECURITY: never exposes full PAN or CVV — only brand, last4, and expiry.
export interface PaymentMethod {
  id: string;
  userId: string;
  cardBrand: string; // "visa" | "mastercard" | "other"
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface AddAddressInput {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

// SECURITY: frontend sends full card number only in transit;
// backend extracts last4 + brand and discards the PAN immediately.
export interface AddPaymentMethodInput {
  cardNumber: string;
  expMonth: number;
  expYear: number;
  isDefault?: boolean;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface ShippingAddressSnapshot {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Pick<Product, 'id' | 'name' | 'imageUrl' | 'price'>;
  quantity: number;
  priceAtPurchase: number;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: ShippingAddressSnapshot;
  items: OrderItem[];
  createdAt: Date;
}

export interface OrderWithUser extends Order {
  user: Pick<PublicUser, 'id' | 'name' | 'email'>;
}

export interface CheckoutInput {
  addressId: string;
  paymentMethodId: string;
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface ProductsResponse {
  products: ProductWithLike[];
}

export interface ProductResponse {
  product: Product;
}

export interface ToggleLikeResponse {
  liked: boolean;
}

export interface CartApiResponse {
  cart: Cart;
}

export interface AddressesResponse {
  addresses: Address[];
}

export interface AddressResponse {
  address: Address;
}

export interface PaymentMethodsResponse {
  paymentMethods: PaymentMethod[];
}

export interface PaymentMethodResponse {
  paymentMethod: PaymentMethod;
}

export interface OrdersResponse {
  orders: Order[];
}

export interface OrderResponse {
  order: Order;
}

export interface AdminOrdersResponse {
  orders: OrderWithUser[];
}

export interface ApiError {
  message: string;
  code?: string;
}

// ─── Admin ─────────────────────────────────────────────────────────────────────

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  category?: string;
  stock?: number;
}

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  outOfStockCount: number;
  totalUsers: number;
}

export interface AdminStatsResponse {
  stats: AdminStats;
}