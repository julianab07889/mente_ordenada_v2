# Saldo insuficiente al registrar una factura en una billetera ficticia

## A. Objetivo

Comprobar por qué el escáner podía rechazar una factura de $18.263 con un saldo disponible de $46.000.

## B. Estado anterior

El selector de cuentas y el registro del gasto usan saldoActual. El selector muestra el saldo con los movimientos disponibles y registrarGasto vuelve a leer los datos persistidos antes de validar la cuenta por su identificador. En la prueba, la billetera ficticia tiene $51.000 de saldo inicial y un gasto anterior de $5.000. La segunda cuenta tiene un saldo distinto.

El extractor interpretaba los sufijos de uno o dos dígitos como decimales y eliminaba todos los separadores en los demás casos. Así, la entrada sintética $18.263,000 terminaba como 18263000. La comparación de ese importe contra 46000 devolvía el mismo error que reportó el usuario. Quedó sin confirmar el texto OCR que produjo el incidente original.

## C. Implementación

El extractor distingue los importes con grupos completos de miles de los importes con parte decimal. Los tres ceros de fracción se aceptan cuando los separadores identifican la parte decimal. Una fracción no nula de tres dígitos en un formato mixto queda sin sugerencia para que el usuario complete el total. La función de saldo y la validación de fondos mantienen sus reglas.

## D. Archivos modificados

- src/extraerComprobante.js. Corrige la normalización del importe extraído.
- tests/extraerComprobante.test.js. Verifica miles, decimales y formatos ambiguos.
- tests/facturas.test.js. Reproduce el caso de la billetera ficticia desde el texto reconocido hasta el gasto persistido.
- docs/aprendizaje/saldo_insuficiente_escaner.md. Documenta el hallazgo y las verificaciones.

## E. Conceptos de programación

La normalización convierte texto localizado en un valor apto para operar. Por ejemplo, 18.263,000 y 17,429.000 representan 18263 en los formatos probados, mientras que 18.263.000 representa 18263000. La estructura completa del número determina el papel de cada separador.

## F. Explicación técnica

extraerComprobante propone el monto normalizado. confirmarFactura lo convierte a Number y registrarGasto encuentra la cuenta por cuentaId en los datos recién leídos. saldoActual suma el saldo inicial y los movimientos de esa cuenta. Con la corrección, el gasto de 18263 se registra una sola vez y el saldo pasa de 46000 a 27737.

## G. Pruebas realizadas

- node --test --test-name-pattern 'billetera ficticia' tests/facturas.test.js reprodujo el rechazo antes de la corrección.
- node --test tests/*.test.js pasó las 13 pruebas. Incluye el escenario billetera ficticia y la validación de saldo realmente insuficiente, fechas, avisos, duplicados y pagos posteriores.
- npm run lint terminó sin errores.
- npm run build terminó correctamente con la salida en una carpeta de trabajo fuera del repositorio.

## H. Riesgos y pendientes

Queda pendiente repetir la operación con el comprobante original o revisar el importe que aparece en el formulario después de escanearlo. Las pruebas utilizaron solo datos ficticios.

## I. Actividad de aprendizaje

1. ¿Por qué eliminar todos los separadores puede producir un monto válido para JavaScript pero incorrecto para la factura?
2. ¿Qué parte de la prueba comprueba que se usó billetera ficticia aunque exista otra cuenta?
3. ¿Por qué conviene mantener la validación del saldo al corregir la lectura del importe?

**Ejercicio.** Añade un ejemplo de un total con dos decimales y calcula a mano el saldo esperado después del gasto. Comprueba ambos valores con una prueba automatizada.
