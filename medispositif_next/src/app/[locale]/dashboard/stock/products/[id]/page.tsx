"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProduct } from "@/hooks/use-products";
import { useUpdateProduct } from "@/hooks/use-stock";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ImageUpload } from "@/components/stock/image-upload";

const productSchema = z.object({
  nom: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caractères"),
  prix: z.number().min(0, "Le prix doit être positif"),
  stock: z.number().min(0, "Le stock doit être positif"),
  idCatalogue: z.string().min(1, "Le catalogue est requis"),
  image: z.any().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const t = useTranslations("stock");
  const locale = useLocale();
  const params = useParams();
  const { data: product, isLoading } = useProduct(params.id as string);
  const updateProduct = useUpdateProduct();
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role || "");
    }
  }, []);

  const getDashboardPath = () => {
    switch (userRole) {
      case "Administrateur":
        return `/${locale}/dashboard/admin`;
      case "ResponsableCommercial":
        return `/${locale}/dashboard/commercial`;
      case "Vendeur":
        return `/${locale}/dashboard/vendeur`;
      case "GestionnaireDeStock":
        return `/${locale}/dashboard/stock`;
      default:
        return `/${locale}/dashboard/stock`;
    }
  };

  console.log("Product ID from params:", params.id);
  console.log("Product data:", product);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nom: "",
      description: "",
      prix: 0,
      stock: 0,
      idCatalogue: "1",
    },
  });

  // Mettre à jour le formulaire quand les données du produit sont disponibles
  useEffect(() => {
    if (product) {
      console.log("Updating form with product data:", product);
      reset({
        nom: product.nom || product.name || "",
        description: product.description || "",
        prix: product.prix || product.price || 0,
        stock: product.stock || 0,
        idCatalogue: String(product.catalogue || product.category || "1"),
      });
    }
  }, [product, reset]);

  const onSubmit = (data: ProductFormData) => {
    if (product) {
      const productId = product.idProduit || product.id;
      console.log("Updating product with ID:", productId);

      if (productId === undefined) {
        return;
      }

      // Créer FormData pour l'upload de fichier
      const formData = new FormData();
      formData.append("nom", data.nom);
      formData.append("description", data.description);
      formData.append("prix", data.prix.toString());
      formData.append("stock", data.stock.toString());
      formData.append("idCatalogue", data.idCatalogue);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      updateProduct.mutate({ id: String(productId), data: formData });
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Produit non trouvé</h2>
          <Link href={getDashboardPath()}>
            <Button>Retour au tableau de bord</Button>
          </Link>
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
          <h1 className="text-4xl font-bold">Modifier le Produit</h1>
          <p className="text-muted-foreground mt-2">
            Modifier les informations du produit: {product.nom || product.name}
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Informations du Produit</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom du produit *</Label>
                <Input
                  id="nom"
                  placeholder="Ex: Paracétamol 500mg"
                  {...register("nom")}
                  className={errors.nom ? "border-destructive" : ""}
                />
                {errors.nom && (
                  <p className="text-sm text-destructive">
                    {errors.nom.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  placeholder="Description détaillée du produit..."
                  {...register("description")}
                  className={`flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.description ? "border-destructive" : ""}`}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prix">Prix (FCFA) *</Label>
                  <Input
                    id="prix"
                    type="number"
                    placeholder="5000"
                    {...register("prix", { valueAsNumber: true })}
                    className={errors.prix ? "border-destructive" : ""}
                  />
                  {errors.prix && (
                    <p className="text-sm text-destructive">
                      {errors.prix.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="100"
                    {...register("stock", { valueAsNumber: true })}
                    className={errors.stock ? "border-destructive" : ""}
                  />
                  {errors.stock && (
                    <p className="text-sm text-destructive">
                      {errors.stock.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idCatalogue">Catalogue *</Label>
                <select
                  id="idCatalogue"
                  {...register("idCatalogue")}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.idCatalogue ? "border-destructive" : ""}`}
                >
                  <option value="1">Général</option>
                </select>
                {errors.idCatalogue && (
                  <p className="text-sm text-destructive">
                    {errors.idCatalogue.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Image du produit (optionnel)</Label>
                <ImageUpload
                  value={imageFile}
                  onChange={setImageFile}
                  error={
                    typeof errors.image?.message === "string"
                      ? errors.image.message
                      : undefined
                  }
                />
                {(product.image || (product as any).image) && !imageFile && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Image actuelle :
                    </p>
                    <img
                      src={product.image || (product as any).image}
                      alt="Image actuelle"
                      className="w-32 h-32 object-cover rounded border"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting || updateProduct.isPending}
                >
                  {isSubmitting || updateProduct.isPending
                    ? "Modification..."
                    : "Modifier le produit"}
                </Button>
                <Link href={getDashboardPath()} className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Annuler
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
