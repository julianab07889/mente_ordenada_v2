import { useEffect, useState } from 'react'
import { formatoCOP, saldoActual, useFinanzas } from './finanzas.js'
import {
  avisosDeFacturas, eventosDeFacturas, fechaLocal, pagarFactura, useFacturas
} from './facturas.js'
import { avisarOrbi } from './orbiEstado.js'

const campo = 'w-full rounded-xl border border-[#DFD1F1] bg-white px-4 py-3 text-sm outline-none focus:border-[#7540B8]'

export function CuentaFactura({ id, cuentas, movimientos, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">Cuenta o billetera</label>
      <select id={id} className={campo} required value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Selecciona una cuenta</option>
        {cuentas.map(cuenta => (
          <option key={cuenta.id} value={cuenta.id}>
            {cuenta.nombre} — {formatoCOP(saldoActual(cuenta, movimientos))}
          </option>
        ))}
      </select>
    </div>
  )
}

function PagoPendiente({ factura, cuentas, movimientos, terminar }) {
  const [cuenta, setCuenta] = useState('')
  const [fecha, setFecha] = useState(fechaLocal)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function pagar(evento) {
    evento.preventDefault()
    if (guardando) return
    setGuardando(true)
    setError('')
    try {
      const resultado = await pagarFactura(factura.id, cuenta, fecha)
      if (resultado.nuevo) avisarOrbi('gasto')
      terminar(resultado.sincronizada
        ? 'Factura pagada. El gasto está registrado.'
        : 'El gasto está registrado. El comprobante se vinculó por su identificador.')
    } catch (fallo) {
      setError(fallo.message || 'No se pudo registrar el pago.')
    } finally {
      setGuardando(false)
    }
  }

  const id = 'pagar-' + factura.id
  return (
    <form onSubmit={pagar} className="mt-3 space-y-3">
      <CuentaFactura id={id} cuentas={cuentas} movimientos={movimientos} value={cuenta} onChange={setCuenta} />
      <div>
        <label htmlFor={id + '-fecha'} className="mb-2 block text-sm font-semibold">Fecha de pago</label>
        <input id={id + '-fecha'} type="date" required value={fecha} className={campo}
          onChange={e => setFecha(e.target.value)} />
      </div>
      {cuentas.length === 0 && <p className="text-sm text-[#A13F56]">Primero crea una cuenta o billetera.</p>}
      {error && <p role="alert" className="text-sm text-[#A13F56]">{error}</p>}
      <button type="submit" disabled={guardando || cuentas.length === 0}
        className="rounded-xl bg-[#6935AE] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
        Confirmar pago
      </button>
    </form>
  )
}

export function FacturasPendientes({ facturas, cuentas, movimientos, alPagar }) {
  const [elegida, setElegida] = useState(null)
  const pagadas = new Set(movimientos.map(movimiento => movimiento.comprobante?.id))
  const pendientes = facturas.filter(factura => !factura.pagada && !pagadas.has(factura.id))
  if (!pendientes.length) return null

  return (
    <section className="space-y-3 rounded-3xl border border-[#EEE7F5] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-extrabold">Facturas pendientes</h3>
      {pendientes.map(factura => (
        <div key={factura.id} className="rounded-xl border border-[#EEE7F5] p-4">
          <p className="font-bold">{factura.descripcion} · {formatoCOP(factura.monto)}</p>
          <p className="text-sm text-[#927EA6]">
            Vence el {factura.vencimiento}{factura.periodo && ' · ' + factura.periodo}
          </p>
          <button type="button" onClick={() => setElegida(elegida === factura.id ? null : factura.id)}
            aria-expanded={elegida === factura.id} className="mt-2 text-sm font-bold text-[#6935AE]">
            {elegida === factura.id ? 'Ocultar formulario de pago' : 'Marcar como pagada'}
          </button>
          {elegida === factura.id && (
            <PagoPendiente factura={factura} cuentas={cuentas} movimientos={movimientos}
              terminar={mensaje => { setElegida(null); alPagar(mensaje) }} />
          )}
        </div>
      ))}
    </section>
  )
}

export function AvisosFacturas({ abrirCalendario }) {
  const facturas = useFacturas()
  const { movimientos } = useFinanzas()
  const [hoy, setHoy] = useState(fechaLocal)

  useEffect(() => {
    const actualizar = () => setHoy(fechaLocal())
    const timer = setInterval(actualizar, 60000)
    window.addEventListener('focus', actualizar)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', actualizar)
    }
  }, [])

  const avisos = avisosDeFacturas(eventosDeFacturas(facturas, movimientos), hoy)
  if (!avisos.length) return null
  return (
    <section aria-label="Avisos de vencimiento"
      className="mb-5 rounded-xl bg-[#EDE2FB] px-4 py-3 text-sm text-[#6532A6]">
      <ul className="space-y-1">
        {avisos.map(aviso => (
          <li key={aviso.id}>
            {aviso.nombre} · {aviso.fecha < hoy ? 'Venció el ' : aviso.fecha === hoy ? 'Vence hoy · ' : 'Vence el '}
            {aviso.fecha}
          </li>
        ))}
      </ul>
      <button type="button" onClick={abrirCalendario} className="mt-2 font-bold underline">Ver calendario</button>
    </section>
  )
}
