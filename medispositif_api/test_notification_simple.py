#!/usr/bin/env python
"""Script de test simple pour envoyer une notification."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from ventes.models import Commande
from django.core.mail import send_mail
from django.conf import settings

print("=== Test simple d'envoi d'email ===")

try:
    commande = Commande.objects.get(pk=37)
    client_email = commande.client.email
    print(f"Envoi d'email a: {client_email}")
    
    result = send_mail(
        subject='Test de notification - Commande #37',
        message='Ceci est un test de notification pour la commande #37.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[client_email],
        fail_silently=False,
    )
    
    print(f"OK Email envoye avec succes! Resultat: {result}")
    
except Exception as e:
    print(f"ERREUR: {str(e)}")
    import traceback
    traceback.print_exc()
