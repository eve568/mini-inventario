# Requisitos de Mini Inventario

## 1. Registrarse e iniciar sesión

**Como** visitante, **quiero** crear una cuenta e iniciar sesión **para** acceder a mi inventario privado.

**Criterios de aceptación:**

- Es posible registrar una cuenta con un correo electrónico válido y una contraseña.
- No se permite registrar dos cuentas con el mismo correo.
- Las credenciales correctas permiten iniciar sesión; las incorrectas muestran un error y no conceden acceso.
- Al cerrar sesión, es necesario volver a autenticarse para consultar el inventario.

## 2. Consultar un inventario privado

**Como** usuario autenticado, **quiero** consultar mis productos **para** conocer mis existencias.

**Criterios de aceptación:**

- La lista muestra nombre, SKU, cantidad y cantidad mínima de cada producto del usuario.
- Una cuenta nueva muestra un inventario vacío.
- Los productos de otro usuario no aparecen en la lista.
- Intentar consultar o modificar un producto de otro usuario mediante su identificador no permite acceder a sus datos ni cambiarlos.

## 3. Registrar productos

**Como** usuario autenticado, **quiero** registrar productos **para** llevar el control de sus existencias.

**Criterios de aceptación:**

- El registro solicita nombre, SKU, cantidad y cantidad mínima; todos son obligatorios.
- Nombre y SKU no pueden estar vacíos ni contener únicamente espacios.
- Cantidad y cantidad mínima aceptan únicamente números enteros iguales o mayores que cero.
- Un SKU ya utilizado en el inventario del usuario impide guardar y muestra un error.
- Dos usuarios distintos pueden utilizar el mismo SKU.
- Al guardar datos válidos, el producto aparece en la lista y permanece disponible al recargar la página.

## 4. Editar productos

**Como** usuario autenticado, **quiero** editar todos los datos de mis productos **para** mantener actualizado el inventario.

**Criterios de aceptación:**

- Se pueden modificar nombre, SKU, cantidad y cantidad mínima.
- Se aplican las mismas validaciones que al registrar un producto.
- Se permite conservar el SKU actual del producto.
- Cambiar el SKU por el de otro producto del mismo usuario impide guardar y muestra un error.
- Los cambios guardados aparecen en la lista y permanecen al recargar la página.
- Cancelar la edición conserva los valores anteriores.

## 5. Identificar y filtrar existencias bajas

**Como** usuario autenticado, **quiero** identificar y filtrar los productos con existencias bajas **para** saber cuáles necesitan reposición.

**Criterios de aceptación:**

- La lista general muestra un indicador visual con el texto «Existencias bajas» cuando la cantidad es menor que la cantidad mínima.
- Un producto con cantidad igual o mayor que el mínimo no muestra ese indicador.
- Al activar el filtro, solo aparecen productos cuya cantidad es menor que su mínimo.
- Al desactivar el filtro, vuelven a mostrarse todos los productos del usuario.
- Si ningún producto cumple la condición, el filtro muestra un mensaje que indica que no hay productos con existencias bajas.
- Tras guardar una edición de cantidad o mínimo, el indicador y los resultados del filtro reflejan los nuevos valores.
