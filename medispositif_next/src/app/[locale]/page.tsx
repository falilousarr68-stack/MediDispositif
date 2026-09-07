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
  Phone,
  Mail,
  MapPin,
  Heart,
  Award,
  Truck,
  HeadphonesIcon,
} from "lucide-react";
import { useLocale } from "next-intl";
import { ConsomcareLogo } from "@/components/logo";

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

  const services = [
    {
      icon: <Package className="h-6 w-6" />,
      title: "Matériel médical",
      description: "Large gamme de matériel médical de qualité",
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Qualité Premium",
      description: "Produits certifiés et conformes aux normes",
    },
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Livraison rapide & fiable",
      description: "Service de livraison partout au Sénégal",
    },
    {
      icon: <HeadphonesIcon className="h-6 w-6" />,
      title: "Service client à l'écoute",
      description: "Support professionnel et réactif",
    },
  ];

  const products = [
    "Matériel médical",
    "Consommables médicaux",
    "Équipements hospitaliers",
    "Dispositifs médicaux",
    "Solutions pour pharmacies & cliniques",
    "Conseil & accompagnement",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
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
            className="mb-6"
          >
            <ConsomcareLogo size="large" />
          </motion.div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            CONSOMCARE SARL
          </h1>
          <p className="text-2xl text-muted-foreground max-w-3xl mx-auto font-semibold">
            Mieux s'équiper pour mieux soigner. Parce que chaque soin compte.
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <Link href={`/${locale}/login`}>
              <Button size="lg" className="text-lg bg-green-600 hover:bg-green-700">
                🔐 Connexion
              </Button>
            </Link>
            <Link href={`/${locale}/register`}>
              <Button size="lg" variant="outline" className="text-lg">
                📝 Inscription
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Services Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="container mx-auto px-4 py-16 bg-gradient-to-b from-green-50 to-transparent dark:from-green-950/20"
      >
        <h2 className="text-3xl font-bold text-center mb-12 text-green-700 dark:text-green-400">
          Nos Services
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow border-green-200 dark:border-green-800">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2 text-green-600 dark:text-green-400">
                    {service.icon}
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Qui Sommes-Nous Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="container mx-auto px-4 py-16"
      >
        <Card className="max-w-4xl mx-auto bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-3xl text-blue-700 dark:text-blue-400">
              QUI SOMMES-NOUS ?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-6">
              CONSOMCARE SARL est une entreprise spécialisée dans la fourniture de matériel
              médical et de dispositifs de santé. Nous nous engageons à fournir des produits
              de qualité supérieure pour répondre aux besoins des professionnels de santé et
              des patients.
            </p>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-xl font-semibold mb-2 text-blue-700 dark:text-blue-400">
                Directrice
              </h3>
              <p className="text-lg font-bold">FATY MBAYE</p>
              <p className="text-muted-foreground">Docteur en Pharmacie</p>
              <div className="mt-4 space-y-2">
                <p className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  <span>Expertise pharmaceutique</span>
                </p>
                <p className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-blue-600" />
                  <span>Accompagnement personnalisé</span>
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <span>Engagement pour la santé</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Produits & Services Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="container mx-auto px-4 py-16 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/20"
      >
        <h2 className="text-3xl font-bold text-center mb-12 text-blue-700 dark:text-blue-400">
          NOS PRODUITS & SERVICES
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {products.map((product, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="hover:shadow-lg transition-shadow border-blue-200 dark:border-blue-800">
                <CardContent className="p-6 text-center">
                  <p className="font-semibold text-lg">{product}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Contact Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="container mx-auto px-4 py-16"
      >
        <h2 className="text-3xl font-bold text-center mb-12 text-green-700 dark:text-green-400">
          NOUS CONTACTER
        </h2>
        <Card className="max-w-4xl mx-auto bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <p className="font-semibold">Adresse</p>
                    <p className="text-muted-foreground">
                      Zac Mbao Cité ICS Villa n°53<br />
                      Dakar, Sénégal
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-muted-foreground">consomcare@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <p className="font-semibold">Téléphone</p>
                    <p className="text-muted-foreground">
                      +221 77 114 67 69<br />
                      +221 76 969 42 43
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-muted-foreground">N.I.N.E.A</p>
                  <p className="font-semibold">012853421</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-muted-foreground">RCCM</p>
                  <p className="font-semibold">SN DKR 2026B7525</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-muted-foreground">Capital social</p>
                  <p className="font-semibold">1 000 000 FCFA</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="container mx-auto px-4 py-16"
      >
        <h2 className="text-3xl font-bold text-center mb-12">
          Fonctionnalités de la Plateforme
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>
      </motion.section>

      {/* Academic Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="container mx-auto px-4 py-16 text-center"
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
            <p className="text-sm text-muted-foreground mt-4">
              Développé par Falilou Sarr & Ousmane Fall
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
