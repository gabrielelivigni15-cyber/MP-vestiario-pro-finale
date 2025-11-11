import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

function Articoli() {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [groups, setGroups] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [zoomImg, setZoomImg] = useState(null);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    gruppo: "",
    codice_fornitore: "",
    fornitore: "",
    taglia: "",
    prezzo_unitario: "",
    quantita: "",
    stagione: "Estiva",
    tipo: "T-shirt/Polo",
    foto_url: "",
  });

  const [newGroup, setNewGroup] = useState({
    gruppo: "",
    nome: "",
    stagione: "Estiva",
    tipo: "T-shirt/Polo",
    foto_url: "",
  });

  const [filters, setFilters] = useState({
    nome: "",
    gruppo: "",
    stagione: "",
    fornitore: "",
  });

  // 🔁 Carica articoli
  async function load() {
    const { data, error } = await supabase
      .from("articoli")
      .select("*")
      .order("nome", { ascending: true });
    if (error) return console.error(error);
    setRows(data || []);
    setFiltered(data || []);

    // 🔹 Popola elenco gruppi unici
    const uniqueGroups = [...new Set((data || []).map((r) => r.gruppo).filter(Boolean))];
    setGroups(uniqueGroups);
  }

  useEffect(() => {
    load();
  }, []);

  // 🔎 Filtri dinamici
  useEffect(() => {
    let res = [...rows];
    if (filters.nome)
      res = res.filter((r) => r.nome?.toLowerCase().includes(filters.nome.toLowerCase()));
    if (filters.gruppo)
      res = res.filter((r) => r.gruppo?.toLowerCase().includes(filters.gruppo.toLowerCase()));
    if (filters.fornitore)
      res = res.filter((r) => r.fornitore?.toLowerCase().includes(filters.fornitore.toLowerCase()));
    if (filters.stagione)
      res = res.filter(
        (r) =>
          r.stagione?.toLowerCase().trim() === filters.stagione.toLowerCase().trim()
      );
    setFiltered(res);
  }, [filters, rows]);

  // ➕ Aggiungi / modifica articolo
  async function onSubmit(e) {
    e.preventDefault();
    const payload = {
      nome: form.nome?.trim() || "",
      gruppo: form.gruppo?.trim() || "",
      codice_fornitore: form.codice_fornitore?.trim() || "",
      fornitore: form.fornitore?.trim() || "",
      taglia: form.taglia?.trim() || "",
      prezzo_unitario: parseFloat(form.prezzo_unitario) || 0,
      quantita: parseInt(form.quantita) || 0,
      stagione: form.stagione,
      tipo: form.tipo,
      foto_url: form.foto_url?.trim() || "",
    };

    if (!payload.gruppo) return alert("Seleziona o crea un gruppo prima di salvare.");

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
      gruppo: "",
      codice_fornitore: "",
      fornitore: "",
      taglia: "",
      prezzo_unitario: "",
      quantita: "",
      stagione: "Estiva",
      tipo: "T-shirt/Polo",
      foto_url: "",
    });
    await load();
  }

  // ➕ Nuovo gruppo
  async function creaNuovoGruppo(e) {
    e.preventDefault();
    if (!newGroup.gruppo || !newGroup.nome) return alert("Inserisci nome e codice gruppo.");

    const payload = {
      nome: newGroup.nome.trim(),
      gruppo: newGroup.gruppo.trim(),
      stagione: newGroup.stagione,
      tipo: newGroup.tipo,
      foto_url: newGroup.foto_url?.trim() || "",
      quantita: 0,
      prezzo_unitario: 0,
      codice_fornitore: "",
      fornitore: "",
      taglia: "",
    };

    const { error } = await supabase.from("articoli").insert([payload]);
    if (error) return alert(error.message);

    setShowNewGroupForm(false);
    setNewGroup({
      gruppo: "",
      nome: "",
      stagione: "Estiva",
      tipo: "T-shirt/Polo",
      foto_url: "",
    });
    await load();
  }

  // ✏️ Modifica
  function editRow(r) {
    setEditingId(r.id);
    setForm({
      nome: r.nome || "",
      gruppo: r.gruppo || "",
      codice_fornitore: r.codice_fornitore || "",
      fornitore: r.fornitore || "",
      taglia: r.taglia || "",
      prezzo_unitario: r.prezzo_unitario || "",
      quantita: r.quantita || "",
      stagione: r.stagione || "Estiva",
      tipo: r.tipo || "T-shirt/Polo",
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

  // 🔽 Raggruppamento per gruppo
  const grouped = filtered.reduce((acc, item) => {
    const key = item.gruppo || item.nome;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const toggleGroup = (key) => {
    const newSet = new Set(expandedGroups);
    newSet.has(key) ? newSet.delete(key) : newSet.add(key);
    setExpandedGroups(newSet);
  };

  return (
    <div className="container">
      {/* --- FORM ARTICOLI --- */}
      <div className="card">
        <h3>Gestione Articoli (Gruppi & Varianti)</h3>

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

          {/* SELECT BLOCCATA DEI GRUPPI */}
          <div style={{ display: "flex", gap: 8 }}>
            <select
              required
              value={form.gruppo}
              onChange={(e) => setForm({ ...form, gruppo: e.target.value })}
              style={{ flex: 1 }}
            >
              <option value="">Seleziona gruppo</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setShowNewGroupForm(true)}
            >
              ➕
            </button>
          </div>

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
            placeholder="Prezzo unitario (€)"
            type="number"
            step="0.01"
            value={form.prezzo_unitario}
            onChange={(e) => setForm({ ...form, prezzo_unitario: e.target.value })}
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
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option value="T-shirt/Polo">T-shirt/Polo</option>
            <option value="Pantaloni">Pantaloni</option>
            <option value="Gilet">Gilet</option>
          </select>
          <input
            placeholder="Foto URL"
            value={form.foto_url}
            onChange={(e) => setForm({ ...form, foto_url: e.target.value })}
          />

          <div style={{ gridColumn: "1/-1", textAlign: "right" }}>
            <button className="btn">
              {editingId ? "💾 Salva modifiche" : "➕ Aggiungi variante"}
            </button>
          </div>
        </form>
      </div>

      {/* --- FORM NUOVO GRUPPO --- */}
      {showNewGroupForm && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>➕ Nuovo Gruppo</h3>
          <form
            onSubmit={creaNuovoGruppo}
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}
          >
            <input
              required
              placeholder="Nome gruppo (es. Felpa MP)"
              value={newGroup.nome}
              onChange={(e) => setNewGroup({ ...newGroup, nome: e.target.value })}
            />
            <input
              required
              placeholder="Codice gruppo (es. FELPA-MP)"
              value={newGroup.gruppo}
              onChange={(e) => setNewGroup({ ...newGroup, gruppo: e.target.value })}
            />
            <input
              placeholder="Foto URL"
              value={newGroup.foto_url}
              onChange={(e) => setNewGroup({ ...newGroup, foto_url: e.target.value })}
            />
            <select
              value={newGroup.stagione}
              onChange={(e) => setNewGroup({ ...newGroup, stagione: e.target.value })}
            >
              <option value="Estiva">Estiva</option>
              <option value="Invernale">Invernale</option>
            </select>
            <select
              value={newGroup.tipo}
              onChange={(e) => setNewGroup({ ...newGroup, tipo: e.target.value })}
            >
              <option value="T-shirt/Polo">T-shirt/Polo</option>
              <option value="Pantaloni">Pantaloni</option>
              <option value="Gilet">Gilet</option>
            </select>

            <div style={{ gridColumn: "1/-1", textAlign: "right" }}>
              <button className="btn">💾 Crea gruppo</button>{" "}
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowNewGroupForm(false)}
              >
                ❌ Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- LISTA ARTICOLI --- */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Elenco Articoli Raggruppati</h3>

        <table className="table">
          <thead>
            <tr>
              <th>Gruppo</th>
              <th>Nome</th>
              <th>Totale quantità</th>
              <th>Stagione</th>
              <th>Foto</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([key, items]) => {
              const tot = items.reduce((s, x) => s + (x.quantita || 0), 0);
              const stagione = items[0]?.stagione || "-";
              const foto = items[0]?.foto_url || "";
              return (
                <>
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{items[0].nome}</td>
                    <td>{tot}</td>
                    <td>{stagione}</td>
                    <td>
                      {foto ? (
                        <img
                          src={foto}
                          alt={items[0].nome}
                          onClick={() => setZoomImg(foto)}
                          style={{
                            width: 50,
                            height: 50,
                            objectFit: "cover",
                            borderRadius: 6,
                            border: "1px solid #ddd",
                            cursor: "zoom-in",
                          }}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <button
                        className="btn secondary"
                        onClick={() => toggleGroup(key)}
                      >
                        {expandedGroups.has(key) ? "🔼 Nascondi" : "🔽 Espandi"}
                      </button>
                    </td>
                  </tr>
                  {expandedGroups.has(key) &&
                    items.map((r) => (
                      <tr key={r.id} style={{ background: "#fafafa" }}>
                        <td colSpan="2">
                          {r.taglia ? `Taglia ${r.taglia}` : "-"} — Cod. {r.codice_fornitore}
                        </td>
                        <td>{r.quantita}</td>
                        <td>{r.stagione}</td>
                        <td>
                          {r.foto_url ? (
                            <img
                              src={r.foto_url}
                              alt={r.nome}
                              onClick={() => setZoomImg(r.foto_url)}
                              style={{
                                width: 40,
                                height: 40,
                                objectFit: "cover",
                                borderRadius: 6,
                                border: "1px solid #ddd",
                                cursor: "zoom-in",
                              }}
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
                </>
              );
            })}
            {Object.keys(grouped).length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "#6b7280" }}>
                  Nessun articolo trovato
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

export default Articoli;
