
import { useState } from 'react'
import {
  Plus, Wallet, Landmark, Banknote,
  Smartphone, Pencil, Trash2, X
} from 'lucide-react'
import {
  useFinanzas,
  guardarCuentas,
  saldoActual,
  formatoCOP
} from './finanzas.js'

const tipos = {
  banco: { nombre: 'Cuenta bancaria', Icono: Landmark },
  billetera: { nombre: 'Billetera digital', Icono: Smartphone },
  efectivo: { nombre: 'Efectivo', Icono: Banknote },
  otra: { nombre: 'Otra cuenta', Icono: Wallet }
}

const vacio = {
  nombre: '',
  tipo: 'banco',
  saldoInicial: ''
}

export default function Cuentas() {
  const { cuentas, movimientos } = useFinanzas()
  const [formulario, setFormulario] = useState(false)
  const [edicion, setEdicion] = useState(null)
  const [datos, setDatos] = useState(vacio)
  const [error, setError] = useState('')

  const total = cuentas.reduce(
    (suma, cuenta) => suma + saldoActual(cuenta, movimientos),
    0
  )

  function nuevaCuenta() {
    setEdicion(null)
    setDatos(vacio)
    setError('')
    setFormulario(true)
  }

  function editar(cuenta) {
    setEdicion(cuenta.id)
    setDatos({
      nombre: cuenta.nombre,
      tipo: cuenta.tipo,
      saldoInicial: String(cuenta.saldoInicial)
    })
    setError('')
    setFormulario(true)
  }

  function guardar(evento) {
    evento.preventDefault()
    setError('')

    const nombre = datos.nombre.trim()
    const saldo = Number(datos.saldoInicial)

    if (!nombre || datos.saldoInicial === '' ||
        !Number.isFinite(saldo) || saldo < 0) {
      setError('Ingresa un nombre y un saldo inicial válido.')
      return
    }

    try {
      if (edicion) {
        const nuevas = cuentas.map(cuenta =>
          cuenta.id === edicion
            ? { ...cuenta, nombre, tipo: datos.tipo, saldoInicial: saldo }
            : cuenta
        )
        guardarCuentas(nuevas)
      } else {
        guardarCuentas([
          ...cuentas,
          {
            id: crypto.randomUUID(),
            nombre,
            tipo: datos.tipo,
            saldoInicial: saldo
          }
        ])
      }
      setFormulario(false)
    } catch {
      setError('No se pudo guardar la cuenta.')
    }
  }

  function eliminar(cuenta) {
    const tieneMovimientos = movimientos.some(
      movimiento => movimiento.cuentaId === cuenta.id
    )

    if (tieneMovimientos) {
      window.alert(
        'No puedes eliminar una cuenta con movimientos asociados.'
      )
      return
    }

    if (!window.confirm(`¿Eliminar la cuenta ${cuenta.nombre}?`)) return

    try {
      guardarCuentas(cuentas.filter(c => c.id !== cuenta.id))
    } catch {
      setError('No se pudo eliminar la cuenta.')
    }
  }

  const campo = 'w-full rounded-xl border border-[#DFD1F1] ' +
    'bg-white px-4 py-3 text-sm outline-none ' +
    'focus:border-[#7540B8]'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#8E7BA4]">
          Consulta los saldos actualizados de tu dinero.
        </p>
        <button onClick={nuevaCuenta}
          className="flex items-center gap-2 rounded-xl
                     bg-[#6935AE] px-5 py-3 text-sm
                     font-bold text-white">
          <Plus size={18} /> Nueva cuenta
        </button>
      </div>

      <section className="rounded-3xl bg-gradient-to-r
                          from-[#452078] to-[#9360D8]
                          p-7 text-white">
        <p className="text-sm text-purple-100">
          Saldo actual consolidado
        </p>
        <h3 className="mt-3 text-3xl font-extrabold">
          {formatoCOP(total)}
        </h3>
        <p className="mt-3 text-xs text-purple-100">
          {cuentas.length} cuentas registradas
        </p>
      </section>

      {error && !formulario && (
        <p role="alert" className="text-sm text-red-700">{error}</p>
      )}

      {cuentas.length === 0 ? (
        <section className="rounded-3xl border border-[#EDE5F5]
                            bg-white px-6 py-14 text-center">
          <Wallet className="mx-auto mb-4 text-[#8851C6]" size={36} />
          <h3 className="font-bold">Todavía no tienes cuentas</h3>
          <p className="mt-2 text-sm text-[#8E7BA4]">
            Crea tu primera cuenta para organizar tu dinero.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cuentas.map(cuenta => {
            const Icono = tipos[cuenta.tipo]?.Icono || Wallet
            const saldo = saldoActual(cuenta, movimientos)
            const cantidad = movimientos.filter(
              m => m.cuentaId === cuenta.id
            ).length

            return (
              <article key={cuenta.id}
                className="rounded-3xl border border-[#EDE5F5]
                           bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div className="rounded-2xl bg-[#F0E5FC] p-3">
                    <Icono size={23} color="#7540B8" />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => editar(cuenta)}
                      aria-label={`Editar ${cuenta.nombre}`}
                      className="rounded-lg p-2 text-[#7540B8]
                                 hover:bg-[#F0E5FC]">
                      <Pencil size={17} />
                    </button>
                    <button onClick={() => eliminar(cuenta)}
                      aria-label={`Eliminar ${cuenta.nombre}`}
                      className="rounded-lg p-2 text-[#BD5976]
                                 hover:bg-red-50">
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold">{cuenta.nombre}</h3>
                <p className="mt-1 text-xs text-[#927EA6]">
                  {tipos[cuenta.tipo]?.nombre}
                </p>
                <p className="mt-5 text-2xl font-extrabold
                              text-[#4A2179]">
                  {formatoCOP(saldo)}
                </p>
                <p className="mt-1 text-xs text-[#927EA6]">
                  Saldo actual · {cantidad} movimientos
                </p>
                <p className="mt-3 text-xs text-[#A18DB3]">
                  Saldo inicial: {formatoCOP(cuenta.saldoInicial)}
                </p>
              </article>
            )
          })}
        </section>
      )}

      {formulario && (
        <div className="fixed inset-0 z-50 flex items-center
                        justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {edicion ? 'Editar cuenta' : 'Nueva cuenta'}
              </h3>
              <button onClick={() => setFormulario(false)}
                      aria-label="Cerrar formulario">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={guardar} className="space-y-4">
              <div>
                <label htmlFor="nombreCuenta"
                       className="mb-2 block text-sm font-semibold">
                  Nombre de la cuenta
                </label>
                <input id="nombreCuenta" className={campo}
                  required maxLength={60}
                  placeholder="Ej. Nequi personal"
                  value={datos.nombre}
                  onChange={e => setDatos({
                    ...datos, nombre: e.target.value
                  })} />
              </div>

              <div>
                <label htmlFor="tipoCuenta"
                       className="mb-2 block text-sm font-semibold">
                  Tipo de cuenta
                </label>
                <select id="tipoCuenta" className={campo}
                  value={datos.tipo}
                  onChange={e => setDatos({
                    ...datos, tipo: e.target.value
                  })}>
                  {Object.entries(tipos).map(([clave, valor]) => (
                    <option key={clave} value={clave}>
                      {valor.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="saldoCuenta"
                       className="mb-2 block text-sm font-semibold">
                  Saldo inicial (COP)
                </label>
                <input id="saldoCuenta" className={campo}
                  type="number" min="0" step="0.01" required
                  value={datos.saldoInicial}
                  onChange={e => setDatos({
                    ...datos, saldoInicial: e.target.value
                  })} />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-700">
                  {error}
                </p>
              )}

              <button type="submit"
                className="w-full rounded-xl bg-[#6935AE]
                           py-3 font-bold text-white">
                {edicion ? 'Guardar cambios' : 'Crear cuenta'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
