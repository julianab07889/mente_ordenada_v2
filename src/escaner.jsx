
import { leerComprobante, esPDF } from './leerComprobante.js'
import { extraerComprobante } from './extraerComprobante.js'
import { confirmarFactura, fechaLocal, huellaComprobante, useFacturas } from './facturas.js'
import { CuentaFactura, FacturasPendientes } from './facturasUI.jsx'
import { avisarOrbi } from './orbiEstado.js'

import { useEffect, useState } from 'react'
import {
  ScanLine, Upload, FileImage, X,
  CheckCircle2, AlertCircle, Wallet
} from 'lucide-react'

import { useFinanzas } from './finanzas.js'

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

function datosIniciales() {
  return {
    estado: 'pagada',
    descripcion: '',
    monto: '',
    categoria: 'Otros',
    cuentaId: '',
    fecha: '',
    fechaPago: fechaLocal(),
    avisoDias: 3,
    vencimiento: '',
    periodo: ''
  }
}

export default function Escaner() {
  const { cuentas, movimientos } = useFinanzas()
  const facturas = useFacturas()
  const [leyendo, setLeyendo] = useState(false)
  const [textoDetectado, setTextoDetectado] = useState('')
  const [{ archivo, vistaPrevia }, setImagen] = useState({ archivo: null, vistaPrevia: '' })
  const [datos, setDatos] = useState(datosIniciales)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmacion, setConfirmacion] = useState(null)
  const pendiente = datos.estado === 'pendiente'

  useEffect(() => {
    if (!vistaPrevia) return

    return () => URL.revokeObjectURL(vistaPrevia)
  }, [vistaPrevia])

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

    if (!esPDF(seleccionado) && !permitidos.includes(seleccionado.type)) {
      setError('Selecciona un PDF o una imagen JPG, PNG o WebP.')
      evento.target.value = ''
      return
    }

    if (seleccionado.size > 5 * 1024 * 1024) {
      setError('El archivo no puede superar los 5 MB.')
      evento.target.value = ''
      return
    }

    setImagen({
      archivo: seleccionado,
      vistaPrevia: esPDF(seleccionado) ? '' : URL.createObjectURL(seleccionado)
    })
    setDatos({
      ...datosIniciales(),
      cuentaId: cuentas[0]?.id || ''
    })

    evento.target.value = ''
  }
  async function leerFactura() {
    if (!archivo || leyendo) return
    setLeyendo(true)
    setConfirmacion(null)
    setError('')
    setExito('')
    setTextoDetectado('')
    try {
      const texto = await leerComprobante(archivo)
      if (!texto.trim()) {
        setError('No se pudo reconocer texto. Puedes completar el formulario manualmente.')
        return
      }
      setTextoDetectado(texto)
      const extraidos = extraerComprobante(texto)
      setDatos(anterior => ({
        ...anterior,
        ...Object.fromEntries(Object.entries(extraidos).filter(([, valor]) => valor))
      }))
      setExito('Lectura finalizada. Confirma los datos antes de guardar.')
    } catch (fallo) {
      setError(fallo?.message?.startsWith('El PDF debe') ? fallo.message :
        'No se pudo analizar el archivo. Verifica que pueda abrirse o completa el formulario manualmente.')
    } finally {
      setLeyendo(false)
    }
  }

  function actualizar(campo, valor) {
    setConfirmacion(null)
    setDatos(actual => ({
      ...actual,
      [campo]: valor
    }))
  }

  function limpiar() {
    setConfirmacion(null)
    setImagen({ archivo: null, vistaPrevia: '' })
    setTextoDetectado('')
    setDatos(datosIniciales())
    setError('')
  }

  async function registrar(evento) {
    evento.preventDefault()
    if (!archivo || leyendo || guardando) return
    setGuardando(true)
    setError('')
    setExito('')
    try {
      const huella = await huellaComprobante(archivo)
      await confirmarFactura({ ...datos, huella }, pendiente, confirmacion)
      if (!pendiente) avisarOrbi('gasto')
      limpiar()
      setExito(pendiente ? 'Recordatorio guardado en el calendario.' : 'Factura pagada. El gasto está registrado.')
    } catch (fallo) {
      setConfirmacion(fallo.confirmacionDuplicado ?? null)
      setError(fallo?.message || 'No se pudo guardar la factura.')
    } finally {
      setGuardando(false)
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

      <FacturasPendientes facturas={facturas} cuentas={cuentas} movimientos={movimientos}
        alPagar={mensaje => { setError(''); setExito(mensaje) }} />

      <section className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-[#EEE7F5]
                        bg-white p-6 shadow-sm">
          <h3 className="text-lg font-extrabold">
            1. Cargar comprobante
          </h3>

          <p className="mt-2 text-sm text-[#927EA6]">
            Selecciona una imagen legible o un PDF de tu recibo o factura.
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
                PDF, JPG, PNG o WebP · Máximo 5 MB
              </span>

              <input
                id="archivoComprobante"
                type="file"
                accept="application/pdf,.pdf,image/jpeg,image/png,image/webp"
                onChange={cargarArchivo}
                className="sr-only"
              />
            </label>
          ) : (
            <div className="mt-6 space-y-4">
              {vistaPrevia && <div className="relative overflow-hidden
                              rounded-2xl bg-[#F7F2FC]">
                <img
                  src={vistaPrevia}
                  alt="Vista previa del comprobante"
                  className="max-h-96 w-full
                             object-contain"
                />
              </div>}

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
                  disabled={leyendo || guardando}
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
    disabled={leyendo || guardando}
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
              Completa o corrige los campos que la lectura no haya identificado.
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

          <form onSubmit={registrar} className="mt-6">
            <fieldset disabled={leyendo || guardando} className="min-w-0 space-y-4">
              <div>
                <label
                  htmlFor="escEstado"
                  className="mb-2 block text-sm font-semibold"
                >
                  Estado de la factura
                </label>

                <select
                  id="escEstado"
                  className={campo}
                  value={datos.estado}
                  onChange={e =>
                    actualizar('estado', e.target.value)
                  }
                >
                  <option value="pagada">Factura pagada</option>
                  <option value="pendiente">Factura pendiente</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="escDescripcion"
                  className="mb-2 block text-sm font-semibold"
                >
                  Comercio o empresa
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

              {!pendiente && (
                <>
                  <CuentaFactura id="escCuenta" cuentas={cuentas} movimientos={movimientos}
                    value={datos.cuentaId} onChange={id => actualizar('cuentaId', id)} />
                  {cuentas.length === 0 && (
                    <p className="flex items-center gap-2 text-sm text-[#A13F56]">
                      <Wallet size={18} /> Primero crea una cuenta o billetera.
                    </p>
                  )}
                  <div>
                    <label htmlFor="escFechaPago" className="mb-2 block text-sm font-semibold">Fecha de pago</label>
                    <input id="escFechaPago" type="date" required className={campo} value={datos.fechaPago}
                      onChange={e => actualizar('fechaPago', e.target.value)} />
                  </div>
                </>
              )}
              {pendiente && (
                <div>
                  <label htmlFor="escAviso" className="mb-2 block text-sm font-semibold">Avisar antes del vencimiento</label>
                  <input id="escAviso" type="number" min="0" max="30" step="1" required className={campo}
                    value={datos.avisoDias} onChange={e => actualizar('avisoDias', e.target.value)} />
                  <p className="mt-1 text-xs text-[#927EA6]">Días de antelación. Con 0, el aviso empieza el día del vencimiento. Se muestra dentro de la aplicación.</p>
                </div>
              )}

              <div>
                <label
                  htmlFor="escFecha"
                  className="mb-2 block text-sm font-semibold"
                >
                  Fecha de emisión
                </label>

                <input
                  id="escFecha"
                  type="date"
                  className={campo}
                  value={datos.fecha}
                  onChange={e =>
                    actualizar('fecha', e.target.value)
                  }
                />
              </div>

              <div>
                <label htmlFor="escVencimiento" className="mb-2 block text-sm font-semibold">Fecha de vencimiento</label>
                <input id="escVencimiento" type="date" required={pendiente} className={campo} value={datos.vencimiento}
                  onChange={e => actualizar('vencimiento', e.target.value)} />
              </div>
              <div>
                <label htmlFor="escPeriodo" className="mb-2 block text-sm font-semibold">Período facturado</label>
                <input id="escPeriodo" maxLength={80} className={campo} value={datos.periodo}
                  onChange={e => actualizar('periodo', e.target.value)} />
              </div>

              <button
                type="submit"
                disabled={!archivo || (!pendiente && !cuentas.length) || leyendo || guardando}
                className="flex w-full items-center
                           justify-center gap-2 rounded-xl
                           bg-[#6935AE] py-3
                           font-bold text-white
                           disabled:cursor-not-allowed
                           disabled:opacity-50"
              >
                <CheckCircle2 size={19} />
                {confirmacion ? 'Es distinto: guardar de todos modos' :
                  pendiente ? 'Confirmar y crear recordatorio' : 'Confirmar y registrar gasto'}
              </button>
            </fieldset>
          </form>
        </div>

      </section>

      <p className="text-xs text-[#927EA6]">
        El archivo se procesa en esta sesión. Se guardan los datos confirmados en el navegador.
      </p>
    </div>
  )
}
