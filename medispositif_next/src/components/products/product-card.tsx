"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Product } from "@/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import Link from "next/link";
import { getMediaUrl } from "@/lib/utils";

const ShoppingCart = dynamic(
  () => import("lucide-react").then(mod => mod.ShoppingCart),
  { ssr: false }
);
const Package = dynamic(() => import("lucide-react").then(mod => mod.Package), {
  ssr: false,
});
const AlertCircle = dynamic(
  () => import("lucide-react").then(mod => mod.AlertCircle),
  { ssr: false }
);

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const locale = useLocale();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1);
  };

  const productId = product.idProduit || product.id;

  if (!productId) {
    console.error("ProductCard - Missing product ID:", product);
    return null;
  }

  console.log("ProductCard - Product ID:", productId, "Full product:", product);

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const imageUrl = getMediaUrl(product.image);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <Link href={`/${locale}/boutique/produit/${productId}`}>
        <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
          <CardHeader className="p-0">
            <div className="aspect-square bg-muted relative overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.nom || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  💊
                </div>
              )}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-lg bg-red-600 px-3 py-1 rounded-full">
                    ❌ Rupture
                  </span>
                </div>
              )}
              {isLowStock && !isOutOfStock && (
                <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  ⚠️ Stock: {product.stock}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="mb-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {product.nom_catalogue || product.category}
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">
              {product.nom || product.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {product.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                {(product.prix || product.price || 0).toLocaleString()} FCFA
              </span>
              <div className="flex items-center text-sm text-muted-foreground">
                <Package className="h-4 w-4 mr-1" />
                <span>{product.stock} en stock</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0">
            <Button
              className="w-full"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isOutOfStock ? "Rupture de stock" : "Ajouter au panier"}
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
