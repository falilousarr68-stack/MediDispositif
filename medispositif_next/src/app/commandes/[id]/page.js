"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "../../../services/api";

export default function CommandeDetailPage() {
  const params = useParams();
  const id = params.id;

  const [commande, setCommande] = useState(null);
  const [facture, setFacture] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [utilisateur, setUtilisateur] = useState(null);

  useEffect(() => {
    const utilisateurStocke = localStorage.getItem("utilisateur");

if (utilisateurStocke) {
  try {
    setUtilisateur(JSON.parse(utilisateurStocke));
  } catch (error) {
    console.error(
      "Impossible de récupérer les informations utilisateur",
      error
    );
  }
}
    const chargerCommande = async () => {
      try {
        setChargement(true);
        setErreur("");

        const response = await api.get(
          `/ventes/commandes/${id}/`
        );

        console.log("Commande récupérée :", response.data);

        setCommande(response.data);

        // Récupérer la facture si elle existe
try {
  const factureResponse = await api.get(
    "/ventes/factures/"
  );

  const factureTrouvee = factureResponse.data.find(
    (f) => Number(f.idCommande) === Number(id)
  );

  setFacture(factureTrouvee || null);

  console.log(
    "Facture de la commande :",
    factureTrouvee
  );

} catch (factureError) {
  // Ne bloque pas l'affichage de la commande
  console.log(
    "Aucune facture disponible pour cette commande."
  );

  setFacture(null);
}

      } catch (error) {
        console.error(
          "Erreur lors du chargement de la commande :",
          error
        );

        if (error.response) {
          console.error(
            "Réponse Django :",
            error.response.data
          );
        }

        setErreur(
          "Impossible de charger les informations de la commande."
        );

      } finally {
        setChargement(false);
      }
    };

    if (id) {
      chargerCommande();
    }
  }, [id]);

  // CHARGEMENT
  if (chargement) {
  return (
    <main className="min-h-screen bg-[#f4f8fc]">


      <div className="ml-64 min-h-screen">

        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <p className="text-gray-600 text-lg">
            Chargement de votre commande...
          </p>
        </div>

      </div>

    </main>
  );
}

  // ERREUR
 if (erreur || !commande) {
  return (
    <main className="min-h-screen bg-[#f4f8fc]">


      <div className="ml-64 min-h-screen">

        <div className="max-w-7xl mx-auto px-6 py-20">

          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">

            <h2 className="text-xl font-bold mb-2">
              Une erreur est survenue
            </h2>

            <p>
              {erreur || "Commande introuvable."}
            </p>

            <Link
              href="/commandes"
              className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Retour aux commandes
            </Link>

          </div>

        </div>
         </div>
      </main>
    );
  }

  return (
  <main className="min-h-screen bg-[#f4f8fc]">


    <div className="ml-64 min-h-screen">

      {/* TITRE */}
      <section className="bg-gradient-to-r from-[#0b1730] via-blue-700 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">

          <p className="text-blue-200 mb-2">
            MediDispositif
          </p>

          <h1 className="text-4xl font-bold">
            Commande #{commande.idCommande}
          </h1>

          <p className="mt-3 text-blue-100">
  {utilisateur?.role === "Client"
    ? "Consultez les détails de votre commande."
    : "Consultez les détails et le suivi de cette commande client."}
</p>

        </div>
      </section>

      {/* CONTENU */}
      <section className="max-w-7xl mx-auto px-6 py-10">

        <div className="mb-6">
  <Link
    href={
  utilisateur?.role === "Vendeur" ||
  utilisateur?.role === "ResponsableCommercial"
    ? "/gestion-commandes"
    : "/commandes"
}
    className="
      inline-flex items-center gap-2
      text-blue-600
      hover:text-cyan-600
      font-medium
      transition
    "
  >
    {utilisateur?.role === "Vendeur" ||
 utilisateur?.role === "ResponsableCommercial"
  ? "← Retour à la gestion des commandes"
  : "← Retour à mes commandes"}
  </Link>
</div>

        {/* SUCCÈS */}
        <div
  className={`rounded-xl p-5 mb-8 border ${
    commande.statut === "Validee"
      ? "bg-green-50 border-green-200 text-green-700"
      : commande.statut === "Annulee"
      ? "bg-red-50 border-red-200 text-red-700"
      : "bg-yellow-50 border-yellow-200 text-yellow-700"
  }`}
>
  <p className="font-semibold">

    {commande.statut === "Validee" && (
      <>✓ Paiement confirmé — commande validée</>
    )}

    {commande.statut === "EnCours" && (
      <>⏳ Commande en attente de paiement</>
    )}

    {commande.statut === "Annulee" && (
      <>✕ Commande annulée</>
    )}

  </p>

  <p className="text-sm mt-1">
    Commande #{commande.idCommande}
  </p>
</div>
        {/* FACTURE */}
{facture && commande.statut === "Validee" && (
  <div className="mb-8 bg-white rounded-xl border border-green-200 shadow-sm p-6">

    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm text-green-600 font-medium">
          FACTURE DISPONIBLE
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-1">
          {facture.numero}
        </h2>

        <p className="text-sm text-gray-500 mt-2">
          Émise le{" "}
          {new Date(
            facture.date_emission
          ).toLocaleDateString("fr-FR")}
        </p>
      </div>

      <div className="text-right">

        <p className="text-sm text-gray-500">
          Montant facturé
        </p>

        <p className="text-xl font-bold text-blue-700">
          {Number(
            facture.montant
          ).toLocaleString("fr-FR")}{" "}
          FCFA
        </p>

      </div>

    </div>

    <div className="mt-5 pt-5 border-t border-gray-200">

      <p className="text-sm text-gray-600">
        ✓ Cette facture correspond à une commande
        entièrement payée et validée.
      </p>

    </div>

  </div>
)}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* INFORMATIONS */}
          <div className="lg:col-span-2">

            <div className="bg-white rounded-xl border shadow-sm p-6">

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Détails de la commande
              </h2>

              <div className="space-y-4">

                {commande.lignes &&
                  commande.lignes.map((ligne) => (
                    <div
                      key={ligne.id}
                      className="flex items-center justify-between border-b pb-4"
                    >

                      <div>

                        <p className="font-semibold text-gray-900">
                          {ligne.nom_produit}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          Quantité : {ligne.quantite}
                        </p>

                        <p className="text-sm text-gray-500">
                          Prix unitaire :{" "}
                          {Number(
                            ligne.prix_unitaire
                          ).toLocaleString("fr-FR")}{" "}
                          FCFA
                        </p>

                      </div>

                      <p className="font-bold text-blue-700">
                        {Number(
                          ligne.montant
                        ).toLocaleString("fr-FR")}{" "}
                        FCFA
                      </p>

                    </div>
                  ))}

              </div>

            </div>

          </div>

          {/* RÉSUMÉ */}
          <aside>

            <div className="bg-white rounded-xl border shadow-sm p-6">

              <h2 className="text-xl font-bold text-gray-900">
                Résumé
              </h2>

              <div className="border-t mt-5 pt-5">

                <div className="flex justify-between text-gray-600">
                  <span>
                    Numéro
                  </span>

                  <span className="font-medium">
                    #{commande.idCommande}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600 mt-4">
                  <span>
                    Statut
                  </span>

                  <span className="text-blue-600 font-medium">
                    {commande.statut_display ||
                      commande.statut}
                  </span>
                </div>

                {utilisateur?.role === "Client" &&
  commande.statut === "EnCours" && (
    <Link
      href={`/paiements?commande=${commande.idCommande}`}
      className="block w-full mt-6 bg-green-600 text-white py-4 rounded-lg font-bold text-center hover:bg-green-700 transition"
    >
      💳 Payer maintenant
    </Link>
  )}

              </div>

              <div className="border-t mt-5 pt-5">

                <div className="flex justify-between items-center">

                  <span className="text-lg font-semibold text-gray-700">
                    Total
                  </span>

                  <span className="text-2xl font-bold text-blue-700">
                    {Number(
                      commande.montant_total
                    ).toLocaleString("fr-FR")}{" "}
                    FCFA
                  </span>

                </div>

              </div>

              {utilisateur?.role === "Client" && (
  <Link
    href="/produits"
    className="block text-center mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-600 transition"
  >
    Continuer mes achats
  </Link>
)}

            </div>

          </aside>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 mt-10">

        <div className="max-w-7xl mx-auto px-6 py-8 text-center">

          <p className="font-semibold text-white">
            MediDispositif
          </p>

          <p className="text-sm mt-2">
            Vente de dispositifs médicaux en ligne
          </p>

          <p className="text-xs text-gray-500 mt-4">
            © 2026 MediDispositif. Tous droits réservés.
          </p>

        </div>

      </footer>
      </div>

    </main>
  );
}