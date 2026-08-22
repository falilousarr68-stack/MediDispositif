'use client';

import React from 'react';
import { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { useGenerateInvoice } from '@/hooks/use-sales';
import { FileText, Download } from 'lucide-react';

interface InvoiceButtonProps {
  order: Order;
  disabled?: boolean;
}

export function InvoiceButton({ order, disabled = false }: InvoiceButtonProps) {
  const generateInvoice = useGenerateInvoice();

  const handleGenerateInvoice = () => {
    generateInvoice.mutate(order.id);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerateInvoice}
      disabled={disabled || generateInvoice.isPending}
    >
      {generateInvoice.isPending ? (
        <Download className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      {generateInvoice.isPending ? 'Génération...' : 'Facture PDF'}
    </Button>
  );
}
