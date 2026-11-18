import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CLAVE_REINICIO, leerConfiguracion, restablecerDatos } from '../src/configuracion.js'

const cuentas = 'mente_ordenada_cuentas_demo'
const historial = ['movimientos_demo', 'metas', 'presupuestos_demo', 'calendario_demo', 'facturas_demo']
  .map(nombre => 'mente_ordenada_' + nombre)

function almacenamiento(falla) {
  const valores = new Map([
    [cuentas, '[{"id":"A","nombre":"Billetera de prueba","saldoInicial":46000}]'],
    ...historial.map(clave => [clave, '[{"id":"registro-demo"}]']),
    ['mente_ordenada_configuracion', '{"tema":"oscuro","sonido":true}'],
    ['mente_ordenada_orbi_preferencias', '{"variante":"gafas"}'],
    ['otra_aplicacion', 'dato independiente']
  ])
  return {
    valores,
    getItem: clave => valores.get(clave) ?? null,
    setItem: (clave, valor) => {
      if (clave === falla) throw new Error('Fallo simulado')
      valores.set(clave, valor)
    },
    removeItem: clave => valores.delete(clave)
  }
}

test('configuración usa valores seguros ante preferencias ausentes o inválidas', () => {
  assert.deepEqual(leerConfiguracion(''), { tema: 'claro', sonido: false })
  assert.deepEqual(leerConfiguracion('{"tema":"verde","sonido":true}'), { tema: 'verde', sonido: true })
  assert.deepEqual(leerConfiguracion('{"tema":"desconocido","sonido":"false"}'), { tema: 'claro', sonido: false })
})

test('restablecer conserva cuentas y preferencias, deja saldos en cero y limpia historial', () => {
  const almacen = almacenamiento()
  restablecerDatos(almacen)
  assert.deepEqual(JSON.parse(almacen.getItem(cuentas)), [{ id: 'A', nombre: 'Billetera de prueba', saldoInicial: 0 }])
  for (const clave of historial) assert.equal(almacen.getItem(clave), '[]')
  assert.equal(almacen.getItem('mente_ordenada_configuracion'), '{"tema":"oscuro","sonido":true}')
  assert.equal(almacen.getItem('mente_ordenada_orbi_preferencias'), '{"variante":"gafas"}')
  assert.equal(almacen.getItem('otra_aplicacion'), 'dato independiente')
  assert.ok(almacen.getItem(CLAVE_REINICIO))
})

test('restablecer recupera los valores anteriores si falla una escritura', () => {
  const almacen = almacenamiento(historial[2])
  const anteriores = new Map(almacen.valores)
  assert.throws(() => restablecerDatos(almacen), /No se pudo completar/)
  assert.deepEqual(almacen.valores, anteriores)
})
