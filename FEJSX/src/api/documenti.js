/**
 * Tutte le chiamate al backend stanno qui dentro.
 * I componenti React non sanno nulla di URL, verbi HTTP o formato degli errori:
 * se domani il backend cambia porta o path, si modifica solo questo file.
 */

const BASE_URL = 'http://localhost:8080/api/documenti'

/**
 * fetch() considera "riuscita" anche una risposta 404 o 500: solleva un errore
 * soltanto se la rete fallisce. Quindi il controllo su .ok va fatto a mano.
 */
async function gestisciRisposta(risposta) {
  if (risposta.ok) {
    // 204 No Content (la DELETE) non ha corpo: chiamare .json() darebbe errore.
    return risposta.status === 204 ? null : risposta.json()
  }

  // Il backend risponde con ErrorResponseDTO: { timestamp, status, error, message }
  let messaggio = `Errore ${risposta.status}`
  try {
    const corpo = await risposta.json()
    if (corpo?.message) {
      messaggio = corpo.message
    }
  } catch {
    // risposta senza corpo JSON: teniamo il messaggio generico
  }
  throw new Error(messaggio)
}

export function getDocumenti() {
  return fetch(BASE_URL).then(gestisciRisposta)
}

/**
 * FormData produce una richiesta multipart/form-data, la stessa cosa che manderebbe
 * un <form enctype="multipart/form-data">, ed e' quello che @RequestParam MultipartFile
 * si aspetta lato Spring.
 *
 * ATTENZIONE: non si imposta l'header Content-Type a mano. Il multipart ha bisogno di un
 * "boundary" generato casualmente per separare i campi; se scrivi tu l'header, il boundary
 * sparisce e il server non riesce piu' a leggere le parti. Lasciando fare al browser, lo
 * aggiunge lui correttamente.
 */
export function caricaDocumento(file, titolo) {
  const dati = new FormData()
  dati.append('file', file)
  if (titolo?.trim()) {
    dati.append('titolo', titolo.trim())
  }
  return fetch(BASE_URL, { method: 'POST', body: dati }).then(gestisciRisposta)
}

export function eliminaDocumento(id) {
  return fetch(`${BASE_URL}/${id}`, { method: 'DELETE' }).then(gestisciRisposta)
}

/** Il file originale non si scarica via fetch: basta puntarci con un <a href>. */
export function urlFileOriginale(id) {
  return `${BASE_URL}/${id}/file`
}
