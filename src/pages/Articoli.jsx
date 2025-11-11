<div className="flex flex-wrap gap-3 items-center mb-4">
  <input
    type="text"
    placeholder="Nome articolo"
    className="border rounded-lg p-2"
    value={form.nome}
    onChange={(e) => setForm({ ...form, nome: e.target.value })}
  />

  <select
    value={form.stagione || 'Estiva'}
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
    Salva
  </button>
</div>
