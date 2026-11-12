
import { avisarOrbi } from './orbi.jsx'

import { useState } from 'react'
import {
  Plus, Target, CalendarDays, Trash2,
  X, Sparkles, PartyPopper
} from 'lucide-react'

const dinero = valor =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(valor)

const emojis = ['🎯', '✈️', '🏠', '🚗', '💻', '🏖️', '🎓', '💜', '🐷']

const formularioInicial = {
  nombre: '',
  emoji: '🎯',
  objetivo: '',
  fecha: ''
}

export default function Metas({
  metas,
  crearMeta,
  aportar,
  eliminarMeta
}) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [metaSeleccionada, setMetaSeleccionada] = useState(null)
  const [datos, setDatos] = useState(formularioInicial)
  const [montoAporte, setMontoAporte] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const totalObjetivos = metas.reduce(
    (total, meta) => total + Number(meta.objetivo), 0
  )

  const totalAhorrado = metas.reduce(
    (total, meta) => total + Number(meta.actual), 0
  )

  const metasCumplidas = metas.filter(
    meta => Number(meta.actual) >= Number(meta.objetivo)
  ).length

  function guardarMeta(evento) {
    evento.preventDefault()
    setError('')

    const objetivo = Number(datos.objetivo)

    if (!datos.nombre.trim() ||
        !Number.isFinite(objetivo) ||
        objetivo <= 0 ||
        !datos.fecha) {
      setError('Completa los campos con información válida.')
      return
    }

    if (datos.fecha < new Date().toLocaleDateString('en-CA')) {
      setError('La fecha objetivo no puede estar en el pasado.')
      return
    }

    crearMeta({
      id: crypto.randomUUID(),
      nombre: datos.nombre.trim(),
      emoji: datos.emoji,
      objetivo,
      actual: 0,
      fecha: datos.fecha
    })

    setDatos(formularioInicial)
    setMostrarFormulario(false)
    setMensaje('¡Tu nueva meta está lista! 🎯')
  }

  function guardarAporte(evento) {
    evento.preventDefault()
    setError('')

    if (!metaSeleccionada) return

    const cantidad = Number(montoAporte)
    const restante = Math.max(
      0,
      metaSeleccionada.objetivo - metaSeleccionada.actual
    )

    if (!Number.isFinite(cantidad) ||
        cantidad <= 0 ||
        cantidad > restante) {
      setError(`Ingresa un aporte mayor que cero y no superior a ${dinero(restante)}.`)
      return
    }

    aportar(metaSeleccionada.id, cantidad)

    const cumplida = cantidad >= restante

if (cumplida) {
  avisarOrbi('meta')
}


    setMetaSeleccionada(null)
    setMontoAporte('')
    setMensaje(
      cumplida
        ? '🎉 ¡Felicitaciones! Alcanzaste tu meta financiera.'
        : '💜 ¡Excelente! Tu ahorro sigue creciendo.'
    )
  }

  function confirmarEliminar(meta) {
    if (window.confirm(`¿Eliminar la meta "${meta.nombre}"?`)) {
      eliminarMeta(meta.id)
      setMensaje('La meta fue eliminada.')
    }
  }

  function cerrarModales() {
    setMostrarFormulario(false)
    setMetaSeleccionada(null)
    setMontoAporte('')
    setError('')
  }

  const campo = `w-full rounded-xl border border-[#DED1F1]
    bg-white px-4 py-3 text-sm outline-none
    focus:border-[#7540B8]`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#8E7BA4]">
          Organiza tus sueños y celebra cada avance.
        </p>

        <button
          onClick={() => {
            setError('')
            setMostrarFormulario(true)
          }}
          className="flex items-center gap-2 rounded-xl
                     bg-[#6935AE] px-5 py-3
                     text-sm font-bold text-white"
        >
          <Plus size={18} />
          Nueva meta
        </button>
      </div>

      {mensaje && (
        <div role="status"
          className="rounded-xl bg-[#EEE4FB]
                     px-4 py-3 text-sm font-semibold
                     text-[#6532A6]">
          {mensaje}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ['Objetivos totales', dinero(totalObjetivos), '🎯'],
          ['Ahorro registrado', dinero(totalAhorrado), '💰'],
          ['Metas cumplidas', String(metasCumplidas), '🏆']
        ].map(([titulo, valor, emoji]) => (
          <div key={titulo}
            className="rounded-2xl border border-[#EEE7F5]
                       bg-white p-5 shadow-sm">
            <div className="mb-3 text-2xl">{emoji}</div>
            <p className="text-xs text-[#927EA6]">{titulo}</p>
            <h3 className="mt-2 break-words text-xl
                           font-extrabold text-[#442268]">
              {valor}
            </h3>
          </div>
        ))}
      </section>

      {metas.length === 0 ? (
        <section className="rounded-3xl bg-white p-10 text-center">
          <Target size={40}
            className="mx-auto mb-4 text-[#8A57CA]" />
          <h3 className="text-xl font-bold">
            ¿Cuál es tu primer sueño?
          </h3>
          <p className="mt-2 text-sm text-[#927EA6]">
            Crea una meta financiera para comenzar.
          </p>
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {metas.map(meta => {
            const porcentaje = Math.min(
              100,
              Math.round(meta.actual / meta.objetivo * 100)
            )
            const restante = Math.max(
              0, meta.objetivo - meta.actual
            )
            const completa = restante === 0

            return (
              <article key={meta.id}
                className="rounded-3xl border border-[#EDE5F5]
                           bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center
                                  justify-center rounded-2xl
                                  bg-[#F0E6FC] text-3xl">
                    {meta.emoji}
                  </div>

                  <button
                    aria-label={`Eliminar ${meta.nombre}`}
                    onClick={() => confirmarEliminar(meta)}
                    className="rounded-lg p-2 text-[#BD5976]
                               hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <h3 className="text-lg font-bold">
                  {meta.nombre}
                </h3>

                <p className="mt-2 text-xs text-[#927EA6]">
                  Meta: {dinero(meta.objetivo)}
                </p>

                {meta.fecha && (
                  <p className="mt-2 flex items-center
                                gap-2 text-xs text-[#927EA6]">
                    <CalendarDays size={14} />
                    Fecha objetivo: {meta.fecha}
                  </p>
                )}

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {dinero(meta.actual)}
                  </span>
                  <span className="text-sm font-bold text-[#7540B8]">
                    {porcentaje}%
                  </span>
                </div>

                <div className="mt-3 h-3 overflow-hidden
                                rounded-full bg-[#E9DDF5]">
                  <div
                    className="h-full rounded-full
                               bg-gradient-to-r
                               from-[#8051C4] to-[#B791EB]
                               transition-all duration-500"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>

                <p className="mt-3 text-xs text-[#927EA6]">
                  {completa
                    ? '🎉 ¡Meta cumplida!'
                    : `${dinero(restante)} por ahorrar`}
                </p>

                <p className="mt-3 text-sm font-medium
                              text-[#765995]">
                  {completa
                    ? '🏆 ¡Lo conseguiste!'
                    : porcentaje >= 75
                      ? '😍 ¡Ya casi lo logras!'
                      : porcentaje >= 40
                        ? '💜 ¡Vas por buen camino!'
                        : '🌱 Cada pequeño aporte cuenta'}
                </p>

                <button
                  disabled={completa}
                  onClick={() => {
                    setMetaSeleccionada(meta)
                    setMontoAporte('')
                    setError('')
                  }}
                  className="mt-6 flex w-full items-center
                             justify-center gap-2 rounded-xl
                             bg-[#6935AE] py-3
                             text-sm font-bold text-white
                             disabled:opacity-50"
                >
                  {completa
                    ? <PartyPopper size={17} />
                    : <Plus size={17} />}
                  {completa ? 'Meta alcanzada' : 'Añadir ahorro'}
                </button>
              </article>
            )
          })}
        </section>
      )}

      {(mostrarFormulario || metaSeleccionada) && (
        <div className="fixed inset-0 z-50 flex items-center
                        justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md
                          overflow-y-auto rounded-3xl
                          bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {mostrarFormulario
                  ? 'Crear meta financiera'
                  : 'Registrar ahorro'}
              </h3>
              <button onClick={cerrarModales}
                      aria-label="Cerrar formulario">
                <X size={22} />
              </button>
            </div>

            {mostrarFormulario ? (
              <form onSubmit={guardarMeta} className="space-y-4">
                <div>
                  <label htmlFor="nombreMeta"
                    className="mb-2 block text-sm font-semibold">
                    Nombre de la meta
                  </label>
                  <input
                    id="nombreMeta"
                    className={campo}
                    maxLength={80}
                    placeholder="Ej. Mi próximo viaje"
                    value={datos.nombre}
                    onChange={e => setDatos({
                      ...datos, nombre: e.target.value
                    })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="emojiMeta"
                    className="mb-2 block text-sm font-semibold">
                    Elige un emoji
                  </label>
                  <select
                    id="emojiMeta"
                    className={campo}
                    value={datos.emoji}
                    onChange={e => setDatos({
                      ...datos, emoji: e.target.value
                    })}
                  >
                    {emojis.map(emoji => (
                      <option key={emoji} value={emoji}>
                        {emoji}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="objetivoMeta"
                    className="mb-2 block text-sm font-semibold">
                    ¿Cuánto deseas ahorrar?
                  </label>
                  <input
                    id="objetivoMeta"
                    type="number"
                    min="1"
                    step="1"
                    className={campo}
                    value={datos.objetivo}
                    onChange={e => setDatos({
                      ...datos, objetivo: e.target.value
                    })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="fechaMeta"
                    className="mb-2 block text-sm font-semibold">
                    Fecha objetivo
                  </label>
                  <input
                    id="fechaMeta"
                    type="date"
                    className={campo}
                    value={datos.fecha}
                    onChange={e => setDatos({
                      ...datos, fecha: e.target.value
                    })}
                    required
                  />
                </div>

                {error && (
                  <p role="alert" className="text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button type="submit"
                  className="w-full rounded-xl bg-[#6935AE]
                             py-3 font-bold text-white">
                  Crear meta
                </button>
              </form>
            ) : (
              <form onSubmit={guardarAporte} className="space-y-4">
                <div className="rounded-xl bg-[#F5EEFC] p-4">
                  <p className="font-bold">
                    {metaSeleccionada.emoji}{' '}
                    {metaSeleccionada.nombre}
                  </p>
                  <p className="mt-2 text-sm text-[#806999]">
                    Restante: {dinero(
                      metaSeleccionada.objetivo -
                      metaSeleccionada.actual
                    )}
                  </p>
                </div>

                <div>
                  <label htmlFor="aporteMeta"
                    className="mb-2 block text-sm font-semibold">
                    Valor del aporte (COP)
                  </label>
                  <input
                    id="aporteMeta"
                    type="number"
                    min="1"
                    step="1"
                    className={campo}
                    placeholder="Ej. 50000"
                    value={montoAporte}
                    onChange={e => setMontoAporte(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <p role="alert" className="text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button type="submit"
                  className="flex w-full items-center
                             justify-center gap-2 rounded-xl
                             bg-[#6935AE] py-3
                             font-bold text-white">
                  <Sparkles size={18} />
                  Registrar ahorro
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
