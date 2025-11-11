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
      const foto = items[0]?.foto_url || ""; // 👈 prende la prima immagine disponibile
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
              <button className="btn secondary" onClick={() => toggleGroup(key)}>
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
