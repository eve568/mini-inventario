const express = require('express');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const publicDirectory = path.join(__dirname, 'public');
const supabaseBrowserSdkDirectory = path.join(
  __dirname,
  'node_modules',
  '@supabase',
  'supabase-js',
  'dist',
  'umd'
);
const productColumns = 'id,user_id,name,sku,quantity,minimum_quantity,created_at,updated_at';
const productFields = ['name', 'sku', 'quantity', 'minimum_quantity'];
const integerMaximum = 2_147_483_647;

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function normalizeProduct(input, { partial = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ApiError(400, 'Envía los datos del producto como un objeto.');
  }

  const keys = Object.keys(input);
  const unsupported = keys.filter((key) => !productFields.includes(key));
  if (unsupported.length) {
    throw new ApiError(400, 'Solo puedes enviar nombre, SKU y cantidades.');
  }
  if (partial && keys.length === 0) {
    throw new ApiError(400, 'Indica al menos un campo para actualizar.');
  }

  const result = {};
  for (const field of productFields) {
    if (partial && !Object.hasOwn(input, field)) continue;
    if (!partial && !Object.hasOwn(input, field)) {
      const labels = {
        name: 'el nombre',
        sku: 'el SKU',
        quantity: 'la cantidad actual',
        minimum_quantity: 'la cantidad mínima'
      };
      throw new ApiError(400, `Escribe ${labels[field]}.`);
    }

    if (field === 'name' || field === 'sku') {
      if (typeof input[field] !== 'string') {
        throw new ApiError(400, field === 'name' ? 'El nombre no es válido.' : 'El SKU no es válido.');
      }
      const value = field === 'name' ? input[field].trim() : input[field].trim().toUpperCase();
      if (!value) {
        throw new ApiError(400, field === 'name' ? 'Escribe el nombre del producto.' : 'Escribe el SKU del producto.');
      }
      if (field === 'name' && value.length > 120) {
        throw new ApiError(400, 'El nombre no puede superar 120 caracteres.');
      }
      if (field === 'sku' && value.length > 60) {
        throw new ApiError(400, 'El SKU no puede superar 60 caracteres.');
      }
      result[field] = value;
      continue;
    }

    const value = input[field];
    if (!Number.isInteger(value) || value < 0 || value > integerMaximum) {
      const label = field === 'quantity' ? 'La cantidad actual' : 'La cantidad mínima';
      throw new ApiError(400, `${label} debe ser un entero entre cero y ${integerMaximum}.`);
    }
    result[field] = value;
  }

  return result;
}

function isPublicSupabaseKey(key) {
  if (typeof key !== 'string') return false;
  if (key.startsWith('sb_publishable_')) return key.length > 'sb_publishable_'.length;

  const parts = key.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload.role === 'anon';
  } catch {
    return false;
  }
}

function createApp({ env = process.env, createSupabaseClient = createClient } = {}) {
  const app = express();
  const port = Number(env.PORT) || 3000;
  const supabaseUrl = env.SUPABASE_URL;
  const publicKey = env.SUPABASE_KEY;

  function hasSupabaseConfig() {
    return Boolean(supabaseUrl && isPublicSupabaseKey(publicKey));
  }

  function makeUserClient(accessToken) {
    return createSupabaseClient(supabaseUrl, publicKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false
      },
      global: {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    });
  }

  app.disable('x-powered-by');
  app.use(express.json({ limit: '20kb' }));

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.get('/config.js', (_request, response) => {
    if (!hasSupabaseConfig()) {
      return response
        .status(503)
        .type('application/javascript')
        .set('Cache-Control', 'no-store')
        .send('window.SUPABASE_CONFIG = null;');
    }
    const config = JSON.stringify({ supabaseUrl, supabaseKey: publicKey });
    return response
      .type('application/javascript')
      .set('Cache-Control', 'no-store')
      .send(`window.SUPABASE_CONFIG = Object.freeze(${config});`);
  });

  async function requireAuth(request, response, next) {
    if (!hasSupabaseConfig()) {
      return response.status(503).json({ error: 'Falta configurar la conexión con Supabase.' });
    }

    const authorization = request.get('authorization') || '';
    const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
    if (!match) {
      return response.status(401).json({ error: 'Inicia sesión para acceder a tus productos.' });
    }

    try {
      const accessToken = match[1];
      const userClient = makeUserClient(accessToken);
      const { data, error } = await userClient.auth.getUser(accessToken);
      if (error || !data?.user) {
        return response.status(401).json({ error: 'La sesión no es válida. Inicia sesión de nuevo.' });
      }
      request.supabase = userClient;
      request.user = data.user;
      return next();
    } catch {
      return response.status(401).json({ error: 'No se pudo validar la sesión. Inicia sesión de nuevo.' });
    }
  }

  function handleDatabaseError(response, error) {
    if (error?.code === '23505') {
      return response.status(409).json({ error: 'Ya existe un producto con ese SKU.' });
    }
    if (['23502', '23514', '22P02', '22003'].includes(error?.code)) {
      return response.status(400).json({ error: 'Los datos del producto no son válidos.' });
    }
    if (error?.code === '42501') {
      return response.status(403).json({ error: 'No tienes permiso para realizar esta operación.' });
    }
    return response.status(500).json({ error: 'Ocurrió un error inesperado al acceder al inventario.' });
  }

  app.get('/api/products', requireAuth, async (request, response) => {
    const { data, error, count } = await request.supabase
      .from('products')
      .select(productColumns, { count: 'exact' })
      .eq('user_id', request.user.id)
      .order('name', { ascending: true });

    if (error) return handleDatabaseError(response, error);
    return response.json({ products: data || [], count: count ?? (data || []).length });
  });

  app.get('/api/products/:id', requireAuth, async (request, response) => {
    const { data, error } = await request.supabase
      .from('products')
      .select(productColumns)
      .eq('id', request.params.id)
      .eq('user_id', request.user.id)
      .maybeSingle();

    if (error) return handleDatabaseError(response, error);
    if (!data) return response.status(404).json({ error: 'No se encontró el producto.' });
    return response.json(data);
  });

  app.post('/api/products', requireAuth, async (request, response) => {
    let product;
    try {
      product = normalizeProduct(request.body);
    } catch (error) {
      if (error instanceof ApiError) return response.status(error.status).json({ error: error.message });
      throw error;
    }

    const { data, error } = await request.supabase
      .from('products')
      .insert({ ...product, user_id: request.user.id })
      .select(productColumns)
      .single();

    if (error) return handleDatabaseError(response, error);
    return response.status(201).json(data);
  });

  app.patch('/api/products/:id', requireAuth, async (request, response) => {
    let product;
    try {
      product = normalizeProduct(request.body, { partial: true });
    } catch (error) {
      if (error instanceof ApiError) return response.status(error.status).json({ error: error.message });
      throw error;
    }

    const { data, error } = await request.supabase
      .from('products')
      .update(product)
      .eq('id', request.params.id)
      .eq('user_id', request.user.id)
      .select(productColumns)
      .maybeSingle();

    if (error) return handleDatabaseError(response, error);
    if (!data) return response.status(404).json({ error: 'No se encontró el producto.' });
    return response.json(data);
  });

  app.delete('/api/products/:id', requireAuth, async (request, response) => {
    const { data, error } = await request.supabase
      .from('products')
      .delete()
      .eq('id', request.params.id)
      .eq('user_id', request.user.id)
      .select('id')
      .maybeSingle();

    if (error) return handleDatabaseError(response, error);
    if (!data) return response.status(404).json({ error: 'No se encontró el producto.' });
    return response.status(204).end();
  });

  app.use('/vendor/supabase', express.static(supabaseBrowserSdkDirectory, {
    immutable: true,
    maxAge: '1h'
  }));
  app.use(express.static(publicDirectory));

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && Object.hasOwn(error, 'body')) {
      return response.status(400).json({ error: 'El cuerpo de la solicitud no contiene JSON válido.' });
    }
    return response.status(500).json({ error: 'Ocurrió un error inesperado.' });
  });

  app.locals.port = port;
  return app;
}

if (require.main === module) {
  const app = createApp();
  app.listen(app.locals.port, () => {
    console.log(`Mini Inventario disponible en http://localhost:${app.locals.port}`);
  });
}

module.exports = { ApiError, createApp, isPublicSupabaseKey, normalizeProduct };
