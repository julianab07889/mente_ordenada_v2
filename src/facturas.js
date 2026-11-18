import { useMemo, useSyncExternalStore } from 'react'
import { fechaValida, normalizar } from './extraerComprobante.js'
import { guardarMovimientos, leerFinanzasActuales, saldoActual } from './finanzas.js'

const CLAVE = 'mente_ordenada_facturas_demo'
const EVENTO = 'mente-ordenada-facturas'

export function fechaLocal(fecha = new Date()) {
  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, '0'),
    String(fecha.getDate()).padStart(2, '0')
  ].join('-')
}

function snapshot() {
  return localStorage.getItem(CLAVE) ?? '[]'
}

function leer(texto) {
  const datos = JSON.parse(texto)
  if (!Array.isArray(datos)) throw new Error('No se pudo leer el registro de facturas.')
  return datos
}

function suscribir(actualizar) {
  window.addEventListener(EVENTO, actualizar)
  window.addEventListener('storage', actualizar)
  return () => {
    window.removeEventListener(EVENTO, actualizar)
    window.removeEventListener('storage', actualizar)
  }
}

export function useFacturas() {
  const texto = useSyncExternalStore(suscribir, snapshot, () => '[]')
  return useMemo(() => {
    try { return leer(texto) } catch { return [] }
  }, [texto])
}

function guardar(facturas) {
  localStorage.setItem(CLAVE, JSON.stringify(facturas))
  window.dispatchEvent(new Event(EVENTO))
}

function operacionExclusiva(operacion) {
  return globalThis.navigator?.locks
    ? navigator.locks.request(CLAVE, async () => operacion())
    : Promise.resolve().then(operacion)
}

function preparar(datos, pendiente) {
  const descripcion = datos.descripcion.trim()
  const monto = Number(datos.monto)
  const avisoDias = Number(datos.avisoDias)
  if (!descripcion || !Number.isFinite(monto) || monto <= 0) {
    throw new Error('Ingresa la empresa o comercio y un total válido.')
  }
  if ((datos.fecha && !fechaValida(datos.fecha)) ||
      (datos.vencimiento && !fechaValida(datos.vencimiento))) {
    throw new Error('Revisa las fechas del comprobante.')
  }
  if (pendiente && (!fechaValida(datos.vencimiento) ||
      !Number.isInteger(avisoDias) || avisoDias < 0 || avisoDias > 30)) {
    throw new Error('Ingresa el vencimiento y un aviso de 0 a 30 días.')
  }
  return {
    id: crypto.randomUUID(),
    descripcion,
    monto,
    categoria: datos.categoria,
    fecha: datos.fecha,
    vencimiento: datos.vencimiento,
    periodo: datos.periodo.trim(),
    avisoDias: pendiente ? avisoDias : 0,
    huella: datos.huella || ''
  }
}

function registrarGasto(factura, cuentaId, fechaPago, finanzas) {
  if (!fechaValida(fechaPago)) throw new Error('Indica una fecha de pago válida.')
  const cuenta = finanzas.cuentas.find(actual => actual.id === cuentaId)
  if (!cuenta) throw new Error('Selecciona una cuenta válida.')
  if (factura.monto > saldoActual(cuenta, finanzas.movimientos)) {
    throw new Error('El saldo de esta cuenta es insuficiente.')
  }

  const { id, descripcion, monto, categoria, fecha, vencimiento, periodo, huella } = factura
  const movimiento = {
    id,
    tipo: 'gasto',
    descripcion,
    monto,
    categoria,
    cuentaId,
    fecha: fechaPago,
    origen: 'comprobante_manual',
    comprobante: { id, fechaEmision: fecha, vencimiento, periodo, huella }
  }
  guardarMovimientos([movimiento, ...finanzas.movimientos])
  return movimiento
}

export async function huellaComprobante(archivo) {
  const digest = await crypto.subtle.digest('SHA-256', await archivo.arrayBuffer())
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

function claveTexto(texto) {
  return normalizar(texto || '').replace(/[^a-z0-9]+/g, ' ').trim()
}

function mismoComprobante(a, b) {
  const empresa = claveTexto(a.descripcion)
  if (!empresa || empresa !== claveTexto(b.descripcion) ||
      Math.round(a.monto * 100) !== Math.round(b.monto * 100)) return false
  const periodoA = claveTexto(a.periodo)
  const periodoB = claveTexto(b.periodo)
  if (periodoA && periodoB && periodoA !== periodoB) return false
  return Boolean((periodoA && periodoA === periodoB) ||
    (a.fecha && a.fecha === b.fecha) ||
    (a.vencimiento && a.vencimiento === b.vencimiento))
}

function facturasDeMovimientos(movimientos) {
  return movimientos
    .filter(m => m.tipo === 'gasto' && (m.comprobante || m.origen === 'comprobante_manual'))
    .map(m => ({
      id: m.comprobante?.id || m.id,
      descripcion: m.descripcion,
      monto: m.monto,
      fecha: m.comprobante ? m.comprobante.fechaEmision : m.fecha,
      vencimiento: m.comprobante?.vencimiento,
      periodo: m.comprobante?.periodo,
      huella: m.comprobante?.huella
    }))
}

function comprobarDuplicado(factura, existentes, confirmacion) {
  if (factura.huella && existentes.some(actual => actual.huella === factura.huella)) {
    throw new Error('Este archivo ya está registrado. Si corresponde a una factura pendiente, gestiónala desde la lista de pendientes.')
  }
  const coincidencias = [...new Set(existentes.filter(actual => mismoComprobante(factura, actual))
    .map(actual => actual.id))].sort()
  if (!coincidencias.length) return
  const datos = { ...factura, id: undefined }
  const clave = JSON.stringify([datos, coincidencias])
  if (clave === confirmacion) return
  const error = new Error('Posible duplicado: ya existe un comprobante con datos similares. Confirma solo si son facturas distintas.')
  error.confirmacionDuplicado = clave
  throw error
}

export function confirmarFactura(datos, pendiente, confirmacion) {
  return operacionExclusiva(() => {
    const factura = preparar(datos, pendiente)
    const facturas = leer(snapshot())
    const finanzas = leerFinanzasActuales()
    comprobarDuplicado(factura, [...facturas, ...facturasDeMovimientos(finanzas.movimientos)], confirmacion)
    if (pendiente) {
      guardar([...facturas, factura])
    } else {
      registrarGasto(factura, datos.cuentaId, datos.fechaPago, finanzas)
    }
  })
}

export function pagarFactura(id, cuentaId, fechaPago) {
  return operacionExclusiva(() => {
    const facturas = leer(snapshot())
    const factura = facturas.find(actual => actual.id === id)
    if (!factura) throw new Error('Esta factura ya no está disponible.')
    if (factura.pagada) return { nuevo: false, sincronizada: true }

    const finanzas = leerFinanzasActuales()
    const existente = finanzas.movimientos.find(movimiento => movimiento.comprobante?.id === id)
    const movimiento = existente || registrarGasto(factura, cuentaId, fechaPago, finanzas)
    try {
      guardar(facturas.map(actual => actual.id === id
        ? { ...actual, pagada: movimiento.fecha }
        : actual))
      return { nuevo: !existente, sincronizada: true }
    } catch {
      // El movimiento contiene el mismo ID y permite recuperar este estado.
      return { nuevo: !existente, sincronizada: false }
    }
  })
}

export function eventosDeFacturas(facturas, movimientos) {
  const pagadas = new Set(movimientos.map(movimiento => movimiento.comprobante?.id))
  return facturas.map(factura => ({
    id: factura.id,
    nombre: factura.descripcion,
    monto: factura.monto,
    fecha: factura.vencimiento,
    tipo: 'pago',
    completado: Boolean(factura.pagada) || pagadas.has(factura.id),
    esFactura: true,
    avisoDias: factura.avisoDias
  }))
}

export function avisosDeFacturas(eventos, hoy) {
  const timestamp = Date.parse(hoy)
  return eventos.filter(evento => {
    if (evento.completado) return false
    const dias = (Date.parse(evento.fecha) - timestamp) / 86400000
    return dias <= evento.avisoDias
  }).sort((a, b) => a.fecha.localeCompare(b.fecha))
}
