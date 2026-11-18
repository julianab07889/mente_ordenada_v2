export const normalizar = texto => texto.normalize('NFD')
  .replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

const MESES = 'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split(' ')

export function fechaValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const fecha = new Date(valor + 'T00:00:00Z')
  return Number.isFinite(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor
}

function extraerFecha(texto) {
  const iso = texto.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/)
  const local = texto.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/)
  const letras = normalizar(texto).match(/\b(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:de\s+)?(\d{4})\b/)
  const [anio, mes, dia] = iso ? iso.slice(1) : local
    ? [local[3], local[2], local[1]] : letras
      ? [letras[3], String(MESES.indexOf(letras[2]) + 1), letras[1]] : []
  if (!anio) return ''
  const fecha = [anio, mes.padStart(2, '0'), dia.padStart(2, '0')].join('-')
  return fechaValida(fecha) ? fecha : ''
}

function extraerMonto(texto) {
  const bruto = texto.match(/(?:COP\s*)?\$?\s*(\d+(?:[.,]\d+)*)/i)?.[1]
  if (!bruto) return ''
  const agrupado = /^\d{1,3}(?:\.\d{3})+$|^\d{1,3}(?:,\d{3})+$/
  const decimal = bruto.match(/^(.*)[.,](\d{1,2}|000)$/)
  let monto = bruto
  if (agrupado.test(bruto)) {
    monto = bruto.replace(/[.,]/g, '')
  } else if (decimal) {
    const [, entero, fraccion] = decimal
    if (!/^\d+$/.test(entero) && !agrupado.test(entero)) return ''
    monto = entero.replace(/[.,]/g, '') + (fraccion === '000' ? '' : '.' + fraccion)
  } else if (!/^\d+$/.test(bruto)) {
    return ''
  }
  return Number.isFinite(Number(monto)) && Number(monto) > 0 ? monto : ''
}

function buscarCampo(lineas, patrones, convertir = valor => valor.trim()) {
  for (const patron of patrones) {
    for (const [i, linea] of lineas.entries()) {
      const coincidencia = normalizar(linea).match(patron)
      if (!coincidencia) continue
      const valor = linea.slice(coincidencia[0].length).trim()
      const resultado = convertir(valor || lineas[i + 1] || '')
      if (resultado) return resultado
    }
  }
  return ''
}

export function extraerComprobante(texto) {
  const lineas = texto.split(/\r?\n/).map(linea => linea.trim()).filter(Boolean)
  const emision = [/^(?:fecha\s+(?:de\s+)?(?:emision|expedicion|facturacion|generacion)|fecha factura)\s*[:-]?\s*/, /^fecha\s*:\s*/]
  const vence = [/^(?:fecha\s+(?:de\s+)?(?:vencimiento|pago oportuno)|vencimiento|pague(?:se)? hasta|pagar hasta|pagar antes de|fecha limite (?:de )?pago|pago oportuno|vence)\s*[:-]?\s*/]
  const periodo = [/^(?:periodo\s+(?:de\s+)?(?:facturado|facturacion|consumo)|periodo)\s*[:-]?\s*/]
  const comercio = buscarCampo(lineas, [/^(?:comercio|establecimiento|empresa|razon social|emisor)\s*:\s*/])
    || lineas.slice(0, 8).find(linea => /[a-záéíóúüñ]{3}/i.test(linea)
      && !/^(?:factura|documento|nit|rut|fecha|recibo|comprobante|ticket|periodo|vencimiento|total)\b/.test(normalizar(linea)))
  const fecha = buscarCampo(lineas, emision, extraerFecha)
    || extraerFecha(lineas.find(linea => /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}(?:\s|$)/.test(linea)) || '')
  const monto = buscarCampo(lineas, [
    /^(?:total\s+a\s+pagar|valor\s+a\s+pagar|importe\s+a\s+pagar|saldo\s+a\s+pagar)\b\s*[:-]?\s*/,
    /^(?:gran total|valor total|importe total|total(?:\s+factura)?)(?=\s*[:$\d]|\s+cop\b|$)\s*[:-]?\s*/
  ], extraerMonto)
  const documento = normalizar(texto)
  const categoria = /\b(energia|acueducto|alcantarillado|gas natural|servicios publicos|internet|telefonia|kwh)\b/.test(documento)
    ? 'Servicios'
    : /\b(supermercado|restaurante|panaderia|mercado)\b/.test(documento) ? 'Alimentación'
      : /\b(farmacia|drogueria|clinica)\b/.test(documento) ? 'Salud'
        : /\b(peaje|parqueadero|gasolina|transporte)\b/.test(documento) ? 'Transporte' : 'Otros'

  return {
    descripcion: (comercio || '').slice(0, 100),
    fecha,
    monto,
    vencimiento: buscarCampo(lineas, vence, extraerFecha),
    periodo: buscarCampo(lineas, periodo).slice(0, 80),
    categoria
  }
}
