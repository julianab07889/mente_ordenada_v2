import { createWorker } from 'tesseract.js'

export function esPDF(archivo) {
  return archivo.type === 'application/pdf' || (!archivo.type && /\.pdf$/i.test(archivo.name))
}

async function leerPDF(archivo, reconocer) {
  const [{ getDocument, GlobalWorkerOptions }, { default: workerUrl }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  ])
  GlobalWorkerOptions.workerSrc = workerUrl

  const tarea = getDocument({ data: await archivo.arrayBuffer(), isEvalSupported: false })
  try {
    const pdf = await tarea.promise
    if (pdf.numPages > 10) throw new Error('El PDF debe tener como máximo 10 páginas.')

    const paginas = []
    for (let numero = 1; numero <= pdf.numPages; numero++) {
      const pagina = await pdf.getPage(numero)
      const { items } = await pagina.getTextContent()
      const texto = items.map(item => item.str ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('')
      if (texto.replace(/\s/g, '').length >= 40) {
        paginas.push(texto)
        continue
      }

      const base = pagina.getViewport({ scale: 1 })
      const escala = Math.min(2.5, 2200 / Math.max(base.width, base.height))
      const viewport = pagina.getViewport({ scale: escala })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      try {
        await pagina.render({ canvas, viewport }).promise
        paginas.push(await reconocer(canvas))
      } finally {
        canvas.width = canvas.height = 0
      }
    }
    return paginas.join('\n')
  } finally {
    await tarea.destroy()
  }
}

export async function leerComprobante(archivo) {
  let worker
  async function reconocer(imagen) {
    worker ??= await createWorker('spa+eng')
    const { data } = await worker.recognize(imagen)
    return data.text || ''
  }

  try {
    return esPDF(archivo) ? await leerPDF(archivo, reconocer) : await reconocer(archivo)
  } finally {
    await worker?.terminate()
  }
}
