from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class Role(models.TextChoices):
    """Énumération des rôles utilisateurs conforme au diagramme de classes UML."""

    ADMINISTRATEUR = 'Administrateur', 'Administrateur'
    RESPONSABLE_COMMERCIAL = 'ResponsableCommercial', 'Responsable Commercial'
    VENDEUR = 'Vendeur', 'Vendeur'
    CLIENT = 'Client', 'Client'
    GESTIONNAIRE_STOCK = 'GestionnaireDeStock', 'Gestionnaire de Stock'


class UtilisateurManager(BaseUserManager):
    """Manager personnalisé pour la création d'utilisateurs via l'email."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire.")

        email = self.normalize_email(email)
        utilisateur = self.model(email=email, **extra_fields)
        utilisateur.set_password(password)
        utilisateur.save(using=self._db)
        return utilisateur

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', Role.ADMINISTRATEUR)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Le superutilisateur doit avoir is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Le superutilisateur doit avoir is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class Utilisateur(AbstractUser):
    """
    Modèle utilisateur personnalisé héritant de AbstractUser.
    L'email sert d'identifiant de connexion (USERNAME_FIELD).
    """

    username = None
    email = models.EmailField(unique=True, verbose_name='Adresse email')
    nom = models.CharField(max_length=100, verbose_name='Nom')
    prenom = models.CharField(max_length=100, verbose_name='Prénom')
    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.CLIENT,
        verbose_name='Rôle',
    )
    telephone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Téléphone',
    )
    adresse = models.TextField(
        blank=True,
        verbose_name='Adresse',
        help_text='Adresse du client (optionnel pour les autres rôles).',
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nom', 'prenom']

    objects = UtilisateurManager()

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['nom', 'prenom']

    def __str__(self):
        return f'{self.prenom} {self.nom} ({self.get_role_display()})'

    @property
    def idUser(self):
        """Alias conforme au diagramme UML pour l'identifiant utilisateur."""
        return self.pk
