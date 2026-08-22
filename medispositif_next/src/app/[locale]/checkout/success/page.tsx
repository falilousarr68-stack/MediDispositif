'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, Home, Package } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function CheckoutSuccessPage() {
  const t = useTranslations('shop');
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-16"
      >
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mx-auto mb-6"
              >
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </motion.div>
              <CardTitle className="text-3xl">Commande confirmée !</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-muted-foreground text-lg">
                  Merci pour votre commande. Vous recevrez une confirmation par email avec les détails de votre commande.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 gap-4 pt-4"
              >
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <Package className="h-8 w-8 text-primary mb-2" />
                  <p className="font-semibold">Préparation</p>
                  <p className="text-sm text-muted-foreground">Votre commande est en cours de préparation</p>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <ShoppingBag className="h-8 w-8 text-primary mb-2" />
                  <p className="font-semibold">Livraison</p>
                  <p className="text-sm text-muted-foreground">Livraison gratuite sous 24-48h</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex gap-4 pt-4"
              >
                <Link href={`/${locale}/boutique`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Continuer mes achats
                  </Button>
                </Link>
                <Link href={`/${locale}`} className="flex-1">
                  <Button className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Retour à l'accueil
                  </Button>
                </Link>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
