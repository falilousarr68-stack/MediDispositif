'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useStockProducts, useDeleteProduct } from '@/hooks/use-stock';
import { StockTable } from '@/components/stock/stock-table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { useStockProducts as useProducts } from '@/hooks/use-stock';

export default function StockProductsPage() {
  const t = useTranslations('stock');
  const locale = useLocale();
  const { data: products, isLoading } = useStockProducts();
  const deleteProduct = useDeleteProduct();
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role || '');
    }
  }, []);

  const getDashboardPath = () => {
    switch (userRole) {
      case 'Administrateur':
        return `/${locale}/dashboard/admin`;
      case 'ResponsableCommercial':
        return `/${locale}/dashboard/commercial`;
      case 'Vendeur':
        return `/${locale}/dashboard/vendeur`;
      case 'GestionnaireDeStock':
        return `/${locale}/dashboard/stock`;
      default:
        return `/${locale}/dashboard/stock`;
    }
  };

  const handleEdit = (product: any) => {
    // Navigate to edit page
    window.location.href = `/${locale}/dashboard/stock/products/${product.id}`;
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      deleteProduct.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="mb-8">
          <Link href={getDashboardPath()}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </Link>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            Gestion des Produits
          </h1>
          <p className="text-muted-foreground mt-2">
            Créer, modifier et supprimer des produits du catalogue
          </p>
        </div>

        <div className="flex justify-end mb-6">
          <Link href={`/${locale}/dashboard/stock/products/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Produit
            </Button>
          </Link>
        </div>

        {products && (
          <StockTable
            products={products}
            onEdit={(product) => {
              console.log('Edit product clicked:', product);
              const productId = product.idProduit || product.id;
              console.log('Product ID for edit:', productId);
              if (productId) {
                window.location.href = `/${locale}/dashboard/stock/products/${productId}`;
              }
            }}
            onDelete={handleDelete}
          />
        )}
      </motion.div>
    </div>
  );
}
