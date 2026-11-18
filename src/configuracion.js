import { useSyncExternalStore } from 'react'

const CLAVE = 'mente_ordenada_configuracion'
const EVENTO = 'mente-ordenada-configuracion'
export const CLAVE_REINICIO = 'mente_ordenada_reinicio'
const TEMAS = ['claro', 'oscuro', 'verde']
const PREDETERMINADA = { tema: 'claro', sonido: false }

function snapshot() {
  return localStorage.getItem(CLAVE) ?? ''
}

export function leerConfiguracion(texto) {
  try {
    const datos = JSON.parse(texto)
    return {
      tema: TEMAS.includes(datos?.tema) ? datos.tema : PREDETERMINADA.tema,
      sonido: datos?.sonido === true
    }
  } catch {
    return PREDETERMINADA
  }
}

function suscribir(actualizar) {
  window.addEventListener(EVENTO, actualizar)
  window.addEventListener('storage', actualizar)
  return () => {
    window.removeEventListener(EVENTO, actualizar)
    window.removeEventListener('storage', actualizar)
  }
}

export function useConfiguracion() {
  return leerConfiguracion(useSyncExternalStore(suscribir, snapshot, () => ''))
}

export function actualizarConfiguracion(cambios) {
  const configuracion = leerConfiguracion(snapshot())
  const siguiente = leerConfiguracion(JSON.stringify({ ...configuracion, ...cambios }))
  localStorage.setItem(CLAVE, JSON.stringify(siguiente))
  window.dispatchEvent(new Event(EVENTO))
}

const CUENTAS = 'mente_ordenada_cuentas_demo'
const HISTORIAL = [
  'mente_ordenada_movimientos_demo',
  'mente_ordenada_metas',
  'mente_ordenada_presupuestos_demo',
  'mente_ordenada_calendario_demo',
  'mente_ordenada_facturas_demo'
]

export function restablecerDatos(almacen = localStorage) {
  const anteriores = new Map([CUENTAS, ...HISTORIAL, CLAVE_REINICIO]
    .map(clave => [clave, almacen.getItem(clave)]))
  const cuentas = JSON.parse(anteriores.get(CUENTAS) ?? '[]')
  if (!Array.isArray(cuentas)) throw new Error('No se pudieron leer las cuentas.')
  const escritas = []
  try {
    for (const clave of [CUENTAS, ...HISTORIAL, CLAVE_REINICIO]) {
      const valor = clave === CUENTAS
        ? JSON.stringify(cuentas.map(cuenta => ({ ...cuenta, saldoInicial: 0 })))
        : clave === CLAVE_REINICIO ? crypto.randomUUID() : '[]'
      almacen.setItem(clave, valor)
      escritas.push(clave)
    }
  } catch {
    for (const clave of escritas.reverse()) {
      const valor = anteriores.get(clave)
      if (valor === null) almacen.removeItem(clave)
      else almacen.setItem(clave, valor)
    }
    throw new Error('No se pudo completar el restablecimiento.')
  }
}

let contextoSonido

export async function reproducirSonido(tipo = 'meta') {
  if (!globalThis.AudioContext) return
  const notas = tipo === 'gasto' ? [392, 349] : tipo === 'ingreso' ? [523, 659] : [523, 659, 784]
  try {
    contextoSonido ??= new AudioContext()
    await contextoSonido.resume()
    if (contextoSonido.state !== 'running') return
    const inicio = contextoSonido.currentTime
    notas.forEach((frecuencia, i) => {
      const instante = inicio + i * 0.11
      const oscilador = contextoSonido.createOscillator()
      const volumen = contextoSonido.createGain()
      oscilador.frequency.value = frecuencia
      volumen.gain.setValueAtTime(0.001, instante)
      volumen.gain.exponentialRampToValueAtTime(0.07, instante + 0.02)
      volumen.gain.exponentialRampToValueAtTime(0.001, instante + 0.16)
      oscilador.connect(volumen)
      volumen.connect(contextoSonido.destination)
      oscilador.start(instante)
      oscilador.stop(instante + 0.16)
    })
  } catch {
    // Las políticas de reproducción del navegador pueden bloquear el audio.
  }
}
