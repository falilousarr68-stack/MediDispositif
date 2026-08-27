#!/usr/bin/env python
"""Script de test pour envoyer une notification de validation manuelle."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from ventes.models import Commande, StatutCommande

print("=== Test de notification de validation ===")

# Trouver la commande #37
try:
    commande = Commande.objects.get(pk=37)
    print(f"Commande trouvée: #{commande.pk}")
    print(f"Client: {commande.client}")
    print(f"Client email: {commande.client.email}")
    print(f"Statut actuel: {commande.statut}")
    print(f"Mode de paiement: {commande.get_mode_paiement_display()}")
    
    # Simuler l'envoi de notification
    from ventes.models import envoyer_notification_validation
    print("\nAppel de la fonction de notification...")
    envoyer_notification_validation(commande)
    print("Fonction appelée avec succès")
    
except Commande.DoesNotExist:
    print("Commande #37 non trouvée")
except Exception as e:
    print(f"Erreur: {str(e)}")
    import traceback
    traceback.print_exc()
