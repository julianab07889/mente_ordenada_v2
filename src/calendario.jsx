
import { useState } from 'react'
import {
  CalendarDays, ChevronLeft, ChevronRight,
  Plus, X, Trash2, CheckCircle2, Clock3
} from 'lucide-react'

const CLAVE = 'mente_ordenada_calendario_demo'

const dinero = valor => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
}).format(valor)

function fechaLocal() {
  const fecha = new Date()
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function leerEventos() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE))
    return Array.isArray(datos) ? datos : []
  } catch {
    return []
  }
}

const vacio = () => ({
  nombre: '',
  monto: '',
  tipo: 'pago',
  fecha: fechaLocal()
})

export default function Calendario() {
  const [eventos, setEventos] = useState(leerEventos)
  const [mes, setMes] = useState(() => {
    const hoy = new Date()
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  })
  const [abierto, setAbierto] = useState(false)
  const [formulario, setFormulario] = useState(vacio)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todos')

  const hoy = fechaLocal()
  const anio = mes.getFullYear()
  const numeroMes = mes.getMonth()
  const claveMes = `${anio}-${String(numeroMes + 1).padStart(2, '0')}`

  const tituloMes = mes.toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric'
  })

  const inicio = new Date(anio, numeroMes, 1)
  const desplazamiento = (inicio.getDay() + 6) % 7
  const totalDias = new Date(anio, numeroMes + 1, 0).getDate()

  const dias = [
    ...Array(desplazamiento).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1)
  ]

  const delMes = eventos.filter(e =>
    typeof e.fecha === 'string' &&
    e.fecha.startsWith(claveMes)
  )

  const pendientes = delMes.filter(e => !e.completado)
  const vencidos = pendientes.filter(e => e.fecha < hoy)

  const visibles = [...delMes]
    .filter(e =>
      filtro === 'todos' ||
      (filtro === 'pendientes' && !e.completado) ||
      (filtro === 'completados' && e.completado)
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  function persistir(nuevos) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(nuevos))
      setEventos(nuevos)
      return true
    } catch {
      setError('No se pudieron guardar los eventos.')
      return false
    }
  }

  function cambiarMes(cantidad) {
    setMes(actual => new Date(
      actual.getFullYear(),
      actual.getMonth() + cantidad,
      1
    ))
  }

  function crear(evento) {
    evento.preventDefault()
    setError('')

    const monto = Number(formulario.monto)

    if (!formulario.nombre.trim() ||
        !formulario.fecha ||
        !Number.isFinite(monto) || monto <= 0) {
      setError('Ingresa un nombre, fecha y monto válido.')
      return
    }

    const nuevo = {
      id: crypto.randomUUID(),
      nombre: formulario.nombre.trim(),
      monto,
      fecha: formulario.fecha,
      tipo: formulario.tipo,
      completado: false
    }

    if (persistir([...eventos, nuevo])) {
      const [a, m] = formulario.fecha.split('-').map(Number)
      setMes(new Date(a, m - 1, 1))
      setAbierto(false)
      setFormulario(vacio())
    }
  }

  function cambiarEstado(id) {
    persistir(eventos.map(e =>
      e.id === id
        ? { ...e, completado: !e.completado }
        : e
    ))
  }

  function eliminar(id) {
    if (!window.confirm('¿Eliminar este compromiso?')) return
    persistir(eventos.filter(e => e.id !== id))
  }

  function eventosDia(dia) {
    if (!dia) return []
    const fecha = `${claveMes}-${String(dia).padStart(2, '0')}`
    return delMes.filter(e => e.fecha === fecha)
  }

  function abrirEnFecha(dia) {
    setFormulario({
      ...vacio(),
      fecha: `${claveMes}-${String(dia).padStart(2, '0')}`
    })
    setError('')
    setAbierto(true)
  }

  const campo = 'w-full rounded-xl border border-[#DFD1F1] ' +
    'bg-white px-4 py-3 text-sm outline-none ' +
    'focus:border-[#7540B8]'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#8E7BA4]">
          Controla tus fechas de pagos y cobros.
        </p>

        <button
          onClick={() => {
            setFormulario(vacio())
            setError('')
            setAbierto(true)
          }}
          className="flex items-center gap-2 rounded-xl
                     bg-[#6935AE] px-5 py-3 text-sm
                     font-bold text-white"
        >
          <Plus size={18} />
          Nuevo compromiso
        </button>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ['Compromisos del mes', delMes.length, '📅'],
          ['Pendientes', pendientes.length, '⏳'],
          ['Vencidos', vencidos.length, '⚠️']
        ].map(([titulo, valor, icono]) => (
          <div key={titulo}
            className="rounded-2xl border border-[#EEE7F5]
                       bg-white p-5 shadow-sm">
            <div className="mb-2 text-2xl">{icono}</div>
            <p className="text-xs text-[#927EA6]">{titulo}</p>
            <p className="mt-2 text-2xl font-extrabold
                          text-[#442268]">{valor}</p>
          </div>
        ))}
      </section>

      {error && !abierto && (
        <p role="alert" className="text-sm text-red-700">{error}</p>
      )}

      <section className="rounded-3xl border border-[#EEE7F5]
                          bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg
                         font-extrabold capitalize">
            <CalendarDays size={21} color="#8051C4" />
            {tituloMes}
          </h3>

          <div className="flex gap-2">
            <button
              aria-label="Mes anterior"
              onClick={() => cambiarMes(-1)}
              className="rounded-xl bg-[#F2E9FC] p-2
                         text-[#713BAE]">
              <ChevronLeft size={19} />
            </button>
            <button
              aria-label="Mes siguiente"
              onClick={() => cambiarMes(1)}
              className="rounded-xl bg-[#F2E9FC] p-2
                         text-[#713BAE]">
              <ChevronRight size={19} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <div key={i}
              className="py-2 text-center text-xs font-bold
                         text-[#8E7BA4]">
              {d}
            </div>
          ))}

          {dias.map((dia, i) => {
            const items = eventosDia(dia)
            const esHoy = dia &&
              `${claveMes}-${String(dia).padStart(2, '0')}` === hoy

            return dia ? (
              <button key={i}
                onClick={() => abrirEnFecha(dia)}
                title={`${items.length} compromisos. Crear uno nuevo.`}
                className={`min-h-16 rounded-xl border p-1.5
                            text-left transition sm:min-h-24 sm:p-2
                  ${esHoy
                    ? 'border-[#8852CB] bg-[#F1E8FC]'
                    : 'border-[#EEE7F5] hover:bg-[#FAF7FE]'}`}
              >
                <span className="text-xs font-bold">{dia}</span>
                <div className="mt-1 space-y-1">
                  {items.slice(0, 2).map(e => (
                    <div key={e.id}
                      className={`truncate rounded px-1 py-0.5
                                  text-[9px] sm:text-[10px]
                        ${e.completado
                          ? 'bg-[#DCF5E9] text-[#22775B]'
                          : e.fecha < hoy
                            ? 'bg-[#FDE7E7] text-[#A54141]'
                            : 'bg-[#EEE2FA] text-[#7540B8]'}`}
                    >
                      {e.nombre}
                    </div>
                  ))}
                  {items.length > 2 && (
                    <p className="text-[9px] text-[#806999]">
                      +{items.length - 2} más
                    </p>
                  )}
                </div>
              </button>
            ) : (
              <div key={i} />
            )
          })}
        </div>

        <p className="mt-5 text-xs text-[#927EA6]">
          Selecciona un día para crear un compromiso en esa fecha.
        </p>
      </section>

      <section className="rounded-3xl border border-[#EEE7F5]
                          bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center
                        justify-between gap-3">
          <h3 className="text-lg font-bold">
            Compromisos del mes
          </h3>
          <select
            aria-label="Filtrar compromisos"
            className={campo}
            style={{ maxWidth: 175 }}
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="pendientes">Pendientes</option>
            <option value="completados">Completados</option>
          </select>
        </div>

        {visibles.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#927EA6]">
            No hay compromisos para mostrar.
          </p>
        ) : (
          <div className="space-y-3">
            {visibles.map(e => {
              const vencido = !e.completado && e.fecha < hoy

              return (
                <div key={e.id}
                  className="flex flex-wrap items-center
                             justify-between gap-3 rounded-xl
                             border border-[#EEE7F5] p-4">
                  <div>
                    <p className="font-bold">{e.nombre}</p>
                    <p className="mt-1 text-xs text-[#927EA6]">
                      {e.fecha} · {e.tipo === 'pago'
                        ? 'Pago'
                        : 'Cobro'}
                    </p>
                    <p className="mt-1 text-sm font-semibold
                                  text-[#6C389E]">
                      {dinero(e.monto)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => cambiarEstado(e.id)}
                      className={`flex items-center gap-1
                                  rounded-lg px-3 py-2
                                  text-xs font-bold
                        ${e.completado
                          ? 'bg-[#DCF5E9] text-[#22775B]'
                          : vencido
                            ? 'bg-[#FDE7E7] text-[#A54141]'
                            : 'bg-[#EEE4FA] text-[#713BAE]'}`}
                    >
                      {e.completado
                        ? <CheckCircle2 size={15} />
                        : <Clock3 size={15} />}
                      {e.completado
                        ? 'Realizado'
                        : vencido
                          ? 'Vencido'
                          : 'Pendiente'}
                    </button>

                    <button
                      aria-label={`Eliminar ${e.nombre}`}
                      onClick={() => eliminar(e.id)}
                      className="rounded-lg p-2 text-[#BD5976]
                                 hover:bg-red-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center
                        justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold">
                Nuevo compromiso
              </h3>
              <button
                aria-label="Cerrar formulario"
                onClick={() => setAbierto(false)}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={crear} className="space-y-4">
              <div>
                <label htmlFor="nombreEvento"
                  className="mb-2 block text-sm font-semibold">
                  Nombre
                </label>
                <input
                  id="nombreEvento"
                  className={campo}
                  maxLength={100}
                  placeholder="Ej. Pago de internet"
                  required
                  value={formulario.nombre}
                  onChange={e => setFormulario({
                    ...formulario,
                    nombre: e.target.value
                  })}
                />
              </div>

              <div>
                <label htmlFor="tipoEvento"
                  className="mb-2 block text-sm font-semibold">
                  Tipo
                </label>
                <select
                  id="tipoEvento"
                  className={campo}
                  value={formulario.tipo}
                  onChange={e => setFormulario({
                    ...formulario,
                    tipo: e.target.value
                  })}
                >
                  <option value="pago">Pago pendiente</option>
                  <option value="cobro">Cobro esperado</option>
                </select>
              </div>

              <div>
                <label htmlFor="montoEvento"
                  className="mb-2 block text-sm font-semibold">
                  Monto (COP)
                </label>
                <input
                  id="montoEvento"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  className={campo}
                  value={formulario.monto}
                  onChange={e => setFormulario({
                    ...formulario,
                    monto: e.target.value
                  })}
                />
              </div>

              <div>
                <label htmlFor="fechaEvento"
                  className="mb-2 block text-sm font-semibold">
                  Fecha
                </label>
                <input
                  id="fechaEvento"
                  type="date"
                  required
                  className={campo}
                  value={formulario.fecha}
                  onChange={e => setFormulario({
                    ...formulario,
                    fecha: e.target.value
                  })}
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-[#6935AE]
                           py-3 font-bold text-white"
              >
                Guardar compromiso
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
