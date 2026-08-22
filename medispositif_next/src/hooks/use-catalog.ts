import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';

interface Catalog {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface CreateCatalogData {
  name: string;
  description: string;
}

// Catalog Management
export function useCatalogs() {
  return useQuery({
    queryKey: ['catalogs'],
    queryFn: async () => {
      const response = await api.get<Catalog[]>('api/catalogue/catalogues/');
      return response.data;
    },
  });
}

export function useCreateCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCatalogData) => {
      const response = await api.post<Catalog>('api/catalogue/catalogues/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      toast.success('Catalogue créé', {
        description: '✅ Catalogue créé avec succès',
      });
    },
    onError: () => {
      toast.error('Erreur de création', {
        description: '❌ Impossible de créer le catalogue',
      });
    },
  });
}

export function useDeleteCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`api/catalogue/catalogues/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      toast.success('Catalogue supprimé', {
        description: '✅ Catalogue supprimé avec succès',
      });
    },
    onError: () => {
      toast.error('Erreur de suppression', {
        description: '❌ Impossible de supprimer le catalogue',
      });
    },
  });
}
