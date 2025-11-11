import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function Articoli() {
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [zoomImg, setZoomImg] = useState(null); // 🔍 immagine ingrandita
  const [form, setForm] = useState({
    nome: "",
    codice_fornitore: "",
    fornitore: "",
    taglia: "",
    prezzo: "",
    quantita: "",
    stagione: "Estiva",
    foto_url: "",
  });

  // 🔁 Carica articoli
  async function load() {
    const { data, error } = await supabase
      .from("articoli")
      .select("*")
      .order("id", { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    setRows(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  // 🔥 Realtime aggiornamento automatico
  useEffect(() => {
    const ch = supabase
      .channel("public:articoli")
      .on("postgres_changes", { event: "*", schema: "public" }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  // ➕ Aggiungi o modifica
  async function onSubmit(e) {
    e.preventDefault();
    const payload = {
      nome: form.nome?.trim() || "",
      codice_fornitore: form.codice_fornitore?.trim() || "",
      fornitore: form.fornitore?.trim() || "",
      taglia: form.taglia?.trim() || "",
      prezzo: parseFloat(form.prezzo) || 0,
      quantita: parseInt(form.quantita) || 0,
      stagione: form.stagione,
      foto_url: form.foto_url?.trim() || "",
    };

    if (editingId) {
      const { error } = await supabase.from("articoli").update(payload).eq("id", editingId);
      if (error) return alert(error.message);
      setEditingId(null);
    } else {
      const { error } = await supabase.from("articoli").insert([payload]);
      if (error) return alert(error.message);
    }

    setForm({
      nome: "",
      codice_fornitore: "",
      fornitore: "",
      taglia: "",
      prezzo: "",
      quantita: "",
      stagione: "Estiva",
      foto_url: "",
    });
    await load();
  }

  // ✏️ Modifica
  function editRow(r) {
    setEditingId(r.id);
    setForm({
      nome: r.nome || "",
      codice_fornitore: r.codice_fornitore || "",
      fornitore: r.fornitore || "",
      taglia: r.taglia || "",
      prezzo: r.prezzo || "",
      quantita: r.quantita || "",
      stagione: r.stagione || "Estiva",
      foto_url: r.foto_url || "",
    });
  }

  // ❌ Elimina
  async function removeRow(id) {
    if (!confirm("Eliminare questo articolo?")) return;
    const { error } = await supabase.from("articoli").delete().eq("id", id);
    if (error) return alert(error.message);
    await load();
  }

  return (
    <div className="container">
      {/* --- CARD GESTIONE ARTICOLI --- */}
      <div className="card">
        <h3>Gestione articoli</h3>

        <form
          onSubmit={onSubmit}
          style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}
        >
          <input
            required
            placeholder="Nome articolo"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <input
            placeholder="Codice fornitore"
            value={form.codice_fornitore}
            onChange={(e) => setForm({ ...form, codice_fornitore: e.target.value })}
          />
          <input
            placeholder="Fornitore"
            value={form.fornitore}
            onChange={(e) => setForm({ ...form, fornitore: e.target.value })}
          />
          <input
            placeholder="Taglia"
            value={form.taglia}
            onChange={(e) => setForm({ ...form, taglia: e.target.value })}
          />
          <input
            placeholder="Prezzo (€)"
            type="number"
            step="0.01"
            value={form.prezzo}
            onChange={(e) => setForm({ ...form, prezzo: e.target.value })}
          />
          <input
            placeholder="Quantità"
            type="number"
            value={form.quantita}
            onChange={(e) => setForm({ ...form, quantita: e.target.value })}
          />
          <select
            value={form.stagione}
            onChange={(e) => setForm({ ...form, stagione: e.target.value })}
          >
            <option value="Estiva">Estiva</option>
            <option value="Invernale">Invernale</option>
          </select>
          <input
            placeholder="Foto URL"
            value={form.foto_url}
            onChange={(e) => setForm({ ...form, foto_url: e.target.value })}
          />

          <div style={{ gridColumn: "1/-1", textAlign: "right" }}>
            <button className="btn">
              {editingId ? "💾 Salva modifiche" : "➕ Aggiungi"}
            </button>
          </div>
        </form>
      </div>

      {/* --- CARD ELENCO ARTICOLI --- */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Elenco articoli</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Cod. Fornitore</th>
              <th>Fornitore</th>
              <th>Taglia</th>
              <th>Prezzo</th>
              <th>Quantità</th>
              <th>Stagione</th>
              <th>Foto</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.nome}</td>
                <td>{r.codice_fornitore}</td>
                <td>{r.fornitore}</td>
                <td>{r.taglia}</td>
                <td>{r.prezzo ? `${parseFloat(r.prezzo).toFixed(2)} €` : "-"}</td>
                <td>{r.quantita ?? 0}</td>
                <td>{r.stagione}</td>
                <td>
                  {r.foto_url ? (
                    <img
                      src={r.foto_url}
                      alt={r.nome}
                      onClick={() => setZoomImg(r.foto_url)}
                      style={{
                        width: 50,
                        height: 50,
                        objectFit: "cover",
                        borderRadius: 6,
                        border: "1px solid #ddd",
                        cursor: "zoom-in",
                        transition: "transform 0.2s",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                      onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  <button className="btn secondary" onClick={() => editRow(r)}>
                    ✏️ Modifica
                  </button>{" "}
                  <button className="btn secondary" onClick={() => removeRow(r.id)}>
                    ❌ Elimina
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: 12, color: "#6b7280" }}>
                  Nessun articolo presente
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODALE ZOOM FOTO --- */}
      {zoomImg && (
        <div
          onClick={() => setZoomImg(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            cursor: "zoom-out",
          }}
        >
          <img
            src={zoomImg}
            alt="Zoom"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: 10,
              boxShadow: "0 0 20px rgba(0,0,0,0.5)",
              border: "2px solid white",
            }}
          />
        </div>
      )}
    </div>
  );
}
