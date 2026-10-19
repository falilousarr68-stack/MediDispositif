"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import api from "../../../services/api";

export default function PaiementCommandePage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id;

  useEffect(() => {
  const utilisateurStocke = localStorage.getItem("utilisateur");

  if (!utilisateurStocke) {
    router.push("/connexion");
    return;
  }

  try {
    setUtilisateur(JSON.parse(utilisateurStocke));
  } catch (error) {
    console.error("Erreur utilisateur :", error);
    router.push("/connexion");
  }
}, [router]);

/*useEffect(() => {
  const interval = setInterval(() => {
    setDateHeure(new Date());
  }, 1000);

  return () => clearInterval(interval);
}, []);*/

  const [commande, setCommande] = useState(null);
  const [utilisateur, setUtilisateur] = useState(null);
  const [dateHeure, setDateHeure] = useState(new Date());

  const [chargement, setChargement] = useState(true);
  const [paiementEnCours, setPaiementEnCours] = useState(false);

  const [erreur, setErreur] = useState("");
  const [messageSucces, setMessageSucces] = useState("");

  const [modePaiement, setModePaiement] = useState("");

  /*
   * ============================================================
   * CHARGER LA COMMANDE
   * ============================================================
   */

  useEffect(() => {
    const chargerCommande = async () => {
      try {
        setChargement(true);
        setErreur("");

        const response = await api.get(
          `/ventes/commandes/${id}/`
        );

        console.log(
          "Commande à payer :",
          response.data
        );

        setCommande(response.data);

      } catch (error) {
        console.error(
          "Erreur lors du chargement de la commande :",
          error
        );

        if (error.response?.status === 401) {
          setErreur(
            "Votre session a expiré. Veuillez vous reconnecter."
          );
        } else if (error.response?.status === 403) {
          setErreur(
            "Vous n'avez pas l'autorisation de consulter cette commande."
          );
        } else if (error.response?.status === 404) {
          setErreur(
            "Cette commande n'existe pas."
          );
        } else {
          setErreur(
            "Impossible de charger les informations de la commande."
          );
        }

      } finally {
        setChargement(false);
      }
    };

    if (id) {
      chargerCommande();
    }
  }, [id]);

  /*
   * ============================================================
   * CHOISIR LE MODE DE PAIEMENT
   * ============================================================
   */

  const choisirModePaiement = (mode) => {
    setModePaiement(mode);
    setErreur("");
  };

  const lancerPaiement = async () => {
  setErreur("");
  setMessageSucces("");

  if (!modePaiement) {
    setErreur(
      "Veuillez sélectionner un mode de paiement."
    );
    return;
  }

  try {
    setPaiementEnCours(true);

    const response = await api.post(
      "/ventes/paiements/initier/",
      {
        idCommande: Number(id),
        mode_paiement: modePaiement,
      }
    );

    console.log(
      "Paiement initialisé :",
      response.data
    );

    const idPaiement = response.data?.idPaiement;

    if (!idPaiement) {
      throw new Error(
        "Le serveur n'a pas retourné l'identifiant du paiement."
      );
    }

    // IMPORTANT :
    // on envoie maintenant l'ID DU PAIEMENT
    router.push(
      `/paiements/simulation/${idPaiement}`
    );

  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation du paiement :",
      error
    );

    console.error(
      "Réponse Django :",
      error.response?.data
    );

    setErreur(
      error.response?.data?.error ||
      error.response?.data?.detail ||
      "Impossible d'initialiser le paiement."
    );

    setPaiementEnCours(false);
  }
};

  /*
   * ============================================================
   * PAYER LA COMMANDE
   * ============================================================
   */


  /*
   * ============================================================
   * CHARGEMENT
   * ============================================================
   */

  if (chargement) {
  return (
    <main className="min-h-screen bg-[#f4f8fc]">
      

      <div className="ml-64 min-h-screen">
        <section className="max-w-7xl mx-auto px-6 py-20 text-center">
          <p className="text-gray-600 text-lg">
            Chargement de votre commande...
          </p>
        </section>
      </div>
    </main>
  );
}

  /*
   * ============================================================
   * ERREUR
   * ============================================================
   */

  if (erreur && !commande) {
  return (
    <main className="min-h-screen bg-[#f4f8fc]">
      <Sidebar utilisateur={utilisateur} />

      <div className="ml-64 min-h-screen">
        <section className="max-w-7xl mx-auto px-6 py-20">

          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-8 text-center">

            <h2 className="text-2xl font-bold">
              Impossible de charger la commande
            </h2>

            <p className="mt-3">
              {erreur}
            </p>

            <Link
              href="/commandes"
              className="inline-block mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-600 transition"
            >
              Mes commandes
            </Link>

          </div>

        </section>
      </div>
    </main>
  );
}

  /*
   * ============================================================
   * AFFICHAGE
   * ============================================================
   */

  const montantTotal = Number(
    commande?.montant_total || 0
  );

  return (
  <main className="min-h-screen bg-[#f4f8fc]">


    <div className="ml-64 min-h-screen">

      {/* HERO */}

      <section className="relative overflow-hidden bg-gradient-to-r from-[#eaf4ff] via-[#effaff] to-[#e9fbf7] border-b border-blue-100">

  <div className="absolute -right-20 -top-24 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />

  <div className="absolute right-40 bottom-[-100px] w-72 h-72 bg-cyan-200/20 rounded-full blur-3xl" />

  <div className="relative max-w-7xl mx-auto px-6 py-9">

    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

      <div>

        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
            ESPACE CLIENT
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Paiement de la commande
        </h1>

        <p className="mt-2 text-slate-600">
          Commande #{commande?.idCommande}
        </p>

      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-white rounded-2xl px-5 py-4 shadow-sm min-w-[230px]">

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Aujourd'hui
        </p>

        <p className="text-sm font-medium text-slate-700 mt-1 capitalize">
          {new Intl.DateTimeFormat("fr-FR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          }).format(dateHeure)}
        </p>

        <p className="text-2xl font-bold text-blue-700 mt-1">
          {dateHeure.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>

      </div>

    </div>

  </div>

</section>

      {/* ======================================================
          CONTENU
      ======================================================= */}

      <section className="max-w-7xl mx-auto px-6 py-10">

        {/* SUCCÈS */}

        {messageSucces && (
          <div className="mb-8 bg-green-50 border border-green-200 text-green-700 rounded-xl p-5">

            <p className="font-semibold">
              ✓ Paiement réussi
            </p>

            <p className="text-sm mt-1">
              {messageSucces}
            </p>

          </div>
        )}

        {/* ERREUR */}

        {erreur && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 rounded-xl p-5">

            <p className="font-medium">
              {erreur}
            </p>

          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ==================================================
              MODES DE PAIEMENT
          =================================================== */}

          <div className="lg:col-span-2">

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7">

              <h2 className="text-2xl font-bold text-gray-900">
                Choisissez votre mode de paiement
              </h2>

              <p className="text-gray-500 mt-2">
                Sélectionnez le moyen de paiement que vous
                souhaitez utiliser pour régler votre commande.
              </p>

              <div className="space-y-4 mt-7">

                {/* WAVE */}

                <button
                  type="button"
                  onClick={() =>
                    choisirModePaiement("Wave")
                  }
                  disabled={paiementEnCours}
                  className={`w-full text-left border rounded-xl p-5 transition ${
                    modePaiement === "Wave"
                      ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500"
                      : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                  }`}
                >

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                      W
                    </div>

                    <div>

                      <p className="font-bold text-gray-900">
                        Wave
                      </p>

                      <p className="text-sm text-gray-500">
                        Paiement mobile
                      </p>

                    </div>

                  </div>

                </button>

                {/* ORANGE MONEY */}

                <button
                  type="button"
                  onClick={() =>
                    choisirModePaiement("OrangeMoney")
                  }
                  disabled={paiementEnCours}
                  className={`w-full text-left border rounded-xl p-5 transition ${
                    modePaiement === "OrangeMoney"
                      ? "border-orange-500 bg-orange-50 ring-2 ring-orange-400"
                      : "border-gray-200 hover:border-orange-400 hover:bg-gray-50"
                  }`}
                >

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold">
                      OM
                    </div>

                    <div>

                      <p className="font-bold text-gray-900">
                        Orange Money
                      </p>

                      <p className="text-sm text-gray-500">
                        Paiement mobile
                      </p>

                    </div>

                  </div>

                </button>

                {/* CARTE */}

                <button
                  type="button"
                  onClick={() =>
                    choisirModePaiement("Carte")
                  }
                  disabled={paiementEnCours}
                  className={`w-full text-left border rounded-xl p-5 transition ${
                    modePaiement === "Carte"
                      ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500"
                      : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                  }`}
                >

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-lg bg-gray-800 text-white flex items-center justify-center">
                      💳
                    </div>

                    <div>

                      <p className="font-bold text-gray-900">
                        Carte bancaire
                      </p>

                      <p className="text-sm text-gray-500">
                        Visa, Mastercard, etc.
                      </p>

                    </div>

                  </div>

                </button>

              </div>

            </div>

          </div>

          {/* ==================================================
              RÉSUMÉ
          =================================================== */}

          <aside>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 sticky top-6">

              <h2 className="text-xl font-bold text-gray-900">
                Résumé de la commande
              </h2>

              <div className="border-t border-gray-200 mt-5 pt-5">

                <div className="flex justify-between text-gray-600">

                  <span>
                    Commande
                  </span>

                  <span className="font-semibold text-gray-900">
                    #{commande?.idCommande}
                  </span>

                </div>

                <div className="flex justify-between text-gray-600 mt-4">

                  <span>
                    Nombre de lignes
                  </span>

                  <span>
                    {commande?.lignes?.length || 0}
                  </span>

                </div>

              </div>

              <div className="border-t border-gray-200 mt-5 pt-5">

                <div className="flex justify-between items-center">

                  <span className="text-lg font-semibold text-gray-900">
                    Total à payer
                  </span>

                  <span className="text-2xl font-bold text-blue-700">
                    {montantTotal.toLocaleString(
                      "fr-FR"
                    )}{" "}
                    FCFA
                  </span>

                </div>

              </div>

              <button
  type="button"
  onClick={lancerPaiement}
  disabled={
    paiementEnCours ||
    !modePaiement
  }
  className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300"
>
  {paiementEnCours
    ? "Initialisation du paiement..."
    : `Payer ${montantTotal.toLocaleString("fr-FR")} FCFA`}
</button>

              <Link
                href={`/commandes/${id}`}
                className="block text-center mt-4 text-gray-500 hover:text-blue-600"
              >
                Retour à la commande
              </Link>

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