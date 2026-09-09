import { useState } from 'react'
import { urlFileOriginale } from '../api/documenti'

export default function CardDocumento({ documento, onElimina }) {
  const [espanso, setEspanso] = useState(false)
  const [copiato, setCopiato] = useState(false)

  const testo = documento.testoEstratto ?? ''
  const vuoto = testo.trim().length === 0
  const lungo = testo.length > 400

  async function copia() {
    await navigator.clipboard.writeText(testo)
    setCopiato(true)
    setTimeout(() => setCopiato(false), 1800)
  }

  return (
    <article className="card">
      <header className="card-testata">
        <span className={`badge ${documento.tipoFile === 'application/pdf' ? 'badge-pdf' : 'badge-img'}`}>
          {documento.tipoFile === 'application/pdf' ? 'PDF' : 'IMG'}
        </span>
        <div className="card-titolo-blocco">
          <h3 className="card-titolo">{documento.titolo}</h3>
          <p className="card-nomefile">{documento.nomeFile}</p>
        </div>
      </header>

      <div className="card-metriche">
        <span className="metrica">{formattaDimensione(documento.dimensioneByte)}</span>
        <span className="metrica metrica-ocr">⚡ {documento.ocrMillis ?? '—'} ms</span>
        <span className="metrica">{formattaData(documento.creatoIl)}</span>
        <span className="metrica">{testo.length} caratteri</span>
      </div>

      {vuoto ? (
        <p className="card-vuoto">
          Nessun testo riconosciuto. Prova con un’immagine più nitida o meglio illuminata.
        </p>
      ) : (
        <pre className={`card-testo ${espanso ? 'card-testo-espanso' : ''}`}>{testo}</pre>
      )}

      {lungo && !vuoto && (
        <button type="button" className="btn-testo" onClick={() => setEspanso(!espanso)}>
          {espanso ? '▲ Comprimi' : '▼ Mostra tutto'}
        </button>
      )}

      <footer className="card-azioni">
        <button type="button" className="btn btn-ghost btn-piccolo" onClick={copia} disabled={vuoto}>
          {copiato ? '✓ Copiato' : '📋 Copia'}
        </button>
        <a
          className="btn btn-ghost btn-piccolo"
          href={urlFileOriginale(documento.id)}
          target="_blank"
          rel="noreferrer"
        >
          ⬇ Originale
        </a>
        <button
          type="button"
          className="btn btn-pericolo btn-piccolo"
          onClick={() => onElimina(documento.id)}
        >
          🗑 Elimina
        </button>
      </footer>
    </article>
  )
}

function formattaDimensione(byte) {
  if (byte < 1024) return `${byte} B`
  if (byte < 1024 * 1024) return `${(byte / 1024).toFixed(0)} KB`
  return `${(byte / (1024 * 1024)).toFixed(1)} MB`
}

function formattaData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
