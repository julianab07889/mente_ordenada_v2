import assert from 'node:assert/strict'
import { test } from 'node:test'
import { extraerComprobante } from '../src/extraerComprobante.js'

test('servicio público: separa vencimiento, emisión, período y prioriza total a pagar', () => {
  const texto = [
    'Factura de servicios públicos', 'Empresa: Energía de prueba',
    'Vencimiento: 30 de noviembre de 2026', 'Fecha de expedición: 2026-11-04',
    'Período facturado: octubre 2026', 'Subtotal $90.000',
    'Total: $95.000', 'TOTAL A PAGAR COP $103.456,70'
  ].join('\n')
  assert.deepEqual(extraerComprobante(texto), {
    descripcion: 'Energía de prueba', fecha: '2026-11-04', monto: '103456.70',
    vencimiento: '2026-11-30', periodo: 'octubre 2026', categoria: 'Servicios'
  })
})

test('compra: toma encabezado y excluye fechas imposibles y subtotales', () => {
  assert.deepEqual(extraerComprobante('Supermercado La Esquina\nFecha: 31/02/2026\nSubtotal: $8.000\nTOTAL $10,250.40'), {
    descripcion: 'Supermercado La Esquina', fecha: '', monto: '10250.40',
    vencimiento: '', periodo: '', categoria: 'Alimentación'
  })
  assert.equal(extraerComprobante('IVA $ 1.400\nSubtotal $ 8.000').monto, '')
  assert.equal(extraerComprobante('Fecha límite de pago: 22/11/2026').fecha, '')
})

test('distingue miles, decimales en cero y un importe ambiguo', () => {
  const casos = [
    ['$18.263', '18263'],
    ['$18.263,000', '18263'],
    ['$18,263.000', '18263'],
    ['$18.263.000', '18263000'],
    ['$18.263,25', '18263.25'],
    ['$18.263,125', '']
  ]
  for (const [importe, esperado] of casos) {
    assert.equal(extraerComprobante('Total a pagar: ' + importe).monto, esperado, importe)
  }
})
