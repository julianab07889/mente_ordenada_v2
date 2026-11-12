

import { useEffect, useState } from 'react'

import {
  LayoutDashboard, ArrowLeftRight, ScanLine, CalendarDays,
  Target, Wallet, ChartNoAxesCombined, Settings2, Bell,
  Plus, ArrowUpRight, ArrowDownLeft, Sparkles, ChevronRight,
  Menu, X, ShieldCheck, ReceiptText, PiggyBank, Heart,
  CircleHelp, Check, TrendingUp
} from 'lucide-react'



import Movimientos from './movimientos.jsx'

import Cuentas from './cuentas.jsx'

import { useFinanzas, saldoActual } from './finanzas.js'

import Metas from './metas.jsx'

import Calendario from './calendario.jsx'

import Presupuestos from './presupuestos.jsx'

import Reportes from './reportes.jsx'

import Escaner from './escaner.jsx'

import {
  OrbiPanel,
  OrbiFlotante,
  useOrbi
} from './orbi.jsx'















const dinero = (valor) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(valor)

const menu = [
  { nombre: 'Inicio', icono: LayoutDashboard },
  { nombre: 'Movimientos', icono: ArrowLeftRight },
  { nombre: 'Escáner inteligente', icono: ScanLine },
  { nombre: 'Calendario', icono: CalendarDays },

  { nombre: 'Cuentas y billeteras', icono: Wallet },
  { nombre: 'Presupuestos', icono: ReceiptText },
  { nombre: 'Metas financieras', icono: Target },
  { nombre: 'Reportes', icono: ChartNoAxesCombined },
  { nombre: 'Mi mascota', icono: Heart }
]



function App() {
  const [pagina, setPagina] = useState('Inicio')
  const [menuAbierto, setMenuAbierto] = useState(false)

const [metas, setMetas] = useState(() => {
  try {
    const guardadas = JSON.parse(
      localStorage.getItem('mente_ordenada_metas')
    )
    return Array.isArray(guardadas) ? guardadas : []
  } catch {
    return []
  }
})

useEffect(() => {
  localStorage.setItem(
    'mente_ordenada_metas',
    JSON.stringify(metas)
  )
}, [metas])

  const [aviso, setAviso] = useState('')

  function navegar(nombre) {
    setPagina(nombre)
    setMenuAbierto(false)
    setAviso('')
  }

  
function crearMeta(meta) {
  setMetas(actuales => [...actuales, meta])
}

function aportar(id, cantidad = 50000) {
  setMetas(actuales =>
    actuales.map(meta =>
      meta.id === id
        ? {
            ...meta,
            actual: Math.min(
              Number(meta.actual) + Number(cantidad),
              Number(meta.objetivo)
            )
          }
        : meta
    )
  )
  setAviso('¡Tu ahorro sigue creciendo! 🎉')
}

function eliminarMeta(id) {
  setMetas(actuales => actuales.filter(meta => meta.id !== id))
}


  return (
    <div className="min-h-screen bg-[#F7F5FB] text-[#32204F] lg:flex">

      {menuAbierto && (
        <button
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-[270px]
        border-r border-[#EEE8F5] bg-white p-5
        transition-transform lg:sticky lg:top-0
        lg:h-screen lg:translate-x-0
        ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="mb-9 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center
                            rounded-2xl bg-[#EBDDFB]">
              <PiggyBank size={27} color="#713DB1" />
            </div>
            <div>
              <h1 className="text-[17px] font-extrabold tracking-tight">
                Mente Ordenada
              </h1>
              <p className="text-xs text-[#967CAB]">
                Buenas Finanzas
              </p>
            </div>
          </div>
          <button
            className="lg:hidden"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-3 px-3 text-[10px] font-bold
                      uppercase tracking-[0.17em] text-[#A8A0B4]">
          Mi espacio
        </p>

        <nav className="space-y-1">
          {menu.map(({ nombre, icono: Icono }) => (
            <button
              key={nombre}
              onClick={() => navegar(nombre)}
              className={`flex w-full items-center gap-3 rounded-xl
                px-4 py-3 text-left text-[13px] font-semibold
                transition-colors
                ${pagina === nombre
                  ? 'bg-[#6935AE] text-white shadow-md shadow-purple-200'
                  : 'text-[#76668E] hover:bg-[#F3ECFC] hover:text-[#6935AE]'
                }`}
            >
              <Icono size={18} strokeWidth={2} />
              {nombre}
            </button>
          ))}
        </nav>

        <div className="mt-7 border-t border-[#F0EBF6] pt-5">
          <button
            onClick={() => navegar('Configuración')}
            className="flex w-full items-center gap-3 rounded-xl
                       px-4 py-3 text-sm text-[#76668E]
                       hover:bg-[#F3ECFC]"
          >
            <Settings2 size={18} />
            Configuración
          </button>
          <button
            onClick={() => navegar('Ayuda')}
            className="flex w-full items-center gap-3 rounded-xl
                       px-4 py-3 text-sm text-[#76668E]
                       hover:bg-[#F3ECFC]"
          >
            <CircleHelp size={18} />
            Ayuda
          </button>
        </div>

        <div className="mt-7 rounded-2xl bg-[#F0E6FD] p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={17} color="#713DB1" />
            <span className="text-xs font-bold text-[#58278D]">
              Tu compañero
            </span>
          </div>
          <p className="text-xs leading-5 text-[#745A92]">
            ¡Cada pequeño avance cuenta! 💜
          </p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-9">

        <header className="mb-7 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl bg-white p-2 lg:hidden"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <div>
              <p className="text-xs font-semibold text-[#A08BB6]">
                TU ESPACIO FINANCIERO
              </p>
              <h2 className="mt-1 text-2xl font-extrabold
                             tracking-tight sm:text-3xl">
                {pagina === 'Inicio'
                  ? '¡Hola, bienvenido! 👋'
                  : pagina}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="rounded-2xl border border-[#EBE5F4]
                         bg-white p-3 text-[#6D3BA8]"
              aria-label="Notificaciones"
              onClick={() => setAviso(
                'Las notificaciones estarán disponibles próximamente.'
              )}
            >
              <Bell size={19} />
            </button>
            <button
              className="flex h-11 w-11 items-center justify-center
                         rounded-2xl bg-[#E6D4FB] font-bold
                         text-[#6A36AB]"
              onClick={() => navegar('Configuración')}
              aria-label="Abrir perfil"
            >
              U
            </button>
          </div>
        </header>

        {aviso && (
          <div role="status"
               className="mb-5 rounded-xl bg-[#EDE2FB]
                          px-4 py-3 text-sm font-medium text-[#6532A6]">
            {aviso}
          </div>
        )}

       



{pagina === 'Inicio' ? (
  <Dashboard
    metas={metas}
    aportar={aportar}
    navegar={navegar}
  />
) : pagina === 'Movimientos' ? (
  <Movimientos />
) : pagina === 'Escáner inteligente' ? (
  <Escaner />
) : pagina === 'Cuentas y billeteras' ? (
  <Cuentas />
) : pagina === 'Metas financieras' ? (
  <Metas
    metas={metas}
    crearMeta={crearMeta}
    aportar={aportar}
    eliminarMeta={eliminarMeta}
  />
) : pagina === 'Calendario' ? (
  <Calendario />
) : pagina === 'Presupuestos' ? (
  <Presupuestos />
) : pagina === 'Reportes' ? (
  <Reportes />

) : pagina === 'Mi mascota' ? (
  <OrbiPanel />
) : (

                    



          <div className="rounded-3xl border border-[#EEE7F5]
                          bg-white p-8 shadow-sm">
            <span className="mb-4 inline-flex rounded-xl
                             bg-[#F0E6FB] p-3 text-[#7441B8]">
              <Sparkles size={24} />
            </span>
            <h3 className="mb-2 text-2xl font-bold">{pagina}</h3>
            <p className="max-w-xl text-sm leading-7 text-[#877696]">
              Este módulo está previsto en el desarrollo de
              Mente Ordenada. Próximamente incorporaremos
              sus formularios, operaciones y conexión con
              la base de datos.
            </p>
            <button
              onClick={() => navegar('Inicio')}
              className="mt-6 rounded-xl bg-[#6935AE]
                         px-5 py-3 text-sm font-semibold text-white"
            >
              Volver al inicio
            </button>
          </div>
        )}

<OrbiFlotante />

      </main>
    </div>
  )
}


function Dashboard({ metas, aportar, navegar }) {
  const { cuentas, movimientos } = useFinanzas()

const preferenciasOrbi = useOrbi()


  const hoy = new Date()
  const mesActual = [
    hoy.getFullYear(),
    String(hoy.getMonth() + 1).padStart(2, '0')
  ].join('-')

  const validos = movimientos.filter(m =>
    ['ingreso', 'gasto'].includes(m.tipo) &&
    Number.isFinite(Number(m.monto)) &&
    Number(m.monto) > 0
  )

  const totalCuentas = cuentas.reduce(
    (suma, cuenta) =>
      suma + saldoActual(cuenta, validos),
    0
  )

  const movimientosMes = validos.filter(m =>
    typeof m.fecha === 'string' &&
    m.fecha.startsWith(mesActual)
  )

  const ingresosMes = movimientosMes
    .filter(m => m.tipo === 'ingreso')
    .reduce((suma, m) => suma + Number(m.monto), 0)

  const gastosMes = movimientosMes
    .filter(m => m.tipo === 'gasto')
    .reduce((suma, m) => suma + Number(m.monto), 0)

  const recientes = [...validos]
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
    .slice(0, 3)

  const meses = Array.from({ length: 6 }, (_, i) => {
    const fecha = new Date(
      hoy.getFullYear(),
      hoy.getMonth() - (5 - i),
      1
    )

    const clave = [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, '0')
    ].join('-')

    const delMes = validos.filter(m =>
      typeof m.fecha === 'string' &&
      m.fecha.startsWith(clave)
    )

    return {
      clave,
      nombre: fecha.toLocaleDateString('es-CO', {
        month: 'short'
      }),
      ingresos: delMes
        .filter(m => m.tipo === 'ingreso')
        .reduce((s, m) => s + Number(m.monto), 0),
      gastos: delMes
        .filter(m => m.tipo === 'gasto')
        .reduce((s, m) => s + Number(m.monto), 0)
    }
  })

  const maxGrafico = Math.max(
    1,
    ...meses.flatMap(m => [m.ingresos, m.gastos])
  )

  const ultimo = recientes[0]

  let mensajeMascota = '¡Comencemos a organizar tus finanzas! 💜'
  let estadoMascota = '🐷'

  if (ultimo?.tipo === 'ingreso') {
    mensajeMascota = '¡Un ingreso registrado! Sigamos avanzando. 🎉'
    estadoMascota = '🥳'
  } else if (gastosMes > ingresosMes && gastosMes > 0) {
    mensajeMascota = 'Tus gastos superan tus ingresos del mes. Revisemos el presupuesto. 💜'
    estadoMascota = '🐷'
  } else if (ultimo?.tipo === 'gasto') {
    mensajeMascota = '¡Gasto registrado! Mantengamos el control. 💪'
  }

  return (
    <div className="space-y-6">

      <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="relative overflow-hidden rounded-[28px]
                        bg-gradient-to-br from-[#452078]
                        via-[#6736AD] to-[#9360D8]
                        p-7 text-white shadow-xl shadow-purple-100">
          <div className="absolute -right-14 -top-20 h-60 w-60
                          rounded-full bg-white/10" />

          <div className="relative">
            <div className="mb-7 flex items-center justify-between">
              <span className="text-xs text-purple-100">
                Saldo total disponible
              </span>
              <Wallet size={21} />
            </div>

            <h3 className="break-words text-3xl font-extrabold
                           sm:text-4xl">
              {dinero(totalCuentas)}
            </h3>

            <p className="mt-4 flex items-center gap-2
                          text-xs text-purple-100">
              <TrendingUp size={16} />
              Calculado desde tus cuentas y movimientos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <MiniTarjeta
            titulo="Ingresos del mes"
            valor={dinero(ingresosMes)}
            Icono={ArrowDownLeft}
            color="#2B9C80"
            fondo="#E1F5EF"
          />

          <MiniTarjeta
            titulo="Gastos del mes"
            valor={dinero(gastosMes)}
            Icono={ArrowUpRight}
            color="#CF6988"
            fondo="#FCE8EF"
          />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <div className="rounded-[26px] border border-[#EFEAF6]
                        bg-white p-6 shadow-sm">
          <h3 className="text-lg font-extrabold">
            Tu actividad financiera
          </h3>
          <p className="mt-1 text-xs text-[#9B8AAE]">
            Ingresos y gastos de los últimos seis meses
          </p>

          <div className="mt-7 flex h-48 items-end
                          justify-between gap-3">
            {meses.map(m => (
              <div key={m.clave}
                   className="flex h-full min-w-0 flex-1
                              items-end justify-center gap-1">
                <div
                  title={`Ingresos: ${dinero(m.ingresos)}`}
                  className="w-1/2 rounded-t-lg
                             bg-[#8A57CA]"
                  style={{
                    height: `${m.ingresos / maxGrafico * 100}%`,
                    minHeight: m.ingresos > 0 ? 4 : 0
                  }}
                />
                <div
                  title={`Gastos: ${dinero(m.gastos)}`}
                  className="w-1/2 rounded-t-lg
                             bg-[#E7A5BB]"
                  style={{
                    height: `${m.gastos / maxGrafico * 100}%`,
                    minHeight: m.gastos > 0 ? 4 : 0
                  }}
                />
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-6 gap-3
                          border-t border-[#EEE8F5] pt-3">
            {meses.map(m => (
              <span key={m.clave}
                    className="text-center text-[10px]
                               text-[#9B8AAE]">
                {m.nombre}
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-5
                          text-xs text-[#806C96]">
            <span>🟣 Ingresos</span>
            <span>🌸 Gastos</span>
          </div>

          {validos.length === 0 && (
            <p className="mt-3 text-xs text-[#9B8AAE]">
              Registra movimientos para visualizar tus estadísticas.
            </p>
          )}
        </div>

{preferenciasOrbi.visible && (

        <div className="flex flex-col justify-between
                        rounded-[26px] bg-[#EBE0FA] p-6">
          <div>
            <span className="inline-flex items-center gap-2
                             rounded-full bg-white/70
                             px-3 py-1.5 text-xs font-bold
                             text-[#713BAE]">
              <Sparkles size={15} />
              Tu compañero financiero
            </span>

            <div className="my-5 text-center text-7xl"
                 aria-label="Reacción de tu compañero financiero">
              {estadoMascota}
            </div>

            <h3 className="text-center text-lg font-extrabold
                           text-[#50277E]">
              ¡Aquí estoy para ayudarte!
            </h3>

            <p className="mt-3 text-center text-sm
                          leading-6 text-[#765995]">
              {mensajeMascota}
            </p>
          </div>

          <button
            onClick={() => navegar('Mi mascota')}
            className="mt-5 flex items-center justify-center gap-2
                       rounded-xl bg-white px-4 py-3
                       text-sm font-bold text-[#6834A8]"
          >
            Personalizar mi mascota
            <ChevronRight size={17} />
          </button>
        </div>

)}
      </section>

      <section className="rounded-[26px] border border-[#EFEAF6]
                          bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center
                        justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2
                           text-lg font-extrabold">
              <Target size={21} color="#8550CD" />
              Mis metas financieras
            </h3>
            <p className="mt-1 text-xs text-[#9B8AAE]">
              Convierte tus sueños en logros
            </p>
          </div>

          <button
            onClick={() => navegar('Metas financieras')}
            className="flex items-center gap-2 rounded-xl
                       bg-[#F2E9FC] px-4 py-2.5
                       text-xs font-bold text-[#713BAE]"
          >
            <Plus size={16} />
            Nueva meta
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {metas.map(meta => {
            const porcentaje = Math.min(
              100,
              Math.round(meta.actual / meta.objetivo * 100)
            )

            return (
              <div key={meta.id}
                   className="rounded-2xl border border-[#EEE7F7]
                              bg-[#FCFAFF] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-3xl">{meta.emoji}</span>
                  <span className="rounded-full bg-[#EEE2FA]
                                   px-3 py-1 text-xs font-bold
                                   text-[#7642B8]">
                    {porcentaje}%
                  </span>
                </div>

                <h4 className="font-bold">{meta.nombre}</h4>

                <p className="mt-2 text-xs text-[#927DA7]">
                  {dinero(meta.actual)} de {dinero(meta.objetivo)}
                </p>

                <div className="mt-4 h-2.5 overflow-hidden
                                rounded-full bg-[#E9DDF5]">
                  <div
                    className="h-full rounded-full
                               bg-gradient-to-r from-[#8051C4]
                               to-[#B791EB]"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>

                <p className="mt-3 text-xs text-[#7B6392]">
                  {porcentaje === 100
                    ? '🎉 ¡Meta alcanzada!'
                    : porcentaje >= 75
                      ? '😍 ¡Ya casi lo logras!'
                      : '💪 Cada aporte cuenta'}
                </p>

                <button
                  onClick={() => aportar(meta.id)}
                  disabled={porcentaje === 100}
                  className="mt-4 flex w-full items-center
                             justify-center gap-1 rounded-xl
                             bg-[#EEE4FA] py-2.5 text-xs
                             font-bold text-[#7240AC]
                             disabled:opacity-50"
                >
                  <Plus size={15} />
                  Aportar $50.000 (demo)
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[26px] border border-[#EFEAF6]
                        bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-extrabold">
              Movimientos recientes
            </h3>
            <button
              onClick={() => navegar('Movimientos')}
              className="text-xs font-bold text-[#8650C3]">
              Ver todos
            </button>
          </div>

          {recientes.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#927EA6]">
              Todavía no tienes movimientos registrados.
            </p>
          ) : (
            <div className="space-y-4">
              {recientes.map(m => {
                const cuenta = cuentas.find(
                  c => c.id === m.cuentaId
                )

                return (
                  <div key={m.id}
                       className="flex items-center
                                  justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11
                                      shrink-0 items-center
                                      justify-center rounded-xl
                                      bg-[#F3EEFA] text-xl">
                        {m.tipo === 'ingreso' ? '💰' : '🛍️'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {m.descripcion}
                        </p>
                        <p className="text-xs text-[#9B8AAE]">
                          {m.fecha} · {cuenta?.nombre || 'Sin cuenta'}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-sm font-bold ${
                      m.tipo === 'ingreso'
                        ? 'text-[#268B75]'
                        : 'text-[#A34C73]'
                    }`}>
                      {m.tipo === 'ingreso' ? '+' : '-'}
                      {dinero(Number(m.monto))}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-[26px] border border-[#EFEAF6]
                        bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-extrabold">
            Acciones rápidas
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {[
              { texto: 'Movimiento', Icono: Plus, pagina: 'Movimientos' },
              { texto: 'Escanear', Icono: ScanLine, pagina: 'Escáner inteligente' },
              { texto: 'Calendario', Icono: CalendarDays, pagina: 'Calendario' },
              { texto: 'Presupuestos', Icono: ShieldCheck, pagina: 'Presupuestos' }
            ].map(({ texto, Icono, pagina }) => (
              <button key={texto}
                onClick={() => navegar(pagina)}
                className="flex flex-col items-center gap-3
                           rounded-2xl bg-[#F8F4FD] p-5
                           text-xs font-bold text-[#68419A]
                           hover:bg-[#EEE3FA]">
                <Icono size={23} />
                {texto}
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className="pb-4 text-center text-xs text-[#AA9CB8]">
        Mente Ordenada · Versión 2.0 en desarrollo
      </footer>
    </div>
  )
}


function MiniTarjeta({ titulo, valor, Icono, color, fondo }) {
  return (
    <article className="flex min-h-44 flex-col justify-between
                        rounded-[24px] border border-[#EFEAF6]
                        bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center
                      rounded-2xl"
           style={{ backgroundColor: fondo }}>
        <Icono size={22} color={color} />
      </div>
      <div>
        <p className="mb-2 text-xs text-[#9B8AAE]">{titulo}</p>
        <p className="break-words text-lg font-extrabold
                      tracking-tight text-[#392054]">
          {valor}
        </p>
      </div>
    </article>
  )
}

export default App
