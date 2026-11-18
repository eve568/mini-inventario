(() => {
  const authPanel = document.querySelector('#auth-panel');
  const authForm = document.querySelector('#auth-form');
  const authTitle = document.querySelector('#auth-title');
  const authSubmit = document.querySelector('#auth-submit');
  const authModeToggle = document.querySelector('#auth-mode-toggle');
  const authMessage = document.querySelector('#auth-message');
  const authEmail = document.querySelector('#auth-email');
  const authPassword = document.querySelector('#auth-password');
  const signOutButton = document.querySelector('#sign-out-button');
  const sessionEmail = document.querySelector('#session-email');
  const syncBadge = document.querySelector('#sync-badge');
  const intro = document.querySelector('#app-intro');
  const workspace = document.querySelector('#workspace');
  const form = document.querySelector('#product-form');
  const list = document.querySelector('#product-list');
  const empty = document.querySelector('#empty-state');
  const count = document.querySelector('#product-count');
  const filter = document.querySelector('#low-stock-filter');
  const error = document.querySelector('#form-error');
  const status = document.querySelector('#status-message');
  const cancel = document.querySelector('#cancel-button');
  const submit = document.querySelector('#submit-button');
  const fields = {
    name: document.querySelector('#name'),
    sku: document.querySelector('#sku'),
    quantity: document.querySelector('#quantity'),
    minimum_quantity: document.querySelector('#minimum-quantity')
  };

  let authMode = 'sign-in';
  let session = null;
  let products = [];
  let activeUserId = null;
  let loadedUserId = null;
  let loadingUserId = null;
  let sessionGeneration = 0;
  let editingId = null;

  const isLow = (product) => product.quantity < product.minimum_quantity;

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function render() {
    const visible = filter.checked ? products.filter(isLow) : products;
    count.textContent = String(products.length);
    list.replaceChildren();

    for (const product of visible) {
      const card = makeElement('article', `product-card${isLow(product) ? ' is-low' : ''}`);
      const info = makeElement('div', 'product-info');
      const titleLine = makeElement('div', 'product-title-line');
      titleLine.append(makeElement('h3', '', product.name));
      if (isLow(product)) titleLine.append(makeElement('span', 'low-badge', 'Existencias bajas'));
      info.append(titleLine, makeElement('p', 'sku-line', `SKU · ${product.sku}`));

      const quantity = makeElement('div', 'quantity-block');
      quantity.append(makeElement('strong', '', String(product.quantity)));
      quantity.append(makeElement('span', '', `mín. ${product.minimum_quantity}`));

      const actions = makeElement('div', 'product-actions');
      const editButton = makeElement('button', 'icon-button', 'Editar');
      editButton.type = 'button';
      editButton.setAttribute('aria-label', `Editar ${product.name}`);
      editButton.addEventListener('click', () => beginEdit(product));
      actions.append(editButton);
      card.append(info, quantity, actions);
      list.append(card);
    }

    empty.hidden = visible.length > 0;
    if (filter.checked && products.length > 0 && visible.length === 0) {
      document.querySelector('#empty-title').textContent = 'Todo en buen nivel';
      document.querySelector('#empty-copy').textContent = 'No hay productos con existencias bajas.';
    } else {
      document.querySelector('#empty-title').textContent = 'Aún no hay productos';
      document.querySelector('#empty-copy').textContent = 'Agrega tu primer producto para empezar a organizar tus existencias.';
    }
  }

  function beginEdit(product) {
    editingId = product.id;
    for (const key of Object.keys(fields)) fields[key].value = product[key];
    document.querySelector('#form-title').textContent = 'Editar producto';
    document.querySelector('#form-eyebrow').textContent = 'ACTUALIZA TU CATÁLOGO';
    document.querySelector('#form-icon').textContent = '✎';
    submit.innerHTML = '<span aria-hidden="true">✓</span> Guardar cambios';
    cancel.hidden = false;
    error.hidden = true;
    fields.name.focus();
  }

  function resetForm() {
    editingId = null;
    form.reset();
    document.querySelector('#form-title').textContent = 'Agregar producto';
    document.querySelector('#form-eyebrow').textContent = 'TU CATÁLOGO';
    document.querySelector('#form-icon').textContent = '＋';
    submit.innerHTML = '<span aria-hidden="true">＋</span> Agregar producto';
    cancel.hidden = true;
    error.hidden = true;
  }

  function setAuthMessage(message, isError = false) {
    authMessage.textContent = message;
    authMessage.classList.toggle('is-error', isError);
  }

  async function loadProducts(userId, generation) {
    loadingUserId = userId;
    status.textContent = 'Cargando productos…';
    status.hidden = false;
    try {
      const result = await window.Productos.list();
      if (generation !== sessionGeneration || activeUserId !== userId) return;
      products = result;
      loadedUserId = userId;
      status.textContent = '';
      status.hidden = true;
      render();
    } catch (cause) {
      if (generation !== sessionGeneration || activeUserId !== userId) return;
      status.textContent = cause.message || 'No se pudieron cargar los productos.';
      status.hidden = false;
      if (cause.status === 401) {
        const auth = await window.AuthReady;
        await auth.signOut().catch(() => {});
        await applySession(null);
      }
    } finally {
      if (loadingUserId === userId) loadingUserId = null;
    }
  }

  async function applySession(nextSession) {
    session = nextSession;
    const userId = nextSession?.user?.id || null;
    if (!userId) {
      if (activeUserId !== null) sessionGeneration += 1;
      activeUserId = null;
      loadedUserId = null;
      loadingUserId = null;
      products = [];
      authPanel.hidden = false;
      intro.hidden = true;
      workspace.hidden = true;
      signOutButton.hidden = true;
      sessionEmail.hidden = true;
      syncBadge.hidden = true;
      status.textContent = '';
      status.hidden = true;
      filter.checked = false;
      resetForm();
      render();
      return;
    }

    authPanel.hidden = true;
    intro.hidden = false;
    workspace.hidden = false;
    signOutButton.hidden = false;
    sessionEmail.hidden = false;
    sessionEmail.textContent = nextSession.user.email || 'Sesión activa';
    syncBadge.hidden = false;
    setAuthMessage('');

    if (activeUserId === userId && (loadedUserId === userId || loadingUserId === userId)) return;
    if (activeUserId !== userId) {
      products = [];
      resetForm();
      activeUserId = userId;
    }
    const generation = ++sessionGeneration;
    render();
    await loadProducts(userId, generation);
  }

  authModeToggle.addEventListener('click', () => {
    authMode = authMode === 'sign-in' ? 'sign-up' : 'sign-in';
    const registering = authMode === 'sign-up';
    authTitle.innerHTML = registering ? 'Crea tu cuenta <span>para comenzar.</span>' : 'Inicia sesión <span>para continuar.</span>';
    authSubmit.textContent = registering ? 'Crear cuenta' : 'Iniciar sesión';
    authModeToggle.textContent = registering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate';
    authPassword.autocomplete = registering ? 'new-password' : 'current-password';
    setAuthMessage('');
  });

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!authForm.reportValidity()) return;
    authSubmit.disabled = true;
    setAuthMessage(authMode === 'sign-up' ? 'Creando tu cuenta…' : 'Iniciando sesión…');
    try {
      const auth = await window.AuthReady;
      const result = authMode === 'sign-up'
        ? await auth.signUp(authEmail.value.trim(), authPassword.value)
        : await auth.signIn(authEmail.value.trim(), authPassword.value);
      if (result.error) throw result.error;
      if (authMode === 'sign-up' && !result.data.session) {
        setAuthMessage('Cuenta creada. Revisa tu correo y confirma la dirección para iniciar sesión.');
      } else if (result.data.session) {
        await applySession(result.data.session);
      }
    } catch (cause) {
      const message = authMode === 'sign-in'
        ? 'No se pudo iniciar sesión. Revisa el correo y la contraseña.'
        : (cause.message || 'No se pudo crear la cuenta.');
      setAuthMessage(message, true);
    } finally {
      authSubmit.disabled = false;
    }
  });

  signOutButton.addEventListener('click', async () => {
    signOutButton.disabled = true;
    try {
      const auth = await window.AuthReady;
      const { error: signOutError } = await auth.signOut();
      if (signOutError) throw signOutError;
      await applySession(null);
      setAuthMessage('Sesión cerrada.');
    } catch {
      status.textContent = 'No se pudo cerrar la sesión. Inténtalo de nuevo.';
      status.hidden = false;
    } finally {
      signOutButton.disabled = false;
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submit.disabled = true;
    try {
      const product = await window.Productos.save({
        name: fields.name.value,
        sku: fields.sku.value,
        quantity: fields.quantity.value,
        minimum_quantity: fields.minimum_quantity.value
      }, editingId);
      if (editingId) {
        products = products.map((item) => item.id === product.id ? product : item);
      } else {
        products = [...products, product];
      }
      resetForm();
      status.textContent = 'Producto guardado.';
      status.hidden = false;
      render();
    } catch (cause) {
      error.textContent = cause.message || 'No se pudo guardar el producto.';
      error.hidden = false;
      if (cause.status === 401) {
        const auth = await window.AuthReady;
        await auth.signOut().catch(() => {});
        await applySession(null);
      }
    } finally {
      submit.disabled = false;
    }
  });

  cancel.addEventListener('click', resetForm);
  filter.addEventListener('change', render);

  (async () => {
    try {
      const auth = await window.AuthReady;
      auth.onAuthStateChange((_event, nextSession) => {
        queueMicrotask(() => { void applySession(nextSession); });
      });
      const { data, error: sessionError } = await auth.getSession();
      if (sessionError) throw sessionError;
      await applySession(data.session);
    } catch (cause) {
      setAuthMessage(cause.message || 'No se pudo conectar con el servicio de autenticación.', true);
      authSubmit.disabled = true;
    }
  })();
})();
