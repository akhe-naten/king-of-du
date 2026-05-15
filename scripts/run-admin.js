const http = require("node:http");
const { spawn } = require("node:child_process");
const { startServer } = require("../src/server");

const PORT = Number(process.env.PORT || 3000);
const ADMIN_URL = `http://localhost:${PORT}/admin.html`;

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

async function main() {
  if (await isServerRunning()) {
    console.log(`Server is already running. Opening ${ADMIN_URL}`);
    openUrl(ADMIN_URL);
    return;
  }

  console.log("Starting Warehouse Auction Night server...");
  startServer();
  setTimeout(() => openUrl(ADMIN_URL), 900);
  console.log("Keep this window open while your friends are playing.");
}

function isServerRunning() {
  return new Promise((resolve) => {
    const request = http.get(`http://127.0.0.1:${PORT}/api/health`, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.setTimeout(600, () => {
      request.destroy();
      resolve(false);
    });
    request.on("error", () => resolve(false));
  });
}

function openUrl(url) {
  const command = openCommand(url);
  if (!command) {
    console.log(`Open this URL in your browser: ${url}`);
    return;
  }

  try {
    const child = spawn(command.file, command.args, {
      detached: true,
      stdio: "ignore"
    });
    child.unref();
  } catch {
    console.log(`Open this URL in your browser: ${url}`);
  }
}

function openCommand(url) {
  if (process.platform === "win32") return { file: "cmd", args: ["/c", "start", "", url] };
  if (process.platform === "darwin") return { file: "open", args: [url] };
  if (process.platform === "linux") return { file: "xdg-open", args: [url] };
  return null;
}
