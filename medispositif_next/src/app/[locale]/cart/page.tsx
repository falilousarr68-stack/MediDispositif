"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLocale } from "next-intl";

const ShoppingCart = dynamic(
  () => import("lucide-react").then(mod => mod.ShoppingCart),
  { ssr: false }
);
const Trash2 = dynamic(() => import("lucide-react").then(mod => mod.Trash2), {
  ssr: false,
});
const ArrowRight = dynamic(
  () => import("lucide-react").then(mod => mod.ArrowRight),
  { ssr: false }
);
const Package = dynamic(() => import("lucide-react").then(mod => mod.Package), {
  ssr: false,
});

export default function CartPage() {
  const t = useTranslations("shop");
  const locale = useLocale();
  const {
    items,
    removeItem,
    clearCart,
    getTotalItems,
    getTotalPrice,
    loadCartFromServer,
  } = useCart();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  // Charger le panier au montage du composant
  React.useEffect(() => {
    console.log("CartPage monté, chargement du panier...");
    loadCartFromServer();
  }, [loadCartFromServer]);

  console.log("État actuel du panier:", items);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="text-8xl mb-6">🛒</div>
            <h1 className="text-3xl font-bold mb-4">Votre panier est vide</h1>
            <p className="text-muted-foreground mb-8">
              Ajoutez des produits à votre panier pour commencer vos achats
            </p>
            <Link href={`/${locale}/boutique`}>
              <Button size="lg">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Découvrir nos produits
              </Button>
            </Link>
          </motion.div>
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
            <ShoppingCart className="h-8 w-8 text-primary" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {totalItems} {totalItems === 1 ? t("item") : t("items")}{" "}
            {t("inCart")}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => {
              const productId = String(item.product.idProduit); // L'état du panier utilise des IDs texte
              console.log("Rendering cart item:", productId, item);
              return (
                <motion.div
                  key={productId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center text-4xl flex-shrink-0">
                          {item.product.image &&
                          item.product.image.startsWith("http") ? (
                            <img
                              src={item.product.image}
                              alt={item.product.nom || item.product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : item.product.image ? (
                            <img
                              src={`http://127.0.0.1:8000${item.product.image}`}
                              alt={item.product.nom || item.product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            "💊"
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <div>
                            <h3 className="font-semibold">
                              {item.product.nom || item.product.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {item.product.nom_catalogue ||
                                item.product.category}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              Quantité :{" "}
                              <span className="font-semibold text-foreground">
                                {item.quantity}
                              </span>
                            </div>

                            <div className="text-right">
                              <p className="font-bold text-lg">
                                {(
                                  (item.product.prix ||
                                    item.product.price ||
                                    0) * item.quantity
                                ).toLocaleString()}{" "}
                                FCFA
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {(
                                  item.product.prix ||
                                  item.product.price ||
                                  0
                                ).toLocaleString()}{" "}
                                FCFA / unité
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Package className="h-4 w-4" />
                              <span>Stock: {item.product.stock}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(String(productId))}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            <Button variant="outline" onClick={clearCart} className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Vider le panier
            </Button>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-24"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span className="font-semibold">
                      {totalPrice.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Livraison</span>
                    <span className="font-semibold text-green-600">
                      Gratuite
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-primary">
                        {totalPrice.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>

                  <Link href={`/${locale}/checkout`} className="block">
                    <Button size="lg" className="w-full">
                      Passer la commande
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>

                  <Link href={`/${locale}/boutique`}>
                    <Button variant="outline" className="w-full">
                      Continuer mes achats
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
