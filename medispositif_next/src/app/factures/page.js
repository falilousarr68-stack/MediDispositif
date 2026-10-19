"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import api from "../../services/api";

export default function MesFacturesPage() {
  const [factures, setFactures] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");
  const [role, setRole] = useState("");
  const [utilisateur, setUtilisateur] = useState(null);

  useEffect(() => {
    const chargerFactures = async () => {
      try {
        setChargement(true);
        setErreur("");

        const utilisateurStocke =
          localStorage.getItem("utilisateur");

        if (!utilisateurStocke) {
          setErreur(
            "Vous devez être connecté pour consulter vos factures."
          );
          return;
        }

        const utilisateur =
  JSON.parse(utilisateurStocke);
    setUtilisateur(utilisateur);
    setRole(utilisateur.role);

const response = await api.get(
  "/ventes/factures/"
);

        console.log(
          "Factures récupérées :",
          response.data
        );

        const toutesLesFactures =
          Array.isArray(response.data)
            ? response.data
            : response.data?.results || [];

        if (utilisateur.role === "Client") {
  const mesFactures = toutesLesFactures.filter(
    (facture) =>
      Number(facture.client_info?.id) ===
      Number(utilisateur.idUser)
  );

  setFactures(mesFactures);
} else {
  // Vendeur, Responsable Commercial, Administrateur
  // peuvent consulter les factures retournées par le backend.
  setFactures(toutesLesFactures);
}

      } catch (error) {
        console.error(
          "Erreur lors du chargement des factures :",
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
            "Vous n'avez pas l'autorisation de consulter vos factures."
          );
        } else {
          setErreur(
            "Impossible de charger vos factures."
          );
        }

      } finally {
        setChargement(false);
      }
    };

    chargerFactures();
  }, []);

  const facturesFiltrees = factures.filter(
    (facture) => {
      const texte =
        recherche.toLowerCase().trim();

      if (!texte) {
        return true;
      }

      return (
        facture.numero
          ?.toLowerCase()
          .includes(texte) ||
        String(facture.idCommande)
          .includes(texte)
      );
    }
  );

  return (
  <main className="min-h-screen bg-[#f4f8fc]">

    

    <div className="ml-64 min-h-screen">

      

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="bg-gradient-to-r from-[#0b1730] via-blue-700 to-cyan-600 text-white">

        <div className="max-w-7xl mx-auto px-6 py-12">

          <p className="text-blue-200 mb-2">
            MediDispositif
          </p>

          <h1 className="text-4xl font-bold">
  {role === "Client" ? "Mes factures" : "Factures"}
</h1>

          <p className="mt-3 text-blue-100">
  {role === "Client"
    ? "Consultez les factures de vos commandes entièrement payées."
    : "Consultez les factures des commandes entièrement payées."}
</p>

        </div>

      </section>

      {/* =====================================================
          CONTENU
      ====================================================== */}

      <section className="max-w-7xl mx-auto px-6 py-10">

        {/* RETOUR */}
<div className="mb-6">
  <button
    type="button"
    onClick={() => {
  if (role === "Client") {
    window.location.href = "/client";
  } else if (role === "Vendeur") {
    window.location.href = "/vendeur";
  } else if (role === "ResponsableCommercial") {
    window.location.href = "/responsable-commercial";
  } else if (role === "GestionnaireDeStock") {
    window.location.href = "/gestionnaire-stock";
  } else if (role === "Administrateur") {
    window.location.href = "/administration";
  }
}}
    className="text-blue-600 hover:text-cyan-600 text-sm font-medium transition"
  >
    ← Retour au tableau de bord
  </button>
</div>

        {/* RECHERCHE */}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rechercher
          </label>

          <input
            type="text"
            value={recherche}
            onChange={(e) =>
              setRecherche(e.target.value)
            }
            placeholder="Numéro de facture ou numéro de commande..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

        {/* ERREUR */}

        {erreur && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 mb-8">

            <p className="font-medium">
              {erreur}
            </p>

          </div>
        )}

        {/* CHARGEMENT */}

        {chargement ? (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">

            <p className="text-gray-600">
              Chargement de vos factures...
            </p>

          </div>
        ) : (

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

            {/* EN-TÊTE */}

            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  Factures
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {facturesFiltrees.length} facture
                  {facturesFiltrees.length > 1
                    ? "s"
                    : ""}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="border border-blue-200 px-4 py-2 rounded-lg text-blue-700 hover:bg-blue-50 transition"
              >
                🔄 Actualiser
              </button>

            </div>

            {/* AUCUNE FACTURE */}

            {facturesFiltrees.length === 0 ? (

              <div className="p-16 text-center">

                <div className="text-5xl mb-5">
                  🧾
                </div>

                <h3 className="text-xl font-bold text-gray-900">
                  Aucune facture
                </h3>

                <p className="text-gray-500 mt-2">
  {role === "Client"
    ? "Vos factures apparaîtront ici après le paiement complet et la validation de vos commandes."
    : "Les factures apparaîtront ici après le paiement complet et la validation des commandes."}
</p>

                <Link
  href={
    role === "Client"
      ? "/commandes"
      : "/gestion-commandes"
  }
  className="inline-block mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-600 transition"
>
  {role === "Client"
    ? "Voir mes commandes"
    : "Voir les commandes"}
</Link>

              </div>

            ) : (

              /* LISTE */

              <div className="divide-y divide-gray-200">

                {facturesFiltrees.map(
                  (facture) => (

                    <div
                      key={facture.id}
                      className="px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition"
                    >

                      {/* FACTURE */}

                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-2xl">
                          🧾
                        </div>

                        <div>

                          <h3 className="font-bold text-gray-900">
                            {facture.numero}
                          </h3>

                          <p className="text-sm text-gray-500 mt-1">
                            Commande #
                            {facture.idCommande}
                          </p>

                          <p className="text-sm text-gray-500">
                            Émise le{" "}
                            {new Date(
                              facture.date_emission
                            ).toLocaleDateString(
                              "fr-FR"
                            )}
                          </p>

                        </div>

                      </div>

                      {/* MONTANT + ACTION */}

                      <div className="flex items-center gap-6">

                        <div className="text-right">

                          <p className="text-xs text-gray-500">
                            Montant
                          </p>

                          <p className="font-bold text-blue-700">
                            {Number(
                              facture.montant
                            ).toLocaleString(
                              "fr-FR"
                            )}{" "}
                            FCFA
                          </p>

                        </div>

                        <Link
                          href={`/factures/${facture.id}`}
                            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-600 transition"
                        >
                          👁 Voir
                        </Link>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>
        )}

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