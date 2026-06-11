// ── Logs ──────────────────────────────────────────────────────
async function cargarCloudWatchLogs() {
  const group = document.getElementById('log-group-select').value;
  const el = document.getElementById('resp-logs');
  el.className = 'response success';
  el.innerHTML = '<span>Cargando...</span>';
  try {
    const res = await fetch('/logs/events/' + group);
    const events = await res.json();
    if (!Array.isArray(events) || events.length === 0) {
      el.innerHTML = '<span class="empty">Sin eventos en este grupo. Los servicios usan logging local; revisa los logs del contenedor para ver la actividad.</span>';
      return;
    }
    const html = events.map(e => {
      const ts = e.timestamp ? new Date(e.timestamp).toLocaleString('es-MX') : '';
      return `<div class="log-event"><span class="log-ts">${escHtml(ts)}</span><span class="log-msg">${escHtml(e.message || '')}</span></div>`;
    }).join('');
    el.innerHTML = `<p class="hint">${events.length} evento(s) — ${escHtml(group)}</p>` + html;
  } catch (err) {
    el.className = 'response error';
    el.innerHTML = `<span>Error al cargar logs: ${escHtml(String(err))}</span>`;
  }
}



