// Types derived from Prisma schema and frontend data structures

export type BookBadge = '2x1' | 'Oferta' | 'Últimas unidades' | string;

export interface Book {
  id: string;
  isbn: string;
  title: string;
  originalTitle: string | null;
  googleBooksId: string | null;
  authors: { id: string; name: string }[];
  synopsis: string | null;
  coverUrl: string | null;
  price: string;          // Decimal represented as string in JSON/API response
  stock: number;
  badge: BookBadge | null;
  genre: string | null;
  isActive: boolean;
  publishedDate: string | null;
  language: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BooksListResponse {
  data: Book[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

// ---- Cart ----

export type ProductType = 'BOOK' | 'ACCESSORY' | 'COMBO';

export interface CartItem {
  id: string;
  type: ProductType;
  title: string;
  author?: string;
  coverUrl: string | null;
  price: string;          // Snapshot of the price at the time of adding
  quantity: number;
  stock?: number;         // Max stock limit
}

// ---- Checkout ----

export interface ShippingFormData {
  postalCode: string;
  address: string;
}

export interface CustomerFormData {
  customerName: string;
  customerEmail: string;
  customerDni: string;
  customerPhone: string;
}

export type CheckoutFormData = ShippingFormData & CustomerFormData;

// ---- API Request / Response ----

export interface OrderLeadItem {
  id: string;
  type: ProductType;
  title: string;
  quantity: number;
  unitPrice: string;
  coverUrl?: string | null;
}

export interface CreateOrderLeadPayload {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerDni: string;
  postalCode?: string;
  address?: string;
  items: OrderLeadItem[];
  totalAmount: string;
}

export type OrderStatus = 'PENDING_WHATSAPP' | 'CONFIRMED' | 'CANCELLED';

export interface OrderLeadResponse {
  id: string;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderLead {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerDni: string;
  postalCode: string | null;
  address: string | null;
  items: OrderLeadItem[];
  totalAmount: string;
  status: OrderStatus;
  createdAt: string;
}

export interface UpdateBookPayload {
  title?: string;
  originalTitle?: string | null;
  googleBooksId?: string | null;
  authors?: string[];
  synopsis?: string | null;
  coverUrl?: string | null;
  price?: number;
  stock?: number;
  badge?: string | null;
  genre?: string | null;
  publishedDate?: string | null;
  language?: string | null;
  isActive?: boolean;
}

export type AccessoryCategory = 'VELAS' | 'SEPARADORES' | 'TRES_D';

export interface Accessory {
  id: string;
  title: string;
  description: string | null;
  price: string;
  stock: number;
  category: AccessoryCategory;
  coverUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccessoriesListResponse {
  data: Accessory[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface CreateAccessoryPayload {
  title: string;
  description?: string;
  price: number;
  stock: number;
  category: AccessoryCategory;
  coverUrl?: string | null;
  isActive?: boolean;
}

export type UpdateAccessoryPayload = Partial<CreateAccessoryPayload>;

export interface ComboBookRelation {
  bookId: string;
  quantity: number;
  book: Book;
}

export interface ComboAccessoryRelation {
  accessoryId: string;
  quantity: number;
  accessory: Accessory;
}

export interface Combo {
  id: string;
  title: string;
  description: string | null;
  price: string;
  coverUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  books: ComboBookRelation[];
  accessories: ComboAccessoryRelation[];
}

export interface CombosListResponse {
  data: Combo[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface CreateComboPayload {
  title: string;
  description?: string;
  price: number;
  coverUrl?: string | null;
  isActive?: boolean;
  books?: { bookId: string; quantity: number }[];
  accessories?: { accessoryId: string; quantity: number }[];
}

export type UpdateComboPayload = Partial<CreateComboPayload>;

export interface StoreConfig {
  id: string;
  whatsappPhone: string;
  instagramUrl: string;
  shippingCost: string;
  freeShippingMin: string;
  bannerMessage: string | null;
  isStoreOpen: boolean;
  updatedAt: string;
}

export interface UpdateConfigPayload {
  whatsappPhone?: string;
  instagramUrl?: string;
  shippingCost?: number;
  freeShippingMin?: number;
  bannerMessage?: string | null;
  isStoreOpen?: boolean;
}



