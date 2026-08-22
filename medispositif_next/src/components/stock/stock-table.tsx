"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

// Dynamic imports pour éviter les erreurs d'hydration avec les icônes
const Package = dynamic(() => import("lucide-react").then(mod => mod.Package), {
  ssr: false,
});
const AlertTriangle = dynamic(
  () => import("lucide-react").then(mod => mod.AlertTriangle),
  { ssr: false }
);
const Edit = dynamic(() => import("lucide-react").then(mod => mod.Edit), {
  ssr: false,
});
const Trash2 = dynamic(() => import("lucide-react").then(mod => mod.Trash2), {
  ssr: false,
});
const TrendingUp = dynamic(
  () => import("lucide-react").then(mod => mod.TrendingUp),
  { ssr: false }
);
const TrendingDown = dynamic(
  () => import("lucide-react").then(mod => mod.TrendingDown),
  { ssr: false }
);

interface StockTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function StockTable({ products, onEdit, onDelete }: StockTableProps) {
  const getStockStatus = (stock: number) => {
    if (stock === 0)
      return {
        label: "Rupture",
        variant: "destructive" as const,
        icon: AlertTriangle,
      };
    if (stock <= 5)
      return {
        label: "Faible",
        variant: "default" as const,
        icon: AlertTriangle,
      };
    if (stock <= 20)
      return {
        label: "Limité",
        variant: "secondary" as const,
        icon: TrendingDown,
      };
    return { label: "Normal", variant: "outline" as const, icon: TrendingUp };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventaire des Produits
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Produit</th>
                <th className="text-left p-3 font-medium">Catégorie</th>
                <th className="text-left p-3 font-medium">Prix</th>
                <th className="text-left p-3 font-medium">Stock</th>
                <th className="text-left p-3 font-medium">Statut</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => {
                const status = getStockStatus(product.stock);
                const StatusIcon = status.icon;

                // Utiliser les champs du backend avec fallback vers les anciens noms pour compatibilité
                const rawProductId = product.idProduit ?? product.id;
                if (rawProductId === undefined) return null;
                const productId = String(rawProductId);
                const productName = product.nom || product.name;
                const productPrice = product.prix || product.price;
                const productCategory =
                  product.nom_catalogue || product.category;
                const productImage = product.image;

                return (
                  <motion.tr
                    key={productId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-xl">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={productName}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            "💊"
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{productName}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{productCategory}</Badge>
                    </td>
                    <td className="p-3 font-medium">
                      {productPrice ? productPrice.toLocaleString() : "N/A"}{" "}
                      FCFA
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{product.stock}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant={status.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            onEdit({ ...product, idProduit: productId })
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(productId)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
