import { useMemo, useState } from 'react'
import CardDocumento from './CardDocumento'

export default function ListaDocumenti({ documenti, caricamento, onElimina }) {
  const [ricerca, setRicerca] = useState('')

  // useMemo evita di rifiltrare l'intero elenco a ogni render: il calcolo viene
  // rifatto solo quando cambiano davvero i documenti o il testo cercato.
  const filtrati = useMemo(() => {
    const termine = ricerca.trim().toLowerCase()
    if (!termine) return documenti
    return documenti.filter(
      (d) =>
        d.titolo?.toLowerCase().includes(termine) ||
        d.nomeFile?.toLowerCase().includes(termine) ||
        d.testoEstratto?.toLowerCase().includes(termine),
    )
  }, [documenti, ricerca])

  if (caricamento) {
    return (
      <div className="stato">
        <div className="spinner" />
        <p>Carico l’archivio…</p>
      </div>
    )
  }

  if (documenti.length === 0) {
    return (
      <div className="stato stato-vuoto">
        <div className="stato-icona">🗂️</div>
        <h3>L’archivio è vuoto</h3>
        <p>Carica una foto o un PDF: il testo verrà estratto automaticamente.</p>
      </div>
    )
  }

  return (
    <section className="lista">
      <div className="lista-testata">
        <h2>
          Archivio <span className="conteggio">{documenti.length}</span>
        </h2>
        <input
          type="search"
          className="ricerca"
          placeholder="🔍 Cerca nel testo estratto…"
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
        />
      </div>

      {filtrati.length === 0 ? (
        <div className="stato stato-vuoto">
          <div className="stato-icona">🔍</div>
          <p>Nessun documento contiene «{ricerca}»</p>
        </div>
      ) : (
        <div className="griglia-card">
          {filtrati.map((documento) => (
            // key stabile e unica: senza, React non sa quale card riusare quando
            // l'elenco cambia e puo' lasciare aperto il testo della card sbagliata.
            <CardDocumento key={documento.id} documento={documento} onElimina={onElimina} />
          ))}
        </div>
      )}
    </section>
  )
}
