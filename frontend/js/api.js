// ── Constantes ────────────────────────────────────────────────
const API = '/api';
const BROKER = '/broker';


// ── Utilidades ────────────────────────────────────────────────
function escHtml(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Badge de estatus de colores (MongoDB style)
function getStatusBadge(status) {
  if (!status) return '';
  const s = status.toUpperCase();
  let bg = 'rgba(0,0,0,0.1)';
  let color = 'var(--text-main)';
  let border = 'rgba(0,0,0,0.2)';
  
  if (s.includes('PEND')) {
    bg = 'rgba(245, 158, 11, 0.15)'; color = 'var(--yellow)'; border = 'rgba(245, 158, 11, 0.3)';
  } else if (s.includes('COMPLETED') || s.includes('PAG') || s.includes('CONFIRM')) {
    bg = 'rgba(0, 237, 100, 0.15)'; color = '#008a3d'; border = 'rgba(0, 237, 100, 0.3)';
  } else if (s.includes('ENV') || s.includes('ENTREG')) {
    bg = 'rgba(0, 104, 74, 0.15)'; color = 'var(--primary)'; border = 'rgba(0, 104, 74, 0.3)';
  } else if (s.includes('CANCEL') || s.includes('REFUND') || s.includes('FAIL')) {
    bg = 'rgba(225, 29, 72, 0.15)'; color = 'var(--red)'; border = 'rgba(225, 29, 72, 0.3)';
  }
  
  return `<span style="background: ${bg}; color: ${color}; border: 1px solid ${border}; padding: 0.3rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; white-space: nowrap;"><i class='bx bxs-circle' style="font-size: 0.6rem; margin-right: 4px; vertical-align: middle;"></i>${escHtml(status)}</span>`;
}

function renderData(data) {
  if (Array.isArray(data)) {
    if (data.length === 0) return '<span class="empty">Sin resultados</span>';
    if (typeof data[0] === 'object' && data[0] !== null) {
      const keys = Object.keys(data[0]);
      const head = keys.map(k => `<th>${escHtml(k)}</th>`).join('');
      const rows = data.map(row =>
        '<tr>' + keys.map(k => {
          const v = row[k];
          const display = v !== null && typeof v === 'object' ? JSON.stringify(v) : (v ?? '—');
          return `<td>${escHtml(display)}</td>`;
        }).join('') + '</tr>'
      ).join('');
      return `<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
    }
    return data.map(s => `<div class="log-line">${escHtml(s)}</div>`).join('');
  }
  if (typeof data === 'object' && data !== null) {
    const rows = Object.entries(data).map(([k, v]) => {
      const display = v !== null && typeof v === 'object' ? JSON.stringify(v) : (v ?? '—');
      return `<tr><td class="key">${escHtml(k)}</td><td>${escHtml(display)}</td></tr>`;
    }).join('');
    return `<table class="obj-table"><tbody>${rows}</tbody></table>`;
  }
  return `<span>${escHtml(data)}</span>`;
}

function show(id, data, isError = false) {
  const el = document.getElementById(id);
  el.className = 'response ' + (isError ? 'error' : 'success');
  if (typeof data === 'string') {
    el.innerHTML = `<span>${escHtml(data)}</span>`;
  } else {
    el.innerHTML = renderData(data);
  }
}

async function request(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    // Desempaquetar wrapper { status, data } o { status, message }
    if (json && typeof json === 'object' && 'status' in json && ('data' in json || 'message' in json)) {
      const isOk = typeof json.status === 'number' ? json.status >= 200 && json.status < 300 : json.status === 'success';
      return { ok: isOk, data: isOk ? json.data : (json.message ?? json.data) };
    }
    return { ok: res.ok, data: json };
  } catch { return { ok: res.ok, data: text }; }
}


// ── Broker request helper ─────────────────────────────────────
async function brokerReq(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BROKER + path, opts);
  const text = await res.text();
  try { return { ok: res.ok, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, data: text }; }
}


