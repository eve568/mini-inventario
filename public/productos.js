(() => {
  const integerMaximum = 2_147_483_647;

  function normalize(input) {
    const name = String(input.name ?? '').trim();
    const sku = String(input.sku ?? '').trim().toUpperCase();
    const quantityValue = String(input.quantity ?? '').trim();
    const minimumQuantityValue = String(input.minimum_quantity ?? '').trim();
    if (!name) throw new Error('Escribe el nombre del producto.');
    if (!sku) throw new Error('Escribe el SKU del producto.');
    if (name.length > 120) throw new Error('El nombre no puede superar 120 caracteres.');
    if (sku.length > 60) throw new Error('El SKU no puede superar 60 caracteres.');
    if (!quantityValue) throw new Error('Escribe la cantidad actual.');
    if (!minimumQuantityValue) throw new Error('Escribe la cantidad mínima.');
    const quantity = Number(quantityValue);
    const minimumQuantity = Number(minimumQuantityValue);
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > integerMaximum) {
      throw new Error(`La cantidad actual debe ser un entero entre cero y ${integerMaximum}.`);
    }
    if (!Number.isInteger(minimumQuantity) || minimumQuantity < 0 || minimumQuantity > integerMaximum) {
      throw new Error(`La cantidad mínima debe ser un entero entre cero y ${integerMaximum}.`);
    }
    return { name, sku, quantity, minimum_quantity: minimumQuantity };
  }

  async function request(url, options = {}) {
    const auth = await window.AuthReady;
    const accessToken = await auth.accessToken();
    if (!accessToken) {
      const error = new Error('Inicia sesión para acceder a tus productos.');
      error.status = 401;
      throw error;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...options.headers
      }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.error || 'No se pudo completar la solicitud.');
      error.status = response.status;
      throw error;
    }
    return body;
  }

  async function list() {
    const result = await request('/api/products');
    return result.products.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  async function save(input, id = null) {
    const product = normalize(input);
    return request(id ? `/api/products/${encodeURIComponent(id)}` : '/api/products', {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(product)
    });
  }

  async function remove(id) {
    await request(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  window.Productos = Object.freeze({ list, save, remove });
})();
