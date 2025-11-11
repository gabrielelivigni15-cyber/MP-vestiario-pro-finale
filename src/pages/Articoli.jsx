import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function Articoli() {
  const [articoli, setArticoli] = useState([])
  const [form, setForm] = useState({ nome: '', prezzo: '', stagione: 'Estiva' })
  const [editing, setEditing] = useState(null)
  const [filtroStagione, setFiltroStagione] = useState('') // Filtro stagione

  async function load() {
    let query = supabase.from('articoli').select('*').order('nome')
    if (filtroStagione) query = query.eq('stagione', filtroStagione)
    const { data, error } = await query
    if (error) console.error(error)
    else setArticoli(data || [])
  }

  useEffect(() => {
    load()
  }, [filtroStagione])

  async function salvaArticolo() {
    if (!form.nome) return alert('Inserisci il nome del capo')
    if (editing) {
      await supabase.from('articoli').update(form).eq('id', editing)
      setEditing(null)
    } else {
      await supabase.from('articoli').insert([form])
    }
    setForm({ nome: '', prezzo: '', stagione: 'Estiva' })
    load()
  }

  async function elimina(id) {
    if (!window.confirm('Sei sicuro di voler eliminare questo articolo?')) return
    await supabase.from('articoli').delete().eq('id', id)
    load()
  }

  async function modifica(articolo) {
    setEditing(articolo.id)
    setForm({
      nome: articolo.nome,
      prezzo: articolo.prezzo || '',
      stagione: articolo.stagione || 'Estiva',
    })
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gestione Articoli</h2>

      {/* FILTRO STAGIONE */}
      <div className="mb-4 flex items-center gap-3">
        <label className="font-medium text-gray-700">Filtra per stagione:</label>
        <select
          value={filtroStagione}
          onChange={(e) => setFiltroStagione(e.target.value)}
          className="border rounded-lg p-2 bg-white shadow-sm"
        >
          <option value="">Tutte</option>
          <option value="Estiva">Estiva</option>
          <option value="Invernale">Invernale</option>
        </select>
      </div>

      {/* FORM INSERIMENTO / MODIFICA */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <input
          type="text"
          placeholder="Nome articolo"
          className="border rounded-lg p-2"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />

        <input
          type="number"
          placeholder="Prezzo"
          className="border rounded-lg p-2 w-36"
          value={form.prezzo}
          onChange={(e) => setForm({ ...form, prezzo: e.target.value })}
        />

        <select
          value={form.stagione}
          onChange={(e) => setForm({ ...form, stagione: e.target.value })}
          className="border rounded-lg p-2 bg-white shadow-sm"
        >
          <option value="Estiva">Estiva</option>
          <option value="Invernale">Invernale</option>
        </select>

        <button
          onClick={salvaArticolo}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow"
        >
          {editing ? 'Aggiorna' : 'Aggiungi'}
        </button>

        {editing && (
          <button
            onClick={() => {
              setEditing(null)
              setForm({ nome: '', prezzo: '', stagione: 'Estiva' })
            }}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg shadow"
          >
            Annulla
          </button>
        )}
      </div>

      {/* TABELLA ARTICOLI */}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2">ID</th>
              <th className="border px-3 py-2">Nome</th>
              <th className="border px-3 py-2">Prezzo</th>
              <th className="border px-3 py-2">Stagione</th>
              <th className="border px-3 py-2 text-center">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {articoli.map((a) => (
              <tr key={a.id}>
                <td className="border px-3 py-2 text-center">{a.id}</td>
                <td className="border px-3 py-2">{a.nome}</td>
                <td className="border px-3 py-2 text-right">{a.prezzo ? `${a.prezzo} €` : '-'}</td>
                <td className="border px-3 py-2 text-center">{a.stagione}</td>
                <td className="border px-3 py-2 text-center">
                  <button
                    onClick={() => modifica(a)}
                    className="text-blue-600 hover:underline mr-3"
                  >
                    Modifica
                  </button>
                  <button
                    onClick={() => elimina(a.id)}
                    className="text-red-600 hover:underline"
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* STATISTICHE CAPO */}
      {articoli.length > 0 && (
        <div className="mt-6 text-sm text-gray-600">
          <p>
            Totale articoli: <strong>{articoli.length}</strong> (
            {articoli.filter((a) => a.stagione === 'Estiva').length} estivi /{' '}
            {articoli.filter((a) => a.stagione === 'Invernale').length} invernali)
          </p>
        </div>
      )}
    </div>
  )
}
