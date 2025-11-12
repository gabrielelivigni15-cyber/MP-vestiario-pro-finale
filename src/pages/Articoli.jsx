import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function Articoli() {
  const [articoli, setArticoli] = useState([]);
  const [gruppi, setGruppi] = useState([]);
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
    setGruppi([...gruppi, nomeGruppo]);
    alert(`Gruppo "${nomeGruppo}" aggiunto con successo!`);
  }

  return (
    <div className="container">
      <div className="card">
        <h3>Gestione Articoli (Gruppi & Varianti)</h3>

        {/* 🔸 SEZIONE GRUPPI */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <label style={{ fontWeight: 600 }}>Gruppi esistenti:</label>
          <select
            value={form.gruppo}
            onChange={(e) => setForm({ ...form, gruppo: e.target.value })}
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          >
            <option value="">Seleziona gruppo</option>
            {gruppi.map((g, i) => (
              <option key={i} value={g}>
                {g}
              </option>
            ))}
          </select>
          <button
            onClick={aggiungiGruppo}
            className="btn secondary"
            style={{
              backgroundColor: "#b30e0e",
              color: "white",
              padding: "6px 10px",
              borderRadius: "6px",
              border: "none",
            }}
          >
            ➕ Aggiungi gruppo
          </button>
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
            {articoli.map((a) => (
              <tr key={a.id}>
                <td>{a.gruppo || "-"}</td>
                <td>{a.nome}</td>
                <td>{a.quantita}</td>
                <td>{a.stagione}</td>
                <td>
                  {a.foto_url ? (
                    <img
                      src={a.foto_url}
                      alt={a.nome}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 6,
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
