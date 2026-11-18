import { useSyncExternalStore } from 'react'

const CLAVE = 'mente_ordenada_orbi_preferencias'
const EVENTO = 'mente_ordenada_orbi_cambio'


const INICIAL = {
  visible: true,
  consejos: true,
  variante: 'normal'
}


function suscribir(actualizar) {
  window.addEventListener(EVENTO, actualizar)
  window.addEventListener('storage', actualizar)

  return () => {
    window.removeEventListener(EVENTO, actualizar)
    window.removeEventListener('storage', actualizar)
  }
}

function obtenerSnapshot() {
  return localStorage.getItem(CLAVE) || ''
}

function leerPreferencias(texto) {
  try {
    const guardadas = JSON.parse(texto)
    return {
      ...INICIAL,
      ...(guardadas && typeof guardadas === 'object'
        ? guardadas
        : {})
    }
  } catch {
    return INICIAL
  }
}

export function useOrbi() {
  const texto = useSyncExternalStore(
    suscribir,
    obtenerSnapshot,
    () => ''
  )

  return leerPreferencias(texto)
}

export function actualizarPreferencias(cambios) {
  const actuales = leerPreferencias(obtenerSnapshot())

  localStorage.setItem(
    CLAVE,
    JSON.stringify({ ...actuales, ...cambios })
  )

  window.dispatchEvent(new Event(EVENTO))
}

export const EVENTO_REACCION = 'mente_ordenada_orbi_reaccion'

export function avisarOrbi(tipo) {
  window.dispatchEvent(
    new CustomEvent(EVENTO_REACCION, {
      detail: { tipo }
    })
  )
}
