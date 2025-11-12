// src/pages/Scanner.jsx
import React, { useEffect, useRef, useState } from "react";

// Polyfill (alcuni browser desktop non hanno BarcodeDetector)
let BD = window.BarcodeDetector;
if (!BD) {
  // opzionale: puoi importare un polyfill se vuoi
  // import("barcode-detector-polyfill").then((m) => (BD = m.BarcodeDetector));
}

export default function Scanner() {
  const videoRef = useRef(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let stream;
    let raf;
    let detector;

    async function start() {
      try {
        detector = BD ? new BD({ formats: ["code_128", "ean_13", "ean_8", "qr_code"] }) : null;
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const loop = async () => {
          if (!videoRef.current) return;
          if (detector) {
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes && codes.length) {
                setResult(codes[0].rawValue || "");
                stop(); // ferma lo stream dopo il rilevamento
                return;
              }
            } catch (_) {}
          }
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch (e) {
        setError("Impossibile accedere alla fotocamera.");
        console.error(e);
      }
    }

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };

    start();
    return () => stop();
  }, []);

  return (
    <div className="card">
      <h3>Scanner</h3>
      <video ref={videoRef} style={{ width: "100%", borderRadius: 10 }} muted playsInline />
      <div style={{ marginTop: 10 }}>
        {result ? <b>📦 Codice rilevato: {result}</b> : <span className="muted">Inquadra un codice…</span>}
        {error && <div style={{ color: "#b30e0e", marginTop: 6 }}>{error}</div>}
      </div>
    </div>
  );
}
