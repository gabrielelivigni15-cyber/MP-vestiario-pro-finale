# MP Vestiario Pro (Medipower)

Dashboard pro per la gestione vestiario con Supabase + Vercel + Vite/React.

## Variabili di ambiente (Vercel)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Tabelle richieste
Queste colonne sono quelle usate dall'app attuale (V2). Se hai un DB "vecchio" puoi aggiungere le colonne mancanti con gli SQL sotto.

- `personale(
  id int8 PK,
  nome text,
  qualifica text,
  tshirt text,
  pantaloni text,
  gilet text,
  note text,
  attivo boolean default true
 )`

- `articoli(
  id int8 PK,
  nome text,
  tipo text,
  taglia text,
  stagione text,
  gruppo text,
  fornitore text,
  codice_fornitore text,
  quantita int8,
  prezzo_unitario numeric,
  foto_url text
 )`

- `assegnazioni(
  id int8 PK,
  id_persona int8 references personale(id) on delete restrict,
  id_articolo int8 references articoli(id) on delete restrict,
  quantita int8,
  data_consegna date default now(),
  prezzo_unitario numeric
 )`

### SQL utili (Supabase)
**Aggiungi colonne mancanti (se il DB è già esistente):**
```sql
alter table if exists personale
  add column if not exists tshirt text,
  add column if not exists pantaloni text,
  add column if not exists gilet text,
  add column if not exists note text,
  add column if not exists attivo boolean default true;

alter table if exists articoli
  add column if not exists stagione text,
  add column if not exists gruppo text,
  add column if not exists prezzo_unitario numeric;

alter table if exists assegnazioni
  add column if not exists quantita int8,
  add column if not exists prezzo_unitario numeric;
```

## Funzione opzionale
- `decrementa_scorta(p_articolo_id int8)` per decremento sicuro delle scorte.
