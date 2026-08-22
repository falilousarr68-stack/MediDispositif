export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'Administrateur' | 'ResponsableCommercial' | 'Vendeur' | 'GestionnaireDeStock' | 'Client';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface Product {
  idProduit: number | string; // ID principal du backend
  nom: string;
  description: string;
  prix: number;
  stock: number;
  catalogue: string;
  nom_catalogue?: string;
  image?: string;
  // Pour compatibilité avec l'ancien code (deprecated)
  id?: number | string;
  name?: string;
  price?: number;
  category?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  user: User;
  items: CartItem[];
  total: number;
  status: 'pending' | 'validated' | 'cancelled' | 'delivered';
  shipping_address?: string;
  payment_method?: 'cash' | 'card' | 'mobile_money' | 'check';
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Supply {
  id: string;
  product: Product;
  quantity: number;
  lot_number: string;
  expiry_date: string;
  received_at: string;
}

export interface Payment {
  id: string;
  order: Order;
  amount: number;
  method: 'cash' | 'card' | 'mobile_money' | 'check';
  reference?: string;
  created_at: string;
}
