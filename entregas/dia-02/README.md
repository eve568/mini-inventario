# Bitácora — Día 2: Planeación, requisitos y diseño

## 1. Objetivo

Planear el desarrollo de Mini Inventario mediante la definición de historias de usuario, criterios de aceptación y un diseño técnico, utilizando Codex como asistente y GitHub para organizar el trabajo.

## 2. Prompts principales utilizados

**Prompt 1. Historias de usuario**

Solicité a Codex planear Mini Inventario, una aplicación web donde los usuarios puedan iniciar sesión, registrar productos y consultar sus existencias. Le pedí proponer cinco historias de usuario con criterios de aceptación verificables, sin escribir código.

**Prompt 2. Diseño técnico**

Solicité diseñar la solución utilizando Node.js, Express, HTML, JavaScript y Supabase, incluyendo la estructura de la base de datos, la autenticación y las validaciones.

**Prompt 3. Issues de GitHub**

Pedí crear cinco issues, uno por cada historia de usuario, incluyendo los criterios de aceptación como listas de tareas. También indiqué que debía explicar cada comando y solicitar mi aprobación antes de ejecutarlo.

**Prompt 4. Publicación del trabajo**

Solicité preparar los documentos, crear un commit, publicar la rama dia-2/requisitos y abrir un Pull Request hacia main, sin fusionarlo automáticamente.

## 3. Correcciones realizadas a Codex

**Primera corrección: validación de SKU**

Definí que los SKU no deben distinguir entre mayúsculas y minúsculas, deben eliminar los espacios al inicio y al final y deben ser únicos por usuario. También aclaré que dos usuarios diferentes pueden utilizar el mismo SKU.

**Segunda corrección: control de cambios**

Solicité que Codex trabajara únicamente en la rama correspondiente, explicara los comandos y pidiera autorización antes de ejecutarlos. También indiqué que no debía crear commits ni publicar cambios hasta recibir mi aprobación.

## 4. Error detectado

Durante la creación de la rama dia-2/requisitos, Git mostró un error relacionado con la creación de una referencia de rama. Después de revisar el resultado, se volvió a ejecutar el comando y la rama se creó correctamente.

Esto permitió continuar trabajando sin modificar la rama principal.

## 5. Comando aprobado

git push -u origin dia-2/requisitos

Aprobé este comando porque permite publicar la rama de trabajo en GitHub y configurar su seguimiento remoto, sin fusionarla automáticamente con main.

## 6. Verificación de resultados

Comprobé que:

- Se guardaron cinco historias de usuario en docs/requisitos.md.
- Se creó el diseño técnico en docs/diseno.md.
- Se generaron cinco issues de GitHub, del #2 al #6.
- Se publicó la rama dia-2/requisitos.
- Se creó el Pull Request #7.
- El Pull Request #7 quedó fusionado con main.

También utilicé comandos de Git para comprobar la rama activa, el estado del repositorio y los archivos publicados.

## 7. Conclusión

Durante esta actividad aprendí a utilizar Codex para organizar los requisitos y el diseño de un proyecto antes de comenzar su programación. También comprendí la importancia de revisar sus propuestas, corregir decisiones técnicas y aprobar los comandos antes de ejecutarlos.

El resultado fue una planeación documentada y organizada en GitHub, que servirá como base para las siguientes actividades de Mini Inventario.
