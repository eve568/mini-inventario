# Día 4 — Integración de Supabase

## Objetivo
Conectar Mini Inventario con Supabase para implementar autenticación de usuarios, almacenamiento de productos en PostgreSQL y protección de datos mediante políticas RLS.

## 1. Actividades realizadas

- Se creó el proyecto `mini-inventario` en Supabase.
- Se configuró el MCP de Supabase y se instalaron las skills `supabase` y `supabase-postgres-best-practices`.
- Se creó la migración SQL para la tabla `products`.
- Se revisaron los permisos y las políticas RLS antes de aplicar la migración.
- Se crearon dos usuarios confirmados en Supabase Authentication.
- Se integró el registro, inicio y cierre de sesión.
- Se reemplazó el almacenamiento local de productos por consultas a Supabase.
- Se configuraron las variables `SUPABASE_URL` y `SUPABASE_KEY` mediante `.env` y la ruta `/config.js`.
- Se creó `.env.example` sin valores.
- Se realizaron pruebas de funcionamiento y seguridad.

## 2. Prompts utilizados

**Prompt 1 — Base de datos**

Se solicitó a Codex crear una migración SQL para la tabla `products`, siguiendo el diseño del proyecto, habilitando RLS y mostrando el SQL antes de aplicarlo.

**Prompt 2 — Conexión de la aplicación**

Se solicitó modificar `public/productos.js` para utilizar Supabase en lugar de `localStorage`, implementar autenticación con correo y contraseña, configurar `/config.js` y crear `.env.example`.

**Prompt 3 — Diagnóstico**

Se pidió a Codex investigar por qué la aplicación mostraba el mensaje «Falta configurar la conexión con Supabase», sin modificar archivos hasta identificar la causa.

## 3. Error identificado y solución

Durante la integración, Codex dejó temporalmente incompleto el archivo `public/app.js`. Se le indicó recuperar su funcionalidad y conservar las características existentes del inventario.

Posteriormente, al ejecutar la aplicación, apareció un error de configuración de Supabase. Codex identificó que el archivo `.env` no existía en la raíz del proyecto.

Se creó `.env` en la ubicación correcta, se configuraron las variables requeridas y se reinició el servidor.

La ruta `/config.js` respondió con el código HTTP `200`, confirmando que estaba disponible.

## 4. Comandos aprobados y verificación

| Comando | Propósito | Resultado |
|---|---|---|
| `npm install --save-exact dotenv` | Instalar la dependencia de configuración | Instalación correcta |
| `npm test` | Ejecutar pruebas automatizadas | 11 pruebas aprobadas |
| `git check-ignore .env` | Verificar la exclusión del archivo de configuración | `.env` ignorado |
| `git status` | Revisar la rama y los cambios | Rama `dia-04-supabase` |
| `git commit` | Guardar los cambios localmente | Commit `a9ec610` |
| `git push -u origin dia-04-supabase` | Publicar la rama en GitHub | Publicación correcta |

## 5. Pruebas de seguridad

Se utilizaron dos usuarios confirmados en Supabase.

**Usuario 1:** registró el producto Cuaderno (`PROD001`) y únicamente pudo visualizar sus propios productos.

**Usuario 2:** registró el producto Lápiz (`PROD002`) y no pudo visualizar el Cuaderno del primer usuario.

Al regresar a la sesión del primer usuario, se comprobó que el Lápiz tampoco aparecía en su inventario.

Estas pruebas demostraron la separación de datos entre ambos usuarios en la aplicación.

## 6. Evidencias

- `usuario1.png`: inventario del primer usuario.
- `usuario2.png`: inventario del segundo usuario.
- Migración SQL: `supabase/migrations/20261117210652_create_products_table.sql`.
- Pull Request del Día 4 en GitHub.

## 7. Conclusión

Se logró conectar Mini Inventario con Supabase, implementar autenticación y almacenar los productos en PostgreSQL. Las políticas RLS permitieron mantener separados los inventarios de los usuarios durante las pruebas realizadas. También se verificó que el archivo `.env` estuviera excluido de Git y se publicó la implementación en una rama para su revisión mediante Pull Request.