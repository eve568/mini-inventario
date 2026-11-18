# Bitácora — Día 3: Mini Inventario

## Objetivo

Construir la primera versión de Mini Inventario: una aplicación Express que sirve `public/`, responde en `/health` y permite listar, agregar y editar productos. La interfaz identifica los productos cuya cantidad está por debajo del mínimo. El acceso a datos se concentra en `public/productos.js` y usa `localStorage`. No se agregó inicio de sesión.

## Prompts principales utilizados

- Leer `docs/requisitos.md` y `docs/diseno.md`, explicar un plan antes de editar y construir la primera versión, sin agregar inicio de sesión.
- Revisar las validaciones para nombres vacíos, SKU duplicados y cantidades negativas; explicar cualquier problema y proponer una corrección sin modificar archivos hasta recibir aprobación.
- Corregir, tras recibir aprobación, únicamente el caso de cantidades vacías que se guardaban como cero.
- Preparar esta bitácora con la información de la sesión y esperar aprobación antes de crear el archivo.

## Rama de trabajo

El trabajo continuó en `dia-03-web`. Se descartó crear una rama adicional porque ya estábamos trabajando en esa rama. No se cambió de rama.

## Archivos implementados

- `package.json`: configuración del proyecto y comando `npm start`.
- `server.js`: servidor Express, ruta `/health`, archivos estáticos desde `public/` y puerto de `process.env.PORT` o `3000`.
- `public/index.html`: estructura de la página y formulario de productos.
- `public/styles.css`: estilos de la interfaz.
- `public/app.js`: interacción del formulario, listado, edición y filtro de existencias bajas.
- `public/productos.js`: lectura y escritura en `localStorage`, normalización de SKU y validación de productos.

## Pruebas manuales

Se ejecutó Mini Inventario en `http://localhost:3000` y se realizaron estas comprobaciones en el navegador:

- Se registraron tres productos.
- Se comprobó el indicador de existencias bajas y se usó el filtro para mostrar esos productos.
- Se recargó la página y se verificó que los productos persistieran.
- Se rechazó el envío de un formulario vacío.
- Se editó un producto y se comprobó que otra edición cancelada no guardara cambios.
- El contador terminó mostrando cuatro productos.

Después de corregir la validación en `public/productos.js`, también se comprobó en el navegador que:

- Una Cantidad actual vacía se rechaza.
- Una Cantidad mínima vacía se rechaza.
- Escribir `0` permite registrar el producto.

No se realizaron pruebas automatizadas.

## Error de cantidades vacías y corrección

Se detectó que `Number('')` produce `0`. Como el formulario desactiva la validación nativa con `novalidate`, una cantidad vacía podía convertirse y guardarse como cero.

Tras recibir aprobación, se modificó únicamente `public/productos.js`. Antes de convertir los valores a número, ahora se recortan y se rechazan si están vacíos, con mensajes específicos para Cantidad actual y Cantidad mínima. Después se aplican las validaciones existentes de entero y valor no negativo.

La corrección se comprobó en el navegador: ambos campos vacíos se rechazan y el valor `0` permite registrar un producto.

## Evidencias

La actividad requiere al menos una captura en `entregas/dia-03/`. Verificaremos los archivos existentes en esa carpeta antes de documentar sus nombres.

## Estado de entrega

Al momento de elaborar esta bitácora, los cambios estaban pendientes de commit y Pull Request.
