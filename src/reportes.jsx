
import { useState } from 'react'
import {
  ChartNoAxesCombined, Download, Wallet,
  TrendingUp, TrendingDown, CalendarDays,
  ChevronLeft, ChevronRight, PieChart
} from 'lucide-react'
import { useFinanzas, formatoCOP } from './finanzas.js'

function mesActual() {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(
    hoy.getMonth() + 1
  ).padStart(2, '0')}`
}

function moverMes(clave, diferencia) {
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

function nombreCorto(clave) {
  const [anio, mes] = clave.split('-').map(Number)
  return new Date(anio, mes - 1, 1)
    .toLocaleDateString('es-CO', {
      month: 'short',
      year: '2-digit'
    })
}

function sumar(lista) {
  return lista.reduce(
    (total, movimiento) =>
      total + Number(movimiento.monto),
    0
  )
}

function valorSeguroCSV(valor) {
  const texto = String(valor ?? '')

  // Evita que Excel interprete textos como fórmulas.
  const seguro = /^[\s]*[=+\-@\t\r]/.test(texto)
    ? `'${texto}`
    : texto

  return `"${seguro.replace(/"/g, '""')}"`
}

export default function Reportes() {
  const { cuentas, movimientos } = useFinanzas()
  const [mes, setMes] = useState(mesActual)
  const [cuentaId, setCuentaId] = useState('todas')

  const validos = movimientos.filter(m =>
    ['ingreso', 'gasto'].includes(m.tipo) &&
    typeof m.fecha === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(m.fecha) &&
    Number.isFinite(Number(m.monto)) &&
    Number(m.monto) > 0
  )

  const filtradosCuenta = validos.filter(m =>
    cuentaId === 'todas' || m.cuentaId === cuentaId
  )

  const delMes = filtradosCuenta.filter(m =>
    m.fecha.startsWith(mes)
  )

  const ingresos = sumar(
    delMes.filter(m => m.tipo === 'ingreso')
  )

  const gastos = sumar(
    delMes.filter(m => m.tipo === 'gasto')
  )

  const resultado = ingresos - gastos

  const categorias = Object.entries(
    delMes
      .filter(m => m.tipo === 'gasto')
      .reduce((acumulado, m) => {
        const nombre = m.categoria || 'Sin categoría'
        acumulado[nombre] =
          (acumulado[nombre] || 0) + Number(m.monto)
        return acumulado
      }, {})
  )
    .map(([nombre, monto]) => ({ nombre, monto }))
    .sort((a, b) => b.monto - a.monto)

  const mayorCategoria = categorias[0] || null

  const meses = Array.from({ length: 6 }, (_, indice) => {
    const clave = moverMes(mes, indice - 5)

    const movimientosMes = filtradosCuenta.filter(m =>
      m.fecha.startsWith(clave)
    )

    return {
      clave,
      nombre: nombreCorto(clave),
      ingresos: sumar(
        movimientosMes.filter(m => m.tipo === 'ingreso')
      ),
      gastos: sumar(
        movimientosMes.filter(m => m.tipo === 'gasto')
      )
    }
  })

  const maximo = Math.max(
    1,
    ...meses.flatMap(item => [item.ingresos, item.gastos])
  )

  const nombreCuenta = id =>
    cuentas.find(c => c.id === id)?.nombre ||
    'Sin cuenta asociada'

  function exportarCSV() {
    const encabezados = [
      'Fecha',
      'Tipo',
      'Descripción',
      'Categoría',
      'Cuenta',
      'Monto COP'
    ]

    const filas = [...delMes]
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map(m => [
        m.fecha,
        m.tipo,
        m.descripcion || '',
        m.categoria || '',
        nombreCuenta(m.cuentaId),
        String(Number(m.monto))
      ])

    const contenido = [encabezados, ...filas]
      .map(fila => fila.map(valorSeguroCSV).join(';'))
      .join('\r\n')

    const archivo = new Blob(
      ['\uFEFF', contenido],
      { type: 'text/csv;charset=utf-8;' }
    )

    const url = URL.createObjectURL(archivo)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `mente_ordenada_reporte_${mes}.csv`

    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()

    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center
                      justify-between gap-3">
        <div>
          <p className="text-sm text-[#8E7BA4]">
            Analiza tus ingresos, gastos y hábitos financieros.
          </p>
          <p className="mt-1 text-xs text-[#A18DB3]">
            Información calculada desde Movimientos.
          </p>
        </div>

        <button
          onClick={exportarCSV}
          className="flex items-center gap-2 rounded-xl
                     bg-[#6935AE] px-5 py-3
                     text-sm font-bold text-white"
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      <section className="flex flex-wrap items-center
                          justify-between gap-4 rounded-2xl
                          border border-[#EEE7F5] bg-white p-5">
        <div className="flex items-center gap-3">
          <button
            aria-label="Mes anterior"
            onClick={() => setMes(moverMes(mes, -1))}
            className="rounded-xl bg-[#F2E9FC] p-2
                       text-[#713BAE]"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2">
            <CalendarDays size={18} color="#8852CB" />
            <span className="min-w-32 text-center
                             text-sm font-bold capitalize">
              {nombreMes(mes)}
            </span>
          </div>

          <button
            aria-label="Mes siguiente"
            onClick={() => setMes(moverMes(mes, 1))}
            className="rounded-xl bg-[#F2E9FC] p-2
                       text-[#713BAE]"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <select
          aria-label="Filtrar por cuenta"
          value={cuentaId}
          onChange={e => setCuentaId(e.target.value)}
          className="rounded-xl border border-[#DFD1F1]
                     bg-white px-4 py-3 text-sm outline-none"
        >
          <option value="todas">Todas las cuentas</option>
          {cuentas.map(c => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            titulo: 'Ingresos del mes',
            valor: ingresos,
            Icono: TrendingUp,
            color: '#21876C',
            fondo: '#E1F5EF'
          },
          {
            titulo: 'Gastos del mes',
            valor: gastos,
            Icono: TrendingDown,
            color: '#BD5976',
            fondo: '#FCE8EF'
          },
          {
            titulo: 'Resultado neto',
            valor: resultado,
            Icono: Wallet,
            color: '#7540B8',
            fondo: '#EEE4FA'
          }
        ].map(item => (
          <article
            key={item.titulo}
            className="rounded-2xl border border-[#EEE7F5]
                       bg-white p-5 shadow-sm"
          >
            <div
              className="mb-4 inline-flex rounded-xl p-3"
              style={{ backgroundColor: item.fondo }}
            >
              <item.Icono size={22} color={item.color} />
            </div>

            <p className="text-xs text-[#927EA6]">
              {item.titulo}
            </p>

            <h3 className="mt-2 break-words text-xl
                           font-extrabold text-[#442268]">
              {formatoCOP(item.valor)}
            </h3>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-3xl border border-[#EEE7F5]
                            bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <ChartNoAxesCombined
              size={21}
              color="#8051C4"
            />
            <h3 className="text-lg font-extrabold">
              Evolución financiera
            </h3>
          </div>

          <p className="mt-2 text-xs text-[#927EA6]">
            Comparación de los últimos seis meses
            hasta el mes seleccionado.
          </p>

          <div className="mt-7 flex h-52 items-end
                          justify-between gap-2">
            {meses.map(item => (
              <div
                key={item.clave}
                className="flex h-full flex-1 items-end
                           justify-center gap-1"
              >
                <div
                  title={`Ingresos: ${formatoCOP(item.ingresos)}`}
                  className="w-1/2 rounded-t-lg bg-[#8A57CA]"
                  style={{
                    height: `${item.ingresos / maximo * 100}%`,
                    minHeight: item.ingresos > 0 ? 4 : 0
                  }}
                />

                <div
                  title={`Gastos: ${formatoCOP(item.gastos)}`}
                  className="w-1/2 rounded-t-lg bg-[#E7A5BB]"
                  style={{
                    height: `${item.gastos / maximo * 100}%`,
                    minHeight: item.gastos > 0 ? 4 : 0
                  }}
                />
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-6
                          gap-2 border-t border-[#EEE8F5] pt-3">
            {meses.map(item => (
              <p
                key={item.clave}
                className="text-center text-[10px]
                           text-[#927EA6]"
              >
                {item.nombre}
              </p>
            ))}
          </div>

          <div className="mt-5 flex gap-5 text-xs
                          text-[#806C96]">
            <span>🟣 Ingresos</span>
            <span>🌸 Gastos</span>
          </div>

          {meses.every(m => !m.ingresos && !m.gastos) && (
            <p className="mt-4 text-xs text-[#927EA6]">
              No hay movimientos en este período.
            </p>
          )}
        </article>

        <article className="rounded-3xl border border-[#EEE7F5]
                            bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <PieChart size={21} color="#8051C4" />
            <h3 className="text-lg font-extrabold">
              Gastos por categoría
            </h3>
          </div>

          <p className="mt-2 text-xs text-[#927EA6]">
            Distribución de los gastos del mes.
          </p>

          {categorias.length === 0 ? (
            <p className="py-14 text-center text-sm
                          text-[#927EA6]">
              No hay gastos registrados en este mes.
            </p>
          ) : (
            <div className="mt-7 space-y-5">
              {categorias.map(item => {
                const porcentaje = gastos > 0
                  ? item.monto / gastos * 100
                  : 0

                return (
                  <div key={item.nombre}>
                    <div className="mb-2 flex flex-wrap
                                    items-center justify-between gap-2">
                      <span className="text-sm font-semibold">
                        {item.nombre}
                      </span>
                      <span className="text-xs text-[#806C96]">
                        {formatoCOP(item.monto)}
                        {' · '}
                        {porcentaje.toFixed(1)}%
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden
                                    rounded-full bg-[#EEE5F8]">
                      <div
                        className="h-full rounded-full bg-[#8955CB]"
                        style={{
                          width: `${porcentaje}%`
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </article>
      </section>

      <section className="rounded-3xl border border-[#EEE7F5]
                          bg-white p-6 shadow-sm">
        <h3 className="text-lg font-extrabold">
          Conclusiones del mes
        </h3>

        {delMes.length === 0 ? (
          <p className="mt-4 text-sm text-[#927EA6]">
            Aún no hay movimientos para analizar en este período.
          </p>
        ) : (
          <div className="mt-5 space-y-3 text-sm">
            <p>
              {resultado >= 0
                ? '✅ Tus ingresos registrados cubren tus gastos del mes.'
                : '⚠️ Tus gastos registrados superan tus ingresos del mes.'}
            </p>

            {mayorCategoria && (
              <p>
                📊 La categoría con mayor gasto es{' '}
                <strong>{mayorCategoria.nombre}</strong>,
                con {formatoCOP(mayorCategoria.monto)}.
              </p>
            )}

            <p>
              💜 Se analizaron <strong>{delMes.length}</strong>
              {' '}movimientos en el período seleccionado.
            </p>
          </div>
        )}

        <p className="mt-5 text-xs text-[#927EA6]">
          El resultado neto corresponde a ingresos menos
          gastos del período; no representa necesariamente
          el saldo total de tus cuentas.
        </p>
      </section>
    </div>
  )
}
