# Mini Inventario

Aplicación de inventario con Node.js 22, Express, Supabase Auth y PostgreSQL.

## Configuración local

1. Copia `.env.example` como `.env`.
2. Asigna `SUPABASE_URL` y `SUPABASE_KEY` con la URL del proyecto y una clave **publishable** (`sb_publishable_…`) o la clave heredada `anon`.
3. Instala las dependencias con `npm ci` y ejecuta `npm start`.
4. Abre `http://localhost:3000`.

`SUPABASE_KEY` se entrega al navegador por `/config.js`; por eso debe ser exclusivamente una clave publicable o `anon`. No uses `service_role`, una secret key ni credenciales de base de datos. El servidor valida los tokens de sesión y consulta la tabla con el token del usuario para que se apliquen las políticas RLS.

El archivo `.env` está excluido de Git. `.env.example` contiene únicamente nombres de variables vacíos; las credenciales reales se configuran localmente o en el gestor de variables del entorno de ejecución.

## Verificación

```sh
npm test
```
