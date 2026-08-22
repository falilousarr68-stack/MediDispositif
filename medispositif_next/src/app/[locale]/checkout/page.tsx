"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/use-cart";
import { useCreateOrder } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const ShoppingCart = dynamic(
  () => import("lucide-react").then(mod => mod.ShoppingCart),
  { ssr: false }
);
const CreditCard = dynamic(
  () => import("lucide-react").then(mod => mod.CreditCard),
  { ssr: false }
);
const Truck = dynamic(() => import("lucide-react").then(mod => mod.Truck), {
  ssr: false,
});
const CheckCircle = dynamic(
  () => import("lucide-react").then(mod => mod.CheckCircle),
  { ssr: false }
);
const ArrowLeft = dynamic(
  () => import("lucide-react").then(mod => mod.ArrowLeft),
  { ssr: false }
);

const checkoutSchema = z.object({
  shipping_address: z
    .string()
    .min(10, "Adresse doit contenir au moins 10 caractères"),
  phone: z.string().min(9, "Numéro de téléphone invalide"),
  payment_method: z.enum(["cash", "card", "mobile_money", "check"]),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const t = useTranslations("shop");
  const locale = useLocale();
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCart();
  const createOrder = useCreateOrder();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const totalPrice = getTotalPrice();

  // Vérifier l'authentification
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push(`/${locale}/login`);
    }
  }, [router, locale]);

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      // Vérifier le token
      const token = localStorage.getItem("access_token");
      console.log("Access token present:", !!token);
      console.log(
        "Access token (first 20 chars):",
        token ? token.substring(0, 20) + "..." : "none"
      );

      if (!token) {
        toast.error("Non authentifié", {
          description: "Vous devez être connecté pour passer une commande",
        });
        router.push(`/${locale}/login`);
        return;
      }

      // Transformer les items du panier au format attendu par le backend
      const lignes = items.map(item => {
        const rawProductId = item.product.idProduit ?? item.product.id;
        const productId = Number.parseInt(String(rawProductId), 10);
        const productPrice = Number(
          item.product.prix ?? item.product.price ?? 0
        );

        if (!Number.isInteger(productId) || productId <= 0) {
          throw new Error(
            `Identifiant invalide pour le produit ${item.product.nom}`
          );
        }

        console.log("Item transformation:", {
          productId,
          productPrice,
          item: item,
        });

        return {
          idProduit: productId,
          quantite: item.quantity,
          prix_unitaire: productPrice,
        };
      });

      console.log("Transforming cart items to order lines:", lignes);

      await createOrder.mutateAsync({
        lignes,
      });
      clearCart();
      router.push(`/${locale}/checkout/success`);
    } catch (error) {
      console.error("Order creation failed:", error);
    }
  };

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
        <Link href={`/${locale}/cart`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au panier
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-primary" />
            Finaliser la commande
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Informations de livraison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="shipping_address">
                        Adresse de livraison *
                      </Label>
                      <Input
                        id="shipping_address"
                        placeholder="123 Rue Example, Dakar, Sénégal"
                        {...register("shipping_address")}
                        className={
                          errors.shipping_address ? "border-destructive" : ""
                        }
                      />
                      {errors.shipping_address && (
                        <p className="text-sm text-destructive">
                          {errors.shipping_address.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+221 77 123 45 67"
                        {...register("phone")}
                        className={errors.phone ? "border-destructive" : ""}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Mode de paiement *</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: "cash", label: "Espèces 💵", icon: "💵" },
                          {
                            value: "card",
                            label: "Carte bancaire 💳",
                            icon: "💳",
                          },
                          {
                            value: "mobile_money",
                            label: "Mobile Money 📱",
                            icon: "📱",
                          },
                          { value: "check", label: "Chèque 📄", icon: "📄" },
                        ].map(method => (
                          <div key={method.value}>
                            <input
                              type="radio"
                              id={method.value}
                              value={method.value}
                              {...register("payment_method")}
                              className="sr-only peer"
                            />
                            <Label
                              htmlFor={method.value}
                              className="flex items-center justify-center gap-2 p-4 border-2 rounded-lg cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5 transition-all"
                            >
                              <span className="text-2xl">{method.icon}</span>
                              <span className="font-medium">
                                {method.label}
                              </span>
                            </Label>
                          </div>
                        ))}
                      </div>
                      {errors.payment_method && (
                        <p className="text-sm text-destructive">
                          {errors.payment_method.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting || createOrder.isPending}
                    >
                      {isSubmitting || createOrder.isPending ? (
                        "Traitement en cours..."
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Confirmer la commande
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24 space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Récapitulatif de commande</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item, index) => {
                    const productId = item.product.idProduit || item.product.id;
                    return (
                      <div
                        key={`${productId}-${index}`}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {item.product.nom || item.product.name} x
                          {item.quantity}
                        </span>
                        <span className="font-medium">
                          {(
                            (item.product.prix || item.product.price || 0) *
                            item.quantity
                          ).toLocaleString()}{" "}
                          FCFA
                        </span>
                      </div>
                    );
                  })}

                  <div className="border-t pt-4 space-y-2">
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
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total</span>
                      <span className="text-primary">
                        {totalPrice.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold mb-1">Paiement sécurisé</p>
                      <p className="text-muted-foreground">
                        Vos informations sont protégées et ne seront jamais
                        partagées
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
