const fs = require("node:fs/promises");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const OUT = path.join(DIST, "king-of-du-portable");

const COPY_ENTRIES = [
  "config",
  "data/README.md",
  "deploy",
  "public",
  "scripts",
  "src",
  ".env.example",
  "cloudbaserc.json",
  "DEPLOYMENT.md",
  "DEVELOPMENT.md",
  "Dockerfile",
  "docker-compose.yml",
  "package.json",
  "README.md",
  "TECHNICAL_PLAN.md",
  "TODO.md",
  "start-game-windows.cmd",
  "start-game-linux.sh",
  "start-game-macos.command",
  "start-admin-windows.cmd",
  "start-admin-linux.sh",
  "start-admin-macos.command",
  "start-admin-linux.desktop"
];

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(OUT, { recursive: true });

  for (const entry of COPY_ENTRIES) {
    const source = path.join(ROOT, entry);
    if (!(await exists(source))) continue;
    const target = path.join(OUT, entry);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.cp(source, target, { recursive: true });
  }

  await fs.mkdir(path.join(OUT, "data"), { recursive: true });
  await fs.writeFile(path.join(OUT, "data", ".gitkeep"), "", "utf8");
  await fs.writeFile(
    path.join(OUT, "START-HERE.txt"),
    [
      "King of Du portable package",
      "",
      "1. Install Node.js 18 or newer.",
      "2. Windows: double-click start-game-windows.cmd.",
      "3. macOS/Linux: run ./start-game-macos.command or ./start-game-linux.sh.",
      "4. Admin console: use the start-admin script for your OS.",
      "",
      "Runtime account data is stored under data/accounts.json and is intentionally not bundled."
    ].join("\n"),
    "utf8"
  );

  await createZipIfPossible();
  console.log(`Portable package written to ${OUT}`);
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function createZipIfPossible() {
  const zipPath = path.join(DIST, "king-of-du-portable.zip");
  await fs.rm(zipPath, { force: true });
  if (process.platform === "win32") {
    const result = spawnSync("powershell", [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${OUT.replaceAll("'", "''")}\\*' -DestinationPath '${zipPath.replaceAll("'", "''")}' -Force`
    ], { stdio: "inherit" });
    if (result.status === 0) return;
  }
  console.log("Zip creation skipped; portable folder is ready.");
}
