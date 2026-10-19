"use client";

import { useState } from "react";
import Link from "next/link";
import api from "../../services/api";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setErreur("");
    setChargement(true);

    try {
      const response = await api.post(
        "/auth/mot-de-passe-oublie/",
        {
          email: email.trim(),
        }
      );

      setMessage(response.data.message);
      setEmail("");
    } catch (error) {
      console.error(
        "Erreur de réinitialisation :",
        error
      );

      setErreur(
        error.response?.data?.message ||
        "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setChargement(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <Link href="/" className="group">
            <h1 className="text-2xl font-bold text-blue-700 group-hover:text-blue-800">
              Dispositif médical
            </h1>

            <p className="text-sm text-gray-500">
              Vente de dispositifs médicaux
            </p>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600"
            >
              Accueil
            </Link>

            <Link
              href="/produits"
              className="text-gray-700 hover:text-blue-600"
            >
              Produits
            </Link>
          </nav>

        </div>
      </header>

      {/* FORMULAIRE */}
      <section className="min-h-[calc(100vh-90px)] flex items-center justify-center px-6 py-12">

        <div className="w-full max-w-md">

          <div className="bg-white rounded-2xl border shadow-sm p-8">

            {/* TITRE */}
            <div className="text-center mb-8">

              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">
                  🔐
                </span>
              </div>

              <h2 className="text-3xl font-bold text-gray-900">
                Mot de passe oublié ?
              </h2>

              <p className="text-gray-500 mt-2">
                Entrez votre adresse email pour recevoir
                un lien de réinitialisation.
              </p>

            </div>

            {/* MESSAGE DE SUCCÈS */}
            {message && (
              <div className="mb-5 bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 text-sm">
                {message}
              </div>
            )}

            {/* ERREUR */}
            {erreur && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                {erreur}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Adresse email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* BOUTON */}
              <button
                type="submit"
                disabled={chargement}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {chargement
                  ? "Envoi en cours..."
                  : "Envoyer le lien de réinitialisation"}
              </button>

            </form>

            {/* RETOUR CONNEXION */}
            <div className="text-center mt-6 pt-6 border-t">

              <Link
                href="/connexion"
                className="text-blue-600 font-semibold hover:text-blue-700"
              >
                ← Retour à la connexion
              </Link>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}