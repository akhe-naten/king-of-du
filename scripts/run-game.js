const http = require("node:http");
const { spawn } = require("node:child_process");
const { networkInterfaces } = require("node:os");
const { startServer } = require("../src/server");

const PORT = Number(process.env.PORT || 3000);
const GAME_URL = `http://localhost:${PORT}/`;

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

async function main() {
  if (await isServerRunning()) {
    printUrls("Server is already running.");
    openUrl(GAME_URL);
    return;
  }

  console.log("Starting King of Du...");
  startServer();
  setTimeout(() => openUrl(GAME_URL), 900);
  setTimeout(() => printUrls("Game server is ready."), 900);
  console.log("Keep this window open while playing.");
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

function printUrls(message) {
  console.log(message);
  console.log(`Local: ${GAME_URL}`);
  const lan = lanUrls();
  if (lan.length) {
    console.log("LAN:");
    lan.forEach((url) => console.log(`  ${url}`));
  }
}

function lanUrls() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((entry) => entry && entry.family === "IPv4" && !entry.internal)
    .map((entry) => `http://${entry.address}:${PORT}/`);
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
