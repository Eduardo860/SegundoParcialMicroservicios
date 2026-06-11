// ── Flujos E2E ────────────────────────────────────────────────
let e2eProductId = '';
let e2eOrderId = '';
let e2ePaymentId = '';

function updateE2eState() {
  document.getElementById('e2e-state').innerText = `Producto ID: ${e2eProductId || 'N/A'}
Orden ID: ${e2eOrderId || 'N/A'}
Pago ID: ${e2ePaymentId || 'N/A'}`;

  if (e2eOrderId) {
    document.getElementById('e2e-payment-order-id').value = e2eOrderId;
    document.getElementById('e2e-status-order-id').value = e2eOrderId;
  }
}

function resetE2eState() {
  e2eProductId = '';
  e2eOrderId = '';
  e2ePaymentId = '';

  document.getElementById('e2e-payment-order-id').value = '';
  document.getElementById('e2e-status-order-id').value = '';

  updateE2eState();
  show('resp-flujos', 'Variables y formularios reseteados.');
}

async function e2eCrearProducto() {
  const name = document.getElementById('e2e-p-name').value || 'Monitor Gamer';
  const price = parseFloat(document.getElementById('e2e-p-price').value) || 3500;
  const stock = parseInt(document.getElementById('e2e-p-stock').value) || 10;

  show('resp-flujos', `Creando producto "${name}"...`);
  const { ok, data } = await request('POST', '/productos', {
    name: name, description: "Demo E2E", price: price, stock: stock
  });
  if (ok && data && data.id) {
    e2eProductId = data.id;
    updateE2eState();
    show('resp-flujos', `Producto creado con ID: ${e2eProductId}\nStock inicial: ${stock}`);
  } else {
    show('resp-flujos', data, true);
  }
}

async function e2eCrearOrden() {
  if (!e2eProductId) return show('resp-flujos', 'Primero debes crear un producto (Paso 1).', true);

  const qty = parseInt(document.getElementById('e2e-o-qty').value) || 2;
  if (qty <= 0) {
    return show('resp-flujos', 'La cantidad solicitada debe ser mayor a cero.', true);
  }
  const price = parseFloat(document.getElementById('e2e-p-price').value) || 3500;
  const email = document.getElementById('e2e-customer-email').value || 'alumno@universidad.edu';
  const total = qty * price;

  show('resp-flujos', `Creando orden por ${qty} unidades (Total: $${total})...`);
  const { ok, data } = await request('POST', '/ordenes', {
    userId: 999, customerEmail: email, totalAmount: total, status: "PENDING",
    products: [{ productId: e2eProductId, quantity: qty }]
  });
  if (ok && data && data.id) {
    e2eOrderId = data.id;
    updateE2eState();
    show('resp-flujos', `Orden creada con ID: ${e2eOrderId}\nRevisa Kafka UI (inventory_update_events).`);
  } else {
    show('resp-flujos', data, true);
  }
}

async function e2eVerificarStock() {
  if (!e2eProductId) return show('resp-flujos', 'No hay Producto ID.', true);
  show('resp-flujos', 'Verificando stock...');
  const { ok, data } = await request('GET', '/productos/' + e2eProductId);
  if (ok && data) {
    show('resp-flujos', `Stock actual: ${data.stock} (Debe ser 8, ya que se restaron 2 en la orden)`);
  } else {
    show('resp-flujos', data, true);
  }
}

async function e2eProcesarPago(isTotal) {
  const orderId = document.getElementById('e2e-payment-order-id').value.trim();
  if (!orderId) return show('resp-flujos', 'Ingresa el ID de la orden a pagar.', true);

  const qty = parseInt(document.getElementById('e2e-o-qty').value) || 2;
  const price = parseFloat(document.getElementById('e2e-p-price').value) || 3500;
  const email = document.getElementById('e2e-customer-email').value || 'alumno@universidad.edu';

  let total = 0;
  if (isTotal) {
    total = qty * price;
    // Auto-completar el input para que el usuario vea cuánto se cobró
    document.getElementById('e2e-payment-amount').value = total;
  } else {
    const inputAmount = document.getElementById('e2e-payment-amount').value;
    if (!inputAmount) return show('resp-flujos', 'Ingresa el Monto a Pagar para el pago parcial.', true);
    total = parseFloat(inputAmount);
  }

  show('resp-flujos', `Procesando pago por $${total} para la orden ${orderId}...`);
  const { ok, data } = await request('POST', '/pagos/procesar', {
    orderId: orderId, amount: total, paymentMethod: "CREDIT_CARD", customerEmail: email
  });
  if (ok && data && data.id) {
    e2ePaymentId = data.id;
    updateE2eState();
    show('resp-flujos', `Pago procesado.\n1. Revisa MailHog para ver el correo de Pago Recibido.\n2. Espera 10 segundos y revisa MailHog para ver el correo de Confirmación de Orden.`);
  } else {
    show('resp-flujos', data, true);
  }
}

async function e2eVerPagosOrden() {
  const orderId = document.getElementById('e2e-payment-order-id').value.trim();
  if (!orderId) return show('resp-flujos', 'Ingresa el ID de la orden para buscar sus pagos.', true);

  show('resp-flujos', `Buscando pagos y calculando faltante para la orden ${orderId}...`);
  
  const [resOrd, resPag] = await Promise.all([
    request('GET', '/ordenes/' + orderId),
    request('GET', '/pagos/orden/' + orderId)
  ]);

  if (resPag.ok && Array.isArray(resPag.data)) {
    let orderTotal = resOrd.ok && resOrd.data ? resOrd.data.totalAmount : null;
    
    if (resPag.data.length === 0) {
      show('resp-flujos', `No hay pagos registrados para la orden ${orderId}. ${orderTotal ? `Falta por pagar: $${orderTotal}` : ''}`);
    } else {
      const totalPaid = resPag.data.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + (p.amount || 0), 0);
      let summary = `Encontrados ${resPag.data.length} pago(s).\n\n`;
      if (orderTotal !== null) {
        const falta = Math.max(0, orderTotal - totalPaid);
        summary += `Total de la Orden: $${orderTotal}\nTotal Pagado: $${totalPaid}\n`;
        summary += falta > 0 ? `👉 FALTA POR PAGAR: $${falta}\n\n` : `¡ORDEN PAGADA COMPLETAMENTE!\n\n`;
      } else {
        summary += `Total Pagado: $${totalPaid}\n\n`;
      }
      summary += JSON.stringify(resPag.data, null, 2);
      show('resp-flujos', summary);
    }
  } else {
    show('resp-flujos', resPag.data, true);
  }
}

async function e2eActualizarEstatus() {
  const orderId = document.getElementById('e2e-status-order-id').value.trim();
  if (!orderId) return show('resp-flujos', 'Ingresa el ID de la orden.', true);

  const newStatus = document.getElementById('e2e-new-status').value;

  show('resp-flujos', `Cambiando estatus a ${newStatus} para la orden ${orderId}...`);
  const { ok, data } = await request('PUT', `/ordenes/${orderId}/status?status=${newStatus}`);
  if (ok) {
    show('resp-flujos', `Estatus actualizado a ${newStatus}.\nRevisa MailHog para ver el correo de Cambio de Estado.`);
  } else {
    show('resp-flujos', data, true);
  }
}


// ── Navegación Cruzada ────────────────────────────────────────
function saltarAPagos(orderId) {
  // 1. Cambiar a la pestaña de pagos
  const tabBtn = Array.from(document.querySelectorAll('.tab')).find(el => el.textContent.includes('Pagos'));
  if (tabBtn) showTab('pagos', tabBtn);

  // 2. Abrir el sub-tab de buscar por orden
  const section = document.getElementById('tab-pagos');
  const subTabBtn = Array.from(section.querySelectorAll('.sub-tab')).find(el => el.textContent.includes('Pagos por Orden'));
  if (subTabBtn) showSubTab('pagos', 'sub-pg-search-order', subTabBtn);

  // 3. Rellenar input y ejecutar búsqueda
  document.getElementById('pg-orderid-buscar').value = orderId;
  getPagosPorOrden();
}

function saltarAOrden(orderId) {
  // 1. Cambiar a la pestaña de órdenes
  const tabBtn = Array.from(document.querySelectorAll('.tab')).find(el => el.textContent.includes('Órdenes'));
  if (tabBtn) showTab('ordenes', tabBtn);

  // 2. Abrir el sub-tab de buscar por ID
  const section = document.getElementById('tab-ordenes');
  const subTabBtn = Array.from(section.querySelectorAll('.sub-tab')).find(el => el.textContent.includes('Buscar (ID)'));
  if (subTabBtn) showSubTab('ordenes', 'sub-o-search-id', subTabBtn);

  // 3. Rellenar input y ejecutar búsqueda
  document.getElementById('o-id').value = orderId;
  getOrden();
}

function saltarAProducto(productId) {
  // 1. Cambiar a la pestaña de productos
  const tabBtn = Array.from(document.querySelectorAll('.tab')).find(el => el.textContent.includes('Productos'));
  if (tabBtn) showTab('productos', tabBtn);

  // 2. Abrir el sub-tab de buscar por ID
  const section = document.getElementById('tab-productos');
  const subTabBtn = Array.from(section.querySelectorAll('.sub-tab')).find(el => el.textContent.includes('Buscar (ID)'));
  if (subTabBtn) showSubTab('productos', 'sub-p-search-id', subTabBtn);

  // 3. Rellenar input y ejecutar búsqueda
  document.getElementById('p-id').value = productId;
  getProducto();
}

function prepararEdicionProducto(id, name, price, stock) {
  const tabBtn = Array.from(document.querySelectorAll('.tab')).find(el => el.textContent.includes('Productos'));
  if (tabBtn) showTab('productos', tabBtn);

  const section = document.getElementById('tab-productos');
  const subTabBtn = Array.from(section.querySelectorAll('.sub-tab')).find(el => el.textContent.includes('Actualizar'));
  if (subTabBtn) showSubTab('productos', 'sub-p-update', subTabBtn);

  document.getElementById('p-update-id').value = id;
  document.getElementById('p-update-name').value = name;
  document.getElementById('p-update-price').value = price;
  document.getElementById('p-update-stock').value = stock;
  
  document.getElementById('p-update-id').focus();
}

function prepararEdicionOrden(id, status) {
  const tabBtn = Array.from(document.querySelectorAll('.tab')).find(el => el.textContent.includes('Órdenes'));
  if (tabBtn) showTab('ordenes', tabBtn);

  const section = document.getElementById('tab-ordenes');
  const subTabBtn = Array.from(section.querySelectorAll('.sub-tab')).find(el => el.textContent.includes('Actualizar Estado'));
  if (subTabBtn) showSubTab('ordenes', 'sub-o-update', subTabBtn);

  document.getElementById('o-status-id').value = id;
  
  const sel = document.getElementById('o-nuevo-status');
  if (status) {
    for (let i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === status.toUpperCase()) {
        sel.selectedIndex = i;
        break;
      }
    }
  }
  
  document.getElementById('o-status-id').focus();
}

function prepararCrearPago(orderId, amount) {
  const tabBtn = Array.from(document.querySelectorAll('.tab')).find(el => el.textContent.includes('Pagos'));
  if (tabBtn) showTab('pagos', tabBtn);

  const section = document.getElementById('tab-pagos');
  const subTabBtn = Array.from(section.querySelectorAll('.sub-tab')).find(el => el.textContent.includes('Procesar Pago'));
  if (subTabBtn) showSubTab('pagos', 'sub-pg-create', subTabBtn);

  document.getElementById('pg-orderid').value = orderId;
  document.getElementById('pg-amount').value = amount || '';
  
  document.getElementById('pg-amount').focus();
}

function prepararCrearOrden(productId, price) {
  const tabBtn = Array.from(document.querySelectorAll('.tab')).find(el => el.textContent.includes('Órdenes'));
  if (tabBtn) showTab('ordenes', tabBtn);

  const section = document.getElementById('tab-ordenes');
  const subTabBtn = Array.from(section.querySelectorAll('.sub-tab')).find(el => el.textContent.includes('Crear'));
  if (subTabBtn) showSubTab('ordenes', 'sub-o-create', subTabBtn);

  document.getElementById('o-productid').value = productId;
  
  const amountEl = document.getElementById('o-amount');
  const qtyEl = document.getElementById('o-quantity');
  
  if (price) {
    amountEl.dataset.unitPrice = price;
    const qty = parseInt(qtyEl.value) || 1;
    amountEl.value = (parseFloat(price) * qty).toFixed(2);
  } else {
    amountEl.value = '';
    delete amountEl.dataset.unitPrice;
  }
  
  // Set default email if element exists
  const emailInput = document.getElementById('o-email');
  if(emailInput) emailInput.value = 'alumno@universidad.edu';
  
  // Hacemos focus en el User ID porque es el único campo manual faltante
  document.getElementById('o-userid').focus();
}

async function saltarAOrdenesDeProducto(productId) {
  // 1. Cambiar a la pestaña de órdenes
  const tabBtn = Array.from(document.querySelectorAll('.tab')).find(el => el.textContent.includes('Órdenes'));
  if (tabBtn) showTab('ordenes', tabBtn);

  // 2. Ocultar opciones y realizar búsqueda directa en memoria
  const section = document.getElementById('tab-ordenes');
  const hideBtn = Array.from(section.querySelectorAll('.sub-tab')).find(el => el.textContent.includes('Ocultar Opciones'));
  if (hideBtn) showSubTab('ordenes', '', hideBtn);

  show('resp-ordenes', 'Buscando órdenes...');
  const { ok, data } = await request('GET', '/ordenes');
  if (ok && Array.isArray(data)) {
    const matches = data.filter(o => o.products && o.products.some(p => p.productId === productId));
    if (matches.length === 0) {
      show('resp-ordenes', `No se encontraron órdenes para el producto ${productId}.`);
    } else {
      const summary = `<p class="hint"><i class='bx bx-info-circle'></i> Encontradas ${matches.length} orden(es) para el producto ${productId}</p>`;
      const rows = matches.map(o => {
        const isPending = (o.status && o.status.toUpperCase().includes('PEND'));
        const pagosBtnClass = isPending ? '' : 'btn-outline';
        const pagosBtnText = isPending ? 'Pagar' : 'Ver Pagos';
        return `
        <tr>
          <td>${escHtml(o.id)}</td>
          <td>${escHtml(o.userId)}</td>
          <td>$${escHtml(o.totalAmount)}</td>
          <td>${getStatusBadge(o.status)}</td>
          <td>${escHtml(o.createdAt || '')}</td>
          <td>
            <div style="display: flex; gap: 5px;">
              <button class="btn-outline" style="padding: 4px 8px; font-size: 0.8rem;" onclick="prepararEdicionOrden('${o.id}', '${o.status}')"><i class='bx bx-slider-alt'></i> Estatus</button>
              <button class="btn-outline" style="padding: 4px 8px; font-size: 0.8rem;" onclick="saltarAProducto('${productId}')"><i class='bx bx-box'></i> Producto</button>
              <button class="${pagosBtnClass}" style="padding: 4px 8px; font-size: 0.8rem;" onclick="saltarAPagos('${o.id}')"><i class='bx bx-credit-card'></i> ${pagosBtnText}</button>
            </div>
          </td>
        </tr>
        `;
      }).join('');
      const html = `<table><thead><tr><th>ID</th><th>User ID</th><th>Monto</th><th>Estatus</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table>`;
      const el = document.getElementById('resp-ordenes');
      el.className = 'response success';
      el.innerHTML = summary + html;
    }
  } else {
    show('resp-ordenes', data, true);
  }
}


