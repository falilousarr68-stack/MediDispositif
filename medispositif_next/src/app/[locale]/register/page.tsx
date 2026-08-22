'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const registerSchema = z
  .object({
    email: z.string().email('Email invalide'),
    motdepasse: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    confirmation_motdepasse: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    phone: z.string().optional(),
  })
  .refine((data) => data.motdepasse === data.confirmation_motdepasse, {
    message: "Les mots de passe ne correspondent pas",
    path: ['confirmation_motdepasse'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      console.log('Tentative d\'inscription avec:', data);
      // Mapping des champs vers les noms attendus par le backend (français)
      const publicRegistrationData = {
        email: data.email,
        motdepasse: data.motdepasse,
        confirmation_motdepasse: data.confirmation_motdepasse,
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.phone,
      };
      console.log('Données envoyées au backend:', publicRegistrationData);
      const response = await api.post('api/auth/inscription/', publicRegistrationData);
      console.log('Réponse inscription:', response.data);
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('registerSuccess'), {
        description: '✅ Compte créé avec succès',
      });
      router.push(`/${locale}/login`);
    },
    onError: (error: any) => {
      console.error('Erreur d\'inscription détaillée:', error);
      
      let errorMessage = '❌ Erreur lors de l\'inscription';
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage = '❌ API non accessible - Vérifiez que le serveur Django est démarré sur http://127.0.0.1:8000';
      } else if (error.response?.data) {
        errorMessage = `❌ ${JSON.stringify(error.response.data)}`;
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`;
      }
      
      toast.error(t('registerError'), {
        description: errorMessage,
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
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
              {t('registerTitle')} 📝
            </CardTitle>
            <CardDescription className="text-center">
              {t('hasAccount')}{' '}
              <a href={`/${locale}/login`} className="text-primary hover:underline">
                {t('login')}
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('firstName')}</label>
                  <Input
                    placeholder="Jean"
                    {...register('prenom')}
                    className={errors.prenom ? 'border-destructive' : ''}
                  />
                  {errors.prenom && (
                    <p className="text-sm text-destructive">{errors.prenom.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('lastName')}</label>
                  <Input
                    placeholder="Dupont"
                    {...register('nom')}
                    className={errors.nom ? 'border-destructive' : ''}
                  />
                  {errors.nom && (
                    <p className="text-sm text-destructive">{errors.nom.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('email')}</label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('phone')}</label>
                <Input
                  type="tel"
                  placeholder="+221 77 123 45 67"
                  {...register('phone')}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('password')}</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...register('motdepasse')}
                  className={errors.motdepasse ? 'border-destructive' : ''}
                />
                {errors.motdepasse && (
                  <p className="text-sm text-destructive">{errors.motdepasse.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('confirmPassword')}</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmation_motdepasse')}
                  className={errors.confirmation_motdepasse ? 'border-destructive' : ''}
                />
                {errors.confirmation_motdepasse && (
                  <p className="text-sm text-destructive">{errors.confirmation_motdepasse.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? '⏳' : ''} {t('register')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
