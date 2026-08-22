"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useProduct } from "@/hooks/use-products";
import { getMediaUrl } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Package,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Plus,
  Minus,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const t = useTranslations("shop");
  const params = useParams();
  const locale = useLocale();
  const { data: product, isLoading } = useProduct(params.id as string);
  const { addItem } = useCart();
  const [quantity, setQuantity] = React.useState(1);

  const handleAddToCart = () => {
    if (product) {
      if (quantity <= product.stock) {
        addItem(product, quantity);
        setQuantity(1);
      } else {
        toast.error("Stock insuffisant", {
          description: `❌ Stock disponible : ${product.stock}`,
        });
      }
    }
  };

  const isOutOfStock = !product || product.stock === 0;
  const isLowStock = product && product.stock > 0 && product.stock <= 5;

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

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Produit non trouvé</h2>
          <Link href={`/${locale}/boutique`}>
            <Button>Retour à la boutique</Button>
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = getMediaUrl(product.image);

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 py-8"
      >
        <Link href={`/${locale}/boutique`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la boutique
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-0">
                <div className="aspect-square bg-muted relative overflow-hidden rounded-lg">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.nom || product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-9xl">
                      💊
                    </div>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl bg-red-600 px-6 py-3 rounded-full">
                        ❌ Rupture de stock
                      </span>
                    </div>
                  )}
                  {isLowStock && !isOutOfStock && (
                    <div className="absolute top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                      ⚠️ Stock limité: {product.stock}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div>
              <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                {product.nom_catalogue || product.category}
              </span>
              <h1 className="text-4xl font-bold mt-4 mb-2">
                {product.nom || product.name}
              </h1>
              <p className="text-3xl font-bold text-primary">
                {(product.prix || product.price || 0).toLocaleString()} FCFA
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Disponibilité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {isOutOfStock ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <span className="text-destructive font-semibold">
                        Rupture de stock
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-600 font-semibold">
                        {product.stock} unités disponibles
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-medium">Quantité:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    disabled={isOutOfStock || quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isOutOfStock ? "Rupture de stock" : "Ajouter au panier"}
              </Button>

              {!isOutOfStock && (
                <p className="text-sm text-muted-foreground text-center">
                  Total:{" "}
                  {(
                    (product.prix || product.price || 0) * quantity
                  ).toLocaleString()}{" "}
                  FCFA
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
