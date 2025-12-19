import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function Articoli() {
  const [articoli, setArticoli] = useState([]);
  const [gruppi, setGruppi] = useState([]);
  const [openGruppi, setOpenGruppi] = useState({});
  const [form, setForm] = useState({
    nome: "",
    fornitore: "",
    codice_fornitore: "",
    prezzo_unitario: "",
    quantita: "",
    foto_url: "",
    stagione: "Estiva",
    tipo: "T-shirt/Polo",
    gruppo: "",
    taglia: "",
  });

  // 🔁 Carica articoli e gruppi
  async function load() {
    const { data: articoliData } = await supabase
      .from("articoli")
      .select("*")
      .order("id", { ascending: true });
    setArticoli(articoliData || []);

    const { data: gruppiData } = await supabase
      .from("articoli")
      .select("gruppo")
      .not("gruppo", "is", null)
      .order("gruppo", { ascending: true });
    const unici = [...new Set(gruppiData.map((g) => g.gruppo))];
    setGruppi(unici);
  }

  useEffect(() => {
    load();
  }, []);

  function toggleGruppo(nome) {
    setOpenGruppi((prev) => ({ ...prev, [nome]: !prev?.[nome] }));
  }

  async function canDeleteArticolo(id_articolo) {
    // Se ci sono assegnazioni legate a quell'articolo, meglio non eliminarlo
    const { count, error } = await supabase
      .from("assegnazioni")
      .select("id", { count: "exact", head: true })
      .eq("id_articolo", id_articolo);
    if (error) return { ok: false, msg: error.message };
    if ((count || 0) > 0)
      return {
        ok: false,
        msg: "Non posso cancellare: esistono assegnazioni collegate a questo articolo.",
      };
    return { ok: true };
  }

  async function eliminaArticolo(articolo) {
    if (!confirm(`Vuoi cancellare la variante "${articolo.nome}" (${articolo.taglia || "-"})?`))
      return;

    const check = await canDeleteArticolo(articolo.id);
    if (!check.ok) return alert(check.msg);

    const { error } = await supabase.from("articoli").delete().eq("id", articolo.id);
    if (error) return alert(error.message);
    await load();
  }

  async function eliminaGruppo(nomeGruppo) {
    if (!nomeGruppo) return;
    const articoliDelGruppo = articoli.filter((a) => a.gruppo === nomeGruppo);
    if (articoliDelGruppo.length === 0) return;

    if (
      !confirm(
        `Vuoi cancellare l'intero gruppo "${nomeGruppo}"? Verranno eliminate ${articoliDelGruppo.length} varianti.`
      )
    )
      return;

    // blocca se una delle varianti è già assegnata
    for (const a of articoliDelGruppo) {
      const check = await canDeleteArticolo(a.id);
      if (!check.ok)
        return alert(
          `${check.msg}\n\nGruppo: ${nomeGruppo}\nVariante bloccante: ${a.nome} (${a.taglia || "-"})`
        );
    }

    const ids = articoliDelGruppo.map((a) => a.id);
    const { error } = await supabase.from("articoli").delete().in("id", ids);
    if (error) return alert(error.message);
    await load();
  }

  // ➕ Aggiungi articolo
  async function aggiungiVariante() {
    if (!form.nome || !form.tipo) {
      alert("Inserisci almeno il nome e il tipo di articolo");
      return;
    }
    const { error } = await supabase.from("articoli").insert([form]);
    if (error) return alert(error.message);
    setForm({
      nome: "",
      fornitore: "",
      codice_fornitore: "",
      prezzo_unitario: "",
      quantita: "",
      foto_url: "",
      stagione: "Estiva",
      tipo: "T-shirt/Polo",
      gruppo: "",
      taglia: "",
    });
    load();
  }

  // ➕ Aggiungi gruppo nuovo
  async function aggiungiGruppo() {
    const nomeGruppo = prompt("Inserisci il nome del nuovo gruppo:");
    if (!nomeGruppo) return;
    // Nota: i gruppi in questa versione sono “derivati” dagli articoli presenti.
    // Qui lo aggiungiamo alla lista per comodità e lo pre-selezioniamo nel form.
    setGruppi((prev) => [...new Set([...(prev || []), nomeGruppo])]);
    setForm((prev) => ({ ...prev, gruppo: nomeGruppo }));
  }

  return (
    <div className="container">
      <div className="card">
        <h3>Gestione Articoli (Gruppi & Varianti)</h3>

        {/* 🔸 SEZIONE GRUPPI */}
        <div className="row" style={{ marginBottom: 12 }}>
          <label style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Gruppi esistenti:</label>
          <select
            value={form.gruppo}
            onChange={(e) => setForm({ ...form, gruppo: e.target.value })}
            style={{ minWidth: 220, flex: 1 }}
          >
            <option value="">Seleziona gruppo</option>
            {gruppi.map((g, i) => (
              <option key={i} value={g}>
                {g}
              </option>
            ))}
          </select>
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button onClick={aggiungiGruppo} className="btn">
              ➕ Aggiungi gruppo
            </button>
            {form.gruppo && (
              <button
                onClick={() => eliminaGruppo(form.gruppo)}
                className="btn danger"
                title="Elimina gruppo selezionato"
              >
                🗑️ Elimina gruppo
              </button>
            )}
          </div>
        </div>

        {/* 🔸 FORM ARTICOLI */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "8px",
          }}
        >
          <input
            placeholder="Nome articolo"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <input
            placeholder="Fornitore"
            value={form.fornitore}
            onChange={(e) => setForm({ ...form, fornitore: e.target.value })}
          />
          <input
            placeholder="Codice fornitore"
            value={form.codice_fornitore}
            onChange={(e) =>
              setForm({ ...form, codice_fornitore: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Prezzo unitario (€)"
            value={form.prezzo_unitario}
            onChange={(e) =>
              setForm({ ...form, prezzo_unitario: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Quantità"
            value={form.quantita}
            onChange={(e) => setForm({ ...form, quantita: e.target.value })}
          />
          <input
            placeholder="Taglia"
            value={form.taglia}
            onChange={(e) => setForm({ ...form, taglia: e.target.value })}
          />
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option>T-shirt/Polo</option>
            <option>Pantaloni</option>
            <option>Gilet</option>
          </select>
          <select
            value={form.stagione}
            onChange={(e) => setForm({ ...form, stagione: e.target.value })}
          >
            <option>Estiva</option>
            <option>Invernale</option>
          </select>
          <input
            placeholder="Foto URL"
            value={form.foto_url}
            onChange={(e) => setForm({ ...form, foto_url: e.target.value })}
          />
        </div>

        <div style={{ textAlign: "right", marginTop: "12px" }}>
          <button
            className="btn"
            onClick={aggiungiVariante}
            style={{
              backgroundColor: "#b30e0e",
              color: "white",
              padding: "8px 14px",
              borderRadius: "6px",
              border: "none",
            }}
          >
            ➕ Aggiungi variante
          </button>
        </div>
      </div>

      {/* 🔸 ELENCO ARTICOLI */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Elenco Articoli per Gruppo</h3>

        {gruppi.length === 0 ? (
          <div className="muted">Nessun gruppo presente</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {gruppi.map((g) => {
              const items = articoli.filter((a) => a.gruppo === g);
              if (items.length === 0) return null;
              const first = items[0];
              const isOpen = !!openGruppi[g];

              return (
                <div
                  key={g}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  {/* Header gruppo (mostra 1° capo) */}
                  <button
                    onClick={() => toggleGruppo(g)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "12px 14px",
                      border: "none",
                      background: "#fafafa",
                      cursor: "pointer",
                    }}
                    title="Apri/chiudi gruppo"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {first.foto_url ? (
                        <img
                          src={first.foto_url}
                          alt={first.nome}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            objectFit: "cover",
                            border: "1px solid #e5e7eb",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            display: "grid",
                            placeItems: "center",
                            color: "#9ca3af",
                            fontWeight: 700,
                          }}
                        >
                          MP
                        </div>
                      )}

                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700 }}>{g}</div>
                        <div className="muted">
                          Primo capo: {first.nome} • Varianti: {items.length}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        className="btn secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminaGruppo(g);
                        }}
                        style={{ background: "#111827", color: "#fff" }}
                        title="Elimina gruppo"
                      >
                        🗑️
                      </button>
                      <span style={{ fontSize: 18 }}>{isOpen ? "▴" : "▾"}</span>
                    </div>
                  </button>

                  {/* Tendina varianti */}
                  {isOpen && (
                    <div style={{ padding: 14 }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Taglia</th>
                            <th>Quantità</th>
                            <th>Stagione</th>
                            <th>Prezzo</th>
                            <th style={{ width: 110 }}>Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((a) => (
                            <tr key={a.id}>
                              <td style={{ fontWeight: 600 }}>{a.nome}</td>
                              <td>{a.taglia || "-"}</td>
                              <td>{a.quantita ?? "-"}</td>
                              <td>{a.stagione || "-"}</td>
                              <td>
                                {a.prezzo_unitario
                                  ? `${parseFloat(a.prezzo_unitario).toFixed(2)} €`
                                  : "-"}
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button
                                    className="btn secondary"
                                    style={{ background: "#b30e0e", color: "#fff" }}
                                    onClick={() => eliminaArticolo(a)}
                                    title="Elimina variante"
                                  >
                                    🗑️
                                  </button>
                                  {a.foto_url ? (
                                    <button
                                      className="btn secondary"
                                      onClick={() => window.open(a.foto_url, "_blank")}
                                      title="Apri foto"
                                    >
                                      🖼️
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
