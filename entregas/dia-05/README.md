# Día 5 — Pruebas de Mini Inventario

## Objetivo

Explorar la aplicación con un navegador real, documentar problemas y convertir los flujos principales en pruebas repetibles con Playwright.

## Rama

`dia-05-pruebas`

## Preparación local

1. Usa Node.js 22.20 o superior.
2. Copia `.env.example` a `.env` y configura `SUPABASE_URL` y `SUPABASE_KEY` con la clave publicable del proyecto.
3. Agrega localmente `TEST_EMAIL` y `TEST_PASSWORD` de un usuario confirmado de Supabase. No compartas ni subas el archivo `.env`.
4. Instala dependencias con `npm ci`.
5. Instala Playwright Test con `npm init playwright@latest` y selecciona JavaScript y Chromium.
6. Instala el navegador si hace falta: `npx playwright install chromium`.

## Pruebas automatizadas

La configuración está en `playwright.config.js` y los cuatro escenarios en `tests/e2e/inventory.spec.js`:

- Inicio de sesión con usuario confirmado.
- Rechazo de contraseña incorrecta.
- Alta de producto con SKU único.
- Identificación de producto por debajo de la cantidad mínima.

Las pruebas de alta eliminan el registro creado al terminar. La limpieza usa la sesión del usuario de prueba y la API autenticada de la aplicación.

Ejecuta:

```sh
npx playwright test
```

## Exploración manual y evidencia pendiente

La exploración debe ejecutarse con la instancia local y las credenciales de prueba, porque requiere una sesión real de Supabase. Guarda las capturas originales en esta carpeta:

- `escritorio-1280x800.png`
- `movil-390x844.png`

Registra aquí los errores de consola, el problema visual o funcional observado, su corrección y los resultados reales. No se incluyen capturas simuladas ni resultados de pruebas que no se hayan ejecutado.

## Bitácora

Completar después de la ejecución local:

| Evidencia requerida | Resultado |
|---|---|
| Prompt de exploración utilizado | Pendiente de registrar |
| Problema real y corrección | Pendiente de inspección de capturas |
| Error o mala decisión de la IA y detección | Pendiente de documentar |
| Comando aprobado o rechazado y motivo | Pendiente de documentar |
| Resultado de las cuatro pruebas | Pendiente de ejecutar |
| Falla provocada y resultado tras revertirla | Pendiente de ejecutar |

## Detección de regresiones

La regla de existencias bajas de la aplicación es `quantity < minimum_quantity`. Para demostrar que la prueba detecta una regresión, cambia temporalmente la comparación a `quantity > minimum_quantity`, ejecuta `npx playwright test` y comprueba que falla el escenario de existencias bajas. Después revierte el cambio y confirma que las cuatro pruebas pasan.

**Importante:** no introduzcas el cambio intencional en una versión que se vaya a desplegar. La comparación debe revertirse antes de abrir el Pull Request.
