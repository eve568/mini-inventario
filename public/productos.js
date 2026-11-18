(() => {
  const STORAGE_KEY = 'mini-inventario:productos:v1';

  function readAll() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const products = JSON.parse(stored);
      return Array.isArray(products) ? products : [];
    } catch {
      return [];
    }
  }

  function writeAll(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }

  function normalize(input) {
    const name = String(input.name ?? '').trim();
    const sku = String(input.sku ?? '').trim().toUpperCase();
    const quantityValue = String(input.quantity ?? '').trim();
    const minimumQuantityValue = String(input.minimum_quantity ?? '').trim();
    if (!name) throw new Error('Escribe el nombre del producto.');
    if (!sku) throw new Error('Escribe el SKU del producto.');
    if (!quantityValue) throw new Error('Escribe la cantidad actual.');
    if (!minimumQuantityValue) throw new Error('Escribe la cantidad mínima.');
    const quantity = Number(quantityValue);
    const minimumQuantity = Number(minimumQuantityValue);
    if (!Number.isInteger(quantity) || quantity < 0) throw new Error('La cantidad actual debe ser un entero igual o mayor que cero.');
    if (!Number.isInteger(minimumQuantity) || minimumQuantity < 0) throw new Error('La cantidad mínima debe ser un entero igual o mayor que cero.');
    return { name, sku, quantity, minimum_quantity: minimumQuantity };
  }

  function list() {
    return readAll().sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  function save(input, id = null) {
    const product = normalize(input);
    const products = readAll();
    const duplicate = products.some((item) => item.sku.toUpperCase() === product.sku && item.id !== id);
    if (duplicate) throw new Error('Ya existe un producto con ese SKU.');

    if (id) {
      const index = products.findIndex((item) => item.id === id);
      if (index < 0) throw new Error('No se encontró el producto que quieres editar.');
      products[index] = { ...products[index], ...product, updated_at: new Date().toISOString() };
    } else {
      products.push({ id: crypto.randomUUID(), ...product, created_at: new Date().toISOString() });
    }
    writeAll(products);
    return products.find((item) => item.id === (id || products.at(-1).id));
  }

  function remove(id) {
    writeAll(readAll().filter((item) => item.id !== id));
  }

  window.Productos = Object.freeze({ list, save, remove });
})();
