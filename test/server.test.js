const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { describe, it } = require('node:test');
const { createServer } = require('node:http');
const { createApp, isPublicSupabaseKey, normalizeProduct } = require('../server');

const testUser = { id: 'user-1', email: 'uno@example.com' };
const testProduct = {
  id: 'product-1',
  user_id: testUser.id,
  name: 'Café',
  sku: 'CAF-001',
  quantity: 3,
  minimum_quantity: 5,
  created_at: '2026-11-17T00:00:00.000Z',
  updated_at: '2026-11-17T00:00:00.000Z'
};
const publishableKey = 'sb_publishable_test_key';
const baseEnv = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_KEY: publishableKey
};

function makeJwt(role) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ role })).toString('base64url');
  return `${header}.${payload}.signature`;
}

function fakeClientFactory({ records = [testProduct], captured = {} } = {}) {
  return (url, key, options) => {
    captured.client = { url, key, options };
    return {
      auth: {
        getUser: async (token) => token === 'valid-access-token'
          ? { data: { user: testUser }, error: null }
          : { data: { user: null }, error: new Error('invalid token') }
      },
      from(table) {
        assert.equal(table, 'products');
        const query = { operation: 'select', filters: [], records };
        const builder = {
          select(_columns, options) {
            query.selectOptions = options;
            return this;
          },
          eq(column, value) {
            query.filters.push([column, value]);
            return this;
          },
          order(column, options) {
            query.order = [column, options];
            return this;
          },
          insert(value) {
            query.operation = 'insert';
            query.value = value;
            return this;
          },
          update(value) {
            query.operation = 'update';
            query.value = value;
            return this;
          },
          delete() {
            query.operation = 'delete';
            return this;
          },
          single() {
            captured.query = query;
            return Promise.resolve({
              data: { ...query.value, id: 'product-new', created_at: 'now', updated_at: 'now' },
              error: null
            });
          },
          maybeSingle() {
            captured.query = query;
            const matching = query.filters.every(([column, value]) =>
              column === 'id' ? value === testProduct.id : column === 'user_id' ? value === testUser.id : false
            );
            return Promise.resolve({
              data: !matching ? null : query.operation === 'delete'
                ? { id: testProduct.id }
                : { ...testProduct, ...query.value },
              error: null
            });
          },
          then(resolve, reject) {
            captured.query = query;
            return Promise.resolve({ data: records, count: records.length, error: null }).then(resolve, reject);
          }
        };
        return builder;
      }
    };
  };
}

async function withServer(app, callback) {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  try {
    return await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

describe('configuración y validación de credenciales', () => {
  it('mantiene .env.example sin valores y .env excluido de Git', () => {
    const example = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
    assert.equal(example, 'SUPABASE_URL=\nSUPABASE_KEY=\n');
    const gitignore = fs.readFileSync(path.join(__dirname, '..', '.gitignore'), 'utf8');
    assert.match(gitignore, /^\.env$/m);
  });

  it('conecta los flujos del formulario con signUp, signInWithPassword y signOut', async () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'auth.js'), 'utf8');
    const calls = [];
    const browserWindow = {
      SUPABASE_CONFIG: { supabaseUrl: baseEnv.SUPABASE_URL, supabaseKey: publishableKey },
      supabase: {
        createClient(url, key) {
          calls.push(['createClient', url, key]);
          return { auth: {
            signUp: async (credentials) => { calls.push(['signUp', credentials]); return { data: {}, error: null }; },
            signInWithPassword: async (credentials) => { calls.push(['signInWithPassword', credentials]); return { data: {}, error: null }; },
            signOut: async () => { calls.push(['signOut']); return { error: null }; },
            getSession: async () => ({ data: { session: { access_token: 'access-token' } }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: {} } })
          } };
        }
      }
    };
    vm.runInNewContext(source, { window: browserWindow });
    const auth = await browserWindow.AuthReady;
    await auth.signUp('uno@example.com', 'password123');
    await auth.signIn('uno@example.com', 'password123');
    await auth.signOut();
    assert.deepEqual(calls.map(([name]) => name), ['createClient', 'signUp', 'signInWithPassword', 'signOut']);
    assert.equal(JSON.stringify(calls[1][1]), JSON.stringify({ email: 'uno@example.com', password: 'password123' }));
  });

  it('acepta claves publishable y anon, y rechaza service_role', () => {
    assert.equal(isPublicSupabaseKey(publishableKey), true);
    assert.equal(isPublicSupabaseKey(makeJwt('anon')), true);
    assert.equal(isPublicSupabaseKey(makeJwt('service_role')), false);
    assert.equal(isPublicSupabaseKey('sb_secret_test_key'), false);
  });

  it('entrega solo URL y clave pública desde /config.js', async () => {
    const app = createApp({ env: baseEnv });
    await withServer(app, async (origin) => {
      const response = await fetch(`${origin}/config.js`);
      const body = await response.text();
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /javascript/);
      assert.match(response.headers.get('cache-control'), /no-store/);
      assert.match(body, /supabaseUrl/);
      assert.match(body, /supabaseKey/);
      assert.doesNotMatch(body, /service_role|sb_secret_/);
    });
  });

  it('rechaza claves secretas al intentar publicar configuración', async () => {
    const app = createApp({ env: { ...baseEnv, SUPABASE_KEY: makeJwt('service_role') } });
    await withServer(app, async (origin) => {
      const response = await fetch(`${origin}/config.js`);
      assert.equal(response.status, 503);
      assert.doesNotMatch(await response.text(), /service_role/);
    });
  });
});

describe('validación de productos', () => {
  it('recorta nombre, normaliza SKU y conserva cantidades enteras', () => {
    assert.deepEqual(normalizeProduct({
      name: '  Café  ', sku: ' caf-001 ', quantity: 3, minimum_quantity: 5
    }), { name: 'Café', sku: 'CAF-001', quantity: 3, minimum_quantity: 5 });
  });

  it('rechaza cantidades decimales, negativas o campos protegidos', () => {
    assert.throws(() => normalizeProduct({
      name: 'Café', sku: 'CAF-001', quantity: 1.5, minimum_quantity: 2
    }), /entero/);
    assert.throws(() => normalizeProduct({
      name: 'Café', sku: 'CAF-001', quantity: 1, minimum_quantity: 2, user_id: 'otro'
    }), /Solo puedes enviar/);
  });
});

describe('API protegida de productos', () => {
  it('requiere token y valida el token en Supabase Auth', async () => {
    let authCalls = 0;
    const factory = (url, key, options) => {
      const client = fakeClientFactory() (url, key, options);
      const original = client.auth.getUser;
      client.auth.getUser = async (token) => {
        authCalls += 1;
        return original(token);
      };
      return client;
    };
    const app = createApp({ env: baseEnv, createSupabaseClient: factory });
    await withServer(app, async (origin) => {
      const missing = await fetch(`${origin}/api/products`);
      assert.equal(missing.status, 401);
      const invalid = await fetch(`${origin}/api/products`, {
        headers: { Authorization: 'Bearer invalid-access-token' }
      });
      assert.equal(invalid.status, 401);
      assert.equal(authCalls, 1);
    });
  });

  it('consulta con el token del usuario y limita la consulta por user_id', async () => {
    const captured = {};
    const app = createApp({ env: baseEnv, createSupabaseClient: fakeClientFactory({ captured }) });
    await withServer(app, async (origin) => {
      const response = await fetch(`${origin}/api/products`, {
        headers: { Authorization: 'Bearer valid-access-token' }
      });
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.products[0].user_id, testUser.id);
      assert.deepEqual(captured.query.filters, [['user_id', testUser.id]]);
      assert.equal(captured.client.key, publishableKey);
      assert.equal(captured.client.options.global.headers.Authorization, 'Bearer valid-access-token');
    });
  });

  it('crea el producto para el usuario validado, no para un propietario enviado', async () => {
    const captured = {};
    const app = createApp({ env: baseEnv, createSupabaseClient: fakeClientFactory({ captured }) });
    await withServer(app, async (origin) => {
      const response = await fetch(`${origin}/api/products`, {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-access-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ' Café ', sku: ' caf-002 ', quantity: 2, minimum_quantity: 4 })
      });
      assert.equal(response.status, 201);
      assert.deepEqual(captured.query.value, {
        name: 'Café', sku: 'CAF-002', quantity: 2, minimum_quantity: 4, user_id: testUser.id
      });
    });
  });

  it('limita las ediciones y eliminaciones al usuario validado', async () => {
    const captured = {};
    const app = createApp({ env: baseEnv, createSupabaseClient: fakeClientFactory({ captured }) });
    await withServer(app, async (origin) => {
      const headers = { Authorization: 'Bearer valid-access-token', 'Content-Type': 'application/json' };
      const updated = await fetch(`${origin}/api/products/${testProduct.id}`, {
        method: 'PATCH', headers, body: JSON.stringify({ quantity: 6 })
      });
      assert.equal(updated.status, 200);
      assert.deepEqual(captured.query.filters, [['id', testProduct.id], ['user_id', testUser.id]]);
      assert.deepEqual(captured.query.value, { quantity: 6 });

      const deleted = await fetch(`${origin}/api/products/${testProduct.id}`, {
        method: 'DELETE', headers
      });
      assert.equal(deleted.status, 204);
      assert.deepEqual(captured.query.filters, [['id', testProduct.id], ['user_id', testUser.id]]);
    });
  });
});
