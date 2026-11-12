
import { useMemo, useSyncExternalStore } from 'react'

const CUENTAS = 'mente_ordenada_cuentas_demo'
const MOVIMIENTOS = 'mente_ordenada_movimientos_demo'
const EVENTO = 'mente-ordenada-datos'

function suscribir(actualizar) {
  window.addEventListener(EVENTO, actualizar)
  window.addEventListener('storage', actualizar)

  return () => {
    window.removeEventListener(EVENTO, actualizar)
    window.removeEventListener('storage', actualizar)
  }
}

function snapshotCuentas() {
  return localStorage.getItem(CUENTAS) || '[]'
}

function snapshotMovimientos() {
  return localStorage.getItem(MOVIMIENTOS) || '[]'
}

function leer(texto) {
  try {
    const datos = JSON.parse(texto)
    return Array.isArray(datos) ? datos : []
  } catch {
    return []
  }
}

function guardar(clave, datos) {
  localStorage.setItem(clave, JSON.stringify(datos))
  window.dispatchEvent(new Event(EVENTO))
}

export function useFinanzas() {
  const cuentasTexto = useSyncExternalStore(
    suscribir, snapshotCuentas, () => '[]'
  )

  const movimientosTexto = useSyncExternalStore(
    suscribir, snapshotMovimientos, () => '[]'
  )

  const cuentas = useMemo(
    () => leer(cuentasTexto), [cuentasTexto]
  )

  const movimientos = useMemo(
    () => leer(movimientosTexto), [movimientosTexto]
  )

  return { cuentas, movimientos }
}

export function guardarCuentas(cuentas) {
  guardar(CUENTAS, cuentas)
}

export function guardarMovimientos(movimientos) {
  guardar(MOVIMIENTOS, movimientos)
}

export function saldoActual(cuenta, movimientos) {
  const variacion = movimientos
    .filter(m => m.cuentaId === cuenta.id)
    .reduce((total, m) => {
      const monto = Number(m.monto) || 0
      return total + (m.tipo === 'ingreso' ? monto : -monto)
    }, 0)

  return Number(cuenta.saldoInicial) + variacion
}

export function formatoCOP(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(valor)
}
