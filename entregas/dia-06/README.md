# Día 6 — Pruebas e integración continua

## Objetivo

Automatizar las pruebas del Mini Inventario con GitHub Actions para que se ejecuten en cada Pull Request dirigido a `main`.

## Rama

`dia-06-ci`

## Flujo de CI

El workflow `.github/workflows/ci.yml`:

1. Se activa cuando se abre o actualiza un Pull Request hacia `main`.
2. Usa Ubuntu y Node.js 22.
3. Instala dependencias y Chromium.
4. Comprueba que existan los cuatro secretos requeridos.
5. Ejecuta pruebas unitarias y E2E.
6. Publica el reporte de Playwright como artefacto, incluso si las pruebas fallan.

## Configuración de secretos

En el repositorio, configurar desde **Settings → Secrets and variables → Actions → New repository secret**:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `TEST_EMAIL`
- `TEST_PASSWORD`

También se pueden agregar desde terminal con GitHub CLI, sin escribir sus valores en el chat:

```sh
gh secret set SUPABASE_URL
gh secret set SUPABASE_KEY
gh secret set TEST_EMAIL
gh secret set TEST_PASSWORD
gh secret list
```

Usar una cuenta de Supabase exclusiva para pruebas. No subir el archivo `.env` ni compartir los valores de los secretos.

## Validación local

Desde la raíz del repositorio:

```sh
npm install
npx playwright install chromium
npm test
npx playwright test
```

Las pruebas E2E necesitan `SUPABASE_URL`, `SUPABASE_KEY`, `TEST_EMAIL` y `TEST_PASSWORD` en el entorno local o en el archivo `.env` ignorado por Git.

## Evidencia y bitácora

| Evidencia | Estado |
|---|---|
| Workflow agregado | Configurado en esta rama |
| Secretos de GitHub | Pendiente de configurar por el propietario |
| Primera ejecución verde | Pendiente |
| Falla intencional y ejecución roja | Pendiente |
| Diagnóstico con `gh pr checks`, `gh run list` y `gh run view --log-failed` | Pendiente |
| Corrección y ejecución verde | Pendiente |
| Capturas de las ejecuciones | Pendiente |

No se registran ejecuciones, capturas ni resultados que todavía no se hayan producido.

## Diagnóstico desde terminal

```sh
gh pr checks
gh run list
gh run view --log-failed
```

## Criterio de aceptación

El Día 6 se considera validado cuando los secretos estén configurados, las pruebas pasen en CI, se documente una falla intencional y su corrección, y el Pull Request sea integrado a `main`.
