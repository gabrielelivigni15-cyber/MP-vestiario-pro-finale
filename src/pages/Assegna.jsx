import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Plus, Trash2, Edit } from "lucide-react";

export default function Assegna() {
  const [personale, setPersonale] = useState([]);
  const [articoli, setArticoli] = useState([]);
  const [assegnazioni, setAssegnazioni] = useState([]);
  const [idPersona, setIdPersona] = useState("");
  const [idArticolo, setIdArticolo] = useState("");
  const [quantita, setQuantita] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: pers } = await supabase.from("personale").select("id, nome");
    const { data: art } = await supabase.from("articoli").select("id, nome_capo");
    const { data: ass } = await supabase
      .from("assegnazioni")
      .select(`id, quantita, data_consegna, 
               personale ( nome ), 
               articoli ( nome_capo )`)
      .order("id", { ascending: false });

    setPersonale(pers || []);
    setArticoli(art || []);
    setAssegnazioni(ass || []);
  }

  async function handleAssegna() {
    if (!idPersona || !idArticolo) {
      alert("⚠️ Seleziona personale e articolo.");
      return;
    }

    const nuova = {
      id_persona: parseInt(idPersona),
      id_articolo: parseInt(idArticolo),
      quantita: parseInt(quantita),
      data_consegna: new Date().toISOString().split("T")[0],
    };

    const { error } = await supabase.from("assegnazioni").insert([nuova]);

    if (error) {
      alert("❌ Errore durante l'inserimento:\n" + error.message);
      console.error(error);
    } else {
      alert("✅ Assegnazione salvata!");
      setIdPersona("");
      setIdArticolo("");
      setQuantita(1);
      loadData();
    }
  }

  async function handleElimina(id) {
    if (!window.confirm("Vuoi eliminare questa assegnazione?")) return;
    await supabase.from("assegnazioni").delete().eq("id", id);
    loadData();
  }

  async function handleModifica(ass) {
    const nuovaQta = prompt("Inserisci nuova quantità:", ass.quantita);
    if (nuovaQta && !isNaN(nuovaQta)) {
      await supabase.from("assegnazioni").update({ quantita: nuovaQta }).eq("id", ass.id);
      loadData();
    }
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-md p-5 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-[#b30e0e]">
          Gestione Assegnazioni
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <select
            className="border rounded-lg p-2"
            value={idPersona}
            onChange={(e) => setIdPersona(e.target.value)}
          >
            <option value="">Seleziona personale</option>
            {personale.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          <select
            className="border rounded-lg p-2"
            value={idArticolo}
            onChange={(e) => setIdArticolo(e.target.value)}
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
            min="1"
            value={quantita}
            onChange={(e) => setQuantita(e.target.value)}
            className="border rounded-lg p-2 text-center"
          />

          <button
            onClick={handleAssegna}
            className="flex items-center justify-center bg-[#b30e0e] text-white px-4 py-2 rounded-lg shadow hover:bg-[#8b0c0c] transition"
          >
            <Plus className="w-4 h-4 mr-1" /> Assegna
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-5">
        <h2 className="text-xl font-semibold mb-4 text-[#b30e0e]">
          Elenco Assegnazioni
        </h2>
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[#f8f9fa] border-b">
            <tr className="text-left">
              <th className="p-2">ID</th>
              <th className="p-2">Dipendente</th>
              <th className="p-2">Articolo</th>
              <th className="p-2">Quantità</th>
              <th className="p-2">Data consegna</th>
              <th className="p-2 text-center">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {assegnazioni.length > 0 ? (
              assegnazioni.map((a) => (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{a.id}</td>
                  <td className="p-2">{a.personale?.nome || "-"}</td>
                  <td className="p-2">{a.articoli?.nome_capo || "-"}</td>
                  <td className="p-2">{a.quantita}</td>
                  <td className="p-2">{a.data_consegna}</td>
                  <td className="p-2 text-center flex justify-center gap-2">
                    <button
                      onClick={() => handleModifica(a)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleElimina(a.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-3 text-gray-500">
                  Nessuna assegnazione presente
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
