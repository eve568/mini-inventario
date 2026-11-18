(() => {
  const form = document.querySelector('#product-form');
  const list = document.querySelector('#product-list');
  const empty = document.querySelector('#empty-state');
  const count = document.querySelector('#product-count');
  const filter = document.querySelector('#low-stock-filter');
  const error = document.querySelector('#form-error');
  const cancel = document.querySelector('#cancel-button');
  const submit = document.querySelector('#submit-button');
  const fields = {
    name: document.querySelector('#name'),
    sku: document.querySelector('#sku'),
    quantity: document.querySelector('#quantity'),
    minimum_quantity: document.querySelector('#minimum-quantity')
  };
  let editingId = null;

  const isLow = (product) => product.quantity < product.minimum_quantity;

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function render() {
    const products = window.Productos.list();
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

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      window.Productos.save({
        name: fields.name.value,
        sku: fields.sku.value,
        quantity: fields.quantity.value,
        minimum_quantity: fields.minimum_quantity.value
      }, editingId);
      resetForm();
      render();
    } catch (cause) {
      error.textContent = cause.message || 'No se pudo guardar el producto.';
      error.hidden = false;
    }
  });

  cancel.addEventListener('click', resetForm);
  filter.addEventListener('change', render);
  render();
})();
