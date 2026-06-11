// ── Tabs ──────────────────────────────────────────────────────
function showTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
  btn.classList.add('active');

  // Auto-cargar tabla al cambiar de tab
  if (tabId === 'productos') listarProductos();
  if (tabId === 'ordenes') listarOrdenes();
  if (tabId === 'pagos') listarPagos();
  if (tabId === 'envios') listarEnvios();
}

function showSubTab(sectionId, subTabId, btn) {
  const section = document.getElementById('tab-' + sectionId);
  section.querySelectorAll('.sub-tab-content').forEach(el => el.classList.remove('active'));
  section.querySelectorAll('.sub-tab').forEach(el => el.classList.remove('active'));
  
  if (subTabId) {
    document.getElementById(subTabId).classList.add('active');
  }
  btn.classList.add('active');
}


// ── Health check ──────────────────────────────────────────────
async function checkHealth() {
  const badge = document.getElementById('health-badge');
  try {
    const { ok, data } = await request('GET', '/actuator/health');
    if (ok && data.status === 'UP') {
      badge.innerHTML = "<i class='bx bx-check-circle'></i> Sistema UP";
      badge.className = 'badge badge-up';
    } else {
      badge.innerHTML = "<i class='bx bx-error'></i> " + (data.status || 'Desconocido');
      badge.className = 'badge badge-warn';
    }
  } catch {
    badge.innerHTML = "<i class='bx bx-x-circle'></i> Sin conexión";
    badge.className = 'badge badge-down';
  }
}


// ── Health Checks ─────────────────────────────────────────────
async function checkServiceHealth(service) {
  show('resp-health', 'Verificando...');
  if (service === 'broker') {
    const { ok, data } = await brokerReq('GET', '/actuator/health');
    show('resp-health', data, !ok);
  } else {
    const { ok, data } = await request('GET', '/actuator/health');
    show('resp-health', data, !ok);
  }
}

async function getEurekaApps() {
  show('resp-health', 'Cargando apps de Eureka...');
  try {
    const res = await fetch('/eureka-proxy/eureka/apps', { headers: { Accept: 'application/json' } });
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    show('resp-health', parsed, !res.ok);
  } catch (err) {
    show('resp-health', 'Error: ' + String(err), true);
  }
}


