import React, { useState } from "react";
import { QrScanner } from "@yudiel/react-qr-scanner";
import { supabase } from "../lib/supabase.js";

export default function Scanner() {
  const [scanResult, setScanResult] = useState("");
  const [articoli, setArticoli] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function cercaArticolo(codice) {
    if (!codice) return;
    setLoading(true);
    setError("");
    setArticoli([]);

    const { data: result, error } = await supabase
      .from("articoli")
      .select("*")
      .eq("codice_fornitore", codice);

    setLoading(false);

    if (error) {
      console.error(error);
      setError("Errore nel recupero dati da Supabase");
      return;
    }

    if (!result || result.length === 0) {
      setError("Nessun articolo trovato per questo codice");
      return;
    }

    setArticoli(result);
  }

  return (
    <div className="container">
      <div className="card">
        <h3>📷 Scanner codici articolo</h3>
        <p className="muted">
          Inquadra un codice fornitore per visualizzare i dettagli del capo.
        </p>

        <div
          style={{
            maxWidth: 500,
            margin: "0 auto",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <QrScanner
            onDecode={(result) => {
              if (result && result !== scanResult) {
                setScanResult(result);
                cercaArticolo(result.trim());
              }
            }}
            onError={(err) => console.error(err)}
            style={{ width: "100%", height: 300 }}
          />
        </div>

        {loading && (
          <div style={{ marginTop: 20, color: "#2563eb", fontWeight: 600 }}>
            🔄 Ricerca in corso...
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 20,
              color: "#b91c1c",
              background: "#fee2e2",
              borderRadius: 8,
              padding: 10,
              fontWeight: 500,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {articoli.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h4>
              {articoli.length > 1
                ? `Trovate ${articoli.length} varianti per questo codice`
                : `Articolo trovato`}
            </h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 16,
                marginTop: 12,
              }}
            >
              {articoli.map((a) => (
                <div
                  key={a.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 10,
                    background: "#f9fafb",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    transition: "0.2s",
                  }}
                >
                  {a.foto_url && (
                    <img
                      src={a.foto_url}
                      alt={a.nome}
                      style={{
                        width: "100%",
                        height: 130,
                        objectFit: "cover",
                        borderRadius: 8,
                        marginBottom: 6,
                      }}
                    />
                  )}
                  <b>{a.nome}</b>
                  <div className="muted">Taglia: {a.taglia || "-"}</div>
                  <div className="muted">Gruppo: {a.gruppo || "-"}</div>
                  <div className="muted">Stagione: {a.stagione || "-"}</div>
                  <div style={{ marginTop: 6 }}>
                    <b>Quantità:</b> {a.quantita ?? 0}
                  </div>
                  <div>
                    <b>Prezzo:</b> €{a.prezzo_unitario?.toFixed(2) ?? "0.00"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
