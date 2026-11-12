
import { createWorker } from 'tesseract.js'

import { useEffect, useState } from 'react'
import {
  ScanLine, Upload, FileImage, X,
  CheckCircle2, AlertCircle, Wallet
} from 'lucide-react'

import {
  useFinanzas,
  guardarMovimientos,
  saldoActual,
  formatoCOP
} from './finanzas.js'

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

function fechaHoy() {
  const hoy = new Date()

  return [
    hoy.getFullYear(),
    String(hoy.getMonth() + 1).padStart(2, '0'),
    String(hoy.getDate()).padStart(2, '0')
  ].join('-')
}

function datosIniciales() {
  return {
    tipo: 'gasto',
    descripcion: '',
    monto: '',
    categoria: 'Otros',
    cuentaId: '',
    fecha: fechaHoy()
  }
}

export default function Escaner() {
  const { cuentas, movimientos } = useFinanzas()
  const [leyendo, setLeyendo] = useState(false)
  const [textoDetectado, setTextoDetectado] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [vistaPrevia, setVistaPrevia] = useState('')
  const [datos, setDatos] = useState(datosIniciales)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  useEffect(() => {
    if (!archivo) {
      setVistaPrevia('')
      return
    }

    const url = URL.createObjectURL(archivo)
    setVistaPrevia(url)

    return () => URL.revokeObjectURL(url)
  }, [archivo])

  function cargarArchivo(evento) {
    const seleccionado = evento.target.files?.[0]

    setError('')
    setExito('')

    if (!seleccionado) return

    const permitidos = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ]

    if (!permitidos.includes(seleccionado.type)) {
      setError('Selecciona una imagen JPG, PNG o WebP.')
      evento.target.value = ''
      return
    }

    if (seleccionado.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5 MB.')
      evento.target.value = ''
      return
    }

    setArchivo(seleccionado)
    setDatos({
      ...datosIniciales(),
      cuentaId: cuentas[0]?.id || ''
    })

    evento.target.value = ''
  }
  
async function leerFactura() {
  if (!archivo || leyendo) return

  setLeyendo(true)
  setError('')
  setExito('')
  setTextoDetectado('')

  let worker

  try {
    worker = await createWorker('spa+eng')

    const resultado = await worker.recognize(archivo)
    const texto = resultado.data.text || ''

    setTextoDetectado(texto)

    if (!texto.trim()) {
      setError('No se pudo reconocer texto en esta imagen.')
      return
    }

    const lineas = texto.split('\n').map(l => l.trim())

    const montos = [
      /(?:total\s*(?:a\s*pagar)?|valor\s*(?:total|pagado)?|monto|importe)\s*[:$ ]+\s*(?:COP|COL)?\s*\$?\s*([\d.,]+)/i,
      /\$\s*([\d.,]+)/i
    ]

    let montoEncontrado = ''

    for (const patron of montos) {
      for (const linea of lineas) {
        const coincidencia = linea.match(patron)
        if (!coincidencia) continue

        let valor = coincidencia[1]

        if (valor.includes('.') && valor.includes(',')) {
          valor = valor.lastIndexOf(',') > valor.lastIndexOf('.')
            ? valor.replace(/\./g, '').replace(',', '.')
            : valor.replace(/,/g, '')
        } else if (/^\d{1,3}(?:[.,]\d{3})+$/.test(valor)) {
          valor = valor.replace(/[.,]/g, '')
        } else {
          valor = valor.replace(',', '.')
        }

        if (Number(valor) > 0) {
          montoEncontrado = valor
          break
        }
      }

      if (montoEncontrado) break
    }

    const fechaEncontrada = texto.match(
      /\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/
    )

    let fecha = ''

    if (fechaEncontrada) {
      const [, dia, mes, anio] = fechaEncontrada
      const posible = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
      const comprobacion = new Date(`${posible}T12:00:00`)

      if (
        comprobacion.getFullYear() === Number(anio) &&
        comprobacion.getMonth() + 1 === Number(mes) &&
        comprobacion.getDate() === Number(dia)
      ) {
        fecha = posible
      }
    }

    setDatos(anterior => ({
      ...anterior,
      monto: montoEncontrado || anterior.monto,
      fecha: fecha || anterior.fecha
    }))

    setExito(
      'Lectura finalizada. Revisa los datos detectados antes de registrar.'
    )
  } catch {
    setError('No se pudo analizar la imagen. Comprueba tu conexión e inténtalo nuevamente.')
  } finally {
    if (worker) await worker.terminate()
    setLeyendo(false)
  }
}


  function actualizar(campo, valor) {
    setDatos(actual => ({
      ...actual,
      [campo]: valor
    }))
  }

  function limpiar() {
    setArchivo(null)
    setDatos(datosIniciales())
    setError('')
  }

  function registrar(evento) {
    evento.preventDefault()
    setError('')
    setExito('')

    const cuenta = cuentas.find(
      c => c.id === datos.cuentaId
    )

    const monto = Number(datos.monto)

    if (!archivo) {
      setError('Primero debes cargar una imagen.')
      return
    }

    if (
      !cuenta ||
      !datos.descripcion.trim() ||
      !datos.fecha ||
      !Number.isFinite(monto) ||
      monto <= 0
    ) {
      setError('Completa los campos con información válida.')
      return
    }

    if (
      datos.tipo === 'gasto' &&
      monto > saldoActual(cuenta, movimientos)
    ) {
      setError('El saldo de esta cuenta es insuficiente.')
      return
    }

    const movimiento = {
      id: crypto.randomUUID(),
      tipo: datos.tipo,
      descripcion: datos.descripcion.trim(),
      monto,
      categoria: datos.categoria,
      cuentaId: datos.cuentaId,
      fecha: datos.fecha,
      origen: 'comprobante_manual'
    }

    try {
      guardarMovimientos([
        movimiento,
        ...movimientos
      ])

      limpiar()
      setExito(
        'Comprobante revisado y movimiento registrado correctamente.'
      )
    } catch {
      setError('No se pudo guardar el movimiento.')
    }
  }

  const campo =
    'w-full rounded-xl border border-[#DFD1F1] ' +
    'bg-white px-4 py-3 text-sm outline-none ' +
    'focus:border-[#7540B8]'

  return (
    <div className="space-y-6">

      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#EEE4FB] p-3">
            <ScanLine size={23} color="#7540B8" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold">
              Escáner de comprobantes
            </h2>

            <p className="mt-1 text-sm text-[#927EA6]">
              Carga, revisa y registra tus recibos.
            </p>
          </div>
        </div>
      </div>

      {exito && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl
                     bg-[#E2F5EB] p-4 text-sm
                     font-semibold text-[#237956]"
        >
          <CheckCircle2 size={19} />
          {exito}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl
                     bg-[#FDE9ED] p-4 text-sm
                     text-[#A13F56]"
        >
          <AlertCircle size={19} />
          {error}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-[#EEE7F5]
                        bg-white p-6 shadow-sm">
          <h3 className="text-lg font-extrabold">
            1. Cargar comprobante
          </h3>

          <p className="mt-2 text-sm text-[#927EA6]">
            Selecciona una fotografía legible de tu
            recibo o factura.
          </p>

          {!archivo ? (
            <label
              htmlFor="archivoComprobante"
              className="mt-6 flex min-h-64 cursor-pointer
                         flex-col items-center justify-center
                         rounded-2xl border-2
                         border-dashed border-[#CFB7E8]
                         bg-[#FAF7FE] p-6 text-center"
            >
              <Upload
                size={40}
                className="mb-4 text-[#8751C8]"
              />

              <span className="font-bold text-[#56308C]">
                Seleccionar comprobante
              </span>

              <span className="mt-3 text-xs text-[#927EA6]">
                JPG, PNG o WebP · Máximo 5 MB
              </span>

              <input
                id="archivoComprobante"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={cargarArchivo}
                className="sr-only"
              />
            </label>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="relative overflow-hidden
                              rounded-2xl bg-[#F7F2FC]">
                <img
                  src={vistaPrevia}
                  alt="Vista previa del comprobante"
                  className="max-h-96 w-full
                             object-contain"
                />
              </div>

              <div className="flex items-center
                              justify-between gap-3">
                <div className="flex min-w-0
                                items-center gap-2">
                  <FileImage
                    size={20}
                    color="#7540B8"
                  />

                  <span className="truncate text-sm">
                    {archivo.name}
                  </span>
                </div>

                <button
                  onClick={limpiar}
                  className="flex items-center gap-1
                             text-sm font-bold
                             text-[#B64B71]"
                >
                  <X size={16} />
                  Quitar
                </button>
              </div>
            </div>
          )}

{archivo && (
  <button
    type="button"
    onClick={leerFactura}
    disabled={leyendo}
    className="mt-5 w-full rounded-xl
               bg-[#6935AE] px-5 py-3
               font-bold text-white
               disabled:opacity-60"
  >
    {leyendo
      ? 'Analizando comprobante...'
      : '🔍 Leer factura automáticamente'}
  </button>
)}

{textoDetectado && (
  <div className="mt-5 rounded-xl border
                  border-[#DFD1F1] p-4">
    <h4 className="mb-2 font-bold text-[#66379E]">
      Texto reconocido
    </h4>

    <pre className="max-h-52 overflow-auto
                    whitespace-pre-wrap break-words
                    text-xs text-[#6B597F]">
      {textoDetectado}
    </pre>
  </div>
)}

          <div className="mt-5 rounded-xl bg-[#F3ECFB] p-4">
            <p className="text-sm font-semibold
                          text-[#66379E]">
             El sistema intentará reconocer los datos de tu comprobante. Verifica el total, la fecha y el establecimiento antes de confirmar.
            </p>

            <p className="mt-2 text-xs leading-5
                          text-[#806999]">
              En esta versión, los datos no se extraen
              automáticamente de la imagen. Debes
              transcribirlos y verificarlos antes
              de registrar la operación.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-[#EEE7F5]
                        bg-white p-6 shadow-sm">
          <h3 className="text-lg font-extrabold">
            2. Revisar información
          </h3>

          <p className="mt-2 text-sm text-[#927EA6]">
            Confirma los datos del comprobante.
          </p>

          <form
            onSubmit={registrar}
            className="mt-6 space-y-4"
          >
            <div>
              <label
                htmlFor="escTipo"
                className="mb-2 block text-sm font-semibold"
              >
                Tipo de movimiento
              </label>

              <select
                id="escTipo"
                className={campo}
                value={datos.tipo}
                onChange={e =>
                  actualizar('tipo', e.target.value)
                }
              >
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="escDescripcion"
                className="mb-2 block text-sm font-semibold"
              >
                Descripción o establecimiento
              </label>

              <input
                id="escDescripcion"
                type="text"
                className={campo}
                required
                maxLength={100}
                placeholder="Ej. Compra supermercado"
                value={datos.descripcion}
                onChange={e =>
                  actualizar('descripcion', e.target.value)
                }
              />
            </div>

            <div>
              <label
                htmlFor="escMonto"
                className="mb-2 block text-sm font-semibold"
              >
                Total del comprobante (COP)
              </label>

              <input
                id="escMonto"
                type="number"
                min="0.01"
                step="0.01"
                required
                className={campo}
                placeholder="Ej. 85000"
                value={datos.monto}
                onChange={e =>
                  actualizar('monto', e.target.value)
                }
              />
            </div>

            <div>
              <label
                htmlFor="escCategoria"
                className="mb-2 block text-sm font-semibold"
              >
                Categoría
              </label>

              <select
                id="escCategoria"
                className={campo}
                value={datos.categoria}
                onChange={e =>
                  actualizar('categoria', e.target.value)
                }
              >
                {categorias.map(categoria => (
                  <option
                    key={categoria}
                    value={categoria}
                  >
                    {categoria}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="escCuenta"
                className="mb-2 block text-sm font-semibold"
              >
                Cuenta o billetera
              </label>

              <select
                id="escCuenta"
                className={campo}
                required
                value={datos.cuentaId}
                onChange={e =>
                  actualizar('cuentaId', e.target.value)
                }
              >
                <option value="">
                  Selecciona una cuenta
                </option>

                {cuentas.map(cuenta => (
                  <option
                    key={cuenta.id}
                    value={cuenta.id}
                  >
                    {cuenta.nombre} — {formatoCOP(
                      saldoActual(cuenta, movimientos)
                    )}
                  </option>
                ))}
              </select>
            </div>

            {cuentas.length === 0 && (
              <p className="flex items-center gap-2
                            text-sm text-[#A13F56]">
                <Wallet size={18} />
                Primero crea una cuenta o billetera.
              </p>
            )}

            <div>
              <label
                htmlFor="escFecha"
                className="mb-2 block text-sm font-semibold"
              >
                Fecha del comprobante
              </label>

              <input
                id="escFecha"
                type="date"
                required
                className={campo}
                value={datos.fecha}
                onChange={e =>
                  actualizar('fecha', e.target.value)
                }
              />
            </div>

            <button
              type="submit"
              disabled={!archivo || !cuentas.length}
              className="flex w-full items-center
                         justify-center gap-2 rounded-xl
                         bg-[#6935AE] py-3
                         font-bold text-white
                         disabled:cursor-not-allowed
                         disabled:opacity-50"
            >
              <CheckCircle2 size={19} />
              Confirmar y registrar movimiento
            </button>
          </form>
        </div>

      </section>

      <p className="text-xs text-[#927EA6]">
        La imagen se utiliza solamente como vista previa
        durante esta sesión. No se almacena ni se envía
        a un servidor. Se guardan únicamente los datos
        del movimiento en el almacenamiento local
        del navegador.
      </p>
    </div>
  )
}
