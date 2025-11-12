// src/pages/Articoli.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function Articoli() {
  const [articoli, setArticoli] = useState([]);
  const [gruppi, setGruppi] = useState([]);
  const [form, setForm] = useState({
    nome_articolo: "",
    gruppo: "",
    fornitore: "",
    codice_fornitore: "",
    taglia: "",
    stagione: "Estiva",
    tipo: "T-shirt/Polo",
    prezzo_unitario: "",
    quantita: "",
    foto_url: "",
  });

  async function load() {
    // Carica articoli
    const { data: a } = await supabase
      .from("articoli")
      .select("*")
      .order("nome_capo", { ascending: true });
    setArticoli(a || []);

    // Gruppi derivati dal nome_capo (o "gruppo" se lo hai)
    const g = Array.from(
      new Set((a || []).map((x) => x.nome_capo || x.gruppo || x.nome_articolo || ""))
    ).filter(Boolean);
    setGruppi(g);
  }

  useEffect(() => { load(); }, []);

  const raggruppati = useMemo(() => {
    const map = new Map();
    for (const r of articoli) {
      const key = r.nome_capo || r.gruppo || r.nome_articolo || "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    return Array.from(map.entries()); // [ [gruppo, rows], ... ]
  }, [articoli]);

  async function addVariante() {
    if (!form.nome_articolo && !form.gruppo) {
      alert("Inserisci almeno Nome articolo o seleziona un Gruppo.");
      return;
    }
    const payload = {
      nome_capo: form.nome_articolo || form.gruppo,
      fornitore: form.fornitore || null,
      codice_fornitore: form.codice_fornitore || null,
      taglia: form.taglia || null,
      stagione: form.stagione,
      tipo: form.tipo,
      prezzo_unitario: form.prezzo_unitario ? Number(form.prezzo_unitario) : null,
      quantita: form.quantita ? Number(form.quantita) : 0,
      foto_url: form.foto_url || null,
    };
    const { error } = await supabase.from("articoli").insert([payload]);
    if (error) return alert(error.message);
    setForm({
      nome_articolo: "",
      gruppo: "",
      fornitore: "",
      codice_fornitore: "",
      taglia: "",
      stagione: "Estiva",
      tipo: "T-shirt/Polo",
      prezzo_unitario: "",
      quantita: "",
      foto_url: "",
    });
    load();
  }

  return (
    <div>
      <div className="card">
        <h3>Gestione Articoli (Gruppi & Varianti)</h3>

        {/* 👇 FORM IN GRIGLIA: niente più sovrapposizioni */}
        <div className="form-grid">
          <input
            placeholder="Nome articolo"
            value={form.nome_articolo}
            onChange={(e) => setForm({ ...form, nome_articolo: e.target.value })}
          />

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={form.gruppo}
              onChange={(e) => setForm({ ...form, gruppo: e.target.value })}
              style={{ flex: 1 }}
            >
              <option value="">Seleziona gruppo</option>
              {gruppi.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            {/* opzionale: pulsante aggiungi gruppo se usi un modal */}
            {/* <button className="btn secondary">+</button> */}
          </div>

          <input
            placeholder="Fornitore"
            value={form.fornitore}
            onChange={(e) => setForm({ ...form, fornitore: e.target.value })}
          />

          <input
            placeholder="Codice fornitore"
            value={form.codice_fornitore}
            onChange={(e) => setForm({ ...form, codice_fornitore: e.target.value })}
          />

          <input
            placeholder="Quantità"
            type="number"
            value={form.quantita}
            onChange={(e) => setForm({ ...form, quantita: e.target.value })}
          />

          <input
            placeholder="Prezzo unitario (€)"
            type="number"
            step="0.01"
            value={form.prezzo_unitario}
            onChange={(e) => setForm({ ...form, prezzo_unitario: e.target.value })}
          />

          <select
            value={form.stagione}
            onChange={(e) => setForm({ ...form, stagione: e.target.value })}
          >
            <option>Estiva</option>
            <option>Invernale</option>
          </select>

          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option>T-shirt/Polo</option>
            <option>Pantaloni</option>
            <option>Gilet</option>
          </select>

          <input
            placeholder="Taglia"
            value={form.taglia}
            onChange={(e) => setForm({ ...form, taglia: e.target.value })}
          />

          <input
            placeholder="Foto URL"
            value={form.foto_url}
            onChange={(e) => setForm({ ...form, foto_url: e.target.value })}
          />
        </div>

        <div style={{ marginTop: 14, textAlign: "right" }}>
          <button className="btn" onClick={addVariante}>➕ Aggiungi variante</button>
        </div>
      </div>

      <div className="card">
        <h3>Elenco Articoli Raggruppati</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Gruppo</th>
              <th>Nome</th>
              <th>Totale quantità</th>
              <th>Stagione</th>
              <th>Foto</th>
            </tr>
          </thead>
          <tbody>
            {raggruppati.map(([group, rows]) => {
              const totale = rows.reduce((sum, r) => sum + (r.quantita || 0), 0);
              const stagione = rows[0]?.stagione || "-";
              const foto = rows[0]?.foto_url || null;
              return (
                <tr key={group}>
                  <td>{group}</td>
                  <td>{rows[0]?.nome_capo || rows[0]?.nome_articolo || "-"}</td>
                  <td>{totale}</td>
                  <td>{stagione}</td>
                  <td>{foto ? <img src={foto} alt="" style={{ height: 40 }} /> : "-"}</td>
                </tr>
              );
            })}
            {raggruppati.length === 0 && (
              <tr><td colSpan="5" className="muted">Nessun articolo presente</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
