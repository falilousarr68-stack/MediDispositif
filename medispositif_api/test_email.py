#!/usr/bin/env python
"""Script de test pour vérifier l'envoi d'emails."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

print("=== Test d'envoi d'email ===")
print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
print()

test_email = "falilousarr68@gmail.com"  # Remplacez par votre email de test

try:
    print(f"Tentative d'envoi d'email de test a {test_email}...")
    result = send_mail(
        subject='Test Email - MediDispositif',
        message='Ceci est un email de test pour verifier la configuration SMTP.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[test_email],
        fail_silently=False,
    )
    print(f"OK Email envoye avec succes! Resultat: {result}")
except Exception as e:
    print(f"ERREUR lors de l'envoi: {str(e)}")
    import traceback
    traceback.print_exc()
