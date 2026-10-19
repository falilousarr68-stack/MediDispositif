from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .permissions import EstAdministrateur
from rest_framework.views import APIView
from systeme.audit import enregistrer_audit
from systeme.models import TypeActionAudit
from django.db import models
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.db.models import Sum
from datetime import date, timedelta
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth

from django.utils.http import (
    urlsafe_base64_encode,
    urlsafe_base64_decode,
)

from authentication.models import Role
from ventes.models import Commande, Paiement, Facture, StatutCommande, StatutPaiement
from catalogue.models import ProduitMedical, MouvementStock

from catalogue.models import ProduitMedical, MouvementStock
from ventes.models import Commande, StatutCommande
from .models import Utilisateur, Role
from .serializers import (
    InscriptionClientSerializer,
    ProfilUtilisateurSerializer,
    UtilisateurAdminSerializer,
    UtilisateurAdminCreateSerializer,
    ChangerMotDePasseSerializer,
)

from .tokens import CustomTokenObtainPairSerializer



class InscriptionClientView(generics.CreateAPIView):
    """
    Endpoint public d'inscription pour les clients.
    Crée un compte avec le rôle Client et retourne les informations du profil.
    """

    serializer_class = InscriptionClientSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        utilisateur = serializer.save()

        return Response(
            {
                'message': 'Compte client créé avec succès.',
                'utilisateur': ProfilUtilisateurSerializer(utilisateur).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ConnexionView(TokenObtainPairView):
    """
    Endpoint de connexion JWT.
    Authentifie par email/mot de passe et retourne les tokens + le rôle.
    """

    serializer_class = CustomTokenObtainPairSerializer

class MotDePasseOublieView(APIView):
    """
    Permet à un utilisateur de demander la réinitialisation
    de son mot de passe à partir de son adresse email.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')

        if not email:
            return Response(
                {
                    'message': 'Veuillez renseigner votre adresse email.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            utilisateur = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            # On ne révèle pas si l'adresse existe ou non.
            return Response(
                {
                    'message': (
                        'Si cette adresse email correspond à un compte, '
                        'un lien de réinitialisation a été envoyé.'
                    )
                },
                status=status.HTTP_200_OK
            )

        uid = urlsafe_base64_encode(force_bytes(utilisateur.pk))

        token = default_token_generator.make_token(utilisateur)

        # Cette URL sera adaptée au frontend Next.js.
        lien_reinitialisation = (
            f"http://localhost:3000/reinitialiser-mot-de-passe/"
            f"{uid}/{token}"
        )

        send_mail(
            subject='Réinitialisation de votre mot de passe - MediDispositif',
            message=(
                f"Bonjour {utilisateur.prenom},\n\n"
                "Vous avez demandé la réinitialisation de votre mot de passe.\n\n"
                "Cliquez sur le lien suivant pour définir un nouveau mot de passe :\n\n"
                f"{lien_reinitialisation}\n\n"
                "Si vous n'êtes pas à l'origine de cette demande, "
                "vous pouvez ignorer cet email.\n\n"
                "Cordialement,\n"
                "L'équipe MediDispositif"
            ),
            from_email=None,
            recipient_list=[utilisateur.email],
            fail_silently=False,
        )

        return Response(
            {
                'message': (
                    'Si cette adresse email correspond à un compte, '
                    'un lien de réinitialisation a été envoyé.'
                )
            },
            status=status.HTTP_200_OK
        )

class ReinitialiserMotDePasseView(APIView):
    """
    Permet de définir un nouveau mot de passe à partir
    du lien reçu par email.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        nouveau_mot_de_passe = request.data.get('nouveau_mot_de_passe')

        if not uid or not token or not nouveau_mot_de_passe:
            return Response(
                {
                    'message': (
                        'Les informations de réinitialisation '
                        'sont obligatoires.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            uid_decode = urlsafe_base64_decode(uid)
            utilisateur_id = force_str(uid_decode)
            utilisateur = Utilisateur.objects.get(pk=utilisateur_id)
        except (
            TypeError,
            ValueError,
            OverflowError,
            Utilisateur.DoesNotExist
        ):
            return Response(
                {
                    'message': 'Le lien de réinitialisation est invalide.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not default_token_generator.check_token(
            utilisateur,
            token
        ):
            return Response(
                {
                    'message': (
                        'Le lien de réinitialisation est invalide '
                        'ou a expiré.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(nouveau_mot_de_passe) < 8:
            return Response(
                {
                    'message': (
                        'Le nouveau mot de passe doit contenir '
                        'au moins 8 caractères.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        utilisateur.set_password(nouveau_mot_de_passe)
        utilisateur.save(update_fields=['password'])

        return Response(
            {
                'message': (
                    'Votre mot de passe a été réinitialisé '
                    'avec succès.'
                )
            },
            status=status.HTTP_200_OK
        )

class ProfilUtilisateurView(generics.RetrieveUpdateAPIView):
    """Endpoint de récupération du profil de l'utilisateur connecté."""

    serializer_class = ProfilUtilisateurSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class ChangerMotDePasseView(APIView):
    """
    Permet à l'utilisateur connecté
    de modifier son mot de passe.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = ChangerMotDePasseSerializer(
            data=request.data,
            context={'request': request}
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        enregistrer_audit(
            utilisateur=request.user,
            module="Authentification",
            action=TypeActionAudit.MODIFICATION,
            description=(
                f"Modification du mot de passe "
                f"de l'utilisateur "
                f"{request.user.prenom} "
                f"{request.user.nom}."
            ),
            reference=f"Utilisateur #{request.user.pk}"
        )

        return Response({
            "message":
                "Votre mot de passe a été modifié avec succès."
        }, status=status.HTTP_200_OK)

class StatistiquesProfilView(APIView):
    """
    Retourne les statistiques adaptées au rôle
    de l'utilisateur connecté.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        utilisateur = request.user
        role = utilisateur.role

        # =====================================================
        # CLIENT
        # =====================================================

        if role == Role.CLIENT:

            commandes = Commande.objects.filter(
                client=utilisateur
            )

            commandes_validees = commandes.filter(
                statut=StatutCommande.VALIDEE
            )

            montant_depense = commandes_validees.aggregate(
                total=Sum('montant_total')
            )['total'] or 0

            return Response({
                'role': role,
                'statistiques': {
                    'commandes': commandes.count(),
                    'commandes_validees': commandes_validees.count(),
                    'montant_depense': float(montant_depense),
                }
            })

        # =====================================================
        # VENDEUR
        # =====================================================

        if role == Role.VENDEUR:

            commandes = Commande.objects.all()

            commandes_validees = commandes.filter(
                statut=StatutCommande.VALIDEE
            )

            chiffre_affaires = commandes_validees.aggregate(
                total=Sum('montant_total')
            )['total'] or 0

            return Response({
                'role': role,
                'statistiques': {
                    'commandes': commandes.count(),
                    'commandes_validees': commandes_validees.count(),
                    'chiffre_affaires': float(chiffre_affaires),
                }
            })

        # =====================================================
        # RESPONSABLE COMMERCIAL
        # =====================================================

        if role == Role.RESPONSABLE_COMMERCIAL:

            commandes = Commande.objects.all()

            commandes_validees = commandes.filter(
                statut=StatutCommande.VALIDEE
            )

            commandes_en_cours = commandes.filter(
                statut=StatutCommande.EN_COURS
            )

            chiffre_affaires = commandes_validees.aggregate(
                total=Sum('montant_total')
            )['total'] or 0

            return Response({
                'role': role,
                'statistiques': {
                    'commandes': commandes.count(),
                    'commandes_en_cours': commandes_en_cours.count(),
                    'commandes_validees': commandes_validees.count(),
                    'chiffre_affaires': float(chiffre_affaires),
                }
            })

        # =====================================================
        # GESTIONNAIRE DE STOCK
        # =====================================================

        if role == Role.GESTIONNAIRE_STOCK:
            produits = ProduitMedical.objects.all()
            mouvements = MouvementStock.objects.all()

            stock_total = produits.aggregate(
                 total=Sum('stock')
            )['total'] or 0

            stock_faible = produits.filter(stock__lte=5).count()

            return Response({
                'role': role,
                'statistiques': {
                    'produits': produits.count(),
                    'stock_total': int(stock_total),
                    'stock_faible': stock_faible,
                    'mouvements': mouvements.count(),
                }
           })

        # =====================================================
        # ADMINISTRATEUR
        # =====================================================

        if role == Role.ADMINISTRATEUR:

            commandes = Commande.objects.all()

            commandes_validees = commandes.filter(
                statut=StatutCommande.VALIDEE
            )

            chiffre_affaires = commandes_validees.aggregate(
                total=Sum('montant_total')
            )['total'] or 0

            return Response({
                'role': role,
                'statistiques': {
                    'utilisateurs': Utilisateur.objects.count(),
                    'produits': ProduitMedical.objects.count(),
                    'commandes': commandes.count(),
                    'commandes_validees': commandes_validees.count(),
                    'chiffre_affaires': float(chiffre_affaires),
                }
            })

        # =====================================================
        # RÔLE INCONNU
        # =====================================================

        return Response({
            'role': role,
            'statistiques': {}
        })

class UtilisateurAdminViewSet(viewsets.ModelViewSet):
    """
    Gestion des utilisateurs réservée à l'Administrateur.

    L'administrateur peut :
    - consulter tous les utilisateurs ;
    - consulter un utilisateur ;
    - modifier les informations d'un utilisateur ;
    - modifier son rôle ;
    - activer ou désactiver un compte ;
    - supprimer un compte.
    """

    queryset = Utilisateur.objects.all()
    permission_classes = [EstAdministrateur]

    def get_serializer_class(self):
        if self.action == 'create':
            return UtilisateurAdminCreateSerializer

        return UtilisateurAdminSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        recherche = self.request.query_params.get('recherche')
        role = self.request.query_params.get('role')

        if recherche:
            queryset = queryset.filter(
                models.Q(
                    nom__icontains=recherche
                )
                | models.Q(
                    prenom__icontains=recherche
                )
                | models.Q(
                    email__icontains=recherche
                )
            )

        if role:
            queryset = queryset.filter(role=role)

        return queryset.order_by('nom', 'prenom')

class DeconnexionView(APIView):
    """
    Enregistre la déconnexion de l'utilisateur dans le journal d'audit.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        utilisateur = request.user

        enregistrer_audit(
            utilisateur=utilisateur,
            module="Authentification",
            action=TypeActionAudit.DECONNEXION,
            description=(
                f"Déconnexion de l'utilisateur "
                f"{utilisateur.prenom} {utilisateur.nom}."
            ),
            reference=f"Utilisateur #{utilisateur.pk}",
        )

        return Response(
            {
                "message": "Déconnexion enregistrée avec succès."
            },
            status=status.HTTP_200_OK,
        )

class StatistiquesProfilView(APIView):
    """
    Retourne les statistiques, graphiques et activités
    correspondant au rôle de l'utilisateur connecté.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        utilisateur = request.user
        role = utilisateur.role

        # ==========================================================
        # RÉPONSE DE BASE
        # ==========================================================

        statistiques = {}
        graphiques = {}
        activite_recente = []
        raccourcis = []

        # ==========================================================
        # CLIENT
        # ==========================================================

        if role == Role.CLIENT:

            commandes = Commande.objects.filter(
                client=utilisateur
            )

            commandes_validees = commandes.filter(
                statut=StatutCommande.VALIDEE
            )

            commandes_en_cours = commandes.filter(
                statut=StatutCommande.EN_COURS
            )

            montant_depense = (
                commandes_validees.aggregate(
                    total=Sum('montant_total')
                )['total']
                or 0
            )

            nombre_factures = Facture.objects.filter(
                commande__client=utilisateur
            ).count()

            statistiques = {
                'commandes': commandes.count(),
                'commandes_validees': commandes_validees.count(),
                'commandes_en_cours': commandes_en_cours.count(),
                'montant_depense': montant_depense,
                'factures': nombre_factures,
            }

            # ------------------------------------------------------
            # GRAPHIQUE : COMMANDES PAR MOIS
            # ------------------------------------------------------

            commandes_mois = (
                commandes_validees
                .annotate(mois=TruncMonth('date_commande'))
                .values('mois')
                .annotate(total=Count('id'))
                .order_by('mois')
            )

            graphiques['commandes_par_mois'] = [
                {
                    'mois': item['mois'].strftime('%Y-%m'),
                    'total': item['total'],
                }
                for item in commandes_mois
            ]

            # ------------------------------------------------------
            # GRAPHIQUE : DÉPENSES PAR MOIS
            # ------------------------------------------------------

            depenses_mois = (
                commandes_validees
                .annotate(mois=TruncMonth('date_commande'))
                .values('mois')
                .annotate(total=Sum('montant_total'))
                .order_by('mois')
            )

            graphiques['depenses_par_mois'] = [
                {
                    'mois': item['mois'].strftime('%Y-%m'),
                    'total': item['total'],
                }
                for item in depenses_mois
            ]

            # ------------------------------------------------------
            # ACTIVITÉ RÉCENTE : COMMANDES
            # ------------------------------------------------------

            dernieres_commandes = commandes.order_by(
                '-date_commande'
            )[:5]

            for commande in dernieres_commandes:
                activite_recente.append({
                    'type': 'commande',
                    'icone': '🛒',
                    'titre': f'Commande #{commande.idCommande}',
                    'description': (
                        f'{commande.get_statut_display()} - '
                        f'{commande.montant_total} FCFA'
                    ),
                    'date': commande.date_commande,
                })

            # ------------------------------------------------------
            # ACTIVITÉ RÉCENTE : PAIEMENTS
            # ------------------------------------------------------

            derniers_paiements = (
                Paiement.objects
                .filter(
                    commande__client=utilisateur,
                    statut=StatutPaiement.REUSSI
                )
                .order_by('-date_paiement')[:5]
            )

            for paiement in derniers_paiements:
                activite_recente.append({
                    'type': 'paiement',
                    'icone': '💳',
                    'titre': 'Paiement effectué',
                    'description': (
                        f'{paiement.montant} FCFA - '
                        f'{paiement.get_mode_paiement_display()}'
                    ),
                    'date': paiement.date_paiement,
                })

            raccourcis = [
    {
        'titre': 'Mes commandes',
        'description': 'Consulter et suivre mes commandes',
        'lien': '/commandes',
        'icone': '🛒',
    },
    {
        'titre': 'Catalogue',
        'description': 'Découvrir les dispositifs médicaux disponibles',
        'lien': '/produits',
        'icone': '📦',
    },
    {
        'titre': 'Mes factures',
        'description': 'Consulter et télécharger mes factures',
        'lien': '/factures',
        'icone': '🧾',
    },
]

        # ==========================================================
        # VENDEUR
        # ==========================================================

        elif role == Role.VENDEUR:

            commandes = Commande.objects.all()

            commandes_validees = commandes.filter(
                statut=StatutCommande.VALIDEE
            )

            chiffre_affaires = (
                commandes_validees.aggregate(
                    total=Sum('montant_total')
                )['total']
                or 0
            )

            paiements_reussis = Paiement.objects.filter(
                statut=StatutPaiement.REUSSI
            )

            statistiques = {
                'commandes_traitees': commandes_validees.count(),
                'ventes': paiements_reussis.count(),
                'chiffre_affaires': chiffre_affaires,
                'commandes_en_cours': commandes.filter(
                    statut=StatutCommande.EN_COURS
                ).count(),
            }

            ventes_mois = (
                commandes_validees
                .annotate(mois=TruncMonth('date_commande'))
                .values('mois')
                .annotate(
                    total=Count('id'),
                    chiffre_affaires=Sum('montant_total')
                )
                .order_by('mois')
            )

            graphiques['ventes_par_mois'] = [
                {
                    'mois': item['mois'].strftime('%Y-%m'),
                    'total': item['total'],
                    'chiffre_affaires': item['chiffre_affaires'],
                }
                for item in ventes_mois
            ]

            dernieres_commandes = commandes.order_by(
                '-date_commande'
            )[:5]

            for commande in dernieres_commandes:
                activite_recente.append({
                    'type': 'commande',
                    'icone': '🛒',
                    'titre': f'Commande #{commande.idCommande}',
                    'description': (
                        f'{commande.get_statut_display()} - '
                        f'{commande.montant_total} FCFA'
                    ),
                    'date': commande.date_commande,
                })

            raccourcis = [
                {
                    'titre': 'Commandes',
                    'description': 'Gérer les commandes',
                    'lien': '/gestion-commandes',
                    'icone': '🛒',
                },
                {
                    'titre': 'Factures',
                    'description': 'Consulter les factures',
                    'lien': '/factures',
                    'icone': '🧾',
                },
            ]

        # ==========================================================
        # RESPONSABLE COMMERCIAL
        # ==========================================================

        elif role == Role.RESPONSABLE_COMMERCIAL:

            commandes = Commande.objects.all()

            commandes_validees = commandes.filter(
                statut=StatutCommande.VALIDEE
            )

            commandes_annulees = commandes.filter(
                statut=StatutCommande.ANNULEE
            )

            chiffre_affaires = (
                commandes_validees.aggregate(
                    total=Sum('montant_total')
                )['total']
                or 0
            )

            statistiques = {
                'commandes': commandes.count(),
                'commandes_validees': commandes_validees.count(),
                'commandes_en_cours': commandes.filter(
                    statut=StatutCommande.EN_COURS
                ).count(),
                'commandes_annulees': commandes_annulees.count(),
                'chiffre_affaires': chiffre_affaires,
            }

            evolution = (
                commandes_validees
                .annotate(mois=TruncMonth('date_commande'))
                .values('mois')
                .annotate(
                    total=Count('id'),
                    chiffre_affaires=Sum('montant_total')
                )
                .order_by('mois')
            )

            graphiques['commandes_par_mois'] = [
                {
                    'mois': item['mois'].strftime('%Y-%m'),
                    'total': item['total'],
                    'chiffre_affaires': item['chiffre_affaires'],
                }
                for item in evolution
            ]

            dernieres_commandes = commandes.order_by(
                '-date_commande'
            )[:5]

            for commande in dernieres_commandes:
                activite_recente.append({
                    'type': 'commande',
                    'icone': '🛒',
                    'titre': f'Commande #{commande.idCommande}',
                    'description': (
                        f'{commande.get_statut_display()} - '
                        f'{commande.montant_total} FCFA'
                    ),
                    'date': commande.date_commande,
                })

            raccourcis = [
                {
                    'titre': 'Gestion des commandes',
                    'description': 'Superviser les commandes',
                    'lien': '/gestion-commandes',
                    'icone': '🛒',
                },
                {
                    'titre': 'Rapports',
                    'description': 'Consulter les rapports',
                    'lien': '/administration/rapports',
                    'icone': '📊',
                },
            ]

        # ==========================================================
        # GESTIONNAIRE DE STOCK
        # ==========================================================

        elif role == Role.GESTIONNAIRE_STOCK:

            produits = ProduitMedical.objects.all()

            stock_total = (
                produits.aggregate(
                    total=Sum('stock')
                )['total']
                or 0
            )

            stock_faible = produits.filter(
                stock__lte=5
            ).count()

            mouvements = MouvementStock.objects.all()

            statistiques = {
                'produits': produits.count(),
                'stock_total': stock_total,
                'stock_faible': stock_faible,
                'mouvements': mouvements.count(),
            }

            # ------------------------------------------------------
            # GRAPHIQUE : MOUVEMENTS DE STOCK
            # ------------------------------------------------------

            mouvements_mois = (
                mouvements
                .annotate(mois=TruncMonth('date_mouvement'))
                .values('mois', 'type_mouvement')
                .annotate(total=Sum('quantite'))
                .order_by('mois')
            )

            graphiques['mouvements_par_mois'] = [
                {
                    'mois': item['mois'].strftime('%Y-%m'),
                    'type': item['type_mouvement'],
                    'quantite': item['total'],
                }
                for item in mouvements_mois
            ]

            # ------------------------------------------------------
# GRAPHIQUE : STOCK DISPONIBLE PAR PRODUIT
# ------------------------------------------------------

            graphiques['stock_par_produit'] = [
                {
                    'produit': produit.nom,
                    'stock': produit.stock,
                }
                for produit in produits
            ]

            derniers_mouvements = (
                mouvements
                .select_related('produit')
                .order_by('-date_mouvement')[:8]
            )

            for mouvement in derniers_mouvements:
                activite_recente.append({
                    'type': 'stock',
                    'icone': '📦',
                    'titre': mouvement.produit.nom,
                    'description': (
                        f'{mouvement.get_type_mouvement_display()} - '
                        f'{mouvement.quantite} unités'
                    ),
                    'date': mouvement.date_mouvement,
                })

            raccourcis = [
                {
                    'titre': 'Produits',
                    'description': 'Gérer les produits',
                    'lien': '/administration/produits',
                    'icone': '📦',
                },
                {
                    'titre': 'Approvisionnements',
                    'description': 'Gérer les entrées de stock',
                    'lien': '/administration/approvisionnements',
                    'icone': '🚚',
                },
                {
                    'titre': 'Historique stock',
                    'description': 'Consulter les mouvements',
                    'lien': '/historique-stock',
                    'icone': '🔄',
                },
            ]

        # ==========================================================
        # ADMINISTRATEUR
        # ==========================================================

        elif role == Role.ADMINISTRATEUR:

            nombre_utilisateurs = Utilisateur.objects.count()

            nombre_produits = ProduitMedical.objects.count()

            commandes = Commande.objects.all()

            commandes_validees = commandes.filter(
                statut=StatutCommande.VALIDEE
            )

            chiffre_affaires = (
                commandes_validees.aggregate(
                    total=Sum('montant_total')
                )['total']
                or 0
            )

            statistiques = {
                'utilisateurs': nombre_utilisateurs,
                'produits': nombre_produits,
                'commandes': commandes.count(),
                'chiffre_affaires': chiffre_affaires,
            }

            evolution = (
                commandes_validees
                .annotate(mois=TruncMonth('date_commande'))
                .values('mois')
                .annotate(
                    commandes=Count('id'),
                    chiffre_affaires=Sum('montant_total')
                )
                .order_by('mois')
            )

            graphiques['activite_commerciale'] = [
                {
                    'mois': item['mois'].strftime('%Y-%m'),
                    'commandes': item['commandes'],
                    'chiffre_affaires': item['chiffre_affaires'],
                }
                for item in evolution
            ]

            # ------------------------------------------------------
            # ACTIVITÉ ADMINISTRATIVE
            # ------------------------------------------------------

            derniers_utilisateurs = (
                Utilisateur.objects
                .order_by('-date_joined')[:5]
            )

            for utilisateur in derniers_utilisateurs:
                activite_recente.append({
                    'type': 'utilisateur',
                    'icone': '👤',
                    'titre': 'Nouvel utilisateur',
                    'description': (
                        f'{utilisateur.prenom} {utilisateur.nom} '
                        f'({utilisateur.get_role_display()})'
                    ),
                    'date': utilisateur.date_joined,
                })

            dernieres_commandes = commandes.order_by(
                '-date_commande'
            )[:5]

            for commande in dernieres_commandes:
                activite_recente.append({
                    'type': 'commande',
                    'icone': '🛒',
                    'titre': f'Commande #{commande.idCommande}',
                    'description': (
                        f'{commande.get_statut_display()} - '
                        f'{commande.montant_total} FCFA'
                    ),
                    'date': commande.date_commande,
                })

            raccourcis = [
                {
                    'titre': 'Utilisateurs',
                    'description': 'Gérer les utilisateurs',
                    'lien': '/administration/utilisateurs',
                    'icone': '👥',
                },
                {
                    'titre': 'Produits',
                    'description': 'Gérer le catalogue',
                    'lien': '/administration/produits',
                    'icone': '📦',
                },
                {
                    'titre': 'Commandes',
                    'description': 'Consulter les commandes',
                    'lien': '/gestion-commandes',
                    'icone': '🛒',
                },
            ]

        # ==========================================================
        # TRI DE L'ACTIVITÉ
        # ==========================================================

        activite_recente = sorted(
            activite_recente,
            key=lambda item: item['date'],
            reverse=True
        )[:8]

        # ==========================================================
        # RÉPONSE
        # ==========================================================

        return Response({
            'role': role,
            'role_display': utilisateur.get_role_display(),

            'statistiques': statistiques,

            'graphiques': graphiques,

            'activite_recente': activite_recente,

            'raccourcis': raccourcis,

            'derniere_connexion': utilisateur.last_login,
        })