# MP Vestiario Pro (Medipower)

Dashboard pro per la gestione vestiario con Supabase + Vercel + Vite/React.

## Variabili di ambiente (Vercel)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Tabelle richieste
- `articoli(id int8 PK, nome text, tipo text, taglia text, fornitore text, codice_fornitore text, quantita int8, valore numeric, foto_url text)`
- `personale(id int8 PK, nome text, qualifica text, taglia_tshirt text, taglia_pantaloni text, taglia_giubbotto text)`
- `assegnazioni(id int8 PK, id_persona int8, id_articolo int8, data_consegna date default now(), prezzo_unitario numeric)`

## Funzione opzionale
- `decrementa_scorta(p_articolo_id int8)` per decremento sicuro delle scorte.
