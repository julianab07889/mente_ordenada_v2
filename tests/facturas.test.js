import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { extraerComprobante } from '../src/extraerComprobante.js'
import { avisosDeFacturas, confirmarFactura, eventosDeFacturas, huellaComprobante, pagarFactura } from '../src/facturas.js'
import { guardarCuentas, guardarMovimientos, leerFinanzasActuales, saldoActual } from '../src/finanzas.js'

const clave = 'mente_ordenada_facturas_demo'
const almacen = new Map()
let escrituras
let rechazarFacturas
globalThis.window = new EventTarget()
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: llave => almacen.get(llave) ?? null,
  setItem: (llave, valor) => {
    if (llave === clave && rechazarFacturas) throw new Error('Cuota simulada')
    almacen.set(llave, valor)
    if (llave === 'mente_ordenada_movimientos_demo') escrituras++
  }
} })

const datos = {
  descripcion: 'Acueducto Demo', monto: 25000, categoria: 'Servicios',
  fecha: '2026-11-10', vencimiento: '2026-11-20', periodo: 'octubre 2026',
  avisoDias: 3, cuentaId: 'A', fechaPago: '2026-11-17'
}

beforeEach(() => {
  almacen.clear()
  escrituras = 0
  rechazarFacturas = false
  guardarCuentas([{ id: 'A', saldoInicial: 80000 }])
})

function leerFacturas() {
  return JSON.parse(almacen.get(clave) ?? '[]')
}

test('pendiente: crea un evento, respeta el aviso y conserva saldos', async () => {
  await confirmarFactura(datos, true)
  const eventos = eventosDeFacturas(leerFacturas(), [])
  assert.equal(eventos[0].fecha, '2026-11-20')
  assert.equal(eventos[0].completado, false)
  assert.equal(avisosDeFacturas(eventos, '2026-11-16').length, 0)
  assert.equal(avisosDeFacturas(eventos, '2026-11-17').length, 1)
  assert.equal(avisosDeFacturas(eventos, '2026-11-21').length, 1)
  assert.deepEqual(leerFinanzasActuales().movimientos, [])
  assert.equal(escrituras, 0)
})

test('pagada directamente: usa la fecha de pago para el saldo y conserva la de emisión', async () => {
  await confirmarFactura(datos, false)
  const { cuentas, movimientos } = leerFinanzasActuales()
  assert.equal(escrituras, 1)
  assert.equal(movimientos[0].fecha, '2026-11-17')
  assert.equal(movimientos[0].comprobante.fechaEmision, '2026-11-10')
  assert.equal(saldoActual(cuentas[0], movimientos), 55000)
  assert.deepEqual(leerFacturas(), [])
})

test('pago posterior: reintentos concurrentes escriben un solo gasto', async () => {
  await confirmarFactura(datos, true)
  const [{ id }] = leerFacturas()
  const pagos = await Promise.all([
    pagarFactura(id, 'A', datos.fechaPago), pagarFactura(id, 'A', datos.fechaPago)
  ])
  const { movimientos } = leerFinanzasActuales()
  assert.equal(pagos.filter(pago => pago.nuevo).length, 1)
  assert.equal(escrituras, 1)
  assert.equal(movimientos[0].comprobante.id, id)
  const eventos = eventosDeFacturas(leerFacturas(), movimientos)
  assert.equal(eventos[0].completado, true)
  assert.deepEqual(avisosDeFacturas(eventos, '2026-11-21'), [])
})

test('si falla actualizar el recordatorio después del gasto, un reintento recupera el estado', async () => {
  await confirmarFactura(datos, true)
  const [{ id }] = leerFacturas()
  rechazarFacturas = true
  const primero = await pagarFactura(id, 'A', datos.fechaPago)
  assert.deepEqual(primero, { nuevo: true, sincronizada: false })
  assert.equal(eventosDeFacturas(leerFacturas(), leerFinanzasActuales().movimientos)[0].completado, true)
  rechazarFacturas = false
  const segundo = await pagarFactura(id, 'A', datos.fechaPago)
  assert.deepEqual(segundo, { nuevo: false, sincronizada: true })
  assert.equal(leerFacturas()[0].pagada, datos.fechaPago)
  assert.equal(escrituras, 1)
})

test('saldo insuficiente, vencimiento inválido y aviso fuera de rango no modifican datos', async () => {
  await assert.rejects(confirmarFactura({ ...datos, monto: 90000 }, false), /saldo/)
  await assert.rejects(confirmarFactura({ ...datos, vencimiento: '2026-02-31' }, true), /fechas/)
  await assert.rejects(confirmarFactura({ ...datos, avisoDias: 31 }, true), /aviso/)
  assert.equal(escrituras, 0)
  assert.deepEqual(leerFacturas(), [])
})

test('misma huella: bloquea el archivo aunque cambien los campos o el estado', async () => {
  const documento = { ...datos, huella: 'abc' }
  await confirmarFactura(documento, true)
  await assert.rejects(confirmarFactura({ ...documento, monto: 30000 }, false), /archivo ya está registrado/)
  const [{ id }] = leerFacturas()
  await pagarFactura(id, 'A', datos.fechaPago)
  await assert.rejects(confirmarFactura(documento, true), /archivo ya está registrado/)
  assert.equal(escrituras, 1)
})

test('posible duplicado: exige confirmar los datos exactos que originaron el aviso', async () => {
  await confirmarFactura({ ...datos, descripcion: 'Acuedúcto-Demo', huella: 'uno' }, false)
  const parecido = { ...datos, huella: 'dos' }
  let confirmacion
  await assert.rejects(confirmarFactura(parecido, true), error => {
    confirmacion = error.confirmacionDuplicado
    return Boolean(confirmacion)
  })
  assert.equal(escrituras, 1)
  await assert.rejects(confirmarFactura({ ...parecido, vencimiento: '2026-11-21' }, true, confirmacion), /Posible duplicado/)
  await confirmarFactura(parecido, true, confirmacion)
  assert.equal(leerFacturas().length, 1)
})

test('facturas recurrentes con períodos distintos pueden guardarse', async () => {
  await confirmarFactura(datos, true)
  await confirmarFactura({ ...datos, periodo: 'noviembre 2026', vencimiento: '2026-12-20' }, true)
  assert.equal(leerFacturas().length, 2)
})

test('SHA-256 usa el contenido del archivo y no su nombre', async () => {
  const firma = await huellaComprobante(new File(['factura de prueba'], 'factura.pdf'))
  assert.match(firma, /^[a-f0-9]{64}$/)
  assert.equal(firma, await huellaComprobante(new File(['factura de prueba'], 'otro-nombre.pdf')))
  assert.notEqual(firma, await huellaComprobante(new Blob(['otro comprobante'])))
})

test('billetera ficticia con $46.000 acepta una factura de electricidad de $18.263 y queda en $27.737', async () => {
  guardarCuentas([
    { id: 'otra', nombre: 'Otra cuenta', saldoInicial: 1000 },
    { id: 'billetera', nombre: 'billetera ficticia', saldoInicial: 51000 }
  ])
  guardarMovimientos([{ id: 'anterior', cuentaId: 'billetera', tipo: 'gasto', monto: 5000 }])
  const inicial = leerFinanzasActuales()
  const billetera = inicial.cuentas.find(cuenta => cuenta.id === 'billetera')
  assert.equal(saldoActual(billetera, inicial.movimientos), 46000)

  const extraidos = extraerComprobante('Empresa: Energía Demo\nTotal a pagar: $18.263,000')
  await confirmarFactura({ ...datos, ...extraidos, cuentaId: billetera.id }, false)

  const { movimientos } = leerFinanzasActuales()
  assert.equal(movimientos[0].monto, 18263)
  assert.equal(movimientos[0].cuentaId, billetera.id)
  assert.equal(saldoActual(billetera, movimientos), 27737)
  assert.equal(escrituras, 2)
})
