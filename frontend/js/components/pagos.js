// ── Pagos ─────────────────────────────────────────────────────
async function procesarPago() {
  const orderId = document.getElementById('pg-orderid').value.trim();
  const amount = parseFloat(document.getElementById('pg-amount').value);
  const paymentMethod = document.getElementById('pg-method').value;
  if (!orderId || isNaN(amount)) {
    return show('resp-pagos', 'Completa todos los campos.', true);
  }
  show('resp-pagos', 'Procesando pago...');
  const { ok, data } = await request('POST', '/pagos/procesar', { orderId, amount, paymentMethod });
  show('resp-pagos', data, !ok);
}

async function getPago() {
  const id = document.getElementById('pg-id').value.trim();
  if (!id) return show('resp-pagos', 'Ingresa un ID.', true);
  show('resp-pagos', 'Buscando...');
  const { ok, data } = await request('GET', '/pagos/' + id);
  show('resp-pagos', data, !ok);
}

async function getPagosPorOrden() {
  const orderId = document.getElementById('pg-orderid-buscar').value.trim();
  if (!orderId) return show('resp-pagos', 'Ingresa un Order ID.', true);
  
  show('resp-pagos', 'Buscando pagos y detalles de la orden...');
  
  const [resOrd, resPag] = await Promise.all([
    request('GET', '/ordenes/' + orderId),
    request('GET', '/pagos/orden/' + orderId)
  ]);

  if (resPag.ok && Array.isArray(resPag.data)) {
    let orderTotal = (resOrd.ok && resOrd.data) ? resOrd.data.totalAmount : null;
    
    if (resPag.data.length === 0) {
      const el = document.getElementById('resp-pagos');
      el.className = 'response success';
      let html = '';
      if (orderTotal !== null) {
        html = `<p>No hay pagos registrados para la orden ${orderId}. Faltan por pagar: $${orderTotal}</p>`;
        html += `<button class="btn-outline" style="margin-top: 10px; padding: 6px 12px; font-size: 0.85rem;" onclick="prepararCrearPago('${orderId}', '${orderTotal}')"><i class='bx bx-money'></i> Procesar Pago Faltante</button>`;
      } else {
        html = `<p>No hay pagos registrados para la orden ${orderId}.</p>`;
        html += `<button class="btn-outline" style="margin-top: 10px; padding: 6px 12px; font-size: 0.85rem;" onclick="prepararCrearPago('${orderId}', '')"><i class='bx bx-money'></i> Procesar Pago</button>`;
      }
      el.innerHTML = html;
    } else {
      const totalPaid = resPag.data.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + (p.amount || 0), 0);
      let summary = `<div style="background: var(--mongo-gray); border-left: 4px solid var(--primary); padding: 15px; border-radius: 4px; margin-bottom: 20px;">
        <h3 style="margin-top:0; margin-bottom:10px; color: var(--primary);"><i class='bx bx-check-shield'></i> Resumen de Cuenta</h3>`;
        
      if (orderTotal !== null) {
        const falta = Math.max(0, orderTotal - totalPaid);
        summary += `<p style="margin: 5px 0;"><strong>Total de la Orden:</strong> $${orderTotal}</p>`;
        summary += `<p style="margin: 5px 0;"><strong>Total Pagado:</strong> $${totalPaid}</p>`;
        if (falta > 0) {
          summary += `<p style="margin: 5px 0; color: var(--yellow);"><strong>Falta por pagar:</strong> $${falta}</p>`;
          summary += `<button class="btn-outline" style="margin-top: 10px; padding: 6px 12px; font-size: 0.85rem;" onclick="prepararCrearPago('${orderId}', '${falta}')"><i class='bx bx-money'></i> Procesar Pago Faltante</button>`;
        } else {
          summary += `<p style="margin: 5px 0; color: var(--mongo-forest); font-weight: bold;"><i class='bx bx-check-circle'></i> ¡Orden pagada en su totalidad!</p>`;
        }
      } else {
        summary += `<p>Total Pagado: $${totalPaid}</p>`;
      }
      summary += `</div>`;
      
      const rows = resPag.data.map(p => `
        <tr>
          <td>${escHtml(p.id)}</td>
          <td>${escHtml(p.orderId)}</td>
          <td>$${escHtml(p.amount)}</td>
          <td>${getStatusBadge(p.status)}</td>
          <td>${escHtml(p.paymentMethod)}</td>
          <td>
            <button class="btn-outline" style="padding: 4px 8px; font-size: 0.8rem;" onclick="saltarAOrden('${p.orderId}')"><i class='bx bx-receipt'></i> Ver Orden</button>
          </td>
        </tr>
      `).join('');
      const html = summary + `<table><thead><tr><th>ID</th><th>Order ID</th><th>Monto</th><th>Estatus</th><th>Método</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table>`;
      
      const el = document.getElementById('resp-pagos');
      el.className = 'response success';
      el.innerHTML = html;
    }
  } else {
    show('resp-pagos', resPag.data, true);
  }
}

async function reembolsarPago() {
  const id = document.getElementById('pg-reembolso-id').value.trim();
  if (!id) return show('resp-pagos', 'Ingresa un ID.', true);
  show('resp-pagos', 'Procesando reembolso...');
  const { ok, data } = await request('PUT', '/pagos/' + id + '/reembolso');
  show('resp-pagos', data, !ok);
}

async function listarPagos() {
  const el = document.getElementById('resp-pagos');
  el.className = 'response';
  el.innerHTML = '<p class="hint"><i class="bx bx-info-circle"></i> Utiliza las opciones de arriba para buscar pagos por ID o por Orden. El backend no tiene un endpoint para listar todos los pagos.</p>';
}


