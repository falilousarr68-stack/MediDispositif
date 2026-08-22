'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push(`/${locale}/login`);
      return;
    }

    const user = JSON.parse(userStr);
    const role = user.role;

    const redirectMap: Record<string, string> = {
      Administrateur: `/${locale}/dashboard/admin`,
      ResponsableCommercial: `/${locale}/dashboard/commercial`,
      Vendeur: `/${locale}/dashboard/vendeur`,
      GestionnaireDeStock: `/${locale}/dashboard/stock`,
      Client: `/${locale}/boutique`,
    };

    const redirectPath = redirectMap[role] || `/${locale}/boutique`;
    router.push(redirectPath);
  }, [router, locale]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirection vers votre dashboard...</p>
      </div>
    </div>
  );
}
