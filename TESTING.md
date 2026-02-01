# 🧪 Guía de Pruebas - Delivery App

Acabamos de inyectar una gran cantidad de datos de prueba en la base de datos para simular un entorno real.

## 🚀 Cómo Probar la App

1. **Reiniciar la App Móvil**
   
   Asegúrate de que la terminal de Expo (`npm start` en `mobile-app`) esté corriendo. Si ya estaba abierta, presiona `r` en la terminal para recargar la app en tu dispositivo.

2. **Explorar el Home**
   - Deberías ver **Categorías** reales (Hamburguesas, Pizza, Sushi, etc.).
   - Desplázate hacia abajo para ver la lista de **Restaurantes**. Deberían aparecer unos 20 restaurantes generados aleatoriamente (ej. "The Burger Spot", "El Pizza Place").
   - Prueba el selector de categorías horizontal.

3. **Probar Búsqueda y Filtros**
   - Toca una categoría (ej. "Pizza") -> La lista de restaurantes debe filtrarse.
   - Usa la barra de búsqueda superior (escribe "Sushi" o "Burger") -> La lista debe actualizarse en tiempo real.

4. **Ver Detalle de Restaurante**
   - Toca cualquier tarjeta de restaurante.
   - Verás la imagen de portada, calificación, tiempo de entrega y costo.
   - Abajo verás el **Menú** con productos de prueba (ej. "Clásica", "Especial", "Combo").
   - Toca el botón `+` en un producto para agregarlo al carrito.

5. **Carrito de Compras**
   - Observa el icono del carrito en la esquina superior derecha (debería tener un badge con el número de items).
   - Toca el icono para abrir la pantalla `Tu Pedido`.
   - Ajusta las cantidades con `+` y `-`.
   - Prueba el botón "Vaciar" (arriba a la derecha).

## 🛠️ Datos Generados

El script `seed_massive.ts` generó:
- **20 Restaurantes** con coordenadas aleatorias alrededor de Lima.
- **12 Categorías** con iconos.
- **~130 Productos** distribuidos entre los restaurantes.

¡Disfruta probando tu nueva app llena de contenido! 🍔🚀
