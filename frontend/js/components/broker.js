// ── Broker ────────────────────────────────────────────────────
async function triggerRetry(type) {
  const entityId = document.getElementById(`br-${type}-entityid`).value.trim();
  const action = document.getElementById(`br-${type}-action`).value;
  const rawData = document.getElementById(`br-${type}-data`).value.trim();
  if (!entityId) return show('resp-broker', 'Ingresa un Entity ID.', true);
  let requestData;
  try { requestData = rawData ? JSON.parse(rawData) : {}; }
  catch { return show('resp-broker', 'El campo Request Data no es JSON válido.', true); }
  show('resp-broker', 'Enviando a Kafka...');
  const { ok, data } = await brokerReq('POST', `/retry/trigger/${type}`, { entityId, action, requestData });
  show('resp-broker', data, !ok);
}

async function listarJobs(type) {
  show('resp-broker', 'Cargando...');
  const { ok, data } = await brokerReq('GET', `/retry/${type}`);
  show('resp-broker', data, !ok);
}

async function getJobById() {
  const id = document.getElementById('br-job-id').value.trim();
  if (!id) return show('resp-broker', 'Ingresa un UUID de job.', true);
  show('resp-broker', 'Buscando...');
  const { ok, data } = await brokerReq('GET', `/retry/products/${id}`);
  show('resp-broker', data, !ok);
}


