// ── Envíos ────────────────────────────────────────────────────
async function listarEnvios() {
  show('resp-envios', 'Cargando...');
  try {
    const [resEnvios, resOrd, resProd] = await Promise.all([
      brokerReq('GET', '/ordenes/envios'),
      request('GET', '/ordenes'),
      request('GET', '/productos')
    ]);

    if (resEnvios.ok && resEnvios.data && resEnvios.data.data && Array.isArray(resEnvios.data.data)) {
      if (resEnvios.data.data.length === 0) return show('resp-envios', 'Sin envíos registrados');
      
      // Map orders and products
      const orderMap = {};
      if (resOrd.ok && Array.isArray(resOrd.data)) {
        resOrd.data.forEach(o => {
          if (o.products && o.products.length > 0) {
            orderMap[o.id] = { productId: o.products[0].productId, qty: o.products[0].quantity };
          } else {
            orderMap[o.id] = { productId: o.productId, qty: 1 };
          }
        });
      }
      
      const prodMap = {};
      if (resProd.ok && Array.isArray(resProd.data)) {
        resProd.data.forEach(p => {
          prodMap[p.id] = p.name;
        });
      }

      let processData = resEnvios.data.data.slice().reverse();

      const rows = processData.map(e => {
        const orderInfo = orderMap[e.orderId] || {};
        let prodName = '-';
        let prodQty = '-';
        if (orderInfo.productId) {
          prodName = prodMap[orderInfo.productId] || orderInfo.productId;
          prodQty = orderInfo.qty || 1;
        }

        return `
        <tr>
          <td>${escHtml(e.id)}</td>
          <td>${escHtml(e.orderId)}</td>
          <td>${escHtml(prodName)}</td>
          <td>${escHtml(prodQty)}</td>
          <td>${escHtml(e.customerEmail)}</td>
          <td>${escHtml(e.status)}</td>
          <td>${escHtml(e.nextRunAt || e.sentAt || '')}</td>
        </tr>
      `}).join('');
      const html = `<table><thead><tr><th>ID</th><th>Orden ID</th><th>Producto</th><th>Cant.</th><th>Email</th><th>Estatus</th><th>Fecha</th></tr></thead><tbody>${rows}</tbody></table>`;
      const el = document.getElementById('resp-envios');
      el.className = 'response success';
      el.innerHTML = html;
    } else {
      show('resp-envios', resEnvios.data.data || resEnvios.data, !resEnvios.ok);
    }
  } catch (err) {
    show('resp-envios', 'Error al cargar envíos: ' + err.message, true);
  }
}


