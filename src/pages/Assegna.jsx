import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function Assegna() {
  const [personale, setPersonale] = useState([]);
  const [articoli, setArticoli] = useState([]);
  const [assegnazioni, setAssegnazioni] = useState([]);
  const [formData, setFormData] = useState({
    id_persona: "",
    id_articolo: "",
    quantita: 1,
  });
  const [editId, setEditId] = useState(null);

  // --- FETCH DATI ---
  useEffect(() => {
    loadData();

    const ch = supabase
      .channel("assegnazioni-realtime")
      .on("postgres_changes", { event: "*", schema: "public" }, () => loadData())
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  async function loadData() {
    const { data: pers } = await supabase.from("personale").select("*").order("id");
    const { data: art } = await supabase.from("articoli").select("*").order("id");
    const { data: ass } = await supabase
      .from("assegnazioni")
      .select("*, personale(nome), articoli(nome_capo)")
      .order("id", { ascending: false });

    setPersonale(pers || []);
    setArticoli(art || []);
    setAssegnazioni(ass || []);
  }

  // --- SALVA / MODIFICA ---
  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.id_persona || !formData.id_articolo) {
      alert("Seleziona persona e articolo");
      return;
    }

    const articolo = articoli.find((a) => a.id === Number(formData.id_articolo));
    if (!articolo) return alert("Articolo non trovato");
    if (!editId && articolo.quantita < formData.quantita)
      return alert("Quantità non disponibile");

    if (editId) {
      const old = assegnazioni.find((a) => a.id === editId);
      const diff = formData.quantita - old.quantita;
      const newQty = articolo.quantita - diff;
      if (newQty < 0) return alert("Quantità insufficiente");

      await supabase
        .from("assegnazioni")
        .update({
          id_persona: Number(formData.id_persona),
          id_articolo: Number(formData.id_articolo),
          quantita: formData.quantita,
        })
        .eq("id", editId);

      await supabase.from("articoli").update({ quantita: newQty }).eq("id", articolo.id);
      setEditId(null);
    } else {
      await supabase.from("assegnazioni").insert([
        {
          id_persona: Number(formData.id_persona),
          id_articolo: Number(formData.id_articolo),
          quantita: formData.quantita,
          data_consegna: new Date().toISOString().split("T")[0],
        },
      ]);
      await supabase
        .from("articoli")
        .update({ quantita: articolo.quantita - formData.quantita })
        .eq("id", articolo.id);
    }

    setFormData({ id_persona: "", id_articolo: "", quantita: 1 });
    loadData();
  }

  // --- ELIMINA ---
  async function handleDelete(a) {
    if (!confirm("Eliminare questa assegnazione?")) return;

    const articolo = articoli.find((x) => x.id === a.id_articolo);
    if (articolo) {
      await supabase
        .from("articoli")
        .update({ quantita: articolo.quantita + a.quantita })
        .eq("id", articolo.id);
    }

    await supabase.from("assegnazioni").delete().eq("id", a.id);
    loadData();
  }

  // --- MODIFICA ---
  function handleEdit(a) {
    setEditId(a.id);
    setFormData({
      id_persona: a.id_persona,
      id_articolo: a.id_articolo,
      quantita: a.quantita,
    });
  }

  return (
    <div className="container">
      {/* --- FORM ASSEGNAZIONE --- */}
      <div className="card">
        <h3>{editId ? "✏️ Modifica Assegnazione" : "➕ Nuova Assegnazione"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Dipendente</label>
            <select
              value={formData.id_persona}
              onChange={(e) =>
                setFormData({ ...formData, id_persona: e.target.value })
              }
              required
            >
              <option value="">Seleziona personale</option>
              {personale.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Articolo</label>
            <select
              value={formData.id_articolo}
              onChange={(e) =>
                setFormData({ ...formData, id_articolo: e.target.value })
              }
              required
            >
              <option value="">Seleziona articolo</option>
              {articoli.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome_capo} ({a.quantita} disp.)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quantità</label>
            <input
              type="number"
              value={formData.quantita}
              onChange={(e) =>
                setFormData({ ...formData, quantita: Number(e.target.value) })
              }
              min="1"
              required
            />
          </div>

          <button type="submit" className="btn">
            {editId ? "💾 Salva modifiche" : "➕ Assegna"}
          </button>
        </form>
      </div>

      {/* --- STORICO --- */}
      <table className="table" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Dipendente</th>
            <th>Articolo</th>
            <th>Quantità</th>
            <th>Data consegna</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {assegnazioni.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: 12 }}>
                Nessuna assegnazione presente
              </td>
            </tr>
          ) : (
            assegnazioni.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.personale?.nome || "-"}</td>
                <td>{a.articoli?.nome_capo || "-"}</td>
                <td>{a.quantita}</td>
                <td>{a.data_consegna}</td>
                <td>
                  <button className="btn secondary" onClick={() => handleEdit(a)}>
                    ✏️
                  </button>{" "}
                  <button className="btn secondary" onClick={() => handleDelete(a)}>
                    ❌
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
