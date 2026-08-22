"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Stethoscope,
  ShoppingCart,
  BarChart3,
  ShieldCheck,
  Package,
  Users,
} from "lucide-react";
import { useLocale } from "next-intl";

export default function HomePage() {
  const t = useTranslations("common");
  const locale = useLocale();

  const features = [
    {
      icon: <ShoppingCart className="h-8 w-8" />,
      title: "Boutique en ligne",
      description:
        "Catalogue complet de dispositifs médicaux avec commande en ligne sécurisée",
      emoji: "🛒",
    },
    {
      icon: <Package className="h-8 w-8" />,
      title: "Gestion de stock",
      description: "Suivi en temps réel des stocks et alertes de péremption",
      emoji: "📦",
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Rapports détaillés",
      description: "Analyse des ventes et export de rapports personnalisés",
      emoji: "📊",
    },
    {
      icon: <ShieldCheck className="h-8 w-8" />,
      title: "Sécurité renforcée",
      description: "Authentification JWT et gestion des rôles utilisateurs",
      emoji: "🔒",
    },
    {
      icon: <Stethoscope className="h-8 w-8" />,
      title: "Produits certifiés",
      description: "Dispositifs médicaux conformes aux normes en vigueur",
      emoji: "🏥",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Gestion des utilisateurs",
      description:
        "Administration complète avec gestion des droits et permissions",
      emoji: "👥",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 py-20"
      >
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-8xl mb-6"
          >
            🏥
          </motion.div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            MediDispositif
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Plateforme E-commerce et de Gestion de Dispositifs Médicaux
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Projet Licence 3 Informatique - Falilou Sarr & Ousmane Fall
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-16">
          <Link href={`/${locale}/login`}>
            <Button size="lg" className="text-lg">
              🔐 Connexion
            </Button>
          </Link>
          <Link href={`/${locale}/register`}>
            <Button size="lg" variant="outline" className="text-lg">
              📝 Inscription
            </Button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{feature.emoji}</span>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 text-center"
        >
          <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">
                🎓 Encadrement Académique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                Sous la direction de{" "}
                <span className="font-semibold">Monsieur Modou Gueye</span>
              </p>
              <p className="text-muted-foreground mt-2">
                Université Cheikh Anta Diop - Licence 3 Informatique
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.section>
    </div>
  );
}
