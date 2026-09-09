import { useEffect, useRef, useState } from 'react'
import { caricaDocumento, eliminaDocumento, getDocumenti } from './api/documenti'
import Fotocamera from './components/Fotocamera'
import ListaDocumenti from './components/ListaDocumenti'
import Uploader from './components/Uploader'
import './App.css'

export default function App() {
  const [documenti, setDocumenti] = useState([])
  const [caricamentoLista, setCaricamentoLista] = useState(true)

  const [file, setFile] = useState(null)
  const [anteprima, setAnteprima] = useState(null)
  const [titolo, setTitolo] = useState('')
  const [fotocameraAperta, setFotocameraAperta] = useState(false)

  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState(null)
  const [successo, setSuccesso] = useState(null)

  /** URL temporaneo dell'anteprima: lo teniamo in un ref per poterlo revocare. */
  const anteprimaUrlRef = useRef(null)

  // Caricamento iniziale dell'archivio.
  // Lo stato si aggiorna DENTRO le callback della promise, non nel corpo dell'effetto:
  // e' la differenza tra "sincronizzarsi con un sistema esterno" (corretto) e
  // "innescare un nuovo render a catena" (che React sconsiglia).
  useEffect(() => {
    // Se l'utente lascia la pagina prima che la risposta arrivi, non tocchiamo piu'
    // lo stato di un componente ormai smontato.
    let attivo = true

    getDocumenti()
      .then((dati) => {
        if (attivo) setDocumenti(dati)
      })
      .catch((e) => {
        if (attivo) {
          setErrore(`${e.message}. Il backend è avviato su http://localhost:8080?`)
        }
      })
      .finally(() => {
        if (attivo) setCaricamentoLista(false)
      })

    return () => {
      attivo = false
    }
  }, [])

  // Alla chiusura della pagina libera l'ultimo URL rimasto appeso.
  useEffect(() => {
    return () => {
      if (anteprimaUrlRef.current) URL.revokeObjectURL(anteprimaUrlRef.current)
    }
  }, [])

  /**
   * L'anteprima non passa dal server: createObjectURL crea un URL temporaneo che punta
   * al file gia' presente in memoria nel browser. Ogni URL creato va poi revocato,
   * altrimenti quei byte restano allocati fino alla chiusura della scheda (memory leak).
   *
   * Lo facciamo qui, nel gestore dell'evento, e non dentro un useEffect: e' una
   * conseguenza diretta di un'azione dell'utente, non una sincronizzazione.
   */
  function impostaFile(nuovo) {
    if (anteprimaUrlRef.current) {
      URL.revokeObjectURL(anteprimaUrlRef.current)
      anteprimaUrlRef.current = null
    }

    // I PDF non si possono mostrare in un <img>: per quelli disegniamo un segnaposto.
    const url =
      nuovo && nuovo.type !== 'application/pdf' ? URL.createObjectURL(nuovo) : null
    anteprimaUrlRef.current = url

    setFile(nuovo)
    setAnteprima(url)
  }

  function selezionaFile(nuovo) {
    impostaFile(nuovo)
    setErrore(null)
    setSuccesso(null)
    setFotocameraAperta(false)
  }

  function annulla() {
    impostaFile(null)
    setTitolo('')
    setErrore(null)
  }

  async function invia(evento) {
    evento.preventDefault()
    if (!file || inCorso) return

    setInCorso(true)
    setErrore(null)
    setSuccesso(null)
    try {
      const creato = await caricaDocumento(file, titolo)
      // Inseriamo in testa senza rifare la GET: la risposta del POST contiene gia'
      // il documento completo di testo estratto.
      setDocumenti((precedenti) => [creato, ...precedenti])
      setSuccesso(
        creato.testoEstratto?.trim()
          ? `Estratti ${creato.testoEstratto.length} caratteri in ${creato.ocrMillis} ms`
          : 'Documento salvato, ma non è stato riconosciuto alcun testo',
      )
      impostaFile(null)
      setTitolo('')
    } catch (e) {
      setErrore(e.message)
    } finally {
      setInCorso(false)
    }
  }

  async function elimina(id) {
    try {
      await eliminaDocumento(id)
      setDocumenti((precedenti) => precedenti.filter((d) => d.id !== id))
    } catch (e) {
      setErrore(e.message)
    }
  }

  return (
    <div className="app">
      <header className="intestazione">
        <h1>
          <span className="logo">📑</span> Archivio <span className="gradiente">OCR</span>
        </h1>
        <p className="sottotitolo">
          Carica una foto o un PDF, Tesseract ne estrae il testo.
        </p>
      </header>

      <main className="colonne">
        <aside className="pannello">
          {fotocameraAperta ? (
            <Fotocamera
              onScatto={selezionaFile}
              onChiudi={() => setFotocameraAperta(false)}
            />
          ) : file ? (
            <form className="anteprima" onSubmit={invia}>
              <div className="anteprima-cornice">
                {anteprima ? (
                  <img src={anteprima} alt="Anteprima del documento" />
                ) : (
                  <div className="anteprima-pdf">
                    <span>📕</span>
                    <p>PDF pronto per l’estrazione</p>
                  </div>
                )}
              </div>

              <p className="anteprima-nome">{file.name}</p>

              <input
                type="text"
                className="campo"
                placeholder="Titolo (opzionale)"
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                disabled={inCorso}
              />

              <div className="anteprima-azioni">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={annulla}
                  disabled={inCorso}
                >
                  Annulla
                </button>
                <button type="submit" className="btn btn-primario" disabled={inCorso}>
                  {inCorso ? (
                    <>
                      <span className="spinner spinner-piccolo" /> Leggo…
                    </>
                  ) : (
                    '✨ Estrai testo'
                  )}
                </button>
              </div>

              {inCorso && (
                <p className="nota-attesa">
                  L’OCR gira sul server e può richiedere qualche secondo.
                </p>
              )}
            </form>
          ) : (
            <Uploader
              onFile={selezionaFile}
              onApriFotocamera={() => setFotocameraAperta(true)}
              disabilitato={inCorso}
            />
          )}

          {errore && <div className="avviso avviso-errore">⚠️ {errore}</div>}
          {successo && <div className="avviso avviso-successo">✓ {successo}</div>}
        </aside>

        <ListaDocumenti
          documenti={documenti}
          caricamento={caricamentoLista}
          onElimina={elimina}
        />
      </main>
    </div>
  )
}
