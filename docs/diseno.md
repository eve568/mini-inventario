# Diseño de Mini Inventario

Diseño aprobado basado en las cinco historias de usuario de docs/requisitos.md.

## 1. Arquitectura general

La aplicación utiliza Node.js 22 con Express para el backend, HTML y JavaScript para el frontend, y Supabase para autenticación y base de datos PostgreSQL.

- El navegador muestra las páginas HTML y ejecuta JavaScript.
- El cliente de Supabase Auth en el navegador gestiona registro, inicio, renovación y cierre de sesión con correo y contraseña.
- Express sirve los archivos del frontend y ofrece una API para consultar, registrar y editar productos.
- Supabase PostgreSQL almacena los productos y aplica reglas de acceso por usuario.

Al iniciar sesión, el navegador obtiene un token de acceso. Lo envía a Express en la cabecera Authorization como Bearer token con cada petición del inventario. Express verifica la identidad y consulta Supabase usando ese token, manteniendo las restricciones del usuario.

El frontend y la API se sirven desde el mismo origen. Las comunicaciones en el entorno publicado utilizan HTTPS.

## 2. Componentes principales

| Componente | Responsabilidad |
|---|---|
| Pantalla de acceso | Registro e inicio de sesión con correo y contraseña; mensajes de error. |
| Pantalla de inventario | Lista con nombre, SKU, cantidad, mínimo e indicador «Existencias bajas». |
| Filtro de existencias bajas | Alterna entre todos los productos y aquellos con cantidad menor que el mínimo. |
| Formulario de producto | Permite registrar y editar los cuatro campos; cancelar descarta los cambios del formulario. |
| Gestión de sesión | Mantiene y renueva la sesión; al cerrarla, limpia el inventario visible y devuelve a la pantalla de acceso. |
| Verificación de autenticación en Express | Valida el token antes de permitir operaciones sobre productos. |
| Validación de productos | Comprueba campos obligatorios, cantidades y formato de los datos. |
| Acceso a datos | Ejecuta las consultas a Supabase con la identidad del usuario de cada petición. |

La interfaz muestra estados de carga, inventario vacío, filtro sin resultados y errores de guardado. Los nombres y SKU se muestran como texto, sin interpretar contenido introducido por el usuario como HTML.

## 3. Modelo de datos de productos

Tabla products:

| Campo | Tipo | Regla |
|---|---|---|
| id | UUID | Identificador único generado automáticamente. |
| user_id | UUID | Obligatorio; referencia al usuario de Supabase Auth. |
| name | Texto | Obligatorio; no puede quedar vacío tras quitar espacios exteriores. |
| sku | Texto | Obligatorio; normalizado y único dentro del inventario del usuario. |
| quantity | Entero | Obligatorio; igual o mayor que cero. |
| minimum_quantity | Entero | Obligatorio; igual o mayor que cero. |
| created_at | Fecha y hora | Fecha de creación automática. |
| updated_at | Fecha y hora | Se actualiza al guardar cambios. |

### Reglas de SKU

- Los SKU no distinguen entre mayúsculas y minúsculas.
- Antes de guardar, se eliminan los espacios al inicio y al final y se convierte el SKU a mayúsculas.
- El SKU normalizado no puede estar vacío.
- El SKU es único dentro del inventario de cada usuario.
- Dos usuarios diferentes pueden utilizar el mismo SKU.
- Al editar, se permite conservar el SKU actual del producto.

La base de datos exige el formato normalizado del SKU y una restricción única sobre la combinación user_id y sku. Así se impiden duplicados incluso si llegan solicitudes simultáneas o se intenta escribir directamente mediante la API de Supabase.

La base de datos también impide cantidades negativas, valores nulos en campos obligatorios y nombres o SKU vacíos. Los tipos enteros impiden almacenar cantidades decimales. Express valida los datos antes de enviarlos a la base de datos.

El estado de existencias bajas se calcula comparando quantity < minimum_quantity y no se almacena en otra columna. Si ambos valores son iguales, el producto no tiene existencias bajas. El filtro aplica esta misma comparación en la consulta a la base de datos.

## 4. Endpoints necesarios

Todos los endpoints de productos requieren autenticación.

| Método y ruta | Función | Resultado esperado |
|---|---|---|
| GET /api/products | Listar los productos del usuario. | 200, incluso si la lista está vacía. |
| GET /api/products?low_stock=true | Listar únicamente productos por debajo del mínimo. | 200 con la lista filtrada. |
| GET /api/products/:id | Obtener un producto para editarlo. | 200 o 404 si no está disponible para ese usuario. |
| POST /api/products | Registrar un producto. | 201 con el producto creado. |
| PATCH /api/products/:id | Editar uno o varios de los cuatro campos. | 200 con el producto actualizado. |

Los cuatro campos editables son name, sku, quantity y minimum_quantity. Al registrar, todos son obligatorios. La API no permite modificar id, user_id ni las fechas administradas por el sistema.

Las respuestas de error son consistentes:

- 400: datos inválidos.
- 401: token ausente, inválido o vencido.
- 404: producto inexistente o perteneciente a otro usuario.
- 409: SKU duplicado en el inventario del usuario.
- 500: error inesperado, sin exponer detalles internos.

Registro, inicio, renovación y cierre de sesión se realizan con el cliente de Supabase Auth en el navegador; no requieren endpoints propios en Express.

## 5. Seguridad y aislamiento del inventario

### Verificación en Express

- Express verifica el token antes de permitir operaciones de productos y obtiene la identidad autenticada.
- Al crear un producto, asigna user_id desde la identidad verificada; no confía en un propietario enviado por el navegador.
- Las consultas se limitan al usuario autenticado y, cuando corresponde, al identificador del producto.
- No acepta cambios de propietario.
- Cada petición utiliza su propio cliente de Supabase con el token del usuario, evitando mezclar sesiones.

### Protección en la base de datos

Se activa Row Level Security (RLS) en products:

- Lectura: el usuario autenticado solo puede consultar filas cuyo user_id coincide con su identidad.
- Inserción: solo puede crear filas cuyo user_id coincide con su identidad.
- Actualización: tanto la fila existente como el resultado deben pertenecer al usuario autenticado, impidiendo transferir productos a otra cuenta.
- Las solicitudes sin autenticación no pueden acceder al inventario.

Las consultas de productos utilizan la clave publicable y el token del usuario. No utilizan claves secretas ni service_role, que omiten las restricciones RLS. El aislamiento se mantiene aunque alguien intente acceder directamente a la API de Supabase.

Las contraseñas quedan a cargo de Supabase Auth; no se almacenan en products ni en registros de la aplicación. Las credenciales y archivos .env quedan fuera del repositorio. Los tokens tampoco deben aparecer en registros de la aplicación.

### Comprobación del aislamiento

Con dos cuentas diferentes se comprobará que:

- Ambas pueden registrar el mismo SKU.
- Una cuenta no puede leer ni editar productos de la otra, incluso conociendo sus identificadores.
- Cambiar el propietario en una petición no permite acceder a otro inventario ni transferir productos.
- Dentro de una cuenta, los SKU equivalentes tras quitar espacios exteriores y convertir a mayúsculas se rechazan como duplicados.

## 6. Referencias

- Supabase: Row Level Security — https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase: claves de API — https://supabase.com/docs/guides/getting-started/api-keys
