'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const AlertTriangle = dynamic(() => import('lucide-react').then(mod => mod.AlertTriangle), { ssr: false });
const Clock = dynamic(() => import('lucide-react').then(mod => mod.Clock), { ssr: false });
const Package = dynamic(() => import('lucide-react').then(mod => mod.Package), { ssr: false });

interface StockAlert {
  id: string;
  productName: string;
  stock: number;
  type: 'low_stock' | 'expiring';
  expiryDate?: string;
  lotNumber?: string;
}

interface StockAlertCardProps {
  alerts: StockAlert[];
  title: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

export function StockAlertCard({ alerts, title, icon, bgColor, textColor }: StockAlertCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className={`${bgColor} border-2`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${textColor}`}>
            {icon}
            {title}
            <Badge variant="secondary" className="ml-auto">
              {alerts.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className={`text-sm ${textColor} opacity-70`}>
              Aucune alerte
            </p>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert, index) => (
                <div
                  key={`${alert.type}-${alert.id}-${index}`}
                  className="flex items-center justify-between p-2 bg-background/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{alert.productName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.type === 'low_stock' && (
                      <Badge variant="destructive" className="text-xs">
                        Stock: {alert.stock}
                      </Badge>
                    )}
                    {alert.type === 'expiring' && alert.expiryDate && (
                      <Badge variant="destructive" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(alert.expiryDate).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {alerts.length > 5 && (
                <p className={`text-xs ${textColor} opacity-70 text-center`}>
                  +{alerts.length - 5} autres alertes
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
