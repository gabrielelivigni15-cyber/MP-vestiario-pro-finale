import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { supabase } from "../lib/supabase.js";

export default function Scanner() {
  const videoRef = useRef(null);
  const [articoli, setArticoli] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [cameraFacingMode, setCameraFacingMode] = useState("environment"); // preferisci posteriore

  async function cercaArticolo(codice) {
    if (!codice) return;
    setError("");
    setArticoli([]);

    const { data: result, error } = await supabase
      .from("articoli")
      .select("*")
      .eq("codice_fornitore", codice.trim());

    if (error) {
      console.error(error);
      setError("Errore nel recupero dati da Supabase");
      return;
    }

    if (!result || result.length === 0) {
      setError(`Nessun articolo trovato per codice: ${codice}`);
      return;
    }

    setArticoli(result);
  }

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let currentStream;

    async function startScanner() {
      try {
        setScanning(true);
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        const deviceId =
          videoInputDevices.find((d) =>
            cameraFacingMode === "environment"
              ? d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear")
              : d.label.toLowerCase().includes("front")
          )?.deviceId || videoInputDevices[0]?.deviceId;

        if (!deviceId) throw new Error("Nessuna fotocamera disponibile");

        currentStream = await codeReader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, err) => {
            if (result) {
              const codice = result.getText();
              if (codice) {
                console.log("Codice letto:", codice);
                cercaArticolo(codice);
                codeReader.reset(); // ferma scanner dopo lettura
                setScanning(false);
              }
            }
          }
        );
      } catch (err) {
        console.error(err);
        setError("Errore nell'avvio della fotocamera");
      }
    }

    startScanner();
    return () => {
      codeReader.reset();
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraFacingMode]);

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      <div className="card" style={{ padding: 16 }}>
        <h3>📷 Scanner universale codici</h3>
        <p className="muted">
          Inquadra un codice QR o a barre per cercare il capo nel database.
        </p>

        {/* Area video */}
        <div
          style={{
            width: "100%",
            maxWidth: 500,
            aspectRatio: "4 / 3",
            margin: "0 auto",
            borderRadius: 12,
            overflow: "hidden",
            background: "#000",
            position: "relative",
          }}
        >
          <video
            ref={videoRef}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            muted
            playsInline
          />
          {!scanning && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
              }}
            >
              Attivazione scanner...
            </div>
          )}
        </div>

        {/* Cambia fotocamera */}
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button
            className="btn"
            onClick={() =>
              setCameraFacingMode((prev) =>
                prev === "environment" ? "user" : "environment"
              )
            }
          >
            🔄 Cambia fotocamera (
            {cameraFacingMode === "environment" ? "Posteriore" : "Frontale"})
          </button>
        </div>

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
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(220px, 1fr))",
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
                  <button
                    style={{
                      width: "100%",
                      marginTop: 10,
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 0",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onClick={() =>
                      alert(
                        `Assegna capo:\n${a.nome} - Taglia ${a.taglia || "-"}`
                      )
                    }
                  >
                    ➕ Assegna questo capo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
