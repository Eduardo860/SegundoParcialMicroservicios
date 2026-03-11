const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { exec } = require('child_process');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

// Proxy /api/* → Gateway
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  pathRewrite: { '^/api': '' }
}));

// ── Log groups y contenedores permitidos (evita command injection) ──
const LOG_GROUPS = [
  'producto-log-group', 'ordenes-log-group', 'pagos-log-group',
  'apigateway-log-group', 'eureka-log-group'
];
const CONTAINERS = [
  'infra-productservice', 'infra-orderservice', 'infra-paymentservice',
  'infra-apigateway', 'infra-eureka-server'
];

function awsCli(args) {
  return new Promise(resolve => {
    exec(`aws ${args} --endpoint-url http://localhost:4566 --region us-east-1 --output json 2>&1`,
      (_, stdout) => { try { resolve(JSON.parse(stdout)); } catch { resolve(null); } }
    );
  });
}

// GET /logs/groups → lista de log groups en CloudWatch
app.get('/logs/groups', async (req, res) => {
  const data = await awsCli('logs describe-log-groups');
  res.json(data?.logGroups || []);
});

// GET /logs/events/:group → últimos eventos del log group
app.get('/logs/events/:group', async (req, res) => {
  const group = req.params.group;
  if (!LOG_GROUPS.includes(group)) return res.status(400).json({ error: 'Grupo no válido' });

  const sd = await awsCli(`logs describe-log-streams --log-group-name "${group}" --order-by LastEventTime --descending`);
  const streams = sd?.logStreams || [];
  if (streams.length === 0) return res.json([]);

  let all = [];
  for (const s of streams.slice(0, 3)) {
    const d = await awsCli(`logs get-log-events --log-group-name "${group}" --log-stream-name "${s.logStreamName}" --limit 30`);
    all = all.concat((d?.events || []).map(e => ({ ...e, stream: s.logStreamName })));
  }
  all.sort((a, b) => b.timestamp - a.timestamp);
  res.json(all.slice(0, 50));
});

// GET /logs/container/:name → últimas 80 líneas del contenedor Docker
app.get('/logs/container/:name', (req, res) => {
  const name = req.params.name;
  if (!CONTAINERS.includes(name)) return res.status(400).json({ error: 'Contenedor no válido' });
  exec(`docker logs ${name} --tail 80 2>&1`, (_, stdout) => {
    res.json((stdout || 'Sin output').split('\n').filter(Boolean));
  });
});

app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.listen(3000, () => console.log('🚀 Frontend en http://localhost:3000'));
