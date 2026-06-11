// ── Productos ─────────────────────────────────────────────────
async function crearProducto() {
  const name = document.getElementById('p-name').value.trim();
  const description = document.getElementById('p-desc').value.trim();
  const price = parseFloat(document.getElementById('p-price').value);
  const stock = parseInt(document.getElementById('p-stock').value);
  if (!name || !description || isNaN(price) || isNaN(stock)) {
    return show('resp-productos', 'Completa todos los campos.', true);
  }
  if (stock <= 0) {
    return show('resp-productos', 'El stock debe ser mayor a cero.', true);
  }
  show('resp-productos', 'Creando producto...');
  const { ok, data } = await request('POST', '/productos', { name, description, price, stock });
  show('resp-productos', data, !ok);
}

async function listarProductos() {
  show('resp-productos', 'Cargando...');
  
  const [resProd, resOrd] = await Promise.all([
    request('GET', '/productos'),
    request('GET', '/ordenes')
  ]);

  if (resProd.ok && Array.isArray(resProd.data)) {
    if (resProd.data.length === 0) return show('resp-productos', 'Sin resultados');
    
    // Mostrar los más recientes primero
    resProd.data.reverse();

    // Calcular productos que tienen órdenes
    let productIdsWithOrders = new Set();
    if (resOrd.ok && Array.isArray(resOrd.data)) {
      resOrd.data.forEach(o => {
        if (o.products) {
          o.products.forEach(p => productIdsWithOrders.add(p.productId));
        }
      });
    }

    const rows = resProd.data.map(p => {
      const hasOrder = productIdsWithOrders.has(p.id);
      
      const btnCrear = `<button class="btn-outline" style="padding: 4px 8px; font-size: 0.8rem;" onclick="prepararCrearOrden('${p.id}', '${p.price}')"><i class='bx bx-cart-add'></i> Crear Orden</button>`;
      const btnVer = hasOrder ? `<button class="" style="padding: 4px 8px; font-size: 0.8rem;" onclick="saltarAOrdenesDeProducto('${p.id}')"><i class='bx bx-receipt'></i> Ver Órdenes</button>` : '';
      
      return `
      <tr>
        <td>${escHtml(p.name)}</td>
        <td>${escHtml(p.stock)}</td>
        <td>$${escHtml(p.price)}</td>
        <td>
          <div style="display: flex; gap: 5px;">
            <button class="btn-outline" style="padding: 4px 8px; font-size: 0.8rem;" onclick="prepararEdicionProducto('${p.id}', decodeURIComponent('${encodeURIComponent(p.name)}'), '${p.price}', '${p.stock}')"><i class='bx bx-edit'></i> Editar</button>
            <button class="btn-danger" style="padding: 4px 8px; font-size: 0.8rem;" onclick="document.getElementById('p-delete-id').value='${p.id}'; eliminarProducto()"><i class='bx bx-trash'></i> Eliminar</button>
            ${btnCrear}
            ${btnVer}
          </div>
        </td>
      </tr>
      `;
    }).join('');
    
    const html = `<table><thead><tr><th>Nombre</th><th>Stock</th><th>Precio</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table>`;
    const el = document.getElementById('resp-productos');
    el.className = 'response success';
    el.innerHTML = html;
  } else {
    show('resp-productos', resProd.data, !resProd.ok);
  }
}

async function getProducto() {
  const id = document.getElementById('p-id').value.trim();
  if (!id) return show('resp-productos', 'Ingresa un ID.', true);
  show('resp-productos', 'Buscando...');
  const { ok, data } = await request('GET', '/productos/' + id);
  show('resp-productos', data, !ok);
}

async function buscarPorNombre() {
  const filtro = document.getElementById('p-nombre').value.trim().toLowerCase();
  if (!filtro) return show('resp-productos', 'Ingresa un nombre a buscar.', true);
  show('resp-productos', 'Buscando...');
  const { ok, data } = await request('GET', '/productos');
  if (!ok) return show('resp-productos', data, true);
  const matches = Array.isArray(data)
    ? data.filter(p => p.name && p.name.toLowerCase().includes(filtro))
    : [];
  if (matches.length === 0) {
    show('resp-productos', `Sin resultados para "${filtro}"`);
  } else {
    const el = document.getElementById('resp-productos');
    el.className = 'response success';
    el.innerHTML = `<p class="hint">${matches.length} resultado(s) para "<strong>${escHtml(filtro)}</strong>"</p>` + renderData(matches);
  }
}

async function actualizarProducto() {
  const id = document.getElementById('p-update-id').value.trim();
  const name = document.getElementById('p-update-name').value.trim();
  const description = document.getElementById('p-update-desc').value.trim();
  const price = parseFloat(document.getElementById('p-update-price').value);
  const stock = parseInt(document.getElementById('p-update-stock').value);
  if (!id || !name || !description || isNaN(price) || isNaN(stock)) {
    return show('resp-productos', 'Completa todos los campos incluyendo el ID.', true);
  }
  show('resp-productos', 'Actualizando producto...');
  const { ok, data } = await request('PUT', '/productos/' + id, { name, description, price, stock });
  show('resp-productos', data, !ok);
}

async function eliminarProducto() {
  const id = document.getElementById('p-delete-id').value.trim();
  if (!id) return show('resp-productos', 'Ingresa un ID.', true);
  show('resp-productos', 'Eliminando producto...');
  const { ok, data } = await request('DELETE', '/productos/' + id);
  show('resp-productos', data, !ok);
}


