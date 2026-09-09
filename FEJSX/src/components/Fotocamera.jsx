import { useEffect, useRef, useState } from 'react'

/**
 * Anteprima live della webcam + scatto.
 *
 * Il flusso e': getUserMedia() restituisce un MediaStream -> lo attacchiamo a un <video>
 * per vederlo -> quando premi "Scatta" disegniamo il fotogramma corrente su un <canvas>
 * -> canvas.toBlob() ci da' i byte dell'immagine -> li impacchettiamo in un File, identico
 * a uno scelto dal disco, pronto per la FormData.
 */
export default function Fotocamera({ onScatto, onChiudi }) {
  // useRef serve per due cose diverse qui:
  // - videoRef / canvasRef: accedere ai nodi del DOM (React non li espone in altro modo)
  // - streamRef: conservare la webcam accesa senza useState, perche' NON e' un dato che
  //   si disegna. Metterlo in useState causerebbe render inutili a ogni cambiamento.
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [pronta, setPronta] = useState(false)
  const [errore, setErrore] = useState(null)

  useEffect(() => {
    // Se il componente viene smontato mentre l'utente sta ancora decidendo se dare il
    // permesso, la promise arriva "in ritardo": questo flag evita di accendere una
    // webcam che nessuno spegnera' piu'.
    let annullato = false

    async function accendi() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          // facingMode 'environment' = fotocamera posteriore sui telefoni.
          // Su un portatile viene semplicemente ignorato e si usa quella integrata.
          video: { facingMode: 'environment', width: { ideal: 1920 } },
          audio: false,
        })

        if (annullato) {
          stream.getTracks().forEach((traccia) => traccia.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setPronta(true)
      } catch (e) {
        setErrore(messaggioErrore(e))
      }
    }

    accendi()

    // Questa funzione di ritorno e' il CLEANUP: React la esegue quando il componente
    // viene smontato. Senza, la webcam resta accesa (lucina verde compresa) anche dopo
    // aver chiuso il pannello. E' l'errore piu' comune con getUserMedia.
    return () => {
      annullato = true
      streamRef.current?.getTracks().forEach((traccia) => traccia.stop())
      streamRef.current = null
    }
  }, [])

  function scatta() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    // Il canvas deve avere la risoluzione VERA del video, non quella a cui lo vediamo
    // a schermo: piu' pixel = piu' testo leggibile per Tesseract.
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    // PNG e non JPEG: la compressione JPEG introduce artefatti sui bordi delle lettere
    // e peggiora sensibilmente il riconoscimento OCR.
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `scatto-${Date.now()}.png`, { type: 'image/png' })
      onScatto(file)
    }, 'image/png')
  }

  return (
    <div className="fotocamera">
      {errore ? (
        <div className="fotocamera-errore">
          <span className="fotocamera-errore-icona">🚫</span>
          <p>{errore}</p>
        </div>
      ) : (
        <div className="fotocamera-cornice">
          {/* playsInline evita che iOS apra il video a tutto schermo.
              muted e' obbligatorio perche' autoPlay parta senza interazione. */}
          <video ref={videoRef} autoPlay playsInline muted className="fotocamera-video" />
          {!pronta && <div className="fotocamera-attesa">Accensione fotocamera…</div>}
          <div className="fotocamera-mirino" aria-hidden="true" />
        </div>
      )}

      {/* Il canvas serve solo come "foglio da disegno" intermedio: non va mai mostrato. */}
      <canvas ref={canvasRef} hidden />

      <div className="fotocamera-azioni">
        <button type="button" className="btn btn-ghost" onClick={onChiudi}>
          Annulla
        </button>
        <button
          type="button"
          className="btn btn-primario"
          onClick={scatta}
          disabled={!pronta}
        >
          📸 Scatta
        </button>
      </div>
    </div>
  )
}

/** Il browser distingue i motivi del rifiuto con il name dell'errore: traduciamoli. */
function messaggioErrore(e) {
  if (e.name === 'NotAllowedError') {
    return 'Permesso negato. Consenti l’accesso alla fotocamera dall’icona nella barra degli indirizzi, poi riprova.'
  }
  if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
    return 'Nessuna fotocamera trovata su questo dispositivo.'
  }
  if (e.name === 'NotReadableError') {
    return 'La fotocamera è già usata da un’altra applicazione.'
  }
  return `Impossibile accedere alla fotocamera: ${e.message}`
}
