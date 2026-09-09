import { useRef, useState } from 'react'

/** Deve restare allineato con TIPI_AMMESSI di DocumentService lato backend. */
const TIPI_AMMESSI =
  'image/jpeg,image/png,image/tiff,image/bmp,image/gif,image/webp,application/pdf'

/**
 * Area per scegliere il file: drag & drop oppure click.
 * Non fa nessuna chiamata di rete: si limita a passare il File al componente padre.
 */
export default function Uploader({ onFile, onApriFotocamera, disabilitato }) {
  const inputRef = useRef(null)
  const [trascinamento, setTrascinamento] = useState(false)

  function gestisciDrop(evento) {
    // Senza preventDefault il browser fa il suo comportamento di default:
    // abbandona la pagina e apre il file trascinato in una nuova scheda.
    evento.preventDefault()
    setTrascinamento(false)
    if (disabilitato) return

    const file = evento.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div className="uploader">
      <div
        className={`dropzone ${trascinamento ? 'dropzone-attiva' : ''} ${
          disabilitato ? 'dropzone-disabilitata' : ''
        }`}
        onDragOver={(e) => {
          // Anche qui serve preventDefault, altrimenti il drop non viene mai accettato.
          e.preventDefault()
          if (!disabilitato) setTrascinamento(true)
        }}
        onDragLeave={() => setTrascinamento(false)}
        onDrop={gestisciDrop}
        onClick={() => !disabilitato && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
      >
        <div className="dropzone-icona">{trascinamento ? '📥' : '📄'}</div>
        <p className="dropzone-titolo">
          {trascinamento ? 'Lascia qui il file' : 'Trascina un documento'}
        </p>
        <p className="dropzone-sottotitolo">
          oppure <span className="link">scegli dal computer</span>
        </p>
        <p className="dropzone-formati">JPG · PNG · TIFF · WEBP · PDF</p>

        {/* L'input vero e' nascosto: i file input di sistema non sono personalizzabili
            via CSS, quindi si mostra un div e gli si inoltra il click. */}
        <input
          ref={inputRef}
          type="file"
          accept={TIPI_AMMESSI}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFile(file)
            // Azzerare il value permette di riselezionare lo STESSO file due volte di
            // fila: senza, il browser non emetterebbe un secondo evento change.
            e.target.value = ''
          }}
        />
      </div>

      <div className="uploader-separatore">
        <span>oppure</span>
      </div>

      <button
        type="button"
        className="btn btn-accento btn-largo"
        onClick={onApriFotocamera}
        disabled={disabilitato}
      >
        📷 Usa la fotocamera
      </button>
    </div>
  )
}
