# Preferencias y restablecimiento en Configuración

## A. Objetivo

Dar acceso a la apariencia, los sonidos y el restablecimiento manual de datos desde Configuración.

## B. Estado anterior

El botón de Configuración abría un aviso de módulo futuro. Los datos se guardaban en claves independientes de localStorage y el tema era fijo.

## C. Implementación

La pantalla ofrece un tema claro morado, un tema oscuro y un tema claro verde. El sonido es opcional, empieza desactivado y usa las reacciones existentes para movimientos y metas. El restablecimiento exige escribir RESTABLECER. Conserva los nombres y tipos de cuenta, pone sus saldos iniciales a cero y limpia movimientos, metas, presupuestos, compromisos y facturas. Conserva las preferencias de la aplicación y de Orbi.

## D. Archivos modificados

- src/App.jsx conecta la ruta, aplica el tema y escucha los eventos de sonido y reinicio.
- src/configuracionUI.jsx muestra los controles y la confirmación.
- src/configuracion.js valida y guarda preferencias, genera los sonidos y delimita las claves del restablecimiento.
- src/temas.css aplica las paletas alternativas sobre los estilos existentes.
- tests/configuracion.test.js cubre preferencias y escenarios de restablecimiento con almacenamiento simulado.

## E. Conceptos de programación

Las variables CSS representan colores con roles distintos, como fondo y texto. Un atributo en el elemento raíz selecciona la paleta. useSyncExternalStore permite sincronizar los componentes con el almacenamiento. Web Audio genera tonos cortos con osciladores y una envolvente de volumen.

## F. Explicación técnica

La interfaz valida el texto de confirmación antes de llamar a restablecerDatos. Esta función trabaja con una lista explícita de claves y guarda una copia temporal de sus valores para intentar restaurarlos si una escritura falla. Emite una señal al completar el restablecimiento. La pestaña actual se recarga y las otras pestañas del mismo origen reciben el evento de almacenamiento, lo que evita que queden abiertas con datos anteriores.

## G. Pruebas realizadas

- npm run lint y npm run build terminaron correctamente. La salida de compilación quedó en una carpeta de trabajo externa.
- node --test tests/*.test.js pasó las 16 pruebas. Las nuevas verifican valores predeterminados, conservación de cuentas y preferencias, limpieza selectiva y recuperación ante un fallo de escritura simulado.
- Las pruebas de restablecimiento usaron un almacenamiento en memoria.

## H. Riesgos y pendientes

Quedan pendientes la revisión visual en navegador de todas las pantallas y la prueba audible. El navegador puede exigir una interacción del usuario antes de reproducir audio. localStorage no ofrece transacciones entre varias claves, por lo que la recuperación ante fallos depende de que el navegador acepte las escrituras de restauración. Una mejora posterior sería ofrecer exportación y restauración de copias de seguridad.

## I. Actividad de aprendizaje

1. ¿Por qué se usa una lista explícita de claves al restablecer datos?
2. ¿Cómo cambia una variable CSS el tema sin modificar la estructura de la página?
3. ¿Qué recibe otra pestaña cuando cambia el almacenamiento del mismo origen?

**Ejercicio.** En el almacenamiento simulado, agrega dos cuentas con saldos diferentes y comprueba que ambas conserven sus nombres y queden en cero después del restablecimiento.
