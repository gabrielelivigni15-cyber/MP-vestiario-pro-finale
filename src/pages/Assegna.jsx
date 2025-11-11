import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function Assegna() {
  const [articoli, setArticoli] = useState([])
  const [persone, setPersone] = useState([])
  const [storico, setStorico] = useState([])
  const [stagione, setStagione] = useState('') // filtro stagione
  const [form, setForm] = useState({ id_persona: '', id_articolo: '', prezzo_unitario: '' })

  async function load() {
    let queryArticoli = supabase.from('articoli').select('*').order('nome')
    if (stagione) queryArticoli = queryArticoli.eq('stagione', stagione)

    const { data: a } = await queryArticoli
    const { data: p } = await supabase.from('personale').select('*').order('nome')
    const { data: s } = await supabase.from('assegnazioni').select('*').order('id', { ascending: false })

    setArticoli(a || [])
    setPersone(p || [])
    setStorico(s || [])
  }

  useEffect(() => {
    load()
  }, [stagione])

  async function assegna() {
    if (!form.id_persona || !form.id_articolo) return alert('Seleziona persona e articolo')
    await supabase.from('assegnazioni').insert([form])
    setForm({ id_persona: '', id_articolo: '', prezzo_unitario: '' })
    load()
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gestione Assegnazioni Vestiario</h2>

      {/* FILTRO STAGIONE */}
      <div className="mb-4 flex items-center gap-3">
        <label className="font-medium text-gray-700">Stagione:</label>
        <select
          value={stagione}
          onChange={(e) => setStagione(e.target.value)}
          className="border rounded-lg p-2 bg-white shadow-sm"
        >
          <option value="">Tutte</option>
          <option value="Estiva">Estiva</option>
          <option value="Invernale">Invernale</option>
        </select>
      </div>

      {/* FORM ASSEGNAZIONE */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-lg p-2"
          value={form.id_persona}
          onChange={(e) => setForm({ ...form, id_persona: e.target.value })}
        >
          <option value="">Seleziona persona</option>
          {persone.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>

        <select
          className="border rounded-lg p-2"
          value={form.id_articolo}
          onChange={(e) => setForm({ ...form, id_articolo: e.target.value })}
        >
          <option value="">Seleziona articolo</option>
          {articoli.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome} ({a.stagione})
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Prezzo unitario"
          className="border rounded-lg p-2 w-36"
          value={form.prezzo_unitario}
          onChange={(e) => setForm({ ...form, prezzo_unitario: e.target.value })}
        />

        <button
          onClick={assegna}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
        >
          Assegna
        </button>
      </div>

      {/* STORICO */}
      <h3 className="text-xl font-semibold mb-3">Storico Assegnazioni</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2">ID</th>
              <th className="border px-3 py-2">Persona</th>
              <th className="border px-3 py-2">Articolo</th>
              <th className="border px-3 py-2">Stagione</th>
              <th className="border px-3 py-2">Prezzo</th>
            </tr>
          </thead>
          <tbody>
            {storico.map((r) => {
              const persona = persone.find((p) => p.id === r.id_persona)
              const articolo = articoli.find((a) => a.id === r.id_articolo)
              return (
                <tr key={r.id}>
                  <td className="border px-3 py-2 text-center">{r.id}</td>
                  <td className="border px-3 py-2">{persona?.nome || '-'}</td>
                  <td className="border px-3 py-2">{articolo?.nome || '-'}</td>
                  <td className="border px-3 py-2 text-center">{articolo?.stagione || '-'}</td>
                  <td className="border px-3 py-2 text-right">{r.prezzo_unitario} €</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
