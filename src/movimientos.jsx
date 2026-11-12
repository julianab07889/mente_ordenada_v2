
import { avisarOrbi } from './orbi.jsx'
import { useState } from 'react'
import { Plus, Trash2, X, Wallet, AlertCircle } from 'lucide-react'
import {
  useFinanzas,
  guardarMovimientos,
  saldoActual,
  formatoCOP
} from './finanzas.js'

const categorias = [
  'Alimentación', 'Transporte', 'Vivienda',
  'Servicios', 'Salud', 'Entretenimiento',
  'Salario', 'Ventas', 'Otros'
]

function fechaHoy() {
  const hoy = new Date()
  const local = new Date(
    hoy.getTime() - hoy.getTimezoneOffset() * 60000
  )
  return local.toISOString().slice(0, 10)
}

function formularioVacio() {
  return {
    tipo: 'gasto',
    descripcion: '',
    monto: '',
    categoria: 'Alimentación',
    fecha: fechaHoy(),
    cuentaId: ''
  }
}

export default function Movimientos() {
  const { cuentas, movimientos } = useFinanzas()
  const [abierto, setAbierto] = useState(false)
  const [datos, setDatos] = useState(formularioVacio)
  const [filtro, setFiltro] = useState('todos')
  const [error, setError] = useState('')

  const ingresos = movimientos
    .filter(m => m.tipo === 'ingreso')
    .reduce((s, m) => s + Number(m.monto || 0), 0)

  const gastos = movimientos
    .filter(m => m.tipo === 'gasto')
    .reduce((s, m) => s + Number(m.monto || 0), 0)

  const visibles = movimientos
    .filter(m => filtro === 'todos' || m.tipo === filtro)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  function abrirFormulario() {
    setDatos({
      ...formularioVacio(),
      cuentaId: cuentas[0]?.id || ''
    })
    setError('')
    setAbierto(true)
  }

  function cambiar(campo, valor) {
    setDatos(actual => ({ ...actual, [campo]: valor }))
  }

  function guardar(evento) {
    evento.preventDefault()
    setError('')

    const monto = Number(datos.monto)
    const cuenta = cuentas.find(c => c.id === datos.cuentaId)

    if (!datos.descripcion.trim() || !datos.fecha ||
        !cuenta || !Number.isFinite(monto) || monto <= 0) {
      setError('Completa los campos y selecciona una cuenta válida.')
      return
    }

    if (datos.tipo === 'gasto' &&
        monto > saldoActual(cuenta, movimientos)) {
      setError('El saldo de esta cuenta es insuficiente.')
      return
    }

    const nuevo = {
      ...datos,
      id: crypto.randomUUID(),
      descripcion: datos.descripcion.trim(),
      monto
    }

    try {
      guardarMovimientos([nuevo, ...movimientos])
      setAbierto(false)

guardarMovimientos([nuevo, ...movimientos])
avisarOrbi(datos.tipo)
setAbierto(false)

      setDatos(formularioVacio())
    } catch {
      setError('No fue posible guardar el movimiento.')
    }
  }

  function eliminar(id) {
    if (!window.confirm('¿Eliminar este movimiento?')) return

    try {
      guardarMovimientos(movimientos.filter(m => m.id !== id))
    } catch {
      setError('No fue posible eliminar el movimiento.')
    }
  }

  const campo = 'w-full rounded-xl border border-[#DFD1F1] ' +
    'bg-white px-4 py-3 text-sm focus:border-[#7540B8] ' +
    'outline-none'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#8E7BA4]">
          Administra tus ingresos y gastos por cuenta.
        </p>
        <button onClick={abrirFormulario}
          className="flex items-center gap-2 rounded-xl
                     bg-[#6935AE] px-5 py-3 text-sm
                     font-bold text-white">
          <Plus size={18} /> Nuevo movimiento
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Ingresos', ingresos, '📈'],
          ['Gastos', gastos, '💸'],
          ['Balance de movimientos', ingresos - gastos, '💜']
        ].map(([titulo, valor, icono]) => (
          <div key={titulo}
            className="rounded-2xl border border-[#EEE7F5]
                       bg-white p-5 shadow-sm">
            <div className="mb-3 text-2xl">{icono}</div>
            <p className="text-xs text-[#927EA6]">{titulo}</p>
            <p className="mt-2 text-xl font-extrabold
                          text-[#442268]">
              {formatoCOP(valor)}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-[#EEE7F5]
                      bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold">Historial de movimientos</h3>
          <select className={campo} style={{ maxWidth: 160 }}
            aria-label="Filtrar movimientos"
            value={filtro}
            onChange={e => setFiltro(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="ingreso">Ingresos</option>
            <option value="gasto">Gastos</option>
          </select>
        </div>

        {error && !abierto && (
          <p role="alert" className="mb-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {visibles.length === 0 ? (
          <div className="py-10 text-center text-[#927EA6]">
            <Wallet size={32} className="mx-auto mb-3" />
            No hay movimientos para mostrar.
          </div>
        ) : (
          <div className="space-y-3">
            {visibles.map(m => {
              const cuenta = cuentas.find(c => c.id === m.cuentaId)

              return (
                <div key={m.id}
                  className="flex flex-wrap items-center
                             justify-between gap-3 rounded-xl
                             border border-[#F0E9F7] p-4">
                  <div>
                    <p className="font-semibold">{m.descripcion}</p>
                    <p className="text-xs text-[#927EA6]">
                      {m.categoria} · {m.fecha}
                    </p>
                    <p className="mt-1 text-xs text-[#7540B8]">
                      {cuenta?.nombre || 'Sin cuenta asociada'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <strong className={
                      m.tipo === 'ingreso'
                        ? 'text-[#21876C]'
                        : 'text-[#C05A78]'
                    }>
                      {m.tipo === 'ingreso' ? '+' : '-'}
                      {formatoCOP(Number(m.monto))}
                    </strong>

                    <button
                      aria-label={`Eliminar ${m.descripcion}`}
                      onClick={() => eliminar(m.id)}
                      className="rounded-lg p-2 text-[#B66A85]
                                 hover:bg-[#FCEAF0]">
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center
                        justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg
                          overflow-y-auto rounded-3xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold">Nuevo movimiento</h3>
              <button onClick={() => setAbierto(false)}
                      aria-label="Cerrar formulario">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={guardar} className="space-y-4">
              <div>
                <label htmlFor="tipoMov"
                       className="mb-1 block text-sm">Tipo</label>
                <select id="tipoMov" className={campo}
                  value={datos.tipo}
                  onChange={e => cambiar('tipo', e.target.value)}>
                  <option value="gasto">Gasto</option>
                  <option value="ingreso">Ingreso</option>
                </select>
              </div>

              <div>
                <label htmlFor="cuentaMov"
                       className="mb-1 block text-sm">
                  Cuenta o billetera
                </label>
                <select id="cuentaMov" className={campo}
                  value={datos.cuentaId}
                  onChange={e => cambiar('cuentaId', e.target.value)}
                  required>
                  <option value="">Selecciona una cuenta</option>
                  {cuentas.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} — {formatoCOP(saldoActual(c, movimientos))}
                    </option>
                  ))}
                </select>
              </div>

              {cuentas.length === 0 && (
                <p className="flex gap-2 text-sm text-[#9D5970]">
                  <AlertCircle size={18} />
                  Primero crea una cuenta en Cuentas y billeteras.
                </p>
              )}

              <div>
                <label htmlFor="descripcionMov"
                       className="mb-1 block text-sm">Descripción</label>
                <input id="descripcionMov" className={campo}
                  maxLength={100} required
                  placeholder="Ej. Compra supermercado"
                  value={datos.descripcion}
                  onChange={e => cambiar('descripcion', e.target.value)} />
              </div>

              <div>
                <label htmlFor="montoMov"
                       className="mb-1 block text-sm">Monto (COP)</label>
                <input id="montoMov" className={campo}
                  type="number" min="0.01" step="0.01" required
                  value={datos.monto}
                  onChange={e => cambiar('monto', e.target.value)} />
              </div>

              <div>
                <label htmlFor="categoriaMov"
                       className="mb-1 block text-sm">Categoría</label>
                <select id="categoriaMov" className={campo}
                  value={datos.categoria}
                  onChange={e => cambiar('categoria', e.target.value)}>
                  {categorias.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="fechaMov"
                       className="mb-1 block text-sm">Fecha</label>
                <input id="fechaMov" className={campo}
                  type="date" required
                  value={datos.fecha}
                  onChange={e => cambiar('fecha', e.target.value)} />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-700">
                  {error}
                </p>
              )}

              <button type="submit"
                className="w-full rounded-xl bg-[#6935AE]
                           py-3 font-bold text-white"
                disabled={!cuentas.length}>
                Guardar movimiento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
