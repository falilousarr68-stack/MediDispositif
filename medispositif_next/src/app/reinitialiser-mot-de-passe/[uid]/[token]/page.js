"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ReinitialiserMotDePassePage() {
    const params = useParams();
    const router = useRouter();

    const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [message, setMessage] = useState("");
    const [erreur, setErreur] = useState("");
    const [chargement, setChargement] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setErreur("");

        if (nouveauMotDePasse !== confirmation) {
            setErreur("Les deux mots de passe ne correspondent pas.");
            return;
        }

        if (nouveauMotDePasse.length < 8) {
            setErreur(
                "Le nouveau mot de passe doit contenir au moins 8 caractères."
            );
            return;
        }

        setChargement(true);

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/api/auth/mot-de-passe-reinitialisation/",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        uid: params.uid,
                        token: params.token,
                        nouveau_mot_de_passe: nouveauMotDePasse,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setErreur(
                    data.message ||
                    "Le lien de réinitialisation est invalide ou expiré."
                );
                return;
            }

            setMessage(data.message);

            setTimeout(() => {
                router.push("/connexion");
            }, 2000);

        } catch (error) {
            setErreur(
                "Impossible de contacter le serveur. Vérifiez que Django est démarré."
            );
        } finally {
            setChargement(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f5f7fa",
                padding: "20px",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "450px",
                    backgroundColor: "#ffffff",
                    padding: "35px",
                    borderRadius: "15px",
                    boxShadow: "0 5px 25px rgba(0,0,0,0.08)",
                }}
            >
                <h1
                    style={{
                        textAlign: "center",
                        marginBottom: "10px",
                        color: "#111827",
                    }}
                >
                    Réinitialiser le mot de passe
                </h1>

                <p
                    style={{
                        textAlign: "center",
                        color: "#666",
                        marginBottom: "30px",
                    }}
                >
                    Entrez votre nouveau mot de passe.
                </p>

                <form onSubmit={handleSubmit}>

                    <div style={{ marginBottom: "20px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "600",
                                color: "#374151",
                            }}
                        >
                            Nouveau mot de passe
                        </label>

                        <input
                            type="password"
                            value={nouveauMotDePasse}
                            onChange={(e) =>
                                setNouveauMotDePasse(e.target.value)
                            }
                            placeholder="Minimum 8 caractères"
                            required
                            style={{
                                width: "100%",
                                padding: "12px",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                fontSize: "15px",
                                color: "#111827",
                                WebkitTextFillColor: "#111827",
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "600",
                                color: "#374151",
                            }}
                        >
                            Confirmer le mot de passe
                        </label>

                        <input
                            type="password"
                            value={confirmation}
                            onChange={(e) =>
                                setConfirmation(e.target.value)
                            }
                            placeholder="Confirmez votre mot de passe"
                            required
                            style={{
                                width: "100%",
                                padding: "12px",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                fontSize: "15px",
                                color: "#111827",
                                WebkitTextFillColor: "#111827",
                            }}
                        />
                    </div>

                    {erreur && (
                        <div
                            style={{
                                backgroundColor: "#fee2e2",
                                color: "#b91c1c",
                                padding: "12px",
                                borderRadius: "8px",
                                marginBottom: "20px",
                            }}
                        >
                            {erreur}
                        </div>
                    )}

                    {message && (
                        <div
                            style={{
                                backgroundColor: "#dcfce7",
                                color: "#15803d",
                                padding: "12px",
                                borderRadius: "8px",
                                marginBottom: "20px",
                            }}
                        >
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={chargement}
                        style={{
                            width: "100%",
                            padding: "13px",
                            border: "none",
                            borderRadius: "8px",
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            fontSize: "16px",
                            fontWeight: "600",
                            cursor: chargement
                                ? "not-allowed"
                                : "pointer",
                        }}
                    >
                        {chargement
                            ? "Réinitialisation..."
                            : "Réinitialiser le mot de passe"}
                    </button>

                </form>
            </div>
        </div>
    );
}