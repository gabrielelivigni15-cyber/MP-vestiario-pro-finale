import React, { useState } from "react";
import { supabase } from "../lib/supabase.js";
import BarcodeScannerComponent from "react-webcam-barcode-scanner";

export default function Scanner() {
  const [data, setData] = useState(null);
  const [articolo, setArticolo] = useState(null);
  const [error, setError] = useState("");

  // 🔎 Ricerca articolo in base al codice
  async function cercaArticolo(codice) {
    setError("");
    setArticolo(null);
    if (!codice) return;

    const { data, error } = await supabase
      .from("articoli")
      .select("*")
      .eq("codice_fornitore", codice)
      .single();

    if (error || !data) {
      setError("Nessun articolo trovato per questo codice");
      return;
    }

    setArticolo(data);
  }

  return (
    <div className="container">
      <div className="card">
        <h3>📷 Scansione codice articolo</h3>
        <p style={{ marginBottom: 10, color: "#555" }}>
          Inquadra il codice fornitore o QR dell'articolo.  
          Il sistema lo riconoscerà automaticamente.
        </p>

        <div
          style={{
            width: "100%",
            maxWidth: 400,
            margin: "0 auto",
            borderRadius: 12,
            overflow: "hidden",
            border: "2px solid #ccc",
          }}
        >
          <BarcodeScannerComponent
            width="100%"
            height={300}
            onUpdate={(err, result) => {
              if (result) {
                setData(result.text);
                cercaArticolo(result.text.trim());
              }
            }}
          />
        </div>

        {data && (
          <div
            style={{
              marginTop: 16,
              padding: 10,
              border: "1px solid #ddd",
              borderRadius: 8,
              background: "#f9fafb",
            }}
          >
            <b>Codice rilevato:</b> {data}
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 12,
              color: "red",
              background: "#fee2e2",
              borderRadius: 8,
              padding: 10,
              border: "1px solid #fecaca",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {articolo && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#ecfdf5",
              border: "1px solid #86efac",
              borderRadius: 8,
              padding: 10,
            }}
          >
            {articolo.foto_url && (
              <img
                src={articolo.foto_url}
                alt={articolo.nome}
                style={{
                  width: 70,
                  height: 70,
                  objectFit: "cover",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                }}
              />
            )}
            <div>
              <h4 style={{ margin: 0 }}>{articolo.nome}</h4>
              <div>
                <b>Taglia:</b> {articolo.taglia || "-"} | <b>Gruppo:</b>{" "}
                {articolo.gruppo || "-"}
              </div>
              <div>
                <b>Quantità:</b> {articolo.quantita} | <b>Prezzo:</b>{" "}
                {articolo.prezzo_unitario} €
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
