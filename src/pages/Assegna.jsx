import React, { useEffect, useMemo, useState } from "react";
// Se il tuo client è in ../lib/supabaseClient.js cambia la riga qui sotto di conseguenza
import { supabase } from "../lib/supabase.js";

/** 
 * ASSEGNAZIONI – MP Vestiario Pro
 * - Form in alto per assegnare X pezzi di un articolo a un dipendente
 * - Storico assegnazioni sotto il form (stessa pagina)
 * - Modifica / Elimina con ricalcolo scorte
 * - Realtime su tabelle 'assegnazioni' e 'articoli'
 */

export default function Assegna() {
  // --- stato base ---
  const [loading, setLoading] = useState(false);

  const [personale, setPersonale] = useState([]);
  const [articoli, setArticoli] = useState([]);
  const [assegnazioni, setAssegnazioni] = useState([]);

  // form
  const [personaId, setPersonaId] = useState("");
  const [articoloId, setArticoloId] = useState("");
  const [quantita, setQuantita] = useState(1);

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editQuantita, setEditQuantita] = useState(1);

  // lookup per nomi rapidi
  const mapPersone = useMemo(() => {
    const m = new Map();
    personale.forEach((p) => m.set(p.id, p.nome));
    return m;
  }, [personale]);

  const mapArticoli = useMemo(() => {
    const m = new Map();
    articoli.forEach((a) => m.set(a.id, a.nome));
    return m;
  }, [articoli]);

  // ---- fetch iniziale + realtime ----
  useEffect(() => {
    (async () => {
      await Promise.all([loadPersonale(), loadArticoli(), loadAssegnazioni()]);
    })();

    // Realtime: ascolta cambi su assegnazioni e articoli
    const ch = supabase
      .channel("rt-assegna")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assegnazioni" },
        () => loadAssegnazioni()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "articoli" },
        () => loadArticoli()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  // ---- loader ----
  async function loadPersonale() {
    const { data, error } = await supabase.from("personale").select("*").order("nome", { ascending: true });
    if (!error) setPersonale(data || []);
  }

  async function loadArticoli() {
    const { data, error } = await supabase.from("articoli").select("*").order("nome", { ascending: true });
    if (!error) setArticoli(data || []);
  }

  async function loadAssegnazioni() {
    const { data, error } = await supabase
      .from("assegnazioni")
      .select("*")
      .order("id", { ascending: false });
    if (!error) setAssegnazioni(data || []);
  }

  // ---- azioni ----
  async function handleAssegna() {
    try {
      if (!personaId) return alert("Seleziona un dipendente.");
      if (!articoloId) return alert("Seleziona un articolo.");
      const qta = Number(quantita);
      if (!Number.isFinite(qta) || qta <= 0) return alert("Quantità non valida.");

      setLoading(true);

      // check scorte
      const articolo = articoli.find((a) => a.id === Number(articoloId));
      if (!articolo) throw new Error("Articolo non trovato.");
      if ((articolo.quantita || 0) < qta) {
        alert(`Scorte insufficienti. Disponibili: ${articolo.quantita || 0}`);
        return;
      }

      // 1) inserisci assegnazione
      const { error: insErr } = await supabase.from("assegnazioni").insert({
        id_persona: Number(personaId),
        id_articolo: Number(articoloId),
        quantita: qta,
        // data_consegna nel DB con default now()
      });
      if (insErr) throw insErr;

      // 2) aggiorna scorte
      const { error: updErr } = await supabase
        .from("articoli")
        .update({ quantita: (articolo.quantita || 0) - qta })
        .eq("id", articolo.id);
      if (updErr) throw updErr;

      // pulisci form
      setQuantita(1);
      setArticoloId("");
      setPersonaId("");

      await Promise.all([loadAssegnazioni(), loadArticoli()]);
    } catch (e) {
      console.error(e);
      alert(`Errore assegnazione: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  function openEdit(row) {
    setEditRow(row);
    setEditQuantita(row.quantita || 1);
    setEditOpen(true);
  }

  async function confirmEdit() {
    try {
      if (!editRow) return;
      const newQta = Number(editQuantita);
      if (!Number.isFinite(newQta) || newQta <= 0) return alert("Quantità non valida.");

      setLoading(true);

      // prendi articolo relativo
      const articolo = articoli.find((a) => a.id === Number(editRow.id_articolo));
      if (!articolo) throw new Error("Articolo non trovato.");

      const oldQta = Number(editRow.quantita || 0);
      const delta = newQta - oldQta; // quanto devo sottrarre (se +) o aggiungere (se -) alle scorte

      if (delta > 0) {
        // devo togliere pezzi in più: check scorte
        if ((articolo.quantita || 0) < delta) {
          alert(`Scorte insufficienti per aumentare. Disponibili: ${articolo.quantita || 0}`);
          return;
        }
      }

      // 1) aggiorna assegnazione
      const { error: updAssErr } = await supabase
        .from("assegnazioni")
        .update({ quantita: newQta })
        .eq("id", editRow.id);
      if (updAssErr) throw updAssErr;

      // 2) aggiorna scorte
      const newStock = (articolo.quantita || 0) - delta;
      const { error: updArtErr } = await supabase.from("articoli").update({ quantita: newStock }).eq("id", articolo.id);
      if (updArtErr) throw updArtErr;

      setEditOpen(false);
      setEditRow(null);
      await Promise.all([loadAssegnazioni(), loadArticoli()]);
    } catch (e) {
      console.error(e);
      alert(`Errore modifica: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(row) {
    try {
      if (!window.confirm("Confermi l'eliminazione dell'assegnazione?")) return;

      setLoading(true);

      // ripristina scorte
      const articolo = articoli.find((a) => a.id === Number(row.id_articolo));
      if (articolo) {
        await supabase
          .from("articoli")
          .update({ quantita: (articolo.quantita || 0) + Number(row.quantita || 0) })
          .eq("id", articolo.id);
      }

      // cancella assegnazione
      const { error: delErr } = await supabase.from("assegnazioni").delete().eq("id", row.id);
      if (delErr) throw delErr;

      await Promise.all([loadAssegnazioni(), loadArticoli()]);
    } catch (e) {
      console.error(e);
      alert(`Errore eliminazione: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  // --- UI ---
  return (
    <div className="p-4 md:p-6">
      {/* CARD FORM */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-5 mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-3">Gestione Assegnazioni</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Persona */}
          <select
            className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-300"
            value={personaId}
            onChange={(e) => setPersonaId(e.target.value)}
          >
            <option value="">Seleziona personale</option>
            {personale.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          {/* Articolo */}
          <select
            className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-300"
            value={articoloId}
            onChange={(e) => setArticoloId(e.target.value)}
          >
            <option value="">Seleziona articolo</option>
            {articoli.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} {a.taglia ? `— ${a.taglia}` : ""} {typeof a.quantita === "number" ? ` (disp: ${a.quantita})` : ""}
              </option>
            ))}
          </select>

          {/* Quantità */}
          <input
            type="number"
            min={1}
            className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-300"
            value={quantita}
            onChange={(e) => setQuantita(e.target.value)}
          />

          {/* Assegna */}
          <button
            onClick={handleAssegna}
            disabled={loading}
            className="bg-[#b30e0e] hover:bg-[#8b0c0c] text-white rounded-lg px-4 py-2 font-semibold shadow-md disabled:opacity-60"
          >
            + Assegna
          </button>
        </div>
      </div>

      {/* CARD STORICO */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-5">
        <h2 className="text-lg md:text-xl font-semibold mb-3">Storico Assegnazioni</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">Dipendente</th>
                <th className="py-2 pr-3">Articolo</th>
                <th className="py-2 pr-3">Quantità</th>
                <th className="py-2 pr-3">Data consegna</th>
                <th className="py-2 pr-3">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {assegnazioni.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-gray-500">
                    Nessuna assegnazione presente
                  </td>
                </tr>
              )}

              {assegnazioni.map((row) => (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-3">{row.id}</td>
                  <td className="py-2 pr-3">{mapPersone.get(row.id_persona) || `#${row.id_persona}`}</td>
                  <td className="py-2 pr-3">{mapArticoli.get(row.id_articolo) || `#${row.id_articolo}`}</td>
                  <td className="py-2 pr-3">{row.quantita}</td>
                  <td className="py-2 pr-3">
                    {row.data_consegna ? new Date(row.data_consegna).toLocaleDateString("it-IT") : "-"}
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <button
                        className="px-3 py-1 rounded-md border text-gray-700 hover:bg-gray-100"
                        onClick={() => openEdit(row)}
                      >
                        Modifica
                      </button>
                      <button
                        className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
                        onClick={() => handleDelete(row)}
                      >
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL MODIFICA */}
      {editOpen && editRow && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <h3 className="text-lg font-semibold mb-3">Modifica assegnazione #{editRow.id}</h3>

            <div className="space-y-3 mb-4">
              <div>
                <div className="text-sm text-gray-600">Dipendente</div>
                <div className="font-medium">{mapPersone.get(editRow.id_persona) || `#${editRow.id_persona}`}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Articolo</div>
                <div className="font-medium">{mapArticoli.get(editRow.id_articolo) || `#${editRow.id_articolo}`}</div>
              </div>

              <label className="block">
                <span className="text-sm text-gray-600">Quantità</span>
                <input
                  type="number"
                  min={1}
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-300"
                  value={editQuantita}
                  onChange={(e) => setEditQuantita(e.target.value)}
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button className="px-4 py-2 rounded-lg border" onClick={() => setEditOpen(false)}>
                Annulla
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-[#b30e0e] text-white hover:bg-[#8b0c0c]"
                onClick={confirmEdit}
                disabled={loading}
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
