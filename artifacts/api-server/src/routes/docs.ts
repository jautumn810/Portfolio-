import { Router, type IRouter } from "express";
import yaml from "js-yaml";
import fs from "node:fs";
import path from "node:path";

const router: IRouter = Router();

const specPath = path.resolve(__dirname, "../../../lib/api-spec/openapi.yaml");
const specDoc = yaml.load(fs.readFileSync(specPath, "utf8")) as Record<string, unknown>;

// Serve the spec as JSON so the UI can fetch it
router.get("/docs/spec.json", (_req, res) => {
  res.json(specDoc);
});

// Self-contained Swagger UI page — loads assets from CDN, no static file serving needed
router.get("/docs", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  // Relax CSP for this developer tool page only
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' cdn.jsdelivr.net 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' cdn.jsdelivr.net",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "font-src 'self' cdn.jsdelivr.net",
    ].join("; "),
  );
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TruckLink API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #0f1117; min-height: 100vh; }

    /* Topbar */
    .swagger-ui .topbar { background: #111827 !important; border-bottom: 2px solid #1f2937; padding: 8px 20px; }
    .swagger-ui .topbar-wrapper { align-items: center; gap: 12px; }
    .swagger-ui .topbar-wrapper img { display: none; }
    .swagger-ui .topbar-wrapper .link::after {
      content: '🚛  TruckLink API';
      color: #dc2626;
      font-size: 1.25rem;
      font-weight: 900;
      letter-spacing: 0.04em;
    }
    .swagger-ui .topbar-wrapper .link span { display: none; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }

    /* Main background */
    .swagger-ui { background: #0f1117; color: #f1f5f9; }
    .swagger-ui .wrapper { background: #0f1117; }
    .swagger-ui .information-container { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 24px; margin-bottom: 20px; }
    .swagger-ui .info h2.title { color: #f1f5f9; }
    .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info table td { color: #94a3b8; }
    .swagger-ui .info a { color: #dc2626; }

    /* Scheme container */
    .swagger-ui .scheme-container { background: #111827 !important; border: 1px solid #1f2937; border-radius: 8px; box-shadow: none; padding: 16px; }
    .swagger-ui .schemes label { color: #94a3b8 !important; }

    /* Tags */
    .swagger-ui .opblock-tag { color: #f1f5f9 !important; border-bottom: 1px solid #1f2937; font-size: 1rem; }
    .swagger-ui .opblock-tag:hover { background: #111827; border-radius: 6px; }
    .swagger-ui .opblock-tag-section { margin-bottom: 8px; }

    /* Operation blocks */
    .swagger-ui .opblock { border-radius: 8px !important; margin-bottom: 4px; border: 1px solid #1f2937; }
    .swagger-ui .opblock .opblock-summary { border-radius: 8px !important; }
    .swagger-ui .opblock.opblock-get { background: rgba(59,130,246,0.07); border-color: rgba(59,130,246,0.3); }
    .swagger-ui .opblock.opblock-post { background: rgba(34,197,94,0.07); border-color: rgba(34,197,94,0.3); }
    .swagger-ui .opblock.opblock-patch { background: rgba(245,158,11,0.07); border-color: rgba(245,158,11,0.3); }
    .swagger-ui .opblock.opblock-delete { background: rgba(239,68,68,0.07); border-color: rgba(239,68,68,0.3); }
    .swagger-ui .opblock-summary-description { color: #cbd5e1 !important; }
    .swagger-ui .opblock-summary-path, .swagger-ui .opblock-summary-path__deprecated { color: #e2e8f0 !important; }

    /* Expanded block body */
    .swagger-ui .opblock-body { background: #111827; }
    .swagger-ui .opblock-section-header { background: #0f1117; border-top: 1px solid #1f2937; }
    .swagger-ui .opblock-section-header label { color: #94a3b8 !important; }
    .swagger-ui .opblock-section-header h4 { color: #f1f5f9; }
    .swagger-ui table thead tr td, .swagger-ui table thead tr th { color: #94a3b8 !important; border-bottom: 1px solid #1f2937; }
    .swagger-ui .parameter__name { color: #f1f5f9; }
    .swagger-ui .parameter__in { color: #94a3b8; }
    .swagger-ui .parameter__type { color: #60a5fa; }
    .swagger-ui .model-hint { color: #94a3b8; }
    .swagger-ui .tab li { color: #94a3b8; }
    .swagger-ui .tab li.active { color: #f1f5f9 !important; }
    .swagger-ui textarea { background: #0f1117 !important; color: #f1f5f9 !important; border: 1px solid #1f2937 !important; border-radius: 6px; font-family: monospace; }
    .swagger-ui input[type="text"], .swagger-ui input[type="password"] { background: #0f1117 !important; color: #f1f5f9 !important; border: 1px solid #1f2937 !important; border-radius: 6px; }
    .swagger-ui select { background: #0f1117 !important; color: #f1f5f9 !important; border: 1px solid #1f2937 !important; }

    /* Buttons */
    .swagger-ui .btn { border-radius: 6px; font-weight: 600; }
    .swagger-ui .btn.execute { background: #dc2626 !important; border-color: #dc2626 !important; color: #fff !important; }
    .swagger-ui .btn.execute:hover { background: #b91c1c !important; }
    .swagger-ui .btn.authorize { border-color: #dc2626 !important; color: #dc2626 !important; }
    .swagger-ui .btn.authorize svg { fill: #dc2626 !important; }
    .swagger-ui .btn.authorize.locked { background-color: #dc2626 !important; color: #fff !important; }
    .swagger-ui .btn.cancel { border-color: #4b5563 !important; color: #9ca3af !important; }
    .swagger-ui .try-out__btn { border-color: #dc2626 !important; color: #dc2626 !important; }
    .swagger-ui .try-out__btn.cancel { border-color: #4b5563 !important; color: #9ca3af !important; }

    /* Responses */
    .swagger-ui .responses-inner { background: #0f1117; }
    .swagger-ui .response-col_status { color: #22c55e; font-weight: 700; }
    .swagger-ui .response .microlight { background: #111827 !important; border-radius: 6px; padding: 12px; color: #f1f5f9; }
    .swagger-ui .highlight-code { background: #111827 !important; }
    .swagger-ui .microlight { color: #e2e8f0; }

    /* Models */
    .swagger-ui section.models { background: #111827; border: 1px solid #1f2937; border-radius: 8px; }
    .swagger-ui section.models h4 { color: #f1f5f9; }
    .swagger-ui .model-container { background: #0f1117 !important; border-radius: 6px; }
    .swagger-ui .model-box { background: #0f1117 !important; }
    .swagger-ui .model { color: #f1f5f9; }
    .swagger-ui .prop-type { color: #60a5fa; }
    .swagger-ui .prop-format { color: #a78bfa; }

    /* Auth modal */
    .swagger-ui .dialog-ux .modal-ux { background: #111827 !important; border: 1px solid #1f2937; border-radius: 12px; }
    .swagger-ui .dialog-ux .modal-ux-header { background: #0f1117 !important; border-bottom: 1px solid #1f2937; border-radius: 12px 12px 0 0; padding: 16px 24px; }
    .swagger-ui .dialog-ux .modal-ux-header h3 { color: #f1f5f9 !important; }
    .swagger-ui .dialog-ux .modal-ux-content { padding: 20px 24px; }
    .swagger-ui .dialog-ux .modal-ux-content p { color: #94a3b8; }
    .swagger-ui label { color: #94a3b8 !important; }

    /* Filter bar */
    .swagger-ui .filter .operation-filter-input { background: #111827 !important; color: #f1f5f9 !important; border: 1px solid #1f2937 !important; border-radius: 6px; }

    /* Loading */
    .swagger-ui .loading-container { background: #0f1117; }
    .swagger-ui .loading-container .loading::after { color: #94a3b8; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0f1117; }
    ::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #4b5563; }

    /* Helper banner */
    #auth-helper {
      background: #111827;
      border: 1px solid #374151;
      border-radius: 10px;
      margin: 12px 20px;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    #auth-helper span { color: #94a3b8; font-size: 0.85rem; flex-shrink: 0; }
    #auth-helper strong { color: #dc2626; }
    #auth-helper .demo-btn {
      background: #1f2937;
      border: 1px solid #374151;
      border-radius: 6px;
      color: #e2e8f0;
      cursor: pointer;
      font-size: 0.8rem;
      padding: 6px 12px;
      transition: background 0.15s;
    }
    #auth-helper .demo-btn:hover { background: #374151; }
    #auth-helper .login-btn {
      background: #dc2626;
      border: none;
      border-radius: 6px;
      color: #fff;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 6px 14px;
      transition: background 0.15s;
      margin-left: auto;
    }
    #auth-helper .login-btn:hover { background: #b91c1c; }
    #auth-helper #token-status { font-size: 0.8rem; color: #22c55e; }
  </style>
</head>
<body>
  <div id="auth-helper">
    <span>Quick demo login: <strong>password123</strong></span>
    <button class="demo-btn" data-email="admin@trucklink.com">Admin</button>
    <button class="demo-btn" data-email="sarah@trucklink.com">Dispatcher</button>
    <button class="demo-btn" data-email="mike@trucklink.com">Driver</button>
    <button class="demo-btn" data-email="james@trucklink.com">Carrier</button>
    <button class="demo-btn" data-email="lisa@trucklink.com">Shipper</button>
    <span id="token-status"></span>
    <button class="login-btn" id="login-btn">Get Token &amp; Authorize →</button>
  </div>
  <div id="swagger-ui"></div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    let selectedEmail = 'admin@trucklink.com';
    let swaggerUiInstance = null;

    // Demo buttons
    document.querySelectorAll('.demo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.demo-btn').forEach(b => b.style.borderColor = '');
        btn.style.borderColor = '#dc2626';
        btn.style.color = '#dc2626';
        selectedEmail = btn.dataset.email;
        document.getElementById('token-status').textContent = '';
      });
    });

    // Login + auto-authorize
    document.getElementById('login-btn').addEventListener('click', async () => {
      const btn = document.getElementById('login-btn');
      btn.textContent = 'Logging in…';
      btn.disabled = true;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: selectedEmail, password: 'password123' }),
        });
        if (!res.ok) throw new Error('Login failed');
        const data = await res.json();
        const token = data.token;
        const user = data.user;

        document.getElementById('token-status').textContent =
          '✓ Logged in as ' + user.name + ' (' + user.role + ')';

        // Inject the Bearer token into SwaggerUI
        if (swaggerUiInstance) {
          swaggerUiInstance.preauthorizeApiKey('bearerAuth', token);
        }
        btn.textContent = '✓ Authorized';
        btn.style.background = '#16a34a';
      } catch (e) {
        document.getElementById('token-status').textContent = '✗ Login failed';
        btn.textContent = 'Get Token & Authorize →';
        btn.style.background = '';
      }
      btn.disabled = false;
    });

    // Init SwaggerUI
    swaggerUiInstance = SwaggerUIBundle({
      url: '/api/docs/spec.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      layout: 'StandaloneLayout',
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      defaultModelsExpandDepth: 1,
      docExpansion: 'list',
      requestInterceptor: (req) => {
        // Ensure requests go to the right base
        return req;
      },
    });
  </script>
</body>
</html>`);
});

export default router;
