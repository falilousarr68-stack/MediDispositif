"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/use-cart";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  motdepasse: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const { checkAuthentication } = useCart();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      console.log("Tentative de connexion avec:", data.email);
      console.log("Données complètes envoyées:", data);

      // Transformer les données pour l'API JWT Django
      // L'API attend: email et password
      const apiData = {
        email: data.email,
        password: data.motdepasse,
      };

      console.log("Données transformées pour API:", apiData);
      const response = await api.post("api/auth/connexion/", apiData);
      console.log("Réponse connexion:", response.data);
      return response.data;
    },
    onSuccess: data => {
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      // Récupérer la photo de profil existante si elle existe (clé spécifique à l'utilisateur)
      const photoKey = `user_photo_${data.utilisateur.email}`;
      const existingPhoto = localStorage.getItem(photoKey);
      const userData = { ...data.utilisateur };
      if (existingPhoto) {
        userData.photo = existingPhoto;
        console.log('Photo de profil restaurée pour:', data.utilisateur.email);
      }

      localStorage.setItem("user", JSON.stringify(userData));

      // Charger le panier depuis le serveur
      checkAuthentication();

      toast.success(t("loginSuccess"), {
        description: "✅ Vous êtes maintenant connecté",
      });

      const role = data.utilisateur.role;
      const redirectMap: Record<string, string> = {
        Administrateur: `/${locale}/dashboard/admin`,
        ResponsableCommercial: `/${locale}/dashboard/commercial`,
        Vendeur: `/${locale}/dashboard/vendeur`,
        GestionnaireDeStock: `/${locale}/dashboard/stock`,
        Client: `/${locale}/boutique`,
      };

      const redirectPath = redirectMap[role] || `/${locale}/boutique`;
      router.push(redirectPath);
    },
    onError: (error: any) => {
      console.error("Erreur de connexion détaillée:", error);

      let errorMessage = "❌ Email ou mot de passe incorrect";

      if (error.code === "ERR_NETWORK") {
        errorMessage =
          "❌ API non accessible - Vérifiez que le serveur Django est démarré sur http://127.0.0.1:8000";
      } else if (error.response?.data) {
        errorMessage = `❌ ${JSON.stringify(error.response.data)}`;
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`;
      }

      toast.error(t("loginError"), {
        description: errorMessage,
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    console.log("Formulaire soumis avec:", data);
    console.log("Erreurs de validation:", errors);
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-20 flex items-center justify-center"
      >
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {t("loginTitle")} 🔐
            </CardTitle>
            <CardDescription className="text-center">
              {t("noAccount")}{" "}
              <a
                href={`/${locale}/register`}
                className="text-primary hover:underline"
              >
                {t("register")}
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("email")}</label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  {...register("email")}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("password")}</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...register("motdepasse")}
                  className={errors.motdepasse ? "border-destructive" : ""}
                />
                {errors.motdepasse && (
                  <p className="text-sm text-destructive">
                    {errors.motdepasse.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "⏳" : ""} {t("login")}
              </Button>

              <div className="text-center">
                <a
                  href={`/${locale}/forgot-password`}
                  className="text-sm text-primary hover:underline"
                >
                  {t("forgotPassword")}
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
