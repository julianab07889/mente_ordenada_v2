# Reconocimiento y gestión de comprobantes

## A. Objetivo

Ampliar el Escáner inteligente para revisar facturas de compras y servicios públicos, registrar gastos ya pagados y programar el pago posterior de facturas pendientes.

## B. Estado anterior

El escáner admitía imágenes y usaba Tesseract.js. Buscaba un monto y una fecha con expresiones regulares y guardaba directamente un movimiento en el navegador. El calendario persistía sus propios compromisos. Cuentas y movimientos compartían un almacén reactivo con localStorage.

## C. Implementación por etapas

1. **Reconocimiento.** El escáner acepta JPG, PNG, WebP y PDF de hasta 5 MB. PDF.js lee la capa de texto y, para páginas con poco texto, genera un lienzo que procesa Tesseract.js en español e inglés. El límite de 10 páginas y el tamaño acotado del lienzo contienen el trabajo del navegador. El extractor sugiere comercio o empresa, emisión, total, vencimiento, período y categoría. El formulario conserva los campos editables para confirmar el resultado.
2. **Pagos y calendario.** Una factura pagada genera un gasto en la cuenta seleccionada con la fecha real de pago. La fecha de emisión queda en los metadatos del comprobante. Una pendiente crea un compromiso con vencimiento y un aviso configurable de 0 a 30 días de antelación. El calendario refleja su estado y permite abrir la lista de pendientes del escáner para registrar el pago.
3. **Duplicados.** Se compara la huella SHA-256 de los bytes. Cambiar el nombre del archivo conserva la misma huella. Si el archivo es distinto, se compara el comercio normalizado y el total junto con la emisión, el vencimiento o el período. Se bloquea el archivo idéntico y se solicita confirmación explícita para una coincidencia probable. Cambiar un campo descarta esa confirmación.

## D. Archivos modificados

| Archivo | Cambio |
|---|---|
| package.json y package-lock.json | Dependencia PDF.js con su versión resuelta y worker empaquetado por Vite. |
| src/escaner.jsx | Carga, lectura, formulario de confirmación y acceso al pago de facturas pendientes. |
| src/leerComprobante.js | Lector de PDF y OCR con limpieza de recursos. |
| src/extraerComprobante.js | Extracción de campos, validación de fechas y sugerencia de categoría. |
| src/facturas.js | Reglas de almacenamiento, pago, avisos y duplicados. |
| src/facturasUI.jsx | Selector de cuenta, formulario de pago posterior y avisos en la aplicación. |
| src/finanzas.js | Lectura actual de cuentas y movimientos para validar y escribir a partir del estado persistido. |
| src/calendario.jsx y src/App.jsx | Facturas en el calendario y avisos visibles dentro de la aplicación. |
| tests/extraerComprobante.test.js y tests/facturas.test.js | Pruebas automatizadas del extractor y del flujo de datos. |

## E. Conceptos de programación

- **Procesamiento asíncrono.** La lectura de archivos y el OCR devuelven promesas. El lector libera el worker de PDF.js, el worker de OCR y cada lienzo temporal incluso cuando falla el procesamiento.
- **Heurística.** «Total a pagar» aporta una señal más específica que «Total», y «Fecha de vencimiento» se procesa aparte de «Fecha de emisión». Si falta una señal, el usuario puede completar el dato.
- **Estado derivado.** El calendario proyecta las facturas como eventos. El vencimiento se lee del registro original y el indicador de pago se deriva del comprobante o de un movimiento asociado.
- **Idempotencia.** Dos solicitudes para pagar el mismo comprobante buscan el mismo identificador. La segunda reutiliza el gasto previo. Web Locks serializa las operaciones de factura entre pestañas en navegadores compatibles.
- **Huella de contenido.** SHA-256 resume el contenido del archivo. Los datos confirmados y la huella se guardan localmente. La imagen, el PDF y el texto OCR completo quedan en memoria durante su uso.

## F. Explicación técnica

En src/escaner.jsx, el usuario carga un archivo y llama a leerComprobante. El texto pasa a extraerComprobante y los campos detectados rellenan el formulario. Al guardar se calcula la huella y confirmarFactura comprueba los registros existentes con datos actualizados.

Una factura pendiente se guarda en la clave mente_ordenada_facturas_demo. eventosDeFacturas la convierte en un compromiso de calendario, sin tocar el saldo. avisosDeFacturas la presenta desde la fecha configurada y la retira cuando se paga. Una factura pagada se registra mediante guardarMovimientos en la colección existente. El gasto conserva los campos que esperan Saldos, Movimientos y Reportes.

pagarFactura revisa el identificador antes de escribir. Si el gasto se guardó y falló la escritura del estado de la factura, el calendario puede reconocer el movimiento asociado y un reintento puede completar el estado sin crear otro gasto.

## G. Pruebas realizadas

| Etapa | Verificación |
|---|---|
| Reconocimiento | Se ejecutaron lint y build. Pasaron dos pruebas automatizadas de extracción. Se leyó un PDF textual sintético con PDF.js y se comprobaron los cinco campos y la categoría. |
| Pagos y recordatorios | Se ejecutaron lint y build. Se probaron el saldo intacto al guardar una pendiente, la ventana de aviso, el gasto directo, el pago concurrente y la recuperación tras un fallo simulado de almacenamiento. Un caso de validación dejó colgado el Web Locks de Node al propagar un error síncrono. Se envolvió el callback en una función asíncrona y se volvieron a ejecutar todas las pruebas. |
| Duplicados y cierre | npm run lint y npm run build pasaron, con la compilación dirigida a una carpeta de trabajo fuera del repositorio. node --test tests/*.test.js pasó con 11 pruebas. Se comprobó el bloqueo por huella, la confirmación de coincidencias probables y el guardado de facturas periódicas distintas. |
| OCR real en Node | Tesseract reconoció una imagen sintética. También se leyó un PDF sintético sin capa de texto, se rasterizó con PDF.js y se extrajeron los datos de la imagen con Tesseract. |

## H. Riesgos y pendientes

- Los avisos aparecen dentro de la aplicación. Mostrar notificaciones con la aplicación cerrada requeriría infraestructura adicional.
- Se verificó en Windows con Node 24. PDF.js 6.5.438 declara Node 22.13 o posterior. El ensayo automatizado en Edge sin interfaz agotó su tiempo, por lo que sigue pendiente confirmar el recorrido completo desde la interfaz, además de validarlo en Linux y con comprobantes reales de diferentes emisores.
- Los PDF protegidos, las fotos borrosas y los formatos poco comunes pueden requerir completar los campos manualmente. El OCR puede descargar el motor y los datos de idioma la primera vez, según la configuración y la caché de Tesseract.
- El almacenamiento pertenece al origen y perfil del navegador. El bloqueo entre pestañas depende de Web Locks. localStorage utiliza claves separadas para los compromisos y los movimientos. El vínculo por identificador permite recuperar el pago si falla la actualización del compromiso.

## I. Actividad de aprendizaje

1. ¿Por qué conviene usar la capa textual de un PDF antes de rasterizarlo para OCR?
2. ¿Qué pasos impiden que reintentar el pago de una factura pendiente produzca dos gastos?
3. ¿Qué diferencia hay entre detectar el mismo archivo por SHA-256 y detectar una factura probable por sus campos?

**Ejercicio práctico.** Construye un texto de factura ficticia con subtotal, total, fechas de emisión y vencimiento. Añade al extractor una prueba que compruebe que identifica el total a pagar y mantiene separadas ambas fechas.
