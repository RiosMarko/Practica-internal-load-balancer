const express = require('express');
const os = require('os');
const mysql = require('mysql2/promise');

const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST || 'mysql-lb';
const DB_PORT = process.env.DB_PORT || '6446';
const DB_USER = process.env.DB_USER || 'appuser';
const DB_PASSWORD = process.env.DB_PASSWORD || 'apppass';
const DB_DATABASE = process.env.DB_DATABASE || 'appdb';

const app = express();

function getPool() {
  return mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', hostname: os.hostname() });
});

app.get('/', async (_req, res) => {
  const hostname = os.hostname();
  let pool;
  try {
    pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, nombre, status, user, password FROM usuarios ORDER BY id'
    );
    res.json({ hostname, usuarios: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ hostname, error: err.message });
  } finally {
    if (pool) await pool.end();
  }
});

app.get('/usuarios', async (req, res) => {
  const hostname = os.hostname();
  const q = (req.query.q || '').trim().toLowerCase(); 
  let pool;
  try {
    pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, nombre, status, user, password FROM usuarios ORDER BY id'
    );

    const filtered = !q
      ? rows
      : rows.filter(r =>
          String(r.id).includes(q) ||
          (r.nombre || '').toLowerCase().includes(q) ||
          (r.status || '').toLowerCase().includes(q) ||
          (r.user || '').toLowerCase().includes(q)
        );

    const html = `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Usuarios | Host: ${hostname}</title>
<style>
  :root { --bg:#0b1220; --card:#141c2f; --txt:#e6e8ec; --muted:#9aa4b2; --acc:#4f8cff; --ok:#22c55e; --warn:#f59e0b; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial; background: var(--bg); color: var(--txt); }
  .container { max-width: 1000px; margin: 32px auto; padding: 0 16px; }
  .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
  .title { font-size: 22px; font-weight: 700; }
  .hostname { font-size: 12px; color: var(--muted); }
  .card { background: var(--card); border: 1px solid #1f2a44; border-radius: 16px; padding: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.3); }
  .controls { display:flex; gap:8px; align-items:center; margin-bottom: 12px; flex-wrap:wrap; }
  .search { flex:1; min-width: 220px; }
  input[type="text"] { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #2a3553; background:#0f172a; color: var(--txt); }
  .btn { appearance:none; border:1px solid #2a3553; background:#0f172a; color:var(--txt); padding:10px 14px; border-radius:10px; cursor:pointer; }
  .btn:hover { border-color:#3a4970; }
  table { width:100%; border-collapse: collapse; }
  th, td { padding: 12px; text-align: left; border-bottom: 1px solid #1f2a44; font-size: 14px; }
  th { color: var(--muted); font-weight:600; }
  .badge { display:inline-flex; align-items:center; gap:6px; padding: 4px 10px; border-radius: 999px; font-size: 12px; border: 1px solid #273356; background:#0f172a; }
  .dot { width:8px; height:8px; border-radius:50%; }
  .ok { color:#70ffb2; border-color:#1d5c40; }
  .ok .dot { background: var(--ok); }
  .warn { color:#ffd68a; border-color:#5e481b; }
  .warn .dot { background: var(--warn); }
  .muted { color: var(--muted); }
  .footer { margin-top: 12px; display:flex; justify-content:space-between; align-items:center; color:var(--muted); font-size:12px; }
  .jsonlink { color: var(--acc); text-decoration: none; }
  .jsonlink:hover { text-decoration: underline; }
  .nowrap { white-space: nowrap; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="title">Usuarios del sistema</div>
        <div class="hostname">Atendido por: <span class="nowrap">${hostname}</span></div>
      </div>
      <a class="jsonlink" href="/">Ver JSON</a>
    </div>

    <div class="card">
      <form class="controls" method="get" action="/usuarios">
        <input class="search" type="text" name="q" placeholder="Buscar por id, nombre, status o user..." value="${q.replace(/"/g,'&quot;')}"/>
        <button class="btn" type="submit">Buscar</button>
        <a class="btn" href="/usuarios">Limpiar</a>
        <button class="btn" type="button" onclick="location.reload()">Refrescar</button>
      </form>

      <div style="overflow:auto;">
        <table>
          <thead>
            <tr>
              <th style="width:80px;">ID</th>
              <th>Nombre</th>
              <th style="width:120px;">Status</th>
              <th style="width:180px;">Usuario</th>
              <th style="width:180px;">Password</th>
            </tr>
          </thead>
          <tbody>
            ${
              filtered.length
                ? filtered.map(u => `
                  <tr>
                    <td>${u.id}</td>
                    <td>${escapeHtml(u.nombre)}</td>
                    <td>
                      <span class="badge ${u.status === 'activo' ? 'ok' : 'warn'}">
                        <span class="dot"></span> ${escapeHtml(u.status)}
                      </span>
                    </td>
                    <td>${escapeHtml(u.user)}</td>
                    <td class="muted">${escapeHtml(u.password)}</td>
                  </tr>
                `).join('')
                : `<tr><td colspan="5" class="muted">Sin resultados</td></tr>`
            }
          </tbody>
        </table>
      </div>

      <div class="footer">
        <div>${filtered.length} resultado(s)</div>
        <div>DB via LB interno: <span class="nowrap">${DB_HOST}:${DB_PORT}</span></div>
      </div>
    </div>
  </div>
</body>
</html>
`;

    res.status(200).set('content-type','text/html; charset=utf-8').send(html);

  } catch (err) {
    console.error(err);
    res
      .status(500)
      .set('content-type','text/html; charset=utf-8')
      .send(`<pre style="color:#e11d48">Error: ${escapeHtml(err.message)}</pre>`);
  } finally {
    if (pool) await pool.end();
  }
});

// util: escape HTML
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

app.listen(PORT, () => {
  console.log(`App escuchando en puerto ${PORT}`);
});
