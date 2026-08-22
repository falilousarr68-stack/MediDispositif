"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  useStockProducts,
  useLowStockProducts,
  useExpiringProducts,
  useStockStats,
  useDeleteProduct,
} from "@/hooks/use-stock";
import { StockTable } from "@/components/stock/stock-table";
import { StockAlertCard } from "@/components/stock/stock-alert-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Package,
  AlertTriangle,
  Clock,
  Plus,
  TrendingUp,
  DollarSign,
  Boxes,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function StockDashboardPage() {
  const t = useTranslations("stock");
  const locale = useLocale();
  const { data: products, isLoading } = useStockProducts();
  const { data: lowStockProducts } = useLowStockProducts(5);
  const { data: expiringSupplies } = useExpiringProducts();
  const { data: stats } = useStockStats();

  const deleteProduct = useDeleteProduct();

  const handleEdit = (product: any) => {
    const productId = product.idProduit ?? product.id;
    if (productId !== undefined) {
      window.location.href = `/${locale}/dashboard/stock/products/${productId}`;
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      deleteProduct.mutate(id);
    }
  };

  const lowStockAlerts =
    lowStockProducts?.map(p => ({
      id: String(p.idProduit ?? p.id ?? ""),
      productName: p.nom ?? p.name ?? "Produit inconnu",
      stock: p.stock,
      type: "low_stock" as const,
    })) || [];

  const expiringAlerts =
    expiringSupplies?.map(s => ({
      id: s.id,
      productName: s.product?.nom ?? s.product?.name ?? "Produit inconnu",
      stock: s.product?.stock ?? 0,
      type: "expiring" as const,
      expiryDate: s.expiry_date,
      lotNumber: s.lot_number,
    })) || [];

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
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestion des stocks et des approvisionnements
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Produits
                </CardTitle>
                <Boxes className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Dans le catalogue
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Stock Faible
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  {lowStockAlerts.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Produits à réapprovisionner
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Péremption Proche
                </CardTitle>
                <Clock className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {expiringAlerts.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lots à surveiller
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Valeur Stock
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {products
                    ?.reduce(
                      (total, p) => total + (p.prix || p.price || 0) * p.stock,
                      0
                    )
                    .toLocaleString() || 0}{" "}
                  FCFA
                </div>
                <p className="text-xs text-muted-foreground">Valeur totale</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Alerts */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <StockAlertCard
            alerts={lowStockAlerts}
            title="Alertes Stock Faible"
            icon={<AlertTriangle className="h-5 w-5" />}
            bgColor="bg-orange-50 dark:bg-orange-950"
            textColor="text-orange-700 dark:text-orange-300"
          />
          <StockAlertCard
            alerts={expiringAlerts}
            title="Alertes Péremption"
            icon={<Clock className="h-5 w-5" />}
            bgColor="bg-red-50 dark:bg-red-950"
            textColor="text-red-700 dark:text-red-300"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <Link href={`/${locale}/dashboard/stock/products`}>
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Gérer les Produits
            </Button>
          </Link>
          <Link href={`/${locale}/dashboard/stock/supplies`}>
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Approvisionnements
            </Button>
          </Link>
          <Link href={`/${locale}/dashboard/stock/products/new`}>
            <Button variant="default" className="ml-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Produit
            </Button>
          </Link>
        </div>

        {/* Products Table */}
        {products && (
          <StockTable
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </motion.div>
    </div>
  );
}
