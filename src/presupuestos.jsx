
import { useState } from 'react'
import {
  Plus, Pencil, Trash2, X, AlertTriangle,
  CheckCircle2, ChevronLeft, ChevronRight,
  Wallet
} from 'lucide-react'
import { useFinanzas, formatoCOP } from './finanzas.js'

const CLAVE = 'mente_ordenada_presupuestos_demo'

const categorias = [
  'Alimentación',
  'Transporte',
  'Vivienda',
  'Servicios',
  'Salud',
  'Entretenimiento',
  'Salario',
  'Ventas',
  'Otros'
]

function mesActual() {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(
    hoy.getMonth() + 1
  ).padStart(2, '0')}`
}

function cambiarMes(clave, diferencia) {
  const [anio, mes] = clave.split('-').map(Number)
  const fecha = new Date(anio, mes - 1 + diferencia, 1)

  return `${fecha.getFullYear()}-${String(
    fecha.getMonth() + 1
  ).padStart(2, '0')}`
}

function nombreMes(clave) {
  const [anio, mes] = clave.split('-').map(Number)

  return new Date(anio, mes - 1, 1)
    .toLocaleDateString('es-CO', {
      month: 'long',
      year: 'numeric'
    })
}

function cargar() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE))
    return Array.isArray(datos) ? datos : []
  } catch {
    return []
  }
}

export default function Presupuestos() {
  const { movimientos } = useFinanzas()

  const [presupuestos, setPresupuestos] = useState(cargar)
  const [mes, setMes] = useState(mesActual)
  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [categoria, setCategoria] = useState('Alimentación')
  const [limite, setLimite] = useState('')
  const [error, setError] = useState('')

  const delMes = presupuestos.filter(p => p.mes === mes)

  const gastos = movimientos.filter(m =>
    m.tipo === 'gasto' &&
    typeof m.fecha === 'string' &&
    m.fecha.startsWith(mes) &&
    Number.isFinite(Number(m.monto)) &&
    Number(m.monto) > 0
  )

  function gastoCategoria(nombre) {
    return gastos
      .filter(m => m.categoria === nombre)
      .reduce((suma, m) => suma + Number(m.monto), 0)
  }

  const asignado = delMes.reduce(
    (suma, p) => suma + Number(p.limite), 0
  )

  const consumido = delMes.reduce(
    (suma, p) => suma + gastoCategoria(p.categoria), 0
  )

  const alertas = delMes.filter(
    p => gastoCategoria(p.categoria) >= Number(p.limite) * 0.8
  ).length

  function persistir(nuevos) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(nuevos))
      setPresupuestos(nuevos)
      return true
    } catch {
      setError('No fue posible guardar los presupuestos.')
      return false
    }
  }

  function nuevo() {
    setEditando(null)
    setCategoria('Alimentación')
    setLimite('')
    setError('')
    setAbierto(true)
  }

  function editar(p) {
    setEditando(p.id)
    setCategoria(p.categoria)
    setLimite(String(p.limite))
    setError('')
    setAbierto(true)
  }

  function guardar(evento) {
    evento.preventDefault()
    setError('')

    const cantidad = Number(limite)

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      setError('Ingresa un límite mayor que cero.')
      return
    }

    const duplicado = presupuestos.some(p =>
      p.mes === mes &&
      p.categoria === categoria &&
      p.id !== editando
    )

    if (duplicado) {
      setError('Ya existe un presupuesto para esta categoría y mes.')
      return
    }

    let nuevos

    if (editando) {
      nuevos = presupuestos.map(p =>
        p.id === editando
          ? { ...p, categoria, limite: cantidad }
          : p
      )
    } else {
      nuevos = [
        ...presupuestos,
        {
          id: crypto.randomUUID(),
          mes,
          categoria,
          limite: cantidad
        }
      ]
    }

    if (persistir(nuevos)) {
      setAbierto(false)
      setEditando(null)
    }
  }

  function eliminar(p) {
    if (!window.confirm(
      `¿Eliminar el presupuesto de ${p.categoria}?`
    )) return

    persistir(presupuestos.filter(item => item.id !== p.id))
  }

  const campo = 'w-full rounded-xl border border-[#DFD1F1] ' +
    'bg-white px-4 py-3 text-sm outline-none ' +
    'focus:border-[#7540B8]'

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#8E7BA4]">
          Define tus límites y controla tus gastos.
        </p>

        <button
          onClick={nuevo}
          className="flex items-center gap-2 rounded-xl
                     bg-[#6935AE] px-5 py-3
                     text-sm font-bold text-white"
        >
          <Plus size={18} />
          Nuevo presupuesto
        </button>
      </div>

      <div className="flex items-center justify-between
                      rounded-2xl border border-[#EEE7F5]
                      bg-white px-5 py-4">
        <button
          aria-label="Mes anterior"
          onClick={() => setMes(cambiarMes(mes, -1))}
          className="rounded-xl bg-[#F2E9FC] p-2 text-[#713BAE]"
        >
          <ChevronLeft size={20} />
        </button>

        <h3 className="text-center font-extrabold capitalize
                       text-[#4A2179]">
          {nombreMes(mes)}
        </h3>

        <button
          aria-label="Mes siguiente"
          onClick={() => setMes(cambiarMes(mes, 1))}
          className="rounded-xl bg-[#F2E9FC] p-2 text-[#713BAE]"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ['Presupuesto asignado', asignado, '🎯'],
          ['Gastos presupuestados', consumido, '💸'],
          ['Categorías en alerta', alertas, '⚠️']
        ].map(([titulo, valor, icono], indice) => (
          <div key={titulo}
            className="rounded-2xl border border-[#EEE7F5]
                       bg-white p-5 shadow-sm">
            <div className="mb-3 text-2xl">{icono}</div>
            <p className="text-xs text-[#927EA6]">{titulo}</p>
            <h3 className="mt-2 break-words text-xl
                           font-extrabold text-[#442268]">
              {indice === 2 ? valor : formatoCOP(valor)}
            </h3>
          </div>
        ))}
      </section>

      {error && !abierto && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      {delMes.length === 0 ? (
        <section className="rounded-3xl border border-[#EEE7F5]
                            bg-white px-6 py-14 text-center">
          <Wallet
            size={40}
            className="mx-auto mb-4 text-[#8852C6]"
          />
          <h3 className="text-lg font-bold">
            No tienes presupuestos para este mes
          </h3>
          <p className="mt-2 text-sm text-[#927EA6]">
            Crea uno para comenzar a controlar tus gastos.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {delMes.map(p => {
            const usado = gastoCategoria(p.categoria)
            const porcentaje = usado / p.limite * 100
            const disponible = p.limite - usado

            const excedido = porcentaje > 100
            const alcanzado = porcentaje === 100
            const advertencia = porcentaje >= 80

            const color = excedido || alcanzado
              ? '#D05C73'
              : advertencia
                ? '#D79A3D'
                : '#8751C8'

            return (
              <article
                key={p.id}
                className="rounded-3xl border border-[#EEE7F5]
                           bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold">
                      {p.categoria}
                    </h3>
                    <p className="mt-1 text-xs text-[#927EA6]">
                      Límite: {formatoCOP(p.limite)}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <button
                      aria-label={`Editar ${p.categoria}`}
                      onClick={() => editar(p)}
                      className="rounded-lg p-2 text-[#7540B8]
                                 hover:bg-[#F2E9FC]"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      aria-label={`Eliminar ${p.categoria}`}
                      onClick={() => eliminar(p)}
                      className="rounded-lg p-2 text-[#BD5976]
                                 hover:bg-red-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#927EA6]">
                      Consumido
                    </p>
                    <p className="mt-1 text-xl font-extrabold
                                  text-[#442268]">
                      {formatoCOP(usado)}
                    </p>
                  </div>
                  <span className="text-sm font-bold"
                        style={{ color }}>
                    {Math.round(porcentaje)}%
                  </span>
                </div>

                <div className="mt-4 h-3 overflow-hidden
                                rounded-full bg-[#E9DDF5]">
                  <div
                    className="h-full rounded-full
                               transition-all duration-500"
                    style={{
                      width: `${Math.min(100, porcentaje)}%`,
                      backgroundColor: color
                    }}
                  />
                </div>

                <div className="mt-4 flex items-center gap-2
                                text-sm font-semibold"
                     style={{ color }}>
                  {advertencia
                    ? <AlertTriangle size={17} />
                    : <CheckCircle2 size={17} />}

                  <span>
                    {excedido
                      ? `Excedido por ${formatoCOP(-disponible)}`
                      : alcanzado
                        ? 'Límite alcanzado'
                        : advertencia
                          ? 'Cerca del límite'
                          : 'Presupuesto bajo control'}
                  </span>
                </div>

                <p className="mt-3 text-xs text-[#927EA6]">
                  {disponible >= 0
                    ? `Disponible: ${formatoCOP(disponible)}`
                    : 'Revisa tus gastos de esta categoría'}
                </p>
              </article>
            )
          })}
        </section>
      )}

      <p className="text-xs text-[#927EA6]">
        Solo se incluyen gastos registrados en Movimientos
        con la misma categoría y el mes seleccionado.
        Las categorías sin presupuesto no están incluidas
        en el total de gastos presupuestados.
      </p>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center
                        justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {editando ? 'Editar presupuesto' : 'Nuevo presupuesto'}
              </h3>
              <button
                aria-label="Cerrar"
                onClick={() => setAbierto(false)}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={guardar} className="space-y-4">
              <p className="text-sm text-[#927EA6]">
                Mes: {nombreMes(mes)}
              </p>

              <div>
                <label
                  htmlFor="categoriaPresupuesto"
                  className="mb-2 block text-sm font-semibold"
                >
                  Categoría
                </label>
                <select
                  id="categoriaPresupuesto"
                  className={campo}
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                >
                  {categorias.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="limitePresupuesto"
                  className="mb-2 block text-sm font-semibold"
                >
                  Límite mensual (COP)
                </label>
                <input
                  id="limitePresupuesto"
                  className={campo}
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="Ej. 500000"
                  value={limite}
                  onChange={e => setLimite(e.target.value)}
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
                {editando
                  ? 'Guardar cambios'
                  : 'Crear presupuesto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
