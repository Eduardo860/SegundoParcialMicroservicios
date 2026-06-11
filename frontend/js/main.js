// ── Inicialización ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  listarProductos();
  checkHealth();
  
  // Listeners para calcular el monto total de la orden automáticamente
  const qtyEl = document.getElementById('o-quantity');
  const prodIdEl = document.getElementById('o-productid');
  const amountEl = document.getElementById('o-amount');

  if (qtyEl && amountEl) {
    qtyEl.addEventListener('input', () => {
      const unitPrice = parseFloat(amountEl.dataset.unitPrice);
      if (!isNaN(unitPrice)) {
        const qty = parseInt(qtyEl.value) || 1;
        amountEl.value = (unitPrice * qty).toFixed(2);
      }
    });
  }

  if (prodIdEl && amountEl) {
    prodIdEl.addEventListener('blur', async () => {
      const productId = prodIdEl.value.trim();
      if (productId) {
        // Fetch product to get its price
        const { ok, data } = await request('GET', '/productos/' + productId);
        if (ok && data && data.price) {
          amountEl.dataset.unitPrice = data.price;
          const qty = parseInt(qtyEl.value) || 1;
          amountEl.value = (parseFloat(data.price) * qty).toFixed(2);
        }
      }
    });
  }
});

// ── Init ──────────────────────────────────────────────────────
checkHealth();
setInterval(checkHealth, 30000);


