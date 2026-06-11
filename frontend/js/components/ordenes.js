// ── Órdenes ───────────────────────────────────────────────────
async function crearOrden() {
  const userId = parseInt(document.getElementById('o-userid').value);
  const productId = document.getElementById('o-productid').value.trim();
  const totalAmount = parseFloat(document.getElementById('o-amount').value);
  const email = document.getElementById('o-email').value.trim();
  const status = document.getElementById('o-status').value;
  if (isNaN(userId) || !productId || isNaN(totalAmount) || !email) {
    return show('resp-ordenes', 'Completa todos los campos incluyendo el Product ID y Correo.', true);
  }
  // Leer la cantidad del formulario
  const qty = parseInt(document.getElementById('o-quantity').value) || 1;
  if (qty <= 0) {
    return show('resp-ordenes', 'La cantidad debe ser mayor a cero.', true);
  }
  show('resp-ordenes', 'Creando orden...');
  const { ok, data } = await request('POST', '/ordenes', { 
    userId: userId, 
    customerEmail: email,
    totalAmount: totalAmount, 
    status: status,
    products: [{ productId: productId, quantity: qty }]
  });
  show('resp-ordenes', data, !ok);
}

async function getOrden() {
  const id = document.getElementById('o-id').value.trim();
  if (!id) return show('resp-ordenes', 'Ingresa un ID.', true);
  show('resp-ordenes', 'Buscando...');
  const { ok, data } = await request('GET', '/ordenes/' + id);
  show('resp-ordenes', data, !ok);
}

async function getOrdenesPorUsuario() {
  const userId = document.getElementById('o-userid-buscar').value.trim();
  if (!userId) return show('resp-ordenes', 'Ingresa un User ID.', true);
  show('resp-ordenes', 'Buscando...');
  const { ok, data } = await request('GET', '/ordenes/usuario/' + userId);
  show('resp-ordenes', data, !ok);
}

async function actualizarEstado() {
  const id = document.getElementById('o-status-id').value.trim();
  const status = document.getElementById('o-nuevo-status').value;
  if (!id) return show('resp-ordenes', 'Ingresa el ID de la orden.', true);
  show('resp-ordenes', 'Actualizando estado...');
  const { ok, data } = await request('PUT', `/ordenes/${id}/status?status=${status}`);
  show('resp-ordenes', data, !ok);
}

async function listarOrdenes(sortByStatus = false) {
  show('resp-ordenes', 'Cargando órdenes...');
  const { ok, data } = await request('GET', '/ordenes');
  if (ok && Array.isArray(data)) {
    let processData = data.slice().reverse();
    
    if (sortByStatus) {
      processData.sort((a, b) => {
        const sA = a.status ? a.status.toUpperCase() : '';
        const sB = b.status ? b.status.toUpperCase() : '';
        if (sA < sB) return -1;
        if (sA > sB) return 1;
        return 0;
      });
    }

    if (processData.length === 0) return show('resp-ordenes', 'Sin resultados');
    const rows = processData.map(o => {
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
            ${o.products && o.products.length > 0 ? `<button class="btn-outline" style="padding: 4px 8px; font-size: 0.8rem;" onclick="saltarAProducto('${o.products[0].productId}')"><i class='bx bx-box'></i> Producto</button>` : ''}
            <button class="${pagosBtnClass}" style="padding: 4px 8px; font-size: 0.8rem;" onclick="saltarAPagos('${o.id}')"><i class='bx bx-credit-card'></i> ${pagosBtnText}</button>
          </div>
        </td>
      </tr>
      `;
    }).join('');
    const html = `<table><thead><tr><th>ID</th><th>User ID</th><th>Monto</th><th>Estatus</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table>`;
    const el = document.getElementById('resp-ordenes');
    el.className = 'response success';
    el.innerHTML = html;
  } else {
    show('resp-ordenes', data, !ok);
  }
}


