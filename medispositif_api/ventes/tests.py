from django.test import RequestFactory, TestCase

from authentication.models import Role, Utilisateur
from ventes.models import Commande
from ventes.permissions import PeutValiderCommande


class PeutValiderCommandeTests(TestCase):
	def setUp(self):
		self.request_factory = RequestFactory()
		self.client_user = Utilisateur.objects.create_user(
			email='client@example.com',
			password='password',
			nom='Client',
			prenom='Test',
			role=Role.CLIENT,
		)
		self.vendeur = Utilisateur.objects.create_user(
			email='vendeur@example.com',
			password='password',
			nom='Vendeur',
			prenom='Test',
			role=Role.VENDEUR,
		)
		self.commande = Commande.objects.create(client=self.client_user)
		self.permission = PeutValiderCommande()

	def test_vendeur_peut_valider_une_commande(self):
		request = self.request_factory.post('/api/ventes/commandes/1/valider/')
		request.user = self.vendeur

		self.assertTrue(
			self.permission.has_object_permission(request, None, self.commande)
		)

	def test_client_ne_peut_pas_valider_une_commande(self):
		request = self.request_factory.post('/api/ventes/commandes/1/valider/')
		request.user = self.client_user

		self.assertFalse(
			self.permission.has_object_permission(request, None, self.commande)
		)
