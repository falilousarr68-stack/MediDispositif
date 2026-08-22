import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Product } from '@/types';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get<Product[]>('api/catalogue/produits/');
      console.log('Products response:', response.data);
      return response.data;
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      console.log('Fetching product with ID:', id);
      try {
        const response = await api.get<Product>(`api/catalogue/produits/${id}/`);
        console.log('Product response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
      }
    },
    enabled: !!id && id !== 'undefined',
  });
}

export function useProductCategories() {
  return useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const response = await api.get<string[]>('api/catalogue/categories/');
      return response.data;
    },
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: async () => {
      const response = await api.get<Product[]>('api/catalogue/produits/', {
        params: { search: query },
      });
      return response.data;
    },
    enabled: query.length > 0,
  });
}

export function useFilterProducts(filters: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}) {
  return useQuery({
    queryKey: ['products', 'filter', filters],
    queryFn: async () => {
      const response = await api.get<Product[]>('api/catalogue/produits/', {
        params: filters,
      });
      return response.data;
    },
  });
}
