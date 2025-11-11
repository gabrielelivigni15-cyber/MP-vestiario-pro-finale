import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function Assegna() {
  const [articoli, setArticoli] = useState([]);
  const [persone, setPersone] = useState([]);
  const [storico, setStorico] = useState([]);
  const [stagione, setStagione] = useState("");
  const [form, setForm] = useState({
    id_persona: "",
    id_articolo: "",
    quantita: 1,
    taglia: "",
  });

  // 🔁 Carica dati principali
  async function load() {
    let queryArticoli = supabase.from("articoli").select("*").order("nome");
    if (stagione) queryArticoli = queryArticoli.eq("stagione", stagione);

    const { data: a } = await queryArticoli;
    const { data: p } = await supabase.from("personale").select("*").order("nome");
    const { data: s } = await supabase
      .from("assegnazioni")
      .select("*")
      .order("id", { ascending: false });

    setArticoli(a || []);
    setPersone(p || []);
    setStorico(s || []);
  }

  useEffect(() => {
    load();
  }, [stagione]);

  // 🧮 Assegna articolo
  async function assegna(e) {
    e.preventDefault();
    if (!form.id_persona || !form.id_articolo)
      return alert("Seleziona persona e articolo");
    if (form.quantita <= 0) return alert("Quantità non valida");

    const articolo = articoli.find((a) => a.id === parseInt(form.id_articolo));
    if (!articolo) return alert("Articolo non trovato");
    if (articolo.quantita < form.quantita)
      return alert(`Quantità insufficiente. Disponibili: ${articolo.quantita}`);

    // 🔹 Calcola nuovo stock
    const nuovaQuantita = articolo.quantita - form.quantita;

    // 🔹 Inserisci assegnazione
    const payload = {
      id_persona: parseInt(form.id_persona),
      id_articolo: parseInt(form.id_articolo),
      prezzo_unitario: articolo.prezzo_unitario || 0, // ✅ nome colonna corretto
      quantita: parseInt(form.quantita),
      data_consegna: new Date().toISOString().split("T")[0],
    };

    const { error: insertError } = await supabase.from("assegnazioni").insert([payload]);
    if (insertError) return alert(insertError.message);

    // 🔹 Aggiorna quantità articolo
    const { error: updateError } = await supabase
      .from("articoli")
      .update({ quantita: nuovaQuantita })
      .eq("id", articolo.id);
    if (updateError) return alert(updateError.message);

    // 🔹 Reset form e ricarica
    setForm({ id_persona: "", id_articolo: "", quantita: 1, taglia: "" });
    await load();
  }

  return (
    <div className="container">
      {/* --- CARD ASSEGNAZIONE --- */}
      <div className="card">
        <h3>Gestione Assegnazioni Vestiario</h3>

        {/* FILTRO STAGIONE */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontWeight: "500", marginRight: 8 }}>Filtra per stagione:</label>
          <select
            value={stagione}
            onChange={(e) => setStagione(e.target.value)}
            style={{ padding: 6, borderRadius: 6, border: "1px solid #ccc" }}
          >
            <option value="">Tutte</option>
            <option value="Estiva">Estiva</option>
            <option value="Invernale">Invernale</option>
          </select>
        </div>

        {/* FORM ASSEGNA */}
        <form
          onSubmit={assegna}
          style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}
        >
          <select
            required
            value={form.id_persona}
            onChange={(e) => setForm({ ...form, id_persona: e.target.value })}
          >
            <option value="">Seleziona persona</option>
            {persone.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          <select
            required
            value={form.id_articolo}
            onChange={(e) => {
              const articolo = articoli.find((a) => a.id === parseInt(e.target.value));
              setForm({
                ...form,
                id_articolo: e.target.value,
                taglia: articolo?.taglia || "",
              });
            }}
          >
            <option value="">Seleziona articolo</option>
            {articoli.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} ({a.tipo}) – {a.stagione} [{a.quantita} disp.]
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Taglia"
            value={form.taglia}
            readOnly
            style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
          />

          <input
            type="number"
            placeholder="Quantità"
            min="1"
            value={form.quantita}
            onChange={(e) => setForm({ ...form, quantita: e.target.value })}
          />

          <div style={{ gridColumn: "1/-1", textAlign: "right" }}>
            <button className="btn">➕ Assegna</button>
          </div>
        </form>
      </div>

      {/* --- CARD STORICO --- */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Storico Assegnazioni</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Persona</th>
              <th>Articolo</th>
              <th>Taglia</th>
              <th>Tipo</th>
              <th>Stagione</th>
              <th>Quantità</th>
              <th>Prezzo Unitario</th>
              <th>Totale</th>
            </tr>
          </thead>
          <tbody>
            {storico.map((r) => {
              const persona = persone.find((p) => p.id === r.id_persona);
              const articolo = articoli.find((a) => a.id === r.id_articolo);
              return (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.data_consegna || "-"}</td>
                  <td>{persona?.nome || "-"}</td>
                  <td>{articolo?.nome || "-"}</td>
                  <td>{articolo?.taglia || "-"}</td>
                  <td>{articolo?.tipo || "-"}</td>
                  <td>{articolo?.stagione || "-"}</td>
                  <td>{r.quantita}</td>
                  <td>
                    {r.prezzo_unitario
                      ? `${parseFloat(r.prezzo_unitario).toFixed(2)} €`
                      : "-"}
                  </td>
                  <td>
                    {r.prezzo_unitario && r.quantita
                      ? `${(parseFloat(r.prezzo_unitario) * r.quantita).toFixed(2)} €`
                      : "-"}
                  </td>
                </tr>
              );
            })}
            {storico.length === 0 && (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: 12, color: "#6b7280" }}>
                  Nessuna assegnazione registrata
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
