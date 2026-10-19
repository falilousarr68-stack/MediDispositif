"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import api from "../../../services/api";

export default function FactureDetailPage() {
  const params = useParams();
  const id = params.id;

  const [facture, setFacture] = useState(null);
  const [commande, setCommande] = useState(null);

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
    const chargerFacture = async () => {
      try {
        setChargement(true);
        setErreur("");

        // ============================================
        // RÉCUPÉRER LA FACTURE
        // ============================================

        const factureResponse = await api.get(
          `/ventes/factures/${id}/`
        );

        console.log(
          "Facture récupérée :",
          factureResponse.data
        );

        const factureData = factureResponse.data;

        setFacture(factureData);

        // ============================================
        // RÉCUPÉRER LA COMMANDE
        // ============================================

        if (factureData.idCommande) {
          const commandeResponse = await api.get(
            `/ventes/commandes/${factureData.idCommande}/`
          );

          console.log(
            "Commande de la facture :",
            commandeResponse.data
          );

          setCommande(commandeResponse.data);
        }

      } catch (error) {
        console.error(
          "Erreur lors du chargement de la facture :",
          error
        );

        console.error(
          "Réponse Django :",
          error.response?.data
        );

        if (error.response?.status === 401) {
          setErreur(
            "Votre session a expiré. Veuillez vous reconnecter."
          );
        } else if (error.response?.status === 403) {
          setErreur(
            "Vous n'avez pas l'autorisation de consulter cette facture."
          );
        } else if (error.response?.status === 404) {
          setErreur(
            "Cette facture n'existe pas."
          );
        } else {
          setErreur(
            "Impossible de charger la facture."
          );
        }

      } finally {
        setChargement(false);
      }
    };

    if (id) {
      chargerFacture();
    }
  }, [id]);

    // ============================================
  // TÉLÉCHARGER LA FACTURE EN PDF
  // ============================================

  const telechargerPDF = async () => {
    try {
      const response = await api.get(
        `/ventes/factures/${id}/pdf/`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        { type: "application/pdf" }
      );

      const url = window.URL.createObjectURL(blob);

      const lien = document.createElement("a");
      lien.href = url;
      lien.download = `facture-${facture.numero}.pdf`;

      document.body.appendChild(lien);
      lien.click();
      lien.remove();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(
        "Erreur lors du téléchargement du PDF :",
        error
      );

      alert(
        "Impossible de télécharger la facture en PDF."
      );
    }
  };

  // ============================================
  // CHARGEMENT
  // ============================================

  if (chargement) {
  return (
    <main className="min-h-screen bg-[#f4f8fc]">


      <div className="ml-64 min-h-screen">

        <section className="max-w-5xl mx-auto px-6 py-20 text-center">

          <p className="text-gray-600 text-lg">
            Chargement de la facture...
          </p>

        </section>
        </div>
      </main>
    );
  }

  // ============================================
  // ERREUR
  // ============================================

  if (erreur || !facture) {
    return (
      <main className="min-h-screen bg-[#f4f8fc]">

  <div className="ml-64 min-h-screen">

    <section className="max-w-5xl mx-auto px-6 py-20">

          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-8 text-center">

            <h2 className="text-2xl font-bold">
              Impossible de charger la facture
            </h2>

            <p className="mt-3">
              {erreur || "Facture introuvable."}
            </p>

            <Link
              href="/factures"
              className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Retour à mes factures
            </Link>

          </div>

        </section>
        </div>

      </main>
    );
  }

  const client = facture.client_info || {};

  const montantFacture = Number(
    facture.montant || 0
  );

  return (
  <main className="min-h-screen bg-[#f4f8fc]">


    <div className="ml-64 min-h-screen">

      <section className="bg-gradient-to-r from-[#0b1730] via-blue-700 to-cyan-600 text-white shadow-lg">

        <div className="max-w-5xl mx-auto px-6 py-10">

          <p className="text-blue-200 mb-2">
            MediDispositif
          </p>

          <h1 className="text-4xl font-bold">
            Facture {facture.numero}
          </h1>

          <p className="mt-3 text-blue-100">
            Facture de votre commande #{facture.idCommande}
          </p>

        </div>

      </section>

      {/* ============================================
          CONTENU
      ============================================ */}

      <section className="max-w-5xl mx-auto px-6 py-10">

        {/* ACTIONS */}

        {/* ACTIONS */}

<div className="flex justify-between items-center mb-6">

  <Link
    href="/factures"
    className="text-blue-600 hover:text-blue-800 font-medium"
  >
    ← Retour à mes factures
  </Link>

  <div className="flex gap-3">

    <button
      type="button"
      onClick={() => window.print()}
      className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-5 py-3 rounded-lg font-semibold hover:from-slate-800 hover:to-slate-900 transition-all"
    >
      🖨️ Imprimer
    </button>

    <button
      type="button"
      onClick={telechargerPDF}
      className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all shadow-sm"
    >
      📄 Télécharger PDF
    </button>

  </div>

</div>

        {/* ============================================
            FACTURE
        ============================================ */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* EN-TÊTE FACTURE */}

          <div className="p-8 border-b border-gray-200">

            <div className="flex justify-between gap-8">

              <div>

                <h2 className="text-2xl font-bold text-blue-700">
                  MediDispositif
                </h2>

                <p className="text-gray-500 mt-1">
                  Vente de dispositifs médicaux
                </p>

              </div>

              <div className="text-right">

                <p className="text-sm text-gray-500">
                  FACTURE
                </p>

                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {facture.numero}
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  Émise le{" "}
                  {new Date(
                    facture.date_emission
                  ).toLocaleDateString("fr-FR")}
                </p>

              </div>

            </div>

          </div>

          {/* ============================================
              CLIENT + COMMANDE
          ============================================ */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 border-b border-gray-200">

            {/* CLIENT */}

            <div className="bg-gray-50 rounded-xl p-5">

              <p className="text-sm text-gray-500 uppercase">
                Client
              </p>

              <p className="font-bold text-gray-900 text-lg mt-2">
                {client.prenom} {client.nom}
              </p>

              <p className="text-gray-600 mt-1">
                {client.email}
              </p>

            </div>

            {/* COMMANDE */}

            <div className="bg-gray-50 rounded-xl p-5">

              <p className="text-sm text-gray-500 uppercase">
                Commande
              </p>

              <p className="font-bold text-blue-700 text-lg mt-2">
                #{facture.idCommande}
              </p>

              {commande?.date_commande && (
                <p className="text-gray-600 mt-1">
                  Commandée le{" "}
                  {new Date(
                    commande.date_commande
                  ).toLocaleDateString("fr-FR")}
                </p>
              )}

            </div>

          </div>

          {/* ============================================
              PRODUITS
          ============================================ */}

          <div className="p-8">

            <h2 className="text-xl font-bold text-gray-900 mb-5">
              Produits facturés
            </h2>

            {commande?.lignes?.length > 0 ? (

              <div className="border border-gray-200 rounded-xl overflow-hidden">

                <div className="grid grid-cols-12 bg-gray-50 px-5 py-4 text-sm font-semibold text-gray-600">

                  <div className="col-span-5">
                    Produit
                  </div>

                  <div className="col-span-2 text-center">
                    Quantité
                  </div>

                  <div className="col-span-2 text-right">
                    Prix unitaire
                  </div>

                  <div className="col-span-3 text-right">
                    Montant
                  </div>

                </div>

                {commande.lignes.map(
                  (ligne) => (

                    <div
                      key={ligne.id}
                      className="grid grid-cols-12 px-5 py-5 border-t border-gray-200"
                    >

                      <div className="col-span-5">

                        <p className="font-semibold text-gray-900">
                          {ligne.nom_produit}
                        </p>

                      </div>

                      <div className="col-span-2 text-center text-gray-600">
                        {ligne.quantite}
                      </div>

                      <div className="col-span-2 text-right text-gray-600">

                        {Number(
                          ligne.prix_unitaire
                        ).toLocaleString("fr-FR")}{" "}
                        FCFA

                      </div>

                      <div className="col-span-3 text-right font-semibold text-gray-900">

                        {Number(
                          ligne.montant
                        ).toLocaleString("fr-FR")}{" "}
                        FCFA

                      </div>

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="border border-gray-200 rounded-xl p-6 text-center text-gray-500">
                Aucun produit trouvé pour cette commande.
              </div>

            )}

          </div>

          {/* ============================================
              TOTAL
          ============================================ */}

          <div className="px-8 pb-8">

            <div className="border-t border-gray-200 pt-6 flex justify-end">

              <div className="w-full md:w-80">

                <div className="flex justify-between items-center gap-6">

  <span className="text-lg font-semibold text-gray-700 whitespace-nowrap">
    Total facturé
  </span>

  <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent whitespace-nowrap">
    {montantFacture.toLocaleString("fr-FR")} FCFA
  </span>

</div>

              </div>

            </div>

          </div>

          {/* ============================================
              VALIDATION
          ============================================ */}

          <div className="mx-8 mb-8 bg-green-50 border border-green-200 rounded-xl p-5">

            <p className="font-semibold text-green-700">
              ✓ Facture validée
            </p>

            <p className="text-sm text-green-600 mt-1">
              Cette facture correspond à une commande
              entièrement payée et validée.
            </p>

          </div>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="bg-gray-900 text-gray-300 mt-10">

        <div className="max-w-5xl mx-auto px-6 py-8 text-center">

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