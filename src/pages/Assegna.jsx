import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { RotateCcw } from "lucide-react";

export default function Assegna() {
  const [personale, setPersonale] = useState([]);
  const [articoli, setArticoli] = useState([]);
  const [assegnazioni, setAssegnazioni] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState("");
  const [selectedArticolo, setSelectedArticolo] = useState("");
  const [quantita, setQuantita] = useState(1);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("assegnazioni-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assegnazioni" },
        () => fetchData()
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchData() {
    const { data: pers } = await supabase.from("personale").select("*");
    const { data: art } = await supabase.from("articoli").select("*");
    const { data: assegn } = await supabase
      .from("assegnazioni")
      .select("*, personale(nome), articoli(nome_capo)")
      .order("id", { ascending: false });

    setPersonale(pers || []);
    setArticoli(art || []);
    setAssegnazioni(assegn || []);
  }

  async function handleAssegna() {
    if (!selectedPersona || !selectedArticolo || quantita <= 0) {
      alert("Seleziona un dipendente, un articolo e una quantità valida.");
      return;
    }

    // Prende l'articolo per scalare la quantità
    const articolo = articoli.find((a) => a.id === parseInt(selectedArticolo));
    if (!articolo || articolo.quantita < quantita) {
      alert("Quantità non disponibile in magazzino!");
      return;
    }

    await supabase.from("assegnazioni").insert([
      {
        id_persona: selectedPersona,
        id_articolo: selectedArticolo,
        quantita: quantita,
        data_consegna: new Date().toISOString().split("T")[0],
      },
    ]);

    // Scala la quantità in magazzino
    await supabase
      .from("articoli")
      .update({ quantita: articolo.quantita - quantita })
      .eq("id", selectedArticolo);

    setSelectedPersona("");
    setSelectedArticolo("");
    setQuantita(1);
    fetchData();
  }

  async function handleElimina(id, articoloId, qta) {
    if (!window.confirm("Sei sicuro di voler eliminare questa assegnazione?")) return;

    const articolo = articoli.find((a) => a.id === articoloId);
    if (articolo) {
      await supabase
        .from("articoli")
        .update({ quantita: articolo.quantita + qta })
        .eq("id", articoloId);
    }

    await supabase.from("assegnazioni").delete().eq("id", id);
    fetchData();
  }

  async function handleModifica(assegnazione) {
    const nuovaQuantita = parseInt(prompt("Inserisci la nuova quantità:", assegnazione.quantita));
    if (!nuovaQuantita || nuovaQuantita <= 0) return;

    const articolo = articoli.find((a) => a.id === assegnazione.id_articolo);
    if (!articolo) return;

    const differenza = nuovaQuantita - assegnazione.quantita;
    const nuovaQtaMagazzino = articolo.quantita - differenza;

    if (nuovaQtaMagazzino < 0) {
      alert("Quantità non disponibile in magazzino!");
      return;
    }

    await supabase
      .from("assegnazioni")
      .update({ quantita: nuovaQuantita })
      .eq("id", assegnazione.id);

    await supabase
      .from("articoli")
      .update({ quantita: nuovaQtaMagazzino })
      .eq("id", articolo.id);

    fetchData();
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-[#b30e0e] mb-4 flex items-center gap-2">
        <RotateCcw /> Gestione Assegnazioni
      </h2>

      {/* Form assegnazione */}
      <div className="bg-white rounded-xl shadow-md p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <select
          value={selectedPersona}
          onChange={(e) => setSelectedPersona(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/3"
        >
          <option value="">Seleziona personale</option>
          {personale.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>

        <select
          value={selectedArticolo}
          onChange={(e) => setSelectedArticolo(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/3"
        >
          <option value="">Seleziona articolo</option>
          {articoli.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome_capo}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={quantita}
          onChange={(e) => setQuantita(parseInt(e.target.value))}
          min="1"
          className="border border-gray-300 rounded-lg px-4 py-2 w-20 text-center"
        />

        <button
          onClick={handleAssegna}
          className="bg-[#b30e0e] hover:bg-[#8b0c0c] text-white font-semibold px-6 py-2 rounded-lg shadow-md transition-all"
        >
          + Assegna
        </button>
      </div>

      {/* Storico sotto */}
      <div className="mt-8 bg-white rounded-xl shadow-md p-4">
        <h3 className="text-lg font-semibold mb-3 text-[#b30e0e]">
          Storico Assegnazioni
        </h3>
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b bg-gray-100">
              <th className="p-2">ID</th>
              <th className="p-2">Dipendente</th>
              <th className="p-2">Articolo</th>
              <th className="p-2">Quantità</th>
              <th className="p-2">Data consegna</th>
              <th className="p-2 text-center">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {assegnazioni.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-3 text-gray-500">
                  Nessuna assegnazione presente
                </td>
              </tr>
            ) : (
              assegnazioni.map((a) => (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{a.id}</td>
                  <td className="p-2">{a.personale?.nome || "-"}</td>
                  <td className="p-2">{a.articoli?.nome_capo || "-"}</td>
                  <td className="p-2">{a.quantita}</td>
                  <td className="p-2">{a.data_consegna}</td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleModifica(a)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold px-3 py-1 rounded mr-2"
                    >
                      ✏️ Modifica
                    </button>
                    <button
                      onClick={() => handleElimina(a.id, a.id_articolo, a.quantita)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1 rounded"
                    >
                      ❌ Elimina
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
