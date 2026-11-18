import { useState } from 'react'
import { actualizarConfiguracion, reproducirSonido, restablecerDatos } from './configuracion.js'

const panel = 'rounded-3xl border border-[#EEE7F5] bg-white p-6 shadow-sm'
const campo = 'rounded-xl border border-[#DFD1F1] bg-white px-4 py-3 text-sm'

export default function Configuracion({ preferencias }) {
  const [confirmar, setConfirmar] = useState(false)
  const [palabra, setPalabra] = useState('')
  const [mensaje, setMensaje] = useState('')

  function cambiar(cambios) {
    try {
      actualizarConfiguracion(cambios)
      setMensaje('')
      if (cambios.sonido === true) void reproducirSonido()
    } catch {
      setMensaje('No se pudo guardar la preferencia en este navegador.')
    }
  }

  function reiniciar(evento) {
    evento.preventDefault()
    if (palabra !== 'RESTABLECER') return
    try {
      restablecerDatos()
      window.location.reload()
    } catch (error) {
      setMensaje(error.message)
    }
  }

  return (
    <div className="space-y-5">
      {mensaje && <p role="alert" className="rounded-xl bg-[#FDE9ED] p-4 text-sm text-[#A13F56]">{mensaje}</p>}

      <section className={panel}>
        <h3 className="text-lg font-extrabold">Apariencia</h3>
        <label htmlFor="tema-app" className="mt-4 block text-sm font-semibold">Tema de la interfaz</label>
        <select id="tema-app" className={campo + ' mt-2 w-full sm:w-auto'} value={preferencias.tema}
          onChange={evento => cambiar({ tema: evento.target.value })}>
          <option value="claro">Claro · morado original</option>
          <option value="oscuro">Oscuro</option>
          <option value="verde">Claro · verde</option>
        </select>
      </section>

      <section className={panel}>
        <h3 className="text-lg font-extrabold">Sonidos</h3>
        <label className="mt-4 flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" checked={preferencias.sonido} className="h-5 w-5 accent-[#7540B8]"
            onChange={evento => cambiar({ sonido: evento.target.checked })} />
          Reproducir sonidos al registrar movimientos y completar metas
        </label>
        {preferencias.sonido && (
          <button type="button" onClick={() => void reproducirSonido()}
            className="mt-3 text-sm font-bold text-[#6935AE] underline">Probar sonido</button>
        )}
      </section>

      <section className={panel}>
        <h3 className="text-lg font-extrabold">Restablecer datos financieros</h3>
        <p className="mt-2 max-w-xl text-sm text-[#76668E]">
          Pone a cero los saldos de tus cuentas y borra movimientos, metas, presupuestos,
          compromisos del calendario y facturas. Conserva las cuentas y tus preferencias.
          Esta acción es irreversible.
        </p>
        {confirmar ? (
          <form onSubmit={reiniciar} className="mt-4 space-y-3">
            <label htmlFor="confirmacion-reinicio" className="block text-sm font-semibold">
              Escribe RESTABLECER para confirmar.
            </label>
            <input id="confirmacion-reinicio" autoComplete="off" className={campo} value={palabra}
              onChange={evento => setPalabra(evento.target.value)} />
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => { setConfirmar(false); setPalabra(''); setMensaje('') }}
                className="rounded-xl border border-[#DFD1F1] px-4 py-2 text-sm font-bold">Cancelar</button>
              <button type="submit" disabled={palabra !== 'RESTABLECER'}
                className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                Borrar historial y poner saldos a cero
              </button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setConfirmar(true)}
            className="mt-4 rounded-xl bg-[#FDE9ED] px-4 py-2 text-sm font-bold text-[#A13F56]">
            Restablecer información
          </button>
        )}
      </section>
    </div>
  )
}
