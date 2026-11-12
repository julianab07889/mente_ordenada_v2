

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

import {
  Bot, Eye, EyeOff, Lightbulb, X,
  ChevronUp, Settings2, Sparkles
} from 'lucide-react'
import { useFinanzas } from './finanzas.js'

import orbiNormal from './assets/orbi/orbi-normal.png'
import orbiFeliz from './assets/orbi/orbi-feliz.png'
import orbiPensando from './assets/orbi/orbi-pensando.png'
import orbiAlerta from './assets/orbi/orbi-alerta.png'
import orbiCelebrando from './assets/orbi/orbi-celebrando.png'
import orbiGafas from './assets/orbi/orbi-gafas.png'
import orbiSombrero from './assets/orbi/orbi-sombrero.png'
import orbiAudifonos from './assets/orbi/orbi-audifonos.png'
import orbiCorbatin from './assets/orbi/orbi-corbatin.png'


export const imagenesOrbi = {
  normal: orbiNormal,
  feliz: orbiFeliz,
  pensando: orbiPensando,
  alerta: orbiAlerta,
  celebrando: orbiCelebrando,
  gafas: orbiGafas,
  sombrero: orbiSombrero,
  audifonos: orbiAudifonos,
  corbatin: orbiCorbatin
}

const expresionesOrbi = [
  { id: 'normal', nombre: 'Normal' },
  { id: 'feliz', nombre: 'Feliz' },
  { id: 'pensando', nombre: 'Pensando' },
  { id: 'alerta', nombre: 'Alerta' },
  { id: 'celebrando', nombre: 'Celebrando' }
]

const accesoriosOrbi = [
  { id: 'gafas', nombre: 'Gafas' },
  { id: 'sombrero', nombre: 'Sombrero' },
  { id: 'audifonos', nombre: 'Audífonos' },
  { id: 'corbatin', nombre: 'Corbatín' }
]


const CLAVE = 'mente_ordenada_orbi_preferencias'
const EVENTO = 'mente_ordenada_orbi_cambio'


const INICIAL = {
  visible: true,
  consejos: true,
  variante: 'normal'
}


function suscribir(actualizar) {
  window.addEventListener(EVENTO, actualizar)
  window.addEventListener('storage', actualizar)

  return () => {
    window.removeEventListener(EVENTO, actualizar)
    window.removeEventListener('storage', actualizar)
  }
}

function obtenerSnapshot() {
  return localStorage.getItem(CLAVE) || ''
}

function leerPreferencias(texto) {
  try {
    const guardadas = JSON.parse(texto)
    return {
      ...INICIAL,
      ...(guardadas && typeof guardadas === 'object'
        ? guardadas
        : {})
    }
  } catch {
    return INICIAL
  }
}

export function useOrbi() {
  const texto = useSyncExternalStore(
    suscribir,
    obtenerSnapshot,
    () => ''
  )

  return leerPreferencias(texto)
}

function actualizarPreferencias(cambios) {
  const actuales = leerPreferencias(obtenerSnapshot())

  localStorage.setItem(
    CLAVE,
    JSON.stringify({ ...actuales, ...cambios })
  )

  window.dispatchEvent(new Event(EVENTO))
}

function mensajeFinanciero(movimientos) {
  const hoy = new Date()

  const mes = [
    hoy.getFullYear(),
    String(hoy.getMonth() + 1).padStart(2, '0')
  ].join('-')

  const delMes = movimientos.filter(m =>
    typeof m.fecha === 'string' &&
    m.fecha.startsWith(mes)
  )

  const ingresos = delMes
    .filter(m => m.tipo === 'ingreso')
    .reduce((s, m) => s + Number(m.monto || 0), 0)

  const gastos = delMes
    .filter(m => m.tipo === 'gasto')
    .reduce((s, m) => s + Number(m.monto || 0), 0)

  if (gastos > ingresos && gastos > 0) {
    return {
      titulo: 'Revisemos tus gastos',
      texto: 'Tus gastos registrados superan tus ingresos del mes. ¿Revisamos el presupuesto?'
    }
  }

  if (delMes.length === 0) {
    return {
      titulo: '¡Hola! Soy Orbi',
      texto: 'Estoy aquí para ayudarte a organizar tus finanzas.'
    }
  }

  return {
    titulo: '¡Buen trabajo!',
    texto: 'Llevar el registro de tu dinero es un gran paso para mantener el control.'
  }
}


export function OrbiPanel() {
  const preferencias = useOrbi()

  const variante = imagenesOrbi[preferencias.variante]
    ? preferencias.variante
    : 'normal'

  function seleccionarVariante(id) {
    actualizarPreferencias({ variante: id })
  }

  function cambiarVisible(evento) {
    actualizarPreferencias({
      visible: evento.target.checked
    })
  }

  function cambiarConsejos(evento) {
    actualizarPreferencias({
      consejos: evento.target.checked
    })
  }

  function Selector({ titulo, opciones }) {
    return (
      <div className="space-y-3">
        <h4 className="font-bold text-[#542486]">
          {titulo}
        </h4>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {opciones.map(opcion => {
            const seleccionado = variante === opcion.id

            return (
              <button
                key={opcion.id}
                type="button"
                onClick={() => seleccionarVariante(opcion.id)}
                aria-pressed={seleccionado}
                className={`rounded-2xl border-2 p-3
                            transition-all hover:bg-[#F7F0FF]
                  ${seleccionado
                    ? 'border-[#8953C8] bg-[#F2E8FC]'
                    : 'border-[#EEE7F5] bg-white'}`}
              >
                <img
                  src={imagenesOrbi[opcion.id]}
                  alt=""
                  className="mx-auto h-20 w-20 object-contain"
                />

                <span className="mt-2 block text-xs
                                 font-bold text-[#6532A6]">
                  {opcion.nombre}
                </span>

                {seleccionado && (
                  <span className="mt-1 block text-xs
                                   text-[#7540B8]">
                    ✓ Seleccionado
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <section className="grid gap-5 xl:grid-cols-2">

        <div className="rounded-3xl border border-[#EEE7F5]
                        bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-xl font-extrabold
                         text-[#542486]">
            Conoce a Orbi
          </h3>

          <div className="flex min-h-[420px] flex-col
                          items-center justify-center
                          rounded-3xl bg-gradient-to-br
                          from-[#F3E8FC] to-[#E8E1FF]
                          p-6 text-center">
            <img
              src={imagenesOrbi[variante]}
              alt={`Orbi, variante ${variante}`}
              className="h-60 w-60 object-contain
                         drop-shadow-xl transition-all
                         duration-300 sm:h-72 sm:w-72"
            />

            <h2 className="mt-4 text-3xl font-extrabold
                           text-[#542486]">
              Orbi
            </h2>

            <p className="mt-2 text-sm text-[#765995]">
              Tu guardián financiero
            </p>

            <span className="mt-4 rounded-full
                             bg-white/80 px-4 py-2
                             text-xs font-bold text-[#7540B8]">
              Estilo seleccionado: {variante}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-[#EEE7F5]
                        bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Settings2 size={21} color="#7540B8" />

            <h3 className="text-xl font-extrabold
                           text-[#542486]">
              Personaliza a Orbi
            </h3>
          </div>

          <p className="mb-6 text-sm text-[#927EA6]">
            Elige una expresión o un accesorio.
            Los cambios se guardan automáticamente.
          </p>

          <div className="space-y-7">
            <Selector
              titulo="Expresiones"
              opciones={expresionesOrbi}
            />

            <div className="border-t border-[#EEE7F5]" />

            <Selector
              titulo="Accesorios"
              opciones={accesoriosOrbi}
            />
          </div>

          <p className="mt-6 rounded-xl bg-[#F5EEFC]
                        p-4 text-xs leading-5
                        text-[#806999]">
            En esta versión, cada accesorio es una
            variante completa de Orbi. Más adelante
            podremos combinar accesorios y expresiones.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-[#EEE7F5]
                          bg-white p-6 shadow-sm">

        <div className="mb-6 flex items-center gap-2">
          <Settings2 size={21} color="#7540B8" />

          <h3 className="text-xl font-extrabold">
            Preferencias de Orbi
          </h3>
        </div>

        <div className="space-y-6">

          <label className="flex cursor-pointer
                            items-center justify-between
                            gap-4">

            <div>
              <p className="flex items-center gap-2
                            font-bold">
                {preferencias.visible
                  ? <Eye size={18} />
                  : <EyeOff size={18} />}

                Mostrar a Orbi
              </p>

              <p className="mt-2 text-sm text-[#927EA6]">
                Muestra u oculta a Orbi en la aplicación.
              </p>
            </div>

            <input
              type="checkbox"
              checked={preferencias.visible}
              onChange={cambiarVisible}
              className="h-5 w-5 shrink-0
                         accent-[#7540B8]"
            />
          </label>

          <div className="border-t border-[#EEE7F5]" />

          <label className="flex cursor-pointer
                            items-center justify-between
                            gap-4">

            <div>
              <p className="flex items-center gap-2
                            font-bold">
                <Lightbulb size={18} />
                Consejos de Orbi
              </p>

              <p className="mt-2 text-sm text-[#927EA6]">
                Activa o desactiva sus mensajes
                financieros.
              </p>
            </div>

            <input
              type="checkbox"
              checked={preferencias.consejos}
              disabled={!preferencias.visible}
              onChange={cambiarConsejos}
              className="h-5 w-5 shrink-0
                         accent-[#7540B8]
                         disabled:opacity-40"
            />
          </label>
        </div>

        <div className="mt-6 rounded-xl bg-[#F4EDFB] p-4">
          <p className="text-sm font-semibold
                        text-[#64349A]">
            {preferencias.visible
              ? 'Orbi está activado.'
              : 'Orbi está desactivado.'}
          </p>

          <p className="mt-2 text-xs text-[#806999]">
            Puedes cambiar esta preferencia cuando quieras.
            Tu personalización se conservará.
          </p>
        </div>
      </section>
    </div>
  )
}


const EVENTO_REACCION = 'mente_ordenada_orbi_reaccion'

export function avisarOrbi(tipo) {
  window.dispatchEvent(
    new CustomEvent(EVENTO_REACCION, {
      detail: { tipo }
    })
  )
}

const REACCIONES = {
  ingreso: {
    imagen: 'feliz',
    titulo: '¡Un nuevo ingreso! 🎉',
    texto: '¡Excelente! Sigamos avanzando hacia tus metas.'
  },
  gasto: {
    imagen: 'pensando',
    titulo: 'Movimiento registrado 💜',
    texto: 'Llevar el control de tus gastos es un gran hábito.'
  },
  meta: {
    imagen: 'celebrando',
    titulo: '¡Meta cumplida! 🏆',
    texto: '¡Lo conseguiste! Tu esfuerzo dio resultados.'
  }
}



export function OrbiFlotante() {
  const preferencias = useOrbi()
  const { movimientos } = useFinanzas()

  const [expandido, setExpandido] = useState(false)
  
const [saludando, setSaludando] = useState(false)

  const [reaccion, setReaccion] = useState(null)
  const temporizador = useRef(null)

  useEffect(() => {
    function reaccionar(evento) {
      const nueva = REACCIONES[evento.detail?.tipo]

      if (!nueva) return

      clearTimeout(temporizador.current)

      setReaccion(nueva)

      if (preferencias.visible && preferencias.consejos) {
        setExpandido(true)
      }

      temporizador.current = setTimeout(() => {
        setReaccion(null)
        setExpandido(false)
      }, 5000)
    }

    window.addEventListener(EVENTO_REACCION, reaccionar)

    return () => {
      window.removeEventListener(
        EVENTO_REACCION,
        reaccionar
      )
      clearTimeout(temporizador.current)
    }
  }, [preferencias.visible, preferencias.consejos])

  if (!preferencias.visible) return null

  const imagen = reaccion?.imagen ||
    preferencias.variante ||
    'normal'

  const imagenActual = imagenesOrbi[imagen] ||
    imagenesOrbi.normal


const animacionOrbi =
  reaccion?.imagen === 'celebrando'
    ? 'orbi-celebrando'
    : reaccion
      ? 'orbi-saludando'
      : saludando
        ? 'orbi-saludando'
        : 'orbi-flotando'



  const mensaje = reaccion ||
    mensajeFinanciero(movimientos)

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5
                 z-40 hidden max-w-[calc(100vw-40px)]
                 flex-col items-end gap-3 md:flex"
    >
      {expandido && preferencias.consejos && (
        <div
          className="pointer-events-auto w-72 rounded-2xl
                     border border-[#E8DCF5] bg-white
                     p-4 shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className="flex items-center gap-2
                           font-bold text-[#60328F]"
              >
                <Sparkles size={16} />
                {mensaje.titulo}
              </p>

              <p
                className="mt-2 text-sm leading-6
                           text-[#765995]"
              >
                {mensaje.texto}
              </p>
            </div>

            <button
              type="button"
              aria-label="Cerrar mensaje de Orbi"
              onClick={() => setExpandido(false)}
              className="shrink-0 text-[#927EA6]"



            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpandido(actual => !actual)}

onMouseEnter={() => setSaludando(true)}
onMouseLeave={() => setSaludando(false)}

        aria-label={
          expandido
            ? 'Cerrar mensaje de Orbi'
            : 'Mostrar mensaje de Orbi'
        }
        aria-expanded={expandido}
        className="orbi-flotando pointer-events-auto
                   flex h-20 w-20 items-center
                   justify-center rounded-full
                   border-2 border-white bg-[#F2E8FC]
                   shadow-xl transition-shadow
                   hover:shadow-2xl"
      >
       
<img
  src={imagenActual}
  alt=""
  className={`h-16 w-16 object-contain
              drop-shadow-md ${animacionOrbi}`}
/>

      </button>
    </div>
  )
}
