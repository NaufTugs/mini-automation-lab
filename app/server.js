
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3000);
const SECRET = process.env.CRON_SECRET || "change-this-secret";

const LOG_FILE = "/tmp/mini-automation-logs.json";
const MAX_LOGS = 100;

function readLogs() {
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveLog(task, status, details = {}) {
  const logs = readLogs();

  logs.push({
    id: Date.now(),
    task,
    status,
    details,
    time: new Date().toISOString()
  });

  fs.writeFileSync(
    LOG_FILE,
    JSON.stringify(logs.slice(-MAX_LOGS), null, 2)
  );
}

function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });

  res.end(JSON.stringify(data, null, 2));
}

const dashboard = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mini Automation Lab</title>
<style>
body {
  background: #101827;
  color: #e5e7eb;
  font-family: Arial, sans-serif;
  padding: 30px;
  max-width: 850px;
  margin: auto;
}
h1 { color: #60a5fa; }
.card {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
  margin: 15px 0;
}
a { color: #60a5fa; }
button {
  padding: 12px 18px;
  border: 0;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  cursor: pointer;
}
pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
</head>
<body>
<h1>Mini Automation Lab</h1>

<div class="card">
  <h3>Application Status</h3>
  <p id="status">Checking...</p>
</div>

<div class="card">
  <h3>Automation Logs</h3>
  <p>Recent task executions</p>
  <button onclick="loadLogs()">Refresh Logs</button>
  <pre id="logs">Loading...</pre>
</div>

<div class="card">
  <h3>API Endpoints</h3>
  <p><a href="/health">/health</a></p>
  <p><a href="/logs">/logs</a></p>
</div>

<script>
async function loadLogs() {
  try {
    const response = await fetch("/logs");
    const data = await response.json();
    document.getElementById("logs").textContent =
      JSON.stringify(data, null, 2);
  } catch (error) {
    document.getElementById("logs").textContent = error.message;
  }
}

async function checkHealth() {
  try {
    const response = await fetch("/health");
    const data = await response.json();
    document.getElementById("status").textContent = data.status;
  } catch {
    document.getElementById("status").textContent = "Offline";
  }
}

loadLogs();
checkHealth();
</script>
</body>
</html>
`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });
    return res.end(dashboard);
  }

  if (req.method === "GET" && url.pathname === "/health") {
    return send(res, 200, {
      status: "online",
      service: "mini-automation-lab",
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === "GET" && url.pathname === "/logs") {
    const logs = readLogs();

    return send(res, 200, {
      total: logs.length,
      logs
    });
  }

  if (req.method === "POST" && url.pathname === "/trigger") {
    if (req.headers.authorization !== `Bearer ${SECRET}`) {
      return send(res, 401, {
        error: "Unauthorized"
      });
    }

    saveLog("heartbeat", "success", {
      source: "cron-job",
      message: "Scheduled task received"
    });

    console.log("Cron trigger received");

    return send(res, 200, {
      success: true,
      message: "Task recorded",
      timestamp: new Date().toISOString()
    });
  }

  return send(res, 404, {
    error: "Not found"
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`App running on port ${PORT}`);
});

function shutdown() {
  console.log("Shutting down app...");

  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
