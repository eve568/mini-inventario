const { test, expect } = require('@playwright/test');
const { randomUUID } = require('node:crypto');

const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;

test.beforeEach(async ({ page }) => {
  test.skip(!email || !password, 'Configura TEST_EMAIL y TEST_PASSWORD en .env');
  await page.goto('/');
});

async function signIn(page, credentials = { email, password }) {
  await page.getByLabel('Correo electrónico').fill(credentials.email);
  await page.getByLabel('Contraseña').fill(credentials.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
}

async function accessToken(page) {
  return page.evaluate(() => {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.endsWith('-auth-token')) continue;
      try {
        const value = JSON.parse(localStorage.getItem(key));
        if (value?.access_token) return value.access_token;
      } catch {
        // Ignora valores de almacenamiento que no sean una sesión de Supabase.
      }
    }
    return null;
  });
}

async function deleteProductBySku(page, sku) {
  const token = await accessToken(page);
  if (!token) return;
  const response = await page.request.get('/api/products', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok()) return;
  const { products } = await response.json();
  const product = products.find((item) => item.sku === sku);
  if (product) {
    await page.request.delete(`/api/products/${encodeURIComponent(product.id)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}

async function addProduct(page, { name, sku, quantity, minimum }) {
  await page.getByLabel('Nombre del producto').fill(name);
  await page.getByLabel('SKU').fill(sku);
  await page.getByLabel('Cantidad actual').fill(String(quantity));
  await page.getByLabel('Cantidad mínima').fill(String(minimum));
  await page.getByRole('button', { name: /Agregar producto/ }).click();
}

test('inicia sesión con un usuario confirmado', async ({ page }) => {
  await signIn(page);
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Productos/ })).toBeVisible();
});

test('rechaza una contraseña incorrecta', async ({ page }) => {
  await signIn(page, { email, password: `${password}-incorrecta` });
  await expect(page.locator('#auth-message')).toContainText(
    'No se pudo iniciar sesión',
    { timeout: 10_000 }
  );
  await expect(page.locator('#workspace')).toBeHidden();
});

test('agrega un producto al inventario', async ({ page }) => {
  await signIn(page);
  await expect(page.locator('#workspace')).toBeVisible();
  const sku = `PW-${randomUUID().slice(0, 8).toUpperCase()}`;
  try {
    await addProduct(page, {
      name: `Producto de prueba ${sku}`,
      sku,
      quantity: 12,
      minimum: 5
    });
    await expect(page.locator('#product-list')).toContainText(sku);
  } finally {
    await deleteProductBySku(page, sku);
  }
});

test('marca como existencias bajas un producto debajo del mínimo', async ({ page }) => {
  await signIn(page);
  await expect(page.locator('#workspace')).toBeVisible();
  const sku = `LOW-${randomUUID().slice(0, 8).toUpperCase()}`;
  try {
    await addProduct(page, {
      name: `Producto bajo mínimo ${sku}`,
      sku,
      quantity: 2,
      minimum: 5
    });
    const product = page.locator('.product-card').filter({ hasText: sku });
    await expect(product).toContainText('Existencias bajas');
    await page.locator('#low-stock-filter').check();
    await expect(product).toBeVisible();
  } finally {
    await deleteProductBySku(page, sku);
  }
});
