const http = require("node:http");
const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const PROJECT_ROOT = path.resolve(__dirname, "..");
const PUBLIC_ROOT = path.join(PROJECT_ROOT, "public");
const CONFIG_DIR = path.join(PROJECT_ROOT, "config");
const DATA_DIR = process.env.KWA_DATA_DIR ? path.resolve(process.env.KWA_DATA_DIR) : path.join(PROJECT_ROOT, "data");
const CONFIG_PATH = path.join(CONFIG_DIR, "server-config.json");
const LOOT_CONFIG_PATH = path.join(CONFIG_DIR, "loot-config.json");
const ROLES_CONFIG_PATH = path.join(CONFIG_DIR, "roles-config.json");
const ACCOUNTS_PATH = path.join(DATA_DIR, "accounts.json");
const ITEM_TEXTURE_ROOT = path.join(PUBLIC_ROOT, "assets", "item-textures");
const CUSTOM_ITEM_TEXTURE_ROOT = path.join(ITEM_TEXTURE_ROOT, "custom");
const CUSTOM_CHARACTER_ROOT = path.join(PUBLIC_ROOT, "assets", "characters", "custom");
const CUSTOM_ROLE_AUDIO_ROOT = path.join(PUBLIC_ROOT, "assets", "audio", "roles", "custom");
const CUSTOM_MAP_IMAGE_ROOT = path.join(PUBLIC_ROOT, "assets", "images", "maps", "custom");
const MAX_PLAYERS = 4;
const MAX_MONEY = 999_999_999;
const DISPLAY_SHELF_SLOTS = 8;
const FINISHED_ROOM_TTL_MS = 1000 * 60 * 5;
const SETTLEMENT_AUTO_CONFIRM_MS = 1000 * 5;
const SESSION_COOKIE = "kwa_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const ACCOUNT_USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const PASSWORD_MIN_LENGTH = 6;
const ADMIN_TOKEN = String(process.env.ADMIN_TOKEN || "");
const COOKIE_SECURE = process.env.COOKIE_SECURE === undefined
  ? process.env.NODE_ENV === "production"
  : /^(1|true|yes)$/i.test(String(process.env.COOKIE_SECURE || ""));
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const AUTH_RATE_LIMIT = Number(process.env.AUTH_RATE_LIMIT || 20);
const ACTION_RATE_LIMIT = Number(process.env.ACTION_RATE_LIMIT || 180);
const JSON_BODY_LIMIT = Number(process.env.JSON_BODY_LIMIT || 12 * 1024 * 1024);

const DEFAULT_GAME_CONFIG = Object.freeze({
  bidRounds: 6,
  startingCash: 900_000,
  maxBid: MAX_MONEY,
  bidStep: 10_000,
  warehouseCols: 15,
  warehouseFillPercent: 92,
  skillRevealCount: 2,
  disconnectTimeoutSeconds: 10,
  settlementRevealMs: 260
});

let gameConfig = loadSavedConfig();
let accountStore = loadAccountStore();
let accountSaveQueue = Promise.resolve();

const STATIC_FILES = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/admin.html", "admin.html"],
  ["/loot-config.json", LOOT_CONFIG_PATH],
  ["/roles-config.json", ROLES_CONFIG_PATH]
]);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg"
};

const RARITY = {
  junk: { label: "灰色", color: "#9aa2a9", floor: 0.25 },
  common: { label: "白色", color: "#f0f4f7", floor: 0.38 },
  green: { label: "绿色", color: "#79e28c", floor: 0.48 },
  blue: { label: "蓝色", color: "#52c8ff", floor: 0.58 },
  gold: { label: "金色", color: "#d9a941", floor: 0.68 },
  red: { label: "红色", color: "#ff6579", floor: 0.78 }
};
const RARITY_ORDER = ["junk", "common", "green", "blue", "gold", "red"];
const CONDITION_ORDER = ["worn", "normal", "good", "fine", "mint"];
const CATEGORY_TAGS = ["文玩", "科技", "载具", "军品", "安防", "宝石", "食品", "工业", "玩具", "杂物", "航海", "服饰", "家具"];
const DEFAULT_MAP_ID = "shipwreck-hold";
const RESOURCE_COST_TABLE = [
  { min: 999_999, cost: 900 },
  { min: 10_000, cost: 500 },
  { min: 4_000, cost: 200 },
  { min: 0, cost: 50 }
];
const CLOSEOUT_MULTIPLIERS = [2, 1.6, 1.3, 1.2, 1.1, 1.05, 1.03, 1.02, 1.01, 1.01, 1.01, 1.01];
const RARITY_DROP_WEIGHT = { junk: 34, common: 30, green: 20, blue: 10, gold: 4, red: 1.4 };
const CONDITION_TABLE = [
  { id: "worn", label: "残旧", min: 0.72, max: 0.88, weight: 16 },
  { id: "normal", label: "普通", min: 0.9, max: 1.08, weight: 42 },
  { id: "good", label: "良好", min: 1.1, max: 1.28, weight: 28 },
  { id: "fine", label: "上品", min: 1.32, max: 1.62, weight: 11 },
  { id: "mint", label: "极品", min: 1.8, max: 2.35, weight: 3 }
];

const VOICE_EVENTS = {
  auctionWin: "assets/audio/events/auction-win.wav",
  settlementProfit: "assets/audio/events/settlement-profit.wav",
  settlementLoss: "assets/audio/events/settlement-loss.wav"
};
const TOOL_RARITY = {
  common: { label: "普通", color: "#f0f4f7" },
  rare: { label: "稀有", color: "#52c8ff" },
  epic: { label: "史诗", color: "#b46dff" },
  legendary: { label: "传说", color: "#ff9f38" }
};
const TOOL_DEFS = [
  { id: "common-inspect", name: "普通查看", rarity: "common", summary: "随机揭示 1 件藏品内容。" },
  { id: "common-probe", name: "普通摸索", rarity: "common", summary: "随机揭示 2 件藏品轮廓。" },
  { id: "rare-double", name: "宝光双鉴", rarity: "rare", summary: "随机揭示 2 件藏品的稀有度及轮廓。" },
  { id: "rare-heavy", name: "重物查看", rarity: "rare", summary: "揭示面积最大的藏品稀有度及轮廓。" },
  { id: "epic-gold-value", name: "精准估价", rarity: "epic", summary: "统计所有金色藏品的总价值。" },
  { id: "legendary-total-value", name: "揭露真相", rarity: "legendary", summary: "统计所有藏品的总价值。" }
];
const DEFAULT_TOOL_IDS = TOOL_DEFS.slice(0, 4).map((tool) => tool.id);
const MAX_LOADOUT_TOOLS = 4;

let rolesConfig = loadRolesConfig();
let ROLE_POOL = normalizeRoles(rolesConfig.roles);
let DEFAULT_ROLE_ID = ROLE_POOL[0]?.id || "god-gambler";
let lootConfig = loadLootConfig();
let lootItems = normalizeLootItems(lootConfig.items);
let warehouses = buildWarehouseTemplates(lootConfig.warehouses, lootItems);
let mapTemplates = buildMapTemplates(lootConfig.mapSettings || lootConfig.maps, lootConfig.warehouses, lootItems);

const rooms = new Map();
const rateLimits = new Map();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    await serveStatic(req, res, url);
  } catch (error) {
    if (!error.statusCode || error.statusCode >= 500) console.error(error);
    sendJson(res, error.statusCode || 500, { error: error.message || "internal_error" });
  }
});

if (require.main === module) startServer();

function startServer() {
  server.listen(PORT, HOST, () => {
    console.log("Warehouse Auction Night is running:");
    console.log(`  Local:   http://localhost:${PORT}`);
    for (const address of getLanAddresses()) console.log(`  LAN:     http://${address}:${PORT}`);
    if (!ADMIN_TOKEN) console.warn("WARNING: ADMIN_TOKEN is not set. Do not expose /admin.html to the public internet.");
  });
}

async function serveStatic(req, res, url) {
  const pathname = url.pathname;
  if (pathname === "/admin.html") requireAdmin(req, url);
  const fileName = STATIC_FILES.get(pathname);
  let filePath;
  if (fileName) {
    filePath = path.isAbsolute(fileName) ? fileName : path.join(PUBLIC_ROOT, fileName);
  } else if (pathname.startsWith("/css/") || pathname.startsWith("/js/") || pathname.startsWith("/assets/")) {
    const relativePath = decodeURIComponent(pathname).replace(/^\/+/, "");
    filePath = path.resolve(PUBLIC_ROOT, relativePath);
    if (filePath !== PUBLIC_ROOT && !filePath.startsWith(`${PUBLIC_ROOT}${path.sep}`)) {
      sendText(res, 404, "Not found");
      return;
    }
  } else {
    sendText(res, 404, "Not found");
    return;
  }
  const body = await fs.readFile(filePath);
  const contentType = MIME_TYPES[path.extname(filePath)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-store" });
  res.end(body);
}

async function handleApi(req, res, url) {
  cleanupFinishedRooms();
  applyRateLimit(req, url);
  if (url.pathname.startsWith("/api/auth/")) {
    await handleAuthApi(req, res, url);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/account") {
    const account = requireAccount(req);
    sendJson(res, 200, { account: publicAccount(account, true) });
    return;
  }

  const accountItemMatch = url.pathname.match(/^\/api\/account\/items\/([^/]+)\/(lock|exhibit|sell)$/);
  if (req.method === "POST" && accountItemMatch) {
    const account = requireAccount(req);
    const body = await readJson(req);
    await handleAccountItemAction(account, decodeURIComponent(accountItemMatch[1]), accountItemMatch[2], body);
    sendJson(res, 200, { account: publicAccount(account, true) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      rooms: rooms.size,
      serverTime: now(),
      port: PORT,
      urls: serverUrls(),
      config: publicConfig(gameConfig)
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin/status") {
    requireAdmin(req, url);
    for (const room of rooms.values()) checkDisconnected(room);
    sendJson(res, 200, {
      ok: true,
      rooms: rooms.size,
      serverTime: now(),
      port: PORT,
      urls: serverUrls(),
      config: publicConfig(gameConfig)
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin/config") {
    requireAdmin(req, url);
    sendJson(res, 200, { config: publicConfig(gameConfig), defaults: publicConfig(DEFAULT_GAME_CONFIG) });
    return;
  }

  if (req.method === "PUT" && url.pathname === "/api/admin/config") {
    requireAdmin(req, url);
    const body = await readJson(req);
    gameConfig = normalizeConfig(body.config || body || {}, gameConfig);
    await saveConfig(gameConfig);
    sendJson(res, 200, { config: publicConfig(gameConfig), defaults: publicConfig(DEFAULT_GAME_CONFIG) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin/loot-config") {
    requireAdmin(req, url);
    sendJson(res, 200, {
      config: lootConfig,
      counts: {
        items: lootItems.length,
        maps: mapTemplates.length,
        warehouses: warehouses.length,
        tags: uniqueTags(lootItems.flatMap((item) => item.tags || [])).length
      }
    });
    return;
  }

  if (req.method === "PUT" && url.pathname === "/api/admin/loot-config") {
    requireAdmin(req, url);
    const body = await readJson(req);
    const nextConfig = normalizeEditableLootConfig(body.config || body || {});
    await saveLootConfig(nextConfig);
    reloadLootConfig(nextConfig);
    sendJson(res, 200, {
      config: lootConfig,
      counts: {
        items: lootItems.length,
        maps: mapTemplates.length,
        warehouses: warehouses.length,
        tags: uniqueTags(lootItems.flatMap((item) => item.tags || [])).length
      }
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin/roles-config") {
    requireAdmin(req, url);
    sendJson(res, 200, { config: rolesConfig, counts: { roles: ROLE_POOL.length } });
    return;
  }

  if (req.method === "PUT" && url.pathname === "/api/admin/roles-config") {
    requireAdmin(req, url);
    const body = await readJson(req);
    const nextConfig = normalizeEditableRolesConfig(body.config || body || {});
    await saveRolesConfig(nextConfig);
    reloadRolesConfig(nextConfig);
    sendJson(res, 200, { config: rolesConfig, counts: { roles: ROLE_POOL.length } });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/item-textures") {
    requireAdmin(req, url);
    const body = await readJson(req);
    const saved = await saveUploadedItemTexture(body);
    sendJson(res, 200, saved);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/role-assets") {
    requireAdmin(req, url);
    const body = await readJson(req);
    const saved = await saveUploadedRoleAsset(body);
    sendJson(res, 200, saved);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/map-assets") {
    requireAdmin(req, url);
    const body = await readJson(req);
    const saved = await saveUploadedMapAsset(body);
    sendJson(res, 200, saved);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin/rooms") {
    requireAdmin(req, url);
    for (const room of rooms.values()) checkDisconnected(room);
    sendJson(res, 200, { rooms: [...rooms.values()].map(adminRoomSummary) });
    return;
  }

  const adminRoomMatch = url.pathname.match(/^\/api\/admin\/rooms\/([A-Z0-9]{4,8})$/);
  if (req.method === "GET" && adminRoomMatch) {
    requireAdmin(req, url);
    const room = rooms.get(adminRoomMatch[1]);
    if (!room) {
      sendJson(res, 404, { error: "room_not_found" });
      return;
    }
    checkDisconnected(room);
    if (!rooms.has(room.id)) {
      sendJson(res, 404, { error: "room_not_found" });
      return;
    }
    syncSettlementProgress(room);
    sendJson(res, 200, { room: adminRoomDetail(room) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/rooms") {
    for (const room of rooms.values()) checkDisconnected(room);
    sendJson(res, 200, { rooms: [...rooms.values()].map(publicRoomSummary) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/maps") {
    sendJson(res, 200, { maps: publicMaps(), defaultMapId: DEFAULT_MAP_ID });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/roles") {
    sendJson(res, 200, { roles: ROLE_POOL, defaultRoleId: DEFAULT_ROLE_ID });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/rooms") {
    const body = await readJson(req);
    const account = requireAccount(req);
    const room = createRoom(body.hostName || account.displayName || account.username || "房主", account, body.mapId, body.roleId, body.toolIds);
    rooms.set(room.id, room);
    const playerId = room.players[0].id;
    sendJson(res, 201, { room: publicRoom(room, playerId), playerId });
    return;
  }

  const roomMatch = url.pathname.match(/^\/api\/rooms\/([A-Z0-9]{4,8})(?:\/(join|action))?$/);
  if (!roomMatch) {
    sendJson(res, 404, { error: "api_not_found" });
    return;
  }

  const room = rooms.get(roomMatch[1]);
  const route = roomMatch[2] || "";
  if (!room) {
    sendJson(res, 404, { error: "room_not_found" });
    return;
  }

  if (req.method === "GET" && route === "") {
    const viewerId = viewerIdForRequest(req, room, url.searchParams.get("playerId"));
    markSeen(room, viewerId);
    checkDisconnected(room);
    if (!rooms.has(room.id)) {
      sendJson(res, 404, { error: "room_not_found" });
      return;
    }
    syncSettlementProgress(room);
    sendJson(res, 200, { room: publicRoom(room, viewerId) });
    return;
  }

  if (req.method === "POST" && route === "join") {
    const body = await readJson(req);
    const account = requireAccount(req);
    const player = joinRoom(room, body.name || account.displayName || account.username || "玩家", account, body.roleId, body.toolIds);
    sendJson(res, 200, { room: publicRoom(room, player.id), playerId: player.id });
    return;
  }

  if (req.method === "POST" && route === "action") {
    const body = await readJson(req);
    const account = requireAccount(req);
    const playerId = authorizedPlayerId(account, room, body.playerId);
    markSeen(room, playerId);
    checkDisconnected(room);
    const result = applyRoomAction(room, { ...body, playerId });
    if (result?.deleted || !rooms.has(room.id)) {
      sendJson(res, 200, { room: null, left: true });
      return;
    }
    sendJson(res, 200, { room: publicRoom(room, playerId), left: Boolean(result?.left) });
    return;
  }

  sendJson(res, 405, { error: "method_not_allowed" });
}

async function handleAuthApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/auth/me") {
    const account = accountFromRequest(req);
    sendJson(res, 200, { account: account ? publicAccount(account, true) : null });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/register") {
    const body = await readJson(req);
    const account = await registerAccount(body);
    const session = createSession(account);
    await queueAccountSave();
    sendJson(res, 201, { account: publicAccount(account, true) }, { "Set-Cookie": sessionCookieHeader(session) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    const body = await readJson(req);
    const account = await loginAccount(body);
    const session = createSession(account);
    account.lastLoginAt = now();
    account.updatedAt = now();
    await queueAccountSave();
    sendJson(res, 200, { account: publicAccount(account, true) }, { "Set-Cookie": sessionCookieHeader(session) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/logout") {
    const token = sessionTokenFromRequest(req);
    if (token) {
      accountStore.sessions = accountStore.sessions.filter((session) => session.token !== token);
      await queueAccountSave();
    }
    sendJson(res, 200, { ok: true }, { "Set-Cookie": clearSessionCookieHeader() });
    return;
  }

  sendJson(res, 404, { error: "auth_not_found" });
}

function createRoom(hostName, account = null, mapId = null, roleId = null, toolIds = null) {
  const map = mapTemplateById(mapId);
  const room = {
    id: makeRoomId(),
    phase: "lobby",
    createdAt: now(),
    updatedAt: now(),
    players: [],
    game: null,
    actions: [],
    maxPlayers: MAX_PLAYERS,
    mapId: map.id
  };
  joinRoom(room, hostName, account, roleId, toolIds);
  return room;
}

function joinRoom(room, name, account = null, roleId = null, toolIds = null) {
  if (account) {
    const existing = room.players.find((player) => player.accountId === account.id);
    if (existing) {
      existing.name = String(name || account.displayName || account.username || existing.name).slice(0, 18);
      existing.accountName = account.username;
      existing.accountDisplayName = account.displayName;
      existing.accountSnapshot = accountSnapshot(account);
      if (roleId) {
        existing.roleId = normalizeRoleId(roleId);
        existing.roleSelected = true;
      }
      existing.toolIds = normalizeToolIds(toolIds || existing.toolIds);
      existing.connected = true;
      existing.lastSeenAt = Date.now();
      const gamePlayer = room.game?.players.find((entry) => entry.id === existing.id);
      if (gamePlayer) {
        gamePlayer.name = existing.name;
        gamePlayer.connected = true;
        gamePlayer.human = true;
      }
      touch(room);
      return existing;
    }
  }
  if (room.phase !== "lobby") throwHttp("game_already_started", 409);
  if (room.players.length >= room.maxPlayers) throwHttp("room_full", 409);
  const player = {
    id: crypto.randomUUID(),
    name: String(name).slice(0, 18),
    seat: room.players.length + 1,
    accountId: account?.id || null,
    accountName: account?.username || null,
    accountDisplayName: account?.displayName || null,
    accountSnapshot: account ? accountSnapshot(account) : null,
    roleId: normalizeRoleId(roleId || DEFAULT_ROLE_ID),
    roleSelected: Boolean(roleId),
    toolIds: normalizeToolIds(toolIds),
    connected: true,
    joinedAt: now(),
    lastSeenAt: Date.now()
  };
  room.players.push(player);
  touch(room);
  return player;
}

function applyRoomAction(room, body) {
  const type = body.type || "unknown";
  const playerId = body.playerId || null;
  room.actions.push({ id: crypto.randomUUID(), playerId, type, payload: body.payload || {}, createdAt: now() });
  room.actions = room.actions.slice(-30);

  if (type === "startGame") startGame(room, playerId);
  else if (type === "setMap") setRoomMap(room, playerId, body.payload?.mapId);
  else if (type === "setRole") setPlayerRole(room, playerId, body.payload?.roleId);
  else if (type === "setTools") setPlayerTools(room, playerId, body.payload?.toolIds);
  else if (type === "useSkill") useSkill(room, playerId);
  else if (type === "useTool") useTool(room, playerId, body.payload?.toolId);
  else if (type === "submitBid") submitBid(room, playerId, body.payload?.bid);
  else if (type === "setSettlementLock") setSettlementItemLock(room, playerId, body.payload?.itemId, body.payload?.locked);
  else if (type === "skipSettlement") skipSettlementReveal(room, playerId);
  else if (type === "confirmSettlement") confirmSettlement(room, playerId);
  else if (type === "leaveRoom") {
    leaveRoom(room, playerId);
    if (destroyRoomIfOnlyAi(room)) return { left: true, deleted: true };
    return { left: true };
  } else if (type === "resetRoom") {
    room.phase = "lobby";
    room.game = null;
  }
  touch(room);
  destroyRoomIfOnlyAi(room);
  return { left: false, deleted: !rooms.has(room.id) };
}

function leaveRoom(room, playerId) {
  const index = room.players.findIndex((entry) => entry.id === playerId);
  if (index >= 0) room.players.splice(index, 1);
  room.players.forEach((player, seatIndex) => {
    player.seat = seatIndex + 1;
  });
  const gamePlayer = room.game?.players.find((entry) => entry.id === playerId);
  if (gamePlayer) {
    gamePlayer.human = false;
    gamePlayer.connected = false;
  }
  room.actions.push({ id: crypto.randomUUID(), playerId, type: "left", payload: {}, createdAt: now() });
  room.actions = room.actions.slice(-30);
}

function destroyRoomIfOnlyAi(room) {
  if (!room) return false;
  const hasLobbyHuman = room.players.some((player) => player.connected !== false);
  const hasGameHuman = room.game?.players?.some((player) => player.human && player.connected !== false) || false;
  if (hasLobbyHuman || hasGameHuman) return false;
  rooms.delete(room.id);
  return true;
}

function setRoomMap(room, playerId, mapId) {
  if (room.phase !== "lobby" || room.game) return;
  if (room.players[0]?.id !== playerId) return;
  room.mapId = mapTemplateById(mapId).id;
}

function setPlayerRole(room, playerId, roleId) {
  if (room.phase !== "lobby" || room.game) return;
  const player = room.players.find((entry) => entry.id === playerId);
  if (!player) throwHttp("player_not_found", 404);
  player.roleId = normalizeRoleId(roleId);
  player.roleSelected = true;
}

function setPlayerTools(room, playerId, toolIds) {
  if (room.phase !== "lobby" || room.game) return;
  const player = room.players.find((entry) => entry.id === playerId);
  if (!player) throwHttp("player_not_found", 404);
  player.toolIds = normalizeToolIds(toolIds);
}

function startGame(room, playerId) {
  if (room.phase !== "lobby" && room.phase !== "finished") return;
  if (room.players[0]?.id !== playerId) throwHttp("forbidden_player", 403);
  room.players.forEach(refreshPlayerAccountSnapshot);
  const config = publicConfig(gameConfig);
  const map = mapTemplateById(room.mapId);
  const ticketCost = clampMoney(map.ticketCost || 0);
  const shortfall = room.players.find((player) => (player.accountSnapshot?.cash ?? config.startingCash) < ticketCost);
  if (shortfall) throwHttp("ticket_not_enough_cash", 409);
  const lot = prepareWarehouse(structuredClone(map), config);
  const gamePlayers = room.players.map((player, index) => makeGamePlayer(player, index, true, config));
  while (gamePlayers.length < MAX_PLAYERS) {
    const index = gamePlayers.length;
    gamePlayers.push(makeGamePlayer({ id: `ai-${index + 1}`, name: `AI ${index + 1}` }, index, false, config));
  }
  gamePlayers.forEach((player) => {
    player.ticketCost = ticketCost;
    player.cash = clampMoney(player.cash - ticketCost);
  });

  room.phase = "bidding";
  room.game = {
    bidRound: 0,
    config,
    players: gamePlayers,
    lot,
    publicIntel: [],
    roundActions: {},
    roundResult: "",
    settlement: null,
    tieCount: 0,
    roleAutoRounds: {}
  };
  const closeout = bidCloseoutMultiplier(0);
  addPublicIntel(room.game, "本局地图·竞拍信息", `${lot.name} 已开启，门票 ${formatMoney(ticketCost)}。开局只展示仓库行列规模，藏品位置需要通过技能或道具确认。`, "图");
  addPublicIntel(room.game, "规则", `共 ${config.bidRounds} 轮报价。角色技能自动触发，每轮仍可使用 1 次道具。最高报价平局会重开本轮；本轮最高价达到第二名 x${formatMultiplier(closeout)} 会提前成交。`, String(config.bidRounds));
  applyGameStartRoleSkills(room.game);
  applyRoundStartRoleSkills(room.game);
}

function makeGamePlayer(player, index, human, config) {
  const role = roleById(player.roleId || ROLE_POOL[index % ROLE_POOL.length]?.id);
  const account = player.accountSnapshot || null;
  return {
    id: player.id,
    name: player.name,
    accountId: player.accountId || null,
    accountName: player.accountName || null,
    seat: index + 1,
    roleId: role.id,
    roleSelected: Boolean(player.roleSelected),
    role: role.role,
    roleSummary: role.summary,
    rolePortrait: role.portrait,
    roleAvatar: role.avatar,
    roleVoice: role.voice,
    roleVoices: role.voices,
    skillScript: role.skillScript,
    toolIds: normalizeToolIds(player.toolIds),
    cash: clampMoney(account?.cash ?? config.startingCash),
    trait: role.trait,
    human,
    connected: human,
    items: account ? structuredClone(account.items || []) : [],
    bidHistory: Array(config.bidRounds).fill(null),
    view: {
      estimateFactor: 0.28,
      intel: [],
      itemInfo: {}
    }
  };
}

function useSkill(room, playerId) {
  const game = requireGame(room);
  const player = game.players.find((entry) => entry.id === playerId);
  if (!player || !player.human) return;
  const action = roundAction(game, playerId);
  if (action.skill || action.bid) return;
  action.skill = true;
  player.view.estimateFactor = Math.min(0.92, player.view.estimateFactor + 0.14);
  const revealed = revealItemInfo(game.lot, player.view, "outline", game.config.skillRevealCount);
  const trueValue = lotValue(game.lot);
  const spread = Math.max(0.12, 0.34 - game.bidRound * 0.04);
  const low = clampMoney(trueValue * (1 - spread));
  const high = clampMoney(trueValue * (1 + spread * 0.75));
  addPrivateIntel(player, "角色技能·鉴定", `总价值约 ${formatMoney(low)} 到 ${formatMoney(high)}，并识别 ${revealed.length} 件藏品轮廓。`, "鉴");
}



function revealRandomItems(lot, view, flags, count) {
  const candidates = shuffle(lot.items.filter((item) => {
    if (item.revealed) return false;
    if (flags.revealed && !viewItemInfoHas(view, item.id, "revealed")) return true;
    if (flags.outline && !viewItemInfoHas(view, item.id, "outline")) return true;
    if (flags.rarity && !viewItemInfoHas(view, item.id, "rarity")) return true;
    return false;
  })).slice(0, count);
  candidates.forEach((item) => {
    if (flags.outline) setViewItemInfoFlag(view, item, "outline");
    if (flags.rarity) setViewItemInfoFlag(view, item, "rarity");
    if (flags.revealed) setViewItemInfoFlag(view, item, "revealed");
  });
  return candidates;
}

function roleSkillVoice(roleId) {
  return roleById(roleId).voices?.skill || `assets/audio/roles/${roleId}-skill.wav`;
}

function applyGameStartRoleSkills(game) {
  game.players.forEach((player) => {
    if (!player.roleSelected) return;
    const role = roleById(player.roleId);
    if (!["god-gambler", "star"].includes(role.id)) return;
    if (role.voices?.start) addPrivateIntel(player, "角色登场", `${role.role} 已准备就绪。`, role.shortName, role.voices.start);
    if (role.id === "god-gambler") {
      game.lot.items.forEach((item) => setViewItemInfoFlag(player.view, item, "outline"));
      addPrivateIntel(player, "赌神·开局读仓", "已展示所有藏品轮廓。", role.shortName, roleSkillVoice(role.id));
    } else if (role.id === "star") {
      const selected = revealRandomItems(game.lot, player.view, { rarity: true }, 5);
      addPrivateIntel(player, "女星·开场直觉", `已标出 ${selected.length} 件藏品各 1 格的稀有度反应。`, role.shortName, roleSkillVoice(role.id));
    }
  });
}

function applyRoundStartRoleSkills(game) {
  game.players.forEach((player) => {
    if (!player.roleSelected) return;
    const role = roleById(player.roleId);
    const key = `${player.id}:${game.bidRound}`;
    if (game.roleAutoRounds[key]) return;
    game.roleAutoRounds[key] = true;
    if (role.id === "teacher") {
      const selected = revealRandomItems(game.lot, player.view, { outline: true, rarity: true }, 2);
      addPrivateIntel(player, "老师·课前点名", `第 ${game.bidRound + 1} 轮前，已识别 ${selected.length} 件藏品的轮廓和稀有度。`, role.shortName, roleSkillVoice(role.id));
    } else if (role.id === "star" && game.bidRound > 0) {
      const selected = revealRandomItems(game.lot, player.view, { rarity: true }, 2);
      addPrivateIntel(player, "女星·镜头感", `第 ${game.bidRound + 1} 轮前，已在 ${selected.length} 件藏品各 1 格标出稀有度反应。`, role.shortName, roleSkillVoice(role.id));
    }
  });
}

function useTool(room, playerId, toolId = null) {
  const game = requireGame(room);
  const player = game.players.find((entry) => entry.id === playerId);
  if (!player || !player.human) return;
  const action = roundAction(game, playerId);
  if (action.tool || action.bid) return;
  const toolIds = normalizeToolIds(player.toolIds);
  const tool = toolById(toolIds.includes(toolId) ? toolId : toolIds[0]);
  action.tool = true;
  action.toolId = tool.id;
  player.view.estimateFactor = Math.min(0.95, player.view.estimateFactor + 0.08);
  const result = applyToolEffect(game, player, tool);
  addPrivateIntel(player, `道具·${tool.name}`, result, TOOL_RARITY[tool.rarity].label.slice(0, 1));
}

function applyToolEffect(game, player, tool) {
  if (tool.id === "common-inspect") {
    const selected = revealRandomItems(game.lot, player.view, { revealed: true }, 1);
    return selected.length ? `已揭示 ${selected[0].name} 的完整内容。` : "没有可揭示的藏品。";
  }
  if (tool.id === "common-probe") {
    const selected = revealRandomItems(game.lot, player.view, { outline: true }, 2);
    return `已摸索出 ${selected.length} 件藏品轮廓。`;
  }
  if (tool.id === "rare-double") {
    const selected = revealRandomItems(game.lot, player.view, { outline: true, rarity: true }, 2);
    return `已鉴定 ${selected.length} 件藏品的轮廓和稀有度。`;
  }
  if (tool.id === "rare-heavy") {
    const item = biggestHiddenItem(game.lot, player.view);
    if (!item) return "没有可查看的藏品。";
    setViewItemInfoFlag(player.view, item, "outline");
    setViewItemInfoFlag(player.view, item, "rarity");
    return `已锁定最大面积藏品：${RARITY[item.rarity].label}，占用 ${item.w}x${item.h}。`;
  }
  if (tool.id === "epic-gold-value") {
    const value = game.lot.items.filter((item) => item.rarity === "gold").reduce((sum, item) => sum + item.value, 0);
    player.view.estimateFactor = Math.min(0.98, player.view.estimateFactor + 0.16);
    return `所有金色藏品总价值约为 ${formatMoney(value)}。`;
  }
  if (tool.id === "legendary-total-value") {
    player.view.exactEstimate = lotValue(game.lot);
    player.view.estimateFactor = 1;
    return `所有藏品总价值为 ${formatMoney(lotValue(game.lot))}。`;
  }
  return "道具没有产生效果。";
}

function biggestHiddenItem(lot, view) {
  return [...lot.items]
    .filter((item) => !item.revealed && (!viewItemInfoHas(view, item.id, "outline") || !viewItemInfoHas(view, item.id, "rarity")))
    .sort((a, b) => b.w * b.h - a.w * a.h || b.value - a.value)[0] || null;
}

function submitBid(room, playerId, rawBid) {
  const game = requireGame(room);
  const player = game.players.find((entry) => entry.id === playerId);
  if (!player || !player.human) return;
  const action = roundAction(game, playerId);
  if (action.bid) return;

  player.bidHistory[game.bidRound] = clampBid(game, player, rawBid);
  action.bid = true;
  maybeResolveRound(room);
}

function maybeResolveRound(room) {
  const game = requireGame(room);
  const humans = game.players.filter((player) => player.human);
  if (!humans.every((player) => roundAction(game, player.id).bid)) {
    game.roundResult = "等待其他玩家报价...";
    return;
  }

  game.players.filter((player) => !player.human).forEach((player) => {
    if (player.bidHistory[game.bidRound] === null) player.bidHistory[game.bidRound] = aiBid(game, player);
  });

  const bids = game.players.map((player) => ({ player, bid: player.bidHistory[game.bidRound] })).sort((a, b) => b.bid - a.bid);
  const high = bids[0].bid;
  const top = bids.filter((entry) => entry.bid === high);
  if (top.length > 1) {
    restartCurrentRound(game, bids);
    return;
  }

  const roundWinner = bids[0];
  addPublicIntel(game, `第 ${game.bidRound + 1} 轮开标`, bids.map((entry) => `${entry.player.name} ${formatMoney(entry.bid)}`).join(" / "), "标");
  game.roundResult = `第 ${game.bidRound + 1} 轮最高报价：${roundWinner.player.name} ${formatMoney(roundWinner.bid)}。`;
  const closeout = bidCloseoutInfo(bids, game.bidRound);
  if (closeout) {
    game.roundResult += ` ${roundWinner.player.name} 已达到第二名 ${formatMoney(closeout.runnerUp.bid)} 的 x${formatMultiplier(closeout.multiplier)} 提前成交线，直接清点。`;
    addPublicIntel(game, "提前成交", game.roundResult, "成");
    addPublicIntel(game, "成交", `${roundWinner.player.name} 拍下仓库，开始清点。`, "成", roleById(roundWinner.player.roleId).voices?.auctionWin || VOICE_EVENTS.auctionWin);
    startSettlement(room, roundWinner.player, roundWinner.bid);
    return;
  }

  if (game.bidRound >= game.config.bidRounds - 1) {
    addPublicIntel(game, "成交", `${roundWinner.player.name} 拍下仓库，开始清点。`, "成", roleById(roundWinner.player.roleId).voices?.auctionWin || VOICE_EVENTS.auctionWin);
    startSettlement(room, roundWinner.player, roundWinner.bid);
    return;
  }

  game.bidRound += 1;
  game.roundActions = {};
  applyRoundStartRoleSkills(game);
}

function restartCurrentRound(game, bids) {
  const tied = bids.filter((entry) => entry.bid === bids[0].bid).map((entry) => entry.player.name).join("、");
  game.tieCount += 1;
  game.players.forEach((player) => {
    player.bidHistory[game.bidRound] = null;
  });
  Object.values(game.roundActions).forEach((action) => {
    action.bid = false;
  });
  game.roundResult = `第 ${game.bidRound + 1} 轮最高价平局：${tied} 同为 ${formatMoney(bids[0].bid)}，本轮重新开始。`;
  addPublicIntel(game, "平局重开", game.roundResult, "平");
}

function bidCloseoutMultiplier(roundIndex) {
  return CLOSEOUT_MULTIPLIERS[Math.min(roundIndex, CLOSEOUT_MULTIPLIERS.length - 1)];
}

function bidCloseoutInfo(bids, roundIndex) {
  const sorted = [...bids].sort((a, b) => b.bid - a.bid);
  const winner = sorted[0];
  const runnerUp = sorted[1];
  const multiplier = bidCloseoutMultiplier(roundIndex);
  if (!winner || !runnerUp || runnerUp.bid <= 0) return null;
  const required = Math.ceil(runnerUp.bid * multiplier);
  if (winner.bid >= required) return { winner, runnerUp, multiplier, required };
  return null;
}

function formatMultiplier(value) {
  if (Number.isInteger(value)) return value.toFixed(1);
  return String(Number(value.toFixed(2)));
}

function startSettlement(room, winner, finalBid) {
  const game = requireGame(room);
  room.phase = "settlement";
  winner.cash -= finalBid;
  game.lot.items.forEach((item) => {
    item.revealed = false;
    item.infoLevel = "hidden";
    item.info = { outline: false, rarity: false, revealed: false };
    item.justRevealed = false;
    item.locked = shouldAutoLockSettlementItem(item);
  });
  game.settlement = {
    winner,
    cost: finalBid,
    revealOrder: settlementRevealItems(game.lot).map((item) => item.id),
    index: 0,
    value: 0,
    items: [],
    readyToSave: false,
    autoConfirmAt: null,
    nextRevealAt: Date.now() + game.config.settlementRevealMs,
    saved: false
  };
  const timer = setInterval(() => {
    if (!room.game?.settlement || room.game.settlement.saved || room.game.settlement.readyToSave) {
      clearInterval(timer);
      return;
    }
    try {
      revealSettlementItem(room);
      touch(room);
    } catch (error) {
      console.error("settlement_reveal_failed", error);
    }
  }, game.config.settlementRevealMs);
}

function shouldAutoLockSettlementItem(item) {
  return item.rarity === "red" || item.rarity === "gold";
}

function setSettlementItemLock(room, playerId, itemId, locked) {
  const game = requireGame(room);
  const settlement = game.settlement;
  if (!settlement || settlement.saved) return;
  if (settlement.winner.id !== playerId) throwHttp("forbidden_player", 403);
  const item = game.lot.items.find((entry) => entry.id === itemId);
  if (!item || !item.revealed) throwHttp("item_not_found", 404);
  item.locked = Boolean(locked);
}

function confirmSettlement(room, playerId) {
  const game = requireGame(room);
  const settlement = game.settlement;
  if (!settlement || settlement.saved) return;
  if (!settlement.readyToSave) throwHttp("settlement_not_ready", 409);
  if (settlement.winner.id !== playerId) throwHttp("forbidden_player", 403);
  finishSettlement(room);
}

function skipSettlementReveal(room, playerId) {
  const game = requireGame(room);
  const settlement = game.settlement;
  if (!settlement || settlement.saved || settlement.readyToSave) return;
  if (settlement.winner.id !== playerId) throwHttp("forbidden_player", 403);
  const orderedItems = settlementRevealItems(game.lot);
  game.lot.items.forEach((item) => {
    item.revealed = true;
    item.justRevealed = false;
  });
  settlement.index = orderedItems.length;
  settlement.items = orderedItems;
  settlement.value = orderedItems.reduce((sum, item) => sum + item.value, 0);
  markSettlementReady(room);
}

function revealSettlementItem(room) {
  const game = requireGame(room);
  const settlement = game.settlement;
  if (!settlement || settlement.saved || settlement.readyToSave) return;
  game.lot.items.forEach((item) => {
    item.justRevealed = false;
  });
  const id = settlement.revealOrder[settlement.index];
  if (!id) {
    markSettlementReady(room);
    return;
  }
  const item = game.lot.items.find((entry) => entry.id === id);
  if (!item) {
    settlement.index += 1;
    if (settlement.index >= settlement.revealOrder.length) markSettlementReady(room);
    else settlement.nextRevealAt = Date.now() + game.config.settlementRevealMs;
    return;
  }
  item.revealed = true;
  item.justRevealed = true;
  settlement.index += 1;
  settlement.value += item.value;
  settlement.items.push(item);
  if (settlement.index >= settlement.revealOrder.length) markSettlementReady(room);
  else settlement.nextRevealAt = Date.now() + game.config.settlementRevealMs;
}

function markSettlementReady(room) {
  const game = requireGame(room);
  const settlement = game.settlement;
  if (!settlement || settlement.saved || settlement.readyToSave) return;
  const stats = reconcileSettlementState(room);
  if (stats.total > 0 && stats.revealedCount < stats.total) return;
  settlement.readyToSave = true;
  settlement.autoConfirmAt = null;
  game.lot.items.forEach((item) => {
    item.justRevealed = false;
  });
}

function syncSettlementProgress(room) {
  const settlement = room.game?.settlement;
  if (!settlement || settlement.saved) return;
  const stats = reconcileSettlementState(room);
  if (settlement.readyToSave) return;
  if (stats.total > 0 && stats.revealedCount >= stats.total) {
    markSettlementReady(room);
    touch(room);
    return;
  }
  if (settlement.index >= settlement.revealOrder.length) {
    markSettlementReady(room);
    touch(room);
    return;
  }
  const nextRevealAt = Number(settlement.nextRevealAt || 0);
  if (nextRevealAt && Date.now() < nextRevealAt) return;
  revealSettlementItem(room);
  touch(room);
}

function reconcileSettlementState(room) {
  const game = room.game;
  const settlement = game?.settlement;
  if (!game || !settlement) return { total: 0, revealedCount: 0 };
  const revealOrder = Array.isArray(settlement.revealOrder) ? settlement.revealOrder : [];
  const orderedItems = revealOrder
    .map((id) => game.lot.items.find((item) => item.id === id))
    .filter(Boolean);
  const revealLimit = Math.min(Math.max(Number(settlement.index) || 0, 0), orderedItems.length);
  orderedItems.slice(0, revealLimit).forEach((item) => {
    item.revealed = true;
  });
  const revealedItems = orderedItems.filter((item) => item.revealed);
  settlement.items = revealedItems;
  settlement.value = revealedItems.reduce((sum, item) => sum + item.value, 0);
  if (settlement.index < revealedItems.length) settlement.index = revealedItems.length;
  return { total: orderedItems.length, revealedCount: revealedItems.length };
}

function finishSettlement(room) {
  const game = requireGame(room);
  const settlement = game.settlement;
  if (settlement.saved) return;
  settlement.saved = true;
  game.lot.items.forEach((item) => {
    item.justRevealed = false;
  });
  const winner = game.players.find((player) => player.id === settlement.winner.id);
  const profit = settlement.value - settlement.cost;
  const winnerRole = roleById(winner.roleId);
  settlement.resultVoice = profit >= 0
    ? winnerRole.voices?.profit || VOICE_EVENTS.settlementProfit
    : winnerRole.voices?.loss || VOICE_EVENTS.settlementLoss;
  const consolationBonus = clampMoney(Math.floor(Math.abs(profit) / 10));
  settlement.profit = profit;
  settlement.consolationBonus = consolationBonus;
  settlement.bonuses = game.players
    .filter((player) => player.id !== winner.id)
    .map((player) => ({ playerId: player.id, name: player.name, amount: consolationBonus }));
  game.players.forEach((player) => {
    if (player.id !== winner.id) player.cash = clampMoney(player.cash + consolationBonus);
  });
  const keptItems = game.lot.items.filter((item) => item.locked);
  const soldItems = game.lot.items.filter((item) => !item.locked);
  const soldValue = soldItems.reduce((sum, item) => sum + item.value, 0);
  const keptValue = keptItems.reduce((sum, item) => sum + item.value, 0);
  winner.cash = clampMoney(winner.cash + soldValue);
  settlement.keptValue = keptValue;
  settlement.soldValue = soldValue;
  settlement.keptCount = keptItems.length;
  settlement.soldCount = soldItems.length;
  winner.items.push(...keptItems.map((item) => ({ ...item })));
  persistSettlementToAccount(room, winner, settlement, game.lot);
  game.roundResult = `${winner.name} 以 ${formatMoney(settlement.cost)} 拿下 ${game.lot.name}。真实价值 ${formatMoney(lotValue(game.lot))}，保留 ${keptItems.length} 件，自动出售 ${soldItems.length} 件获得 ${formatMoney(soldValue)}，最终${profit >= 0 ? "盈利" : "亏损"} ${formatMoney(Math.abs(profit))}。未拍中玩家各获得系统补贴 ${formatMoney(consolationBonus)}。`;
  room.phase = "finished";
}

function settlementRevealItems(lot) {
  return [...lot.items].sort((a, b) => a.y - b.y || a.x - b.x || b.w * b.h - a.w * a.h || b.value - a.value);
}

function markSeen(room, playerId) {
  if (!playerId) return;
  const player = room.players.find((entry) => entry.id === playerId);
  if (!player) return;
  player.connected = true;
  player.lastSeenAt = Date.now();
  const gamePlayer = room.game?.players.find((entry) => entry.id === playerId);
  if (gamePlayer && player.connected) {
    gamePlayer.connected = true;
    if (player.accountId) gamePlayer.human = true;
  }
}

function checkDisconnected(room) {
  if (!room.game || room.phase !== "bidding") return;
  let changed = false;
  const deadline = Date.now() - gameConfig.disconnectTimeoutSeconds * 1000;
  room.players.forEach((player) => {
    if (!player.connected || !player.lastSeenAt || player.lastSeenAt >= deadline) return;
    player.connected = false;
    const gamePlayer = room.game.players.find((entry) => entry.id === player.id);
    if (gamePlayer && gamePlayer.human) {
      gamePlayer.human = false;
      gamePlayer.connected = false;
      addPublicIntel(room.game, "AI 接管", `${gamePlayer.name} 已断开连接，由 AI 自动接管。`, "AI");
      changed = true;
    }
  });
  if (changed) maybeResolveRound(room);
  destroyRoomIfOnlyAi(room);
}

function cleanupFinishedRooms() {
  const deadline = Date.now() - FINISHED_ROOM_TTL_MS;
  for (const [id, room] of rooms.entries()) {
    if (destroyRoomIfOnlyAi(room)) continue;
    if (room.phase !== "finished") continue;
    const updatedAt = new Date(room.updatedAt || room.createdAt || 0).getTime();
    if (!Number.isFinite(updatedAt) || updatedAt <= deadline) rooms.delete(id);
  }
}

function requireGame(room) {
  if (!room.game) throwHttp("game_not_started", 409);
  return room.game;
}

function roundAction(game, playerId) {
  if (!game.roundActions[playerId]) game.roundActions[playerId] = { skill: false, tool: false, bid: false };
  return game.roundActions[playerId];
}

function prepareWarehouse(lot, config) {
  lot.cols = config.warehouseCols;
  lot.resourceBudget = rollResourceBudget(lot);
  const generated = generateWarehouseItems(lot, config);
  lot.items = generated.items;
  lot.rows = generated.rows;
  lot.resourceSpent = generated.resourceSpent;
  lot.generationMode = "resource-budget";
  lot.occupiedCells = buildOccupiedCells(lot);
  delete lot.allItems;
  return lot;
}

function generateWarehouseItems(lot, config) {
  const budget = Math.max(1, clampMoney(lot.resourceBudget || 1));
  const source = uniqueLootItems([...(lot.items || []), ...(lot.allItems || [])]);
  let best = { items: [], rows: 1, area: 0, resourceSpent: 0, score: -1 };
  const attempts = Math.max(18, Math.min(42, Math.ceil(source.length / 3)));
  for (let index = 0; index < attempts; index += 1) {
    const selected = resourceUniqueSelection(source, lot, budget);
    const layout = compactWarehouseLayout(selected.items, lot.cols, config);
    const area = itemArea(layout.items);
    const resourceSpent = itemResourceCost(layout.items);
    const budgetScore = Math.min(resourceSpent, budget);
    const fill = layout.rows > 0 ? area / (lot.cols * layout.rows) : 0;
    const score = budgetScore * 8 + area + layout.items.length * 2 + fill * 160 - layout.rows * 1.5 - Math.max(0, resourceSpent - budget) * 0.3;
    if (score > best.score || (score === best.score && Math.random() > 0.5)) best = { items: layout.items, rows: layout.rows, area, resourceSpent, score };
    if (resourceSpent >= budget && layout.items.length === selected.items.length && fill >= config.warehouseFillPercent / 100) break;
  }
  return { items: best.items, rows: best.rows, resourceSpent: best.resourceSpent };
}

function compactWarehouseLayout(items, cols, config) {
  const area = Math.max(1, itemArea(items));
  const fill = clampInteger(config.warehouseFillPercent, 30, 100, 92) / 100;
  const tallest = items.reduce((max, item) => Math.max(max, item.h || 1), 1);
  const startRows = Math.max(1, tallest, Math.ceil(area / (cols * fill)));
  const maxRows = Math.max(startRows + 20, tallest, Math.ceil(area / cols) + 80);
  let best = { items: [], rows: startRows, area: 0, score: -1 };
  for (let rows = startRows; rows <= maxRows; rows += 1) {
    const packed = autoPackItems(items, cols, rows);
    const packedArea = itemArea(packed);
    const packedAll = packed.length === items.length;
    const usedFill = packedArea / (cols * rows);
    const score = packedArea * 12 + packed.length * 20 + usedFill * 180 - rows * 2;
    if (score > best.score || (score === best.score && rows < best.rows)) best = { items: packed, rows, area: packedArea, score };
    if (packedAll) return { items: packed, rows };
  }
  return best;
}

function uniqueLootItems(items) {
  const seen = new Map();
  items.forEach((item) => {
    if (!item?.id || seen.has(item.id)) return;
    seen.set(item.id, structuredClone(item));
  });
  return [...seen.values()];
}

function resourceUniqueSelection(source, lot, budget) {
  const available = shuffle(source);
  const selected = [];
  let resourceSpent = 0;
  let misses = 0;
  const maxMisses = Math.max(20, source.length * 3);
  while (available.length && resourceSpent < budget && misses < maxMisses) {
    const rarity = pickRarityForMap(lot);
    const category = pickCategoryForMap(lot);
    const candidates = candidatesForResourceRoll(available, rarity, category);
    if (!candidates.length) {
      misses += 1;
      continue;
    }
    const remaining = Math.max(1, budget - resourceSpent);
    const candidateIndex = pickWeightedIndex(candidates, (item) => resourceItemWeight(item, lot, rarity, category, remaining));
    const template = candidates[candidateIndex];
    const sourceIndex = available.findIndex((item) => item.id === template.id);
    if (sourceIndex < 0) {
      misses += 1;
      continue;
    }
    const [item] = available.splice(sourceIndex, 1);
    const instance = instantiateLootItem(item);
    instance.resourceCost = resourceCostForValue(instance.value);
    selected.push(instance);
    resourceSpent += instance.resourceCost;
  }
  return { items: selected, resourceSpent };
}

function candidatesForResourceRoll(available, rarity, category) {
  const byRarityAndCategory = category
    ? available.filter((item) => item.rarity === rarity && itemHasCategory(item, category))
    : [];
  if (byRarityAndCategory.length) return byRarityAndCategory;
  const byRarity = available.filter((item) => item.rarity === rarity);
  if (byRarity.length) return byRarity;
  const byCategory = category ? available.filter((item) => itemHasCategory(item, category)) : [];
  if (byCategory.length) return byCategory;
  return available;
}

function resourceItemWeight(item, lot, rarity, category, remainingResource) {
  const itemCost = resourceCostForValue(item.value);
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const mapTags = Array.isArray(lot.tags) ? lot.tags : [];
  const rarityFit = item.rarity === rarity ? 1.35 : 0.42;
  const categoryFit = category && tags.includes(category) ? 1.45 : 1;
  const mapFit = tags.some((tag) => mapTags.includes(tag)) ? 1.22 : 0.72;
  const size = lootArea(item);
  const sizeFit = remainingResource < 500 ? Math.max(0.35, 3.5 / size) : size >= 8 ? 1.12 : 1;
  const budgetFit = itemCost <= remainingResource ? 1.2 : 0.58;
  const customWeight = Math.max(0.05, Number(item.weight || 1));
  return customWeight * rarityFit * categoryFit * mapFit * sizeFit * budgetFit * (0.85 + Math.random() * 0.3);
}

function pickRarityForMap(lot) {
  const weights = normalizeRarityWeights(lot.rarityWeights);
  return weightedPick(RARITY_ORDER, (rarity) => weights[rarity] || 0.001);
}

function pickCategoryForMap(lot) {
  if (lot.categoryMode === "singlePool") return null;
  const weights = normalizeCategoryWeights(lot.categoryWeights, lot.tags);
  return weightedPick(Object.keys(weights), (category) => weights[category] || 0.001);
}

function itemHasCategory(item, category) {
  return Array.isArray(item.tags) && item.tags.includes(category);
}

function rollResourceBudget(lot) {
  const values = Array.isArray(lot.resourceRoll) && lot.resourceRoll.length ? lot.resourceRoll : [3000];
  return clampMoney(values[randomInt(0, values.length - 1)]);
}

function itemResourceCost(items) {
  return items.reduce((sum, item) => sum + (item.resourceCost || resourceCostForValue(item.value)), 0);
}

function resourceCostForValue(value) {
  const amount = clampMoney(value);
  return RESOURCE_COST_TABLE.find((entry) => amount >= entry.min)?.cost || 50;
}

function instantiateLootItem(template) {
  const condition = rollCondition();
  const baseValue = clampMoney(template.value);
  return {
    ...template,
    baseValue,
    value: clampMoney(Math.round(baseValue * condition.factor)),
    condition: condition.label,
    conditionId: condition.id,
    conditionFactor: condition.factor,
    texture: template.texture || textureKeyForItem(template),
    x: 1,
    y: 1,
    infoLevel: "hidden",
    revealed: false,
    justRevealed: false
  };
}

function rollCondition() {
  const condition = weightedPick(CONDITION_TABLE, (entry) => entry.weight);
  const factor = condition.min + Math.random() * (condition.max - condition.min);
  return { ...condition, factor };
}

function weightedPick(items, weightOf) {
  return items[pickWeightedIndex(items, weightOf)];
}

function pickWeightedIndex(items, weightOf) {
  const weights = items.map((item) => Math.max(0.001, Number(weightOf(item)) || 0.001));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * total;
  for (let index = 0; index < items.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return index;
  }
  return items.length - 1;
}

function itemArea(items) {
  return items.reduce((sum, item) => sum + item.w * item.h, 0);
}

function autoPackItems(items, cols, rows) {
  const modes = shuffle(["scatter", "topLeft", "topRight", "bottomLeft", "center", "edge"]).concat("topLeft");
  let best = { placed: [], area: 0 };
  modes.forEach((mode) => {
    const packed = packItemsOnce(items, cols, rows, mode);
    const area = itemArea(packed);
    if (area > best.area || (area === best.area && Math.random() > 0.5)) best = { placed: packed, area };
  });
  return best.placed.sort((a, b) => a.y - b.y || a.x - b.x);
}

function packItemsOnce(items, cols, rows, mode) {
  const occupied = Array.from({ length: rows }, () => Array(cols).fill(false));
  const placed = [];
  const packed = createPackingOrder(items);
  packed.forEach((item) => {
    const spot = findSpot(occupied, cols, rows, item.w, item.h, mode);
    if (!spot) return;
    item.x = spot.x + 1;
    item.y = spot.y + 1;
    for (let y = spot.y; y < spot.y + item.h; y += 1) {
      for (let x = spot.x; x < spot.x + item.w; x += 1) occupied[y][x] = true;
    }
    placed.push(item);
  });
  return placed;
}

function createPackingOrder(items) {
  return items
    .map((item) => {
      const area = lootArea(item);
      const tier = area >= 12 ? 4 : area >= 8 ? 3 : area >= 4 ? 2 : 1;
      return {
        item: { ...item },
        tier,
        score: area * 0.75 + rarityRank(item.rarity) * 0.25 + Math.random() * 3
      };
    })
    .sort((a, b) => b.tier - a.tier || b.score - a.score)
    .map((entry) => entry.item);
}

function findSpot(occupied, cols, rows, w, h, mode = "topLeft") {
  const candidates = [];
  for (let y = 0; y <= rows - h; y += 1) {
    for (let x = 0; x <= cols - w; x += 1) {
      if (canPlace(occupied, x, y, w, h)) candidates.push({ x, y, score: placementScore(mode, x, y, w, h, cols, rows) });
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.score - b.score);
  return candidates[0];
}

function placementScore(mode, x, y, w, h, cols, rows) {
  const jitter = Math.random() * 2.4;
  const centerX = x + w / 2;
  const centerY = y + h / 2;
  if (mode === "scatter") return Math.random() * 100;
  if (mode === "topRight") return y * cols + (cols - x - w) + jitter;
  if (mode === "bottomLeft") return (rows - y - h) * cols + x + jitter;
  if (mode === "center") return Math.abs(centerX - cols / 2) * 1.4 + Math.abs(centerY - rows / 2) + jitter;
  if (mode === "edge") return Math.min(x, y, cols - x - w, rows - y - h) * 5 + jitter;
  return y * cols + x + jitter;
}

function canPlace(occupied, startX, startY, w, h) {
  for (let y = startY; y < startY + h; y += 1) {
    for (let x = startX; x < startX + w; x += 1) {
      if (occupied[y][x]) return false;
    }
  }
  return true;
}

function lootArea(item) {
  return item.w * item.h;
}

function rarityRank(rarity) {
  return RARITY_ORDER.indexOf(rarity) + 1 || 1;
}

function buildOccupiedCells(lot) {
  const cells = new Set();
  lot.items.forEach((item) => {
    for (let y = item.y; y < item.y + item.h; y += 1) {
      for (let x = item.x; x < item.x + item.w; x += 1) cells.add(`${x}:${y}`);
    }
  });
  return [...cells].map((key) => {
    const [x, y] = key.split(":").map(Number);
    return { x, y };
  });
}

function revealItemInfo(lot, view, level, count) {
  const flag = level === "revealed" ? "revealed" : level === "rarity" ? "rarity" : "outline";
  const selected = lot.items
    .filter((item) => !item.revealed && !viewItemInfoHas(view, item.id, flag))
    .sort((a, b) => b.w * b.h - a.w * a.h || b.value - a.value)
    .slice(0, count);
  selected.forEach((item) => {
    setViewItemInfoFlag(view, item, flag);
  });
  return selected;
}

function revealRarityInfo(lot, view, rarity) {
  const selected = lot.items.filter((item) => !item.revealed && item.rarity === rarity && !viewItemInfoHas(view, item.id, "rarity"));
  selected.forEach((item) => {
    setViewItemInfoFlag(view, item, "rarity");
  });
  return selected;
}

function pickBestRarityForTool(lot, view) {
  return ["red", "gold", "blue", "green", "common", "junk"].find((rarity) =>
    lot.items.some((item) => item.rarity === rarity && !viewItemInfoHas(view, item.id, "rarity"))
  ) || "junk";
}

function normalizeRarityCells(item = {}, cells = []) {
  if (!Array.isArray(cells)) return [];
  const seen = new Set();
  return cells
    .map((cell) => ({ x: Number(cell?.x), y: Number(cell?.y) }))
    .filter((cell) =>
      Number.isFinite(cell.x) &&
      Number.isFinite(cell.y) &&
      cell.x >= item.x &&
      cell.x < item.x + item.w &&
      cell.y >= item.y &&
      cell.y < item.y + item.h
    )
    .filter((cell) => {
      const key = `${cell.x}:${cell.y}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function randomItemCell(item = {}) {
  const width = Math.max(1, Number(item.w) || 1);
  const height = Math.max(1, Number(item.h) || 1);
  return {
    x: (Number(item.x) || 1) + Math.floor(Math.random() * width),
    y: (Number(item.y) || 1) + Math.floor(Math.random() * height)
  };
}

function ensureRarityCell(info, item) {
  info.rarityCells = normalizeRarityCells(item, info.rarityCells);
  if (!info.rarityCells.length) info.rarityCells.push(randomItemCell(item));
}

function normalizeViewItemInfo(value, item = {}) {
  if (value && typeof value === "object") {
    return {
      outline: Boolean(value.outline),
      rarity: Boolean(value.rarity),
      revealed: Boolean(value.revealed),
      rarityCells: normalizeRarityCells(item, value.rarityCells)
    };
  }
  const level = String(value || "hidden");
  const info = {
    outline: level === "outline" || level === "outline-rarity" || level === "revealed",
    rarity: level === "rarity" || level === "outline-rarity" || level === "revealed",
    revealed: level === "revealed",
    rarityCells: []
  };
  if (info.rarity && !info.outline) ensureRarityCell(info, item);
  return info;
}

function viewItemInfoHas(view, itemId, flag) {
  return Boolean(normalizeViewItemInfo(view.itemInfo[itemId])[flag]);
}

function setViewItemInfoFlag(view, itemOrId, flag) {
  const item = typeof itemOrId === "object" ? itemOrId : null;
  const itemId = item?.id || itemOrId;
  const info = normalizeViewItemInfo(view.itemInfo[itemId], item || {});
  if (flag === "revealed") {
    info.outline = true;
    info.rarity = true;
    info.revealed = true;
  } else if (flag === "outline" || flag === "rarity") {
    info[flag] = true;
    if (flag === "rarity" && item) ensureRarityCell(info, item);
  }
  view.itemInfo[itemId] = info;
}

function currentBid(game, player) {
  for (let index = game.bidRound; index >= 0; index -= 1) {
    if (player.bidHistory[index] !== null) return player.bidHistory[index];
  }
  return 0;
}

function clampBid(game, player, value) {
  const minimum = currentBid(game, player);
  const maximum = Math.min(player.cash, game.config.maxBid);
  return Math.max(minimum, Math.min(maximum, clampMoney(value)));
}

function aiBid(game, player) {
  const previous = currentBid(game, player);
  const trueValue = lotValue(game.lot);
  const pressure = (game.bidRound + 1) / game.config.bidRounds;
  const noise = 0.81 + Math.random() * 0.21;
  const target = trueValue * (0.32 + pressure * 0.48) * player.trait * noise;
  const raise = Math.max(game.config.bidStep * 2, roundToStep(target - previous, game.config.bidStep));
  const aiCap = Math.max(0, Math.min(player.cash, game.config.maxBid) - player.seat * game.config.bidStep);
  return Math.min(aiCap, Math.max(previous, roundToStep(previous + raise, game.config.bidStep)));
}

function lotValue(lot) {
  return lot.items.reduce((sum, item) => sum + item.value, 0);
}

function visibleEstimate(game, viewerId) {
  const player = game.players.find((entry) => entry.id === viewerId) || game.players.find((entry) => entry.human) || game.players[0];
  const view = player?.view || { estimateFactor: 0.28, itemInfo: {} };
  if (typeof view.exactEstimate === "number") return view.exactEstimate;
  const footprint = game.lot.occupiedCells.length * 7;
  const infoBonus = game.lot.items.reduce((sum, item) => {
    const info = item.revealed ? "revealed" : view.itemInfo[item.id];
    const flags = normalizeViewItemInfo(info, item);
    if (flags.revealed) return sum + item.value;
    if (flags.rarity) return sum + item.value * RARITY[item.rarity].floor;
    if (flags.outline) return sum + item.value * 0.18;
    return sum;
  }, 0);
  return Math.round(Math.max(footprint, lotValue(game.lot) * view.estimateFactor + infoBonus * 0.28));
}

function addPublicIntel(game, title, text, icon, voice = null) {
  game.publicIntel.unshift({ title, text, icon, voice, scope: "public" });
  game.publicIntel = game.publicIntel.slice(0, 10);
}

function addPrivateIntel(player, title, text, icon, voice = null) {
  player.view.intel.unshift({ title, text, icon, voice, scope: "private" });
  player.view.intel = player.view.intel.slice(0, 8);
}

function loadLootConfig() {
  try {
    const raw = fsSync.readFileSync(LOOT_CONFIG_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {
      items: [
        { id: "fallback-book", name: "古董书柜", w: 2, h: 2, rarity: "gold", value: 260, tags: ["文玩"] },
        { id: "fallback-radio", name: "军用电台", w: 3, h: 2, rarity: "blue", value: 210, tags: ["文玩"] },
        { id: "fallback-gem", name: "蓝宝石胸针", w: 1, h: 1, rarity: "red", value: 420, tags: ["文玩"] }
      ],
      warehouses: [{ id: "fallback", name: "临时暗仓", hint: "配置文件读取失败，使用内置兜底藏品。", tags: ["文玩", "科技", "宝石"] }]
    };
  }
}

function reloadLootConfig(config = loadLootConfig()) {
  lootConfig = config;
  lootItems = normalizeLootItems(lootConfig.items);
  warehouses = buildWarehouseTemplates(lootConfig.warehouses, lootItems);
  mapTemplates = buildMapTemplates(lootConfig.mapSettings || lootConfig.maps, lootConfig.warehouses, lootItems);
}

function loadRolesConfig() {
  try {
    return JSON.parse(fsSync.readFileSync(ROLES_CONFIG_PATH, "utf8"));
  } catch {
    return {
      version: 1,
      roles: [
        defaultRole("god-gambler", "赌神", "赌", 1.08, "开局展示所有藏品轮廓"),
        defaultRole("teacher", "老师", "师", 0.98, "每轮自动识别 2 件藏品的轮廓和稀有度"),
        defaultRole("star", "女星", "星", 1.02, "开局识别 5 件稀有度，每轮再标出 2 件位置稀有度")
      ]
    };
  }
}

function defaultRole(id, name, shortName, trait, summary) {
  return {
    id,
    name,
    role: name,
    shortName,
    trait,
    summary,
    portrait: `assets/characters/${id}.png`,
    avatar: `assets/characters/${id}.png`,
    voices: {
      start: `assets/audio/roles/${id}.wav`,
      skill: `assets/audio/roles/${id}-skill.wav`,
      auctionWin: VOICE_EVENTS.auctionWin,
      profit: VOICE_EVENTS.settlementProfit,
      loss: VOICE_EVENTS.settlementLoss
    },
    skillScript: `role-skills/${id}.js`
  };
}

function reloadRolesConfig(config = loadRolesConfig()) {
  rolesConfig = normalizeEditableRolesConfig(config);
  ROLE_POOL = normalizeRoles(rolesConfig.roles);
  DEFAULT_ROLE_ID = ROLE_POOL[0]?.id || "god-gambler";
}

function normalizeEditableRolesConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) throwHttp("invalid_roles_config", 400);
  if (!Array.isArray(config.roles) || !config.roles.length) throwHttp("roles_required", 400);
  return { version: Number(config.version || 1), roles: normalizeRoles(config.roles) };
}

function normalizeRoles(entries = []) {
  return entries.map((entry, index) => {
    const id = String(entry.id || `role-${index + 1}`).replace(/[^a-z0-9_-]/gi, "-").slice(0, 48);
    const name = String(entry.name || entry.role || `角色 ${index + 1}`).slice(0, 24);
    const voices = entry.voices && typeof entry.voices === "object" ? entry.voices : {};
    return {
      id,
      name,
      role: name,
      shortName: String(entry.shortName || name.slice(0, 1) || "?").slice(0, 2),
      trait: clampFloat(entry.trait, 0.2, 3, 1),
      summary: String(entry.summary || "").slice(0, 120),
      portrait: normalizeCharacterAssetPath(entry.portrait),
      avatar: normalizeCharacterAssetPath(entry.avatar || entry.portrait),
      voice: normalizeAudioAssetPath(entry.voice || voices.start),
      voices: {
        start: normalizeAudioAssetPath(voices.start || entry.voice),
        skill: normalizeAudioAssetPath(voices.skill || `assets/audio/roles/${id}-skill.wav`),
        auctionWin: normalizeAudioAssetPath(voices.auctionWin || VOICE_EVENTS.auctionWin),
        profit: normalizeAudioAssetPath(voices.profit || VOICE_EVENTS.settlementProfit),
        loss: normalizeAudioAssetPath(voices.loss || VOICE_EVENTS.settlementLoss)
      },
      skillScript: normalizeSkillScriptPath(entry.skillScript || `role-skills/${id}.js`)
    };
  });
}

async function saveRolesConfig(config) {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(ROLES_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function normalizeEditableLootConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) throwHttp("invalid_loot_config", 400);
  if (!Array.isArray(config.items) || !config.items.length) throwHttp("loot_items_required", 400);
  if (!Array.isArray(config.mapSettings) || !config.mapSettings.length) throwHttp("map_settings_required", 400);
  const next = structuredClone(config);
  next.version = Number(next.version || 1);
  next.items = next.items.map((item, index) => ({
    ...item,
    id: String(item.id || `item-${index + 1}`),
    name: String(item.name || `藏品 ${index + 1}`),
    w: clampInteger(item.w, 1, 8, 1),
    h: clampInteger(item.h, 1, 8, 1),
    rarity: RARITY[item.rarity] ? item.rarity : "common",
    value: clampMoney(item.value),
    tags: Array.isArray(item.tags) ? uniqueTags(item.tags) : [],
    image: normalizeAssetPath(item.image)
  }));
  next.mapSettings = next.mapSettings.map((map, index) => ({
    ...map,
    id: String(map.id || `map-${index + 1}`),
    tier: clampInteger(map.tier, 1, 5, index + 1),
    name: String(map.name || `地图 ${index + 1}`),
    ticketCost: clampMoney(map.ticketCost),
    background: normalizeBackgroundPath(map.background),
    resourceRoll: normalizeResourceRoll(map.resourceRoll, index + 1),
    rarityWeights: normalizeRarityWeights(map.rarityWeights),
    categoryWeights: map.categoryWeights && typeof map.categoryWeights === "object" ? map.categoryWeights : {},
    tags: Array.isArray(map.tags) ? uniqueTags(map.tags) : []
  }));
  if (Array.isArray(next.warehouses)) {
    next.warehouses = next.warehouses.map((entry, index) => ({
      ...entry,
      id: String(entry.id || `warehouse-${index + 1}`),
      name: String(entry.name || `暗仓 ${index + 1}`),
      hint: String(entry.hint || ""),
      tags: Array.isArray(entry.tags) ? uniqueTags(entry.tags) : []
    }));
  }
  return next;
}

async function saveLootConfig(config) {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(LOOT_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function normalizeLootItems(entries = []) {
  return entries.map((entry) => ({
    id: entry.id || crypto.randomUUID(),
    name: String(entry.name || "未命名藏品").slice(0, 24),
    x: 1,
    y: 1,
    w: clampInteger(entry.w, 1, 5, 1),
    h: clampInteger(entry.h, 1, 5, 1),
    rarity: RARITY[entry.rarity] ? entry.rarity : "common",
    value: normalizeBaseValue(entry),
    tags: Array.isArray(entry.tags) ? entry.tags.map(String) : [],
    texture: entry.texture || textureKeyForItem(entry),
    image: normalizeAssetPath(entry.image),
    infoLevel: "hidden",
    revealed: false,
    justRevealed: false
  }));
}

function normalizeAssetPath(value) {
  const textureRoot = "assets/item-textures/";
  const raw = String(value || "").trim();
  if (!raw) return "";
  const cleaned = raw.replaceAll("\\", "/").replace(/^\/+/, "").split(/[?#]/)[0];
  if (!cleaned || cleaned.includes("..") || !/\.(png|webp|jpg|jpeg)$/i.test(cleaned)) return "";
  const lower = cleaned.toLowerCase();
  const marker = lower.lastIndexOf(textureRoot);
  if (marker >= 0) return cleaned.slice(marker);
  const fileName = cleaned.split("/").pop();
  return fileName && !fileName.includes(":") ? `${textureRoot}${fileName}` : "";
}

function normalizeBackgroundPath(value) {
  const raw = String(value || "").trim();
  if (!raw) return "assets/images/background-default.png";
  const cleaned = raw.replaceAll("\\", "/").replace(/^\/+/, "").split(/[?#]/)[0];
  if (!cleaned || cleaned.includes("..") || !/^assets\/images\/.+\.(svg|png|jpg|jpeg|webp)$/i.test(cleaned)) return "assets/images/background-default.png";
  return cleaned;
}

function normalizeCharacterAssetPath(value) {
  const raw = String(value || "").trim();
  if (!raw) return "assets/characters/god-gambler.png";
  const cleaned = raw.replaceAll("\\", "/").replace(/^\/+/, "").split(/[?#]/)[0];
  if (!cleaned || cleaned.includes("..") || !/^assets\/characters\/.+\.png$/i.test(cleaned)) return "assets/characters/god-gambler.png";
  return cleaned;
}

function normalizeAudioAssetPath(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const cleaned = raw.replaceAll("\\", "/").replace(/^\/+/, "").split(/[?#]/)[0];
  if (!cleaned || cleaned.includes("..") || !/^assets\/audio\/roles\/.+\.(wav|mp3|ogg)$/i.test(cleaned) && !/^assets\/audio\/events\/.+\.(wav|mp3|ogg)$/i.test(cleaned)) return "";
  return cleaned;
}

function normalizeSkillScriptPath(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const cleaned = raw.replaceAll("\\", "/").replace(/^\/+/, "").split(/[?#]/)[0];
  if (!cleaned || cleaned.includes("..") || !/^role-skills\/.+\.js$/i.test(cleaned)) return "";
  return cleaned;
}

async function saveUploadedItemTexture(body = {}) {
  const dataUrl = String(body.dataUrl || "");
  const itemId = String(body.itemId || "item").replace(/[^a-z0-9_-]/gi, "-").slice(0, 48) || "item";
  const match = dataUrl.match(/^data:image\/png;base64,([a-z0-9+/=]+)$/i);
  if (!match) throwHttp("invalid_image_upload", 400);
  const bytes = Buffer.from(match[1], "base64");
  if (!bytes.length || bytes.length > 4 * 1024 * 1024) throwHttp("invalid_image_size", 400);
  await fs.mkdir(CUSTOM_ITEM_TEXTURE_ROOT, { recursive: true });
  const fileName = `${itemId}.png`;
  await fs.writeFile(path.join(CUSTOM_ITEM_TEXTURE_ROOT, fileName), bytes);
  return { image: `assets/item-textures/custom/${fileName}` };
}

async function saveUploadedRoleAsset(body = {}) {
  const type = String(body.type || "portrait");
  const roleId = String(body.roleId || "role").replace(/[^a-z0-9_-]/gi, "-").slice(0, 48) || "role";
  const dataUrl = String(body.dataUrl || "");
  if (type === "audio") {
    const match = dataUrl.match(/^data:audio\/(wav|mpeg|mp3|ogg);base64,([a-z0-9+/=]+)$/i);
    if (!match) throwHttp("invalid_audio_upload", 400);
    const ext = match[1].toLowerCase() === "mpeg" ? "mp3" : match[1].toLowerCase();
    const bytes = Buffer.from(match[2], "base64");
    if (!bytes.length || bytes.length > 8 * 1024 * 1024) throwHttp("invalid_audio_size", 400);
    await fs.mkdir(CUSTOM_ROLE_AUDIO_ROOT, { recursive: true });
    const fileName = `${roleId}-${Date.now().toString(36)}.${ext}`;
    await fs.writeFile(path.join(CUSTOM_ROLE_AUDIO_ROOT, fileName), bytes);
    return { path: `assets/audio/roles/custom/${fileName}` };
  }
  const match = dataUrl.match(/^data:image\/png;base64,([a-z0-9+/=]+)$/i);
  if (!match) throwHttp("invalid_image_upload", 400);
  const bytes = Buffer.from(match[1], "base64");
  if (!bytes.length || bytes.length > 4 * 1024 * 1024) throwHttp("invalid_image_size", 400);
  await fs.mkdir(CUSTOM_CHARACTER_ROOT, { recursive: true });
  const fileName = `${roleId}-${type}.png`;
  await fs.writeFile(path.join(CUSTOM_CHARACTER_ROOT, fileName), bytes);
  return { path: `assets/characters/custom/${fileName}` };
}

async function saveUploadedMapAsset(body = {}) {
  const dataUrl = String(body.dataUrl || "");
  const mapId = String(body.mapId || "map").replace(/[^a-z0-9_-]/gi, "-").slice(0, 48) || "map";
  const match = dataUrl.match(/^data:image\/png;base64,([a-z0-9+/=]+)$/i);
  if (!match) throwHttp("invalid_image_upload", 400);
  const bytes = Buffer.from(match[1], "base64");
  if (!bytes.length || bytes.length > 5 * 1024 * 1024) throwHttp("invalid_image_size", 400);
  await fs.mkdir(CUSTOM_MAP_IMAGE_ROOT, { recursive: true });
  const fileName = `${mapId}.png`;
  await fs.writeFile(path.join(CUSTOM_MAP_IMAGE_ROOT, fileName), bytes);
  return { background: `assets/images/maps/custom/${fileName}` };
}

function buildWarehouseTemplates(entries = [], items = []) {
  const source = entries.length ? entries : [{ name: "混合暗仓", hint: "全部藏品混合。", tags: [] }];
  return source.map((entry) => {
    const tags = Array.isArray(entry.tags) ? entry.tags.map(String) : [];
    const selected = tags.length ? items.filter((item) => item.tags.some((tag) => tags.includes(tag))) : items;
    return warehouse(entry.name || "混合暗仓", entry.hint || "藏品信息不明。", 15, 1, selected.length ? selected : items, items);
  });
}

function buildMapTemplates(entries = [], warehouseEntries = [], items = []) {
  const source = entries.length ? entries : defaultMapEntries(warehouseEntries);
  return source.map((entry, index) => normalizeMapTemplate(entry, index, items));
}

function defaultMapEntries(warehouseEntries = []) {
  const allTags = uniqueTags(warehouseEntries.flatMap((entry) => entry.tags || CATEGORY_TAGS));
  return [
    {
      id: "shipwreck-hold",
      tier: 1,
      name: "沉船货舱",
      hint: "低门槛旧货地图，白绿蓝物品多，偶尔混入小件高价藏品。",
      ticketCost: 5000,
      resourceRoll: [1200, 2550, 3800, 6000],
      rarityWeights: { junk: 80, common: 200, green: 240, blue: 240, gold: 120, red: 70 },
      tags: ["航海", "食品", "工业", "杂物", "科技"]
    },
    {
      id: "flea-yard",
      tier: 2,
      name: "跳蚤旧货场",
      hint: "杂货和收藏品混排，稳定产出中低价物，适合熟悉估价节奏。",
      ticketCost: 15000,
      resourceRoll: [2500, 3800, 6000, 7600],
      rarityWeights: { junk: 60, common: 220, green: 260, blue: 220, gold: 90, red: 45 },
      tags: ["杂物", "文玩", "工业", "玩具", "食品", "服饰"]
    },
    {
      id: "security-cache",
      tier: 3,
      name: "废弃安保站",
      hint: "安防、军品、科技件偏多，蓝金物品的出现率明显提高。",
      ticketCost: 40000,
      resourceRoll: [4200, 6000, 8200, 10000],
      rarityWeights: { junk: 30, common: 160, green: 240, blue: 260, gold: 160, red: 90 },
      tags: ["军品", "安防", "科技", "工业"]
    },
    {
      id: "collector-vault",
      tier: 4,
      name: "私人收藏库",
      hint: "高价文玩、宝石和科技收藏混放，门票高但回报上限更高。",
      ticketCost: 90000,
      resourceRoll: [6500, 8500, 10500, 13000],
      rarityWeights: { junk: 20, common: 120, green: 220, blue: 260, gold: 210, red: 140 },
      tags: ["文玩", "宝石", "服饰", "科技", "家具"]
    },
    {
      id: "hidden-auction",
      tier: 5,
      name: "隐拍黑箱",
      hint: "最高收益地图，所有品类进入同一池子，稀有物品权重最高。",
      ticketCost: 180000,
      resourceRoll: [10000, 12000, 15000, 18000],
      rarityWeights: { junk: 10, common: 100, green: 200, blue: 240, gold: 220, red: 200 },
      categoryMode: "singlePool",
      tags: allTags
    }
  ];
}

function normalizeMapTemplate(entry, index, items) {
  const tags = uniqueTags(Array.isArray(entry.tags) ? entry.tags : CATEGORY_TAGS);
  const selected = tags.length ? items.filter((item) => item.tags.some((tag) => tags.includes(tag))) : items;
  const tier = clampInteger(entry.tier, 1, 5, index + 1);
  return {
    id: String(entry.id || `map-${index + 1}`),
    tier,
    name: String(entry.name || `地图 ${index + 1}`).slice(0, 32),
    type: "地图暗仓",
    hint: String(entry.hint || "地图情报不足。").slice(0, 120),
    ticketCost: clampMoney(entry.ticketCost ?? tier * 10000),
    background: normalizeBackgroundPath(entry.background),
    resourceRoll: normalizeResourceRoll(entry.resourceRoll, tier),
    rarityWeights: normalizeRarityWeights(entry.rarityWeights),
    categoryWeights: normalizeCategoryWeights(entry.categoryWeights, tags),
    categoryMode: entry.categoryMode === "singlePool" ? "singlePool" : "weighted",
    tags,
    cols: 15,
    rows: 1,
    items: selected.length ? selected : items,
    allItems: items
  };
}

function normalizeResourceRoll(values, tier = 1) {
  const fallback = [1200, 2550, 3800, 6000].map((value) => value * Math.max(1, tier));
  const source = Array.isArray(values) && values.length ? values : fallback;
  return source.map((value) => clampInteger(value, 100, 50_000, 1000));
}

function normalizeRarityWeights(weights = {}) {
  const fallback = { ...RARITY_DROP_WEIGHT };
  const result = {};
  RARITY_ORDER.forEach((rarity) => {
    result[rarity] = Math.max(0.001, Number(weights?.[rarity] ?? fallback[rarity] ?? 1));
  });
  return result;
}

function normalizeCategoryWeights(weights = {}, tags = CATEGORY_TAGS) {
  const categories = uniqueTags(tags.length ? tags : CATEGORY_TAGS);
  return Object.fromEntries(categories.map((tag) => [tag, Math.max(0.001, Number(weights?.[tag] ?? 1))]));
}

function uniqueTags(tags = []) {
  return [...new Set(tags.map(String).filter(Boolean))];
}

function mapTemplateById(id) {
  return mapTemplates.find((map) => map.id === id) || mapTemplates.find((map) => map.id === DEFAULT_MAP_ID) || mapTemplates[0];
}

function publicMaps() {
  return mapTemplates.map(publicMap).sort((a, b) => a.tier - b.tier);
}

function publicMap(map) {
  return {
    id: map.id,
    tier: map.tier,
    name: map.name,
    hint: map.hint,
    background: map.background || "assets/images/background-default.png",
    ticketCost: map.ticketCost,
    categoryMode: map.categoryMode
  };
}

function roleById(id) {
  return ROLE_POOL.find((role) => role.id === id) || ROLE_POOL[0];
}

function normalizeRoleId(id) {
  return roleById(id).id;
}

function toolById(id) {
  return TOOL_DEFS.find((tool) => tool.id === id) || TOOL_DEFS[0];
}

function normalizeToolIds(ids = []) {
  const unique = [];
  (Array.isArray(ids) ? ids : []).forEach((id) => {
    const normalized = toolById(id).id;
    if (!unique.includes(normalized)) unique.push(normalized);
  });
  if (!unique.length) unique.push(...DEFAULT_TOOL_IDS);
  return unique.slice(0, MAX_LOADOUT_TOOLS);
}

function warehouse(name, hint, cols, rows, items, allItems = items) {
  return { name, type: "战利品仓库", hint, cols, rows, items, allItems };
}

function loot(name, w, h, rarity, value) {
  return { id: crypto.randomUUID(), name, x: 1, y: 1, w, h, rarity, value, revealed: false, justRevealed: false };
}

function textureKeyForItem(item = {}) {
  const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).toLowerCase()) : [];
  const name = String(item.name || "").toLowerCase();
  if (tags.some((tag) => ["vehicle", "industrial", "载具", "工业"].includes(tag)) || /车|机|缸|metal|engine/.test(name)) return "metal";
  if (tags.some((tag) => ["culture", "fashion", "文玩", "服饰"].includes(tag)) || /书|画|纸|服|绸|book|paper/.test(name)) return "paper";
  if (tags.some((tag) => ["gem", "nav", "宝石", "航海"].includes(tag)) || /玉|宝|珠|石|gem/.test(name)) return "crystal";
  if (tags.some((tag) => ["food", "食品"].includes(tag)) || /酒|罐|茶|food/.test(name)) return "ceramic";
  if (tags.some((tag) => ["military", "security", "tech", "军品", "安防", "科技"].includes(tag)) || /电|芯|路由|雷达|tech/.test(name)) return "tech";
  if (tags.some((tag) => ["junk", "杂物"].includes(tag)) || /旧|破|残|junk/.test(name)) return "worn";
  return "lacquer";
}

function publicRoom(room, viewerId = null) {
  syncSettlementProgress(room);
  return {
    id: room.id,
    phase: room.phase,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    maxPlayers: room.maxPlayers,
    map: publicMap(mapTemplateById(room.mapId)),
    maps: publicMaps(),
    players: room.players.map(publicLobbyPlayer),
    actions: room.actions.slice(-20),
    game: room.game ? publicGame(room.game, viewerId) : null
  };
}

function publicLobbyPlayer(player) {
  return {
    id: player.id,
    name: player.name,
    roleId: player.roleId || DEFAULT_ROLE_ID,
    role: roleById(player.roleId).role,
    toolIds: normalizeToolIds(player.toolIds),
    accountName: player.accountName || null,
    seat: player.seat,
    connected: player.connected,
    joinedAt: player.joinedAt,
    lastSeenAt: player.lastSeenAt,
    accountName: player.accountName || null,
    accountDisplayName: player.accountDisplayName || null
  };
}

function publicGame(game, viewerId) {
  const viewer = game.players.find((player) => player.id === viewerId) || null;
  const view = viewer?.view || { itemInfo: {}, intel: [] };
  const viewerAction = viewerId && game.roundActions[viewerId]
    ? { [viewerId]: { ...game.roundActions[viewerId] } }
    : {};
  const { allItems, resourceBudget, resourceSpent, resourceRoll, rarityWeights, categoryWeights, tags, ...publicLotBase } = game.lot;
  const lot = {
    ...publicLotBase,
    items: game.lot.items.map((item) => {
      const info = item.revealed
        ? { outline: true, rarity: true, revealed: true, rarityCells: [] }
        : normalizeViewItemInfo(view.itemInfo[item.id], item);
      return publicLotItem(item, info, Boolean(game.settlement));
    })
  };
  const players = game.players.map((player) => publicPlayer(game, player, viewerId));
  const settlement = game.settlement
    ? { ...game.settlement, winner: publicPlayer(game, game.settlement.winner, viewerId), lot }
    : null;
  return {
    bidRound: game.bidRound,
    maxBidRounds: game.config.bidRounds,
    config: publicConfig(game.config),
    players,
    lot,
    intel: [...(view.intel || []), ...game.publicIntel].slice(0, 12),
    roundActions: viewerAction,
    roundResult: game.roundResult,
    settlement,
    visibleEstimate: visibleEstimate(game, viewerId),
    tieCount: game.tieCount
  };
}

function publicLotItem(item, info, includePendingLayout = false) {
  const infoLevel = info.revealed ? "revealed" : info.outline && info.rarity ? "outline-rarity" : info.outline ? "outline" : info.rarity ? "rarity" : "hidden";
  const base = {
    id: item.id,
    info,
    infoLevel,
    revealed: Boolean(item.revealed || info.revealed),
    justRevealed: Boolean(item.justRevealed),
    locked: Boolean(item.locked)
  };
  if (includePendingLayout || info.outline || info.revealed) {
    base.x = item.x;
    base.y = item.y;
    base.w = item.w;
    base.h = item.h;
  }
  if (info.rarity || info.revealed) base.rarity = item.rarity;
  if (info.revealed || item.revealed) {
    return {
      ...base,
      name: item.name,
      value: item.value,
      baseValue: item.baseValue,
      condition: item.condition,
      conditionMultiplier: item.conditionMultiplier,
      tags: item.tags,
      image: item.image,
      sourceLot: item.sourceLot
    };
  }
  return base;
}

function publicPlayer(game, player, viewerId) {
  const ownView = !viewerId || player.id === viewerId;
  const inventoryValue = player.items.reduce((sum, item) => sum + item.value, 0);
  return {
    ...player,
    bidHistory: visibleBidHistory(game, player, viewerId),
    bidSubmitted: Boolean(game.roundActions[player.id]?.bid || player.bidHistory[game.bidRound] !== null),
    items: ownView ? player.items : [],
    itemCount: player.items.length,
    inventoryValue,
    view: undefined
  };
}

function visibleBidHistory(game, player, viewerId) {
  return player.bidHistory.map((bid, index) => {
    if (index !== game.bidRound || game.settlement || player.id === viewerId) return bid;
    return null;
  });
}

function publicRoomSummary(room) {
  return { id: room.id, phase: room.phase, players: room.players.length, maxPlayers: room.maxPlayers, updatedAt: room.updatedAt, map: publicMap(mapTemplateById(room.mapId)) };
}

function adminRoomSummary(room) {
  return {
    id: room.id,
    phase: room.phase,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    playerCount: room.players.length,
    maxPlayers: room.maxPlayers,
    map: publicMap(mapTemplateById(room.mapId)),
    players: room.players.map(adminLobbyPlayer),
    game: room.game ? adminGameSummary(room.game) : null
  };
}

function adminRoomDetail(room) {
  return {
    ...adminRoomSummary(room),
    actions: room.actions.slice(-30),
    game: room.game ? adminGameDetail(room.game) : null
  };
}

function adminLobbyPlayer(player) {
  return {
    id: player.id,
    name: player.name,
    roleId: player.roleId || DEFAULT_ROLE_ID,
    role: roleById(player.roleId).role,
    seat: player.seat,
    connected: player.connected,
    joinedAt: player.joinedAt,
    lastSeenAt: player.lastSeenAt ? new Date(player.lastSeenAt).toISOString() : null
  };
}

function adminGameSummary(game) {
  const totalValue = lotValue(game.lot);
  return {
    bidRound: game.bidRound,
    maxBidRounds: game.config.bidRounds,
    config: publicConfig(game.config),
    phaseText: game.settlement ? "settlement" : "bidding",
    lotName: game.lot.name,
    lotHint: game.lot.hint,
    totalValue,
    itemCount: game.lot.items.length,
    lotRows: game.lot.rows,
    lotCols: game.lot.cols,
    occupiedCells: game.lot.occupiedCells.length,
    resourceBudget: game.lot.resourceBudget || 0,
    resourceSpent: game.lot.resourceSpent || 0,
    ticketCost: game.lot.ticketCost || 0,
    roundResult: game.roundResult,
    tieCount: game.tieCount,
    settlement: game.settlement ? adminSettlement(game.settlement, game.lot) : null
  };
}

function adminGameDetail(game) {
  return {
    ...adminGameSummary(game),
    players: game.players.map((player) => adminGamePlayer(game, player)),
    lot: {
      name: game.lot.name,
      hint: game.lot.hint,
      cols: game.lot.cols,
    rows: game.lot.rows,
      totalValue: lotValue(game.lot),
      resourceBudget: game.lot.resourceBudget || 0,
      resourceSpent: game.lot.resourceSpent || 0,
      items: game.lot.items.map((item) => ({
        id: item.id,
        name: item.name,
        rarity: item.rarity,
        baseValue: item.baseValue,
        value: item.value,
        condition: item.condition,
        size: `${item.w}x${item.h}`,
        x: item.x,
        y: item.y
      }))
    },
    publicIntel: game.publicIntel.slice(0, 10)
  };
}

function adminGamePlayer(game, player) {
  const action = game.roundActions[player.id] || { skill: false, tool: false, bid: false };
  return {
    id: player.id,
    name: player.name,
    accountName: player.accountName || null,
    seat: player.seat,
    roleId: player.roleId,
    role: player.role,
    toolIds: normalizeToolIds(player.toolIds),
    cash: player.cash,
    human: player.human,
    connected: player.connected,
    currentBid: currentBid(game, player),
    bidHistory: player.bidHistory,
    action: { ...action },
    itemCount: player.items.length,
    inventoryValue: player.items.reduce((sum, item) => sum + item.value, 0),
    privateIntelCount: player.view?.intel?.length || 0
  };
}

function adminSettlement(settlement, lot) {
  return {
    winnerId: settlement.winner.id,
    winnerName: settlement.winner.name,
    cost: settlement.cost,
    value: settlement.value,
    profit: settlement.value - settlement.cost,
    consolationBonus: settlement.consolationBonus || 0,
    bonuses: settlement.bonuses || [],
    keptValue: settlement.keptValue || 0,
    soldValue: settlement.soldValue || 0,
    keptCount: settlement.keptCount || 0,
    soldCount: settlement.soldCount || 0,
    index: settlement.index,
    total: settlement.revealOrder.length,
    saved: settlement.saved,
    lotValue: lotValue(lot)
  };
}

function loadAccountStore() {
  try {
    const raw = fsSync.readFileSync(ACCOUNTS_PATH, "utf8");
    return normalizeAccountStore(JSON.parse(raw));
  } catch {
    return normalizeAccountStore({});
  }
}

function normalizeAccountStore(input) {
  const store = {
    version: 1,
    accounts: Array.isArray(input.accounts) ? input.accounts : [],
    sessions: Array.isArray(input.sessions) ? input.sessions : []
  };
  store.accounts = store.accounts.map((account) => ({
    id: String(account.id || crypto.randomUUID()),
    username: normalizeUsername(account.username || ""),
    displayName: String(account.displayName || account.username || "Player").slice(0, 18),
    passwordSalt: String(account.passwordSalt || ""),
    passwordHash: String(account.passwordHash || ""),
    cash: clampMoney(account.cash ?? DEFAULT_GAME_CONFIG.startingCash),
    items: normalizeAccountItems(account.items),
    stats: normalizeAccountStats(account.stats),
    createdAt: account.createdAt || now(),
    updatedAt: account.updatedAt || account.createdAt || now(),
    lastLoginAt: account.lastLoginAt || null
  })).filter((account) => account.username && account.passwordSalt && account.passwordHash);
  store.sessions = store.sessions
    .map((session) => ({
      token: String(session.token || ""),
      accountId: String(session.accountId || ""),
      createdAt: session.createdAt || now(),
      expiresAt: Number(session.expiresAt || 0)
    }))
    .filter((session) => session.token && session.accountId && session.expiresAt > Date.now());
  return store;
}

function normalizeAccountStats(stats = {}) {
  return {
    gamesPlayed: clampInteger(stats.gamesPlayed, 0, 999_999, 0),
    wins: clampInteger(stats.wins, 0, 999_999, 0),
    totalSpent: Math.max(0, Math.trunc(Number(stats.totalSpent || 0))),
    totalLootValue: Math.max(0, Math.trunc(Number(stats.totalLootValue || 0))),
    totalProfit: Math.trunc(Number(stats.totalProfit || 0))
  };
}

function normalizeAccountItems(items = []) {
  return Array.isArray(items) ? items.map(accountItemFromStored).filter(Boolean) : [];
}

function accountItemFromStored(item) {
  if (!item || typeof item !== "object") return null;
  return {
    id: String(item.id || crypto.randomUUID()),
    instanceId: String(item.instanceId || crypto.randomUUID()),
    name: String(item.name || "Unknown").slice(0, 32),
    w: clampInteger(item.w, 1, 8, 1),
    h: clampInteger(item.h, 1, 8, 1),
    x: clampInteger(item.x, 1, 99, 1),
    y: clampInteger(item.y, 1, 99, 1),
    rarity: RARITY[item.rarity] ? item.rarity : "common",
    value: clampMoney(item.value),
    baseValue: clampMoney(item.baseValue || item.value),
    condition: String(item.condition || ""),
    conditionId: String(item.conditionId || ""),
    conditionFactor: Number(item.conditionFactor || 1),
    tags: Array.isArray(item.tags) ? item.tags.map(String).slice(0, 8) : [],
    texture: String(item.texture || textureKeyForItem(item)),
    image: normalizeAssetPath(item.image),
    locked: Boolean(item.locked),
    displaySlot: normalizeDisplaySlot(item.displaySlot),
    sourceLot: String(item.sourceLot || ""),
    sourceRoom: String(item.sourceRoom || ""),
    acquiredAt: item.acquiredAt || now()
  };
}

function normalizeDisplaySlot(value) {
  if (value === null || value === undefined || value === "") return null;
  const slot = Number(value);
  if (!Number.isInteger(slot) || slot < 0 || slot >= DISPLAY_SHELF_SLOTS) return null;
  return slot;
}

async function handleAccountItemAction(account, instanceId, action, body = {}) {
  account.items = normalizeAccountItems(account.items);
  const item = account.items.find((entry) => entry.instanceId === instanceId);
  if (!item) throwHttp("item_not_found", 404);

  if (action === "lock") {
    item.locked = Boolean(body.locked);
  } else if (action === "exhibit") {
    const slot = normalizeDisplaySlot(body.displaySlot);
    account.items.forEach((entry) => {
      if (entry.instanceId !== item.instanceId && entry.displaySlot === slot) entry.displaySlot = null;
    });
    item.displaySlot = slot;
  } else if (action === "sell") {
    if (item.locked) throwHttp("item_locked", 409);
    account.items = account.items.filter((entry) => entry.instanceId !== item.instanceId);
    account.cash = clampMoney(account.cash + item.value);
  } else {
    throwHttp("unknown_item_action", 400);
  }

  account.updatedAt = now();
  await queueAccountSave();
}

async function registerAccount(input = {}) {
  const username = normalizeUsername(input.username);
  const password = String(input.password || "");
  if (!ACCOUNT_USERNAME_RE.test(username)) throwHttp("invalid_username", 400);
  if (password.length < PASSWORD_MIN_LENGTH) throwHttp("weak_password", 400);
  if (accountStore.accounts.some((account) => account.username === username)) throwHttp("username_taken", 409);

  const passwordSalt = crypto.randomBytes(16).toString("hex");
  const passwordHash = await hashPassword(password, passwordSalt);
  const displayName = String(input.displayName || input.username || username).trim().slice(0, 18) || username;
  const account = {
    id: crypto.randomUUID(),
    username,
    displayName,
    passwordSalt,
    passwordHash,
    cash: clampMoney(gameConfig.startingCash || DEFAULT_GAME_CONFIG.startingCash),
    items: [],
    stats: normalizeAccountStats(),
    createdAt: now(),
    updatedAt: now(),
    lastLoginAt: now()
  };
  accountStore.accounts.push(account);
  await queueAccountSave();
  return account;
}

async function loginAccount(input = {}) {
  const username = normalizeUsername(input.username);
  const password = String(input.password || "");
  const account = accountStore.accounts.find((entry) => entry.username === username);
  if (!account || !(await verifyPassword(password, account.passwordSalt, account.passwordHash))) {
    throwHttp("invalid_credentials", 401);
  }
  return account;
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(String(password), salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key.toString("hex"));
    });
  });
}

async function verifyPassword(password, salt, expectedHash) {
  const actualHash = await hashPassword(password, salt);
  const actual = Buffer.from(actualHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

function createSession(account) {
  const session = {
    token: crypto.randomBytes(32).toString("hex"),
    accountId: account.id,
    createdAt: now(),
    expiresAt: Date.now() + SESSION_TTL_MS
  };
  accountStore.sessions = accountStore.sessions.filter((entry) => entry.accountId !== account.id && entry.expiresAt > Date.now());
  accountStore.sessions.push(session);
  return session;
}

function accountFromRequest(req) {
  const token = sessionTokenFromRequest(req);
  if (!token) return null;
  const session = accountStore.sessions.find((entry) => entry.token === token && entry.expiresAt > Date.now());
  if (!session) return null;
  return accountStore.accounts.find((account) => account.id === session.accountId) || null;
}

function requireAccount(req) {
  const account = accountFromRequest(req);
  if (!account) throwHttp("auth_required", 401);
  return account;
}

function sessionTokenFromRequest(req) {
  return parseCookies(req.headers.cookie || "")[SESSION_COOKIE] || "";
}

function requireAdmin(req, url = null) {
  if (!ADMIN_TOKEN) return;
  const provided = adminTokenFromRequest(req, url);
  if (!safeEqualString(provided, ADMIN_TOKEN)) throwHttp("admin_auth_required", 401);
}

function adminTokenFromRequest(req, url = null) {
  const auth = String(req.headers.authorization || "");
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  const headerToken = req.headers["x-admin-token"];
  if (headerToken) return Array.isArray(headerToken) ? String(headerToken[0]) : String(headerToken);
  if (url?.searchParams?.has("admin_token")) return String(url.searchParams.get("admin_token") || "");
  return "";
}

function safeEqualString(actual, expected) {
  const actualBuffer = Buffer.from(String(actual || ""));
  const expectedBuffer = Buffer.from(String(expected || ""));
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function parseCookies(header) {
  return String(header || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const index = part.indexOf("=");
      if (index === -1) return cookies;
      cookies[decodeURIComponent(part.slice(0, index))] = decodeURIComponent(part.slice(index + 1));
      return cookies;
    }, {});
}

function sessionCookieHeader(session) {
  return `${SESSION_COOKIE}=${encodeURIComponent(session.token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(session.expiresAt).toUTCString()}${COOKIE_SECURE ? "; Secure" : ""}`;
}

function clearSessionCookieHeader() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${COOKIE_SECURE ? "; Secure" : ""}`;
}

function publicAccount(account, includeItems = false) {
  const items = normalizeAccountItems(account.items);
  const payload = {
    id: account.id,
    username: account.username,
    displayName: account.displayName,
    cash: clampMoney(account.cash),
    itemCount: items.length,
    inventoryValue: items.reduce((sum, item) => sum + item.value, 0),
    netWorth: Math.trunc(Number(account.cash || 0)) + items.reduce((sum, item) => sum + item.value, 0),
    shelfSlots: DISPLAY_SHELF_SLOTS,
    stats: normalizeAccountStats(account.stats),
    createdAt: account.createdAt,
    updatedAt: account.updatedAt
  };
  if (includeItems) payload.items = items;
  return payload;
}

function accountSnapshot(account) {
  return {
    cash: clampMoney(account.cash),
    items: normalizeAccountItems(account.items)
  };
}

function refreshPlayerAccountSnapshot(player) {
  if (!player.accountId) return;
  const account = accountStore.accounts.find((entry) => entry.id === player.accountId);
  if (!account) return;
  player.accountName = account.username;
  player.accountDisplayName = account.displayName;
  player.accountSnapshot = accountSnapshot(account);
}

function viewerIdForRequest(req, room, requestedPlayerId) {
  const account = accountFromRequest(req);
  if (!account) {
    const requested = requestedPlayerId ? room.players.find((entry) => entry.id === requestedPlayerId) : null;
    if (requested?.accountId) throwHttp("auth_required", 401);
    return requestedPlayerId;
  }
  const player = requestedPlayerId
    ? room.players.find((entry) => entry.id === requestedPlayerId)
    : room.players.find((entry) => entry.accountId === account.id);
  if (!player) return requestedPlayerId;
  if (player.accountId && player.accountId !== account.id) throwHttp("forbidden_player", 403);
  return player.id;
}

function authorizedPlayerId(account, room, requestedPlayerId) {
  const player = requestedPlayerId
    ? room.players.find((entry) => entry.id === requestedPlayerId)
    : room.players.find((entry) => entry.accountId === account.id);
  if (!player) throwHttp("player_not_found", 404);
  if (player.accountId && player.accountId !== account.id) throwHttp("forbidden_player", 403);
  return player.id;
}

function persistSettlementToAccount(room, winner, settlement, lot) {
  room.game.players.forEach((player) => {
    if (!player.accountId) return;
    const account = accountStore.accounts.find((entry) => entry.id === player.accountId);
    if (!account) return;
    account.cash = clampMoney(player.cash);
    account.stats = normalizeAccountStats({
      ...account.stats,
      gamesPlayed: (account.stats?.gamesPlayed || 0) + 1
    });
    account.updatedAt = now();
  });

  if (!winner?.accountId) {
    queueAccountSave();
    return;
  }
  const account = accountStore.accounts.find((entry) => entry.id === winner.accountId);
  if (!account) return;
  const keptItems = lot.items.filter((item) => item.locked);
  const wonItems = keptItems.map((item) => accountItemFromStored({
    ...item,
    instanceId: crypto.randomUUID(),
    locked: true,
    sourceLot: lot.name,
    sourceRoom: room.id,
    acquiredAt: now()
  }));
  account.items.push(...wonItems);
  account.cash = clampMoney(winner.cash);
  account.stats = normalizeAccountStats({
    ...account.stats,
    wins: (account.stats?.wins || 0) + 1,
    totalSpent: (account.stats?.totalSpent || 0) + settlement.cost,
    totalLootValue: (account.stats?.totalLootValue || 0) + lotValue(lot)
  });
  account.updatedAt = now();

  room.players.forEach(refreshPlayerAccountSnapshot);
  queueAccountSave();
}

function queueAccountSave() {
  accountStore.sessions = accountStore.sessions.filter((session) => session.expiresAt > Date.now());
  accountSaveQueue = accountSaveQueue
    .catch((error) => {
      console.error("account_save_previous_failed", error);
    })
    .then(saveAccountStore);
  return accountSaveQueue;
}

async function saveAccountStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tempPath = `${ACCOUNTS_PATH}.tmp`;
  const serializable = {
    version: 1,
    accounts: accountStore.accounts,
    sessions: accountStore.sessions
  };
  await fs.writeFile(tempPath, `${JSON.stringify(serializable, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, ACCOUNTS_PATH);
}

function makeRoomId() {
  let id;
  do {
    id = crypto.randomBytes(3).toString("hex").toUpperCase();
  } while (rooms.has(id));
  return id;
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > JSON_BODY_LIMIT) throwHttp("request_body_too_large", 413);
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function applyRateLimit(req, url) {
  const limit = rateLimitForRequest(req, url);
  if (!limit) return;
  const key = `${limit.scope}:${clientIp(req)}`;
  const nowMs = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || entry.resetAt <= nowMs) {
    rateLimits.set(key, { count: 1, resetAt: nowMs + RATE_LIMIT_WINDOW_MS });
    cleanupRateLimits(nowMs);
    return;
  }
  entry.count += 1;
  if (entry.count > limit.max) throwHttp("rate_limited", 429);
}

function rateLimitForRequest(req, url) {
  if (req.method === "POST" && (url.pathname === "/api/auth/login" || url.pathname === "/api/auth/register")) {
    return { scope: "auth", max: AUTH_RATE_LIMIT };
  }
  if (req.method === "POST" && /^\/api\/rooms\/[A-Z0-9]{4,8}\/action$/.test(url.pathname)) {
    return { scope: "action", max: ACTION_RATE_LIMIT };
  }
  return null;
}

function cleanupRateLimits(nowMs = Date.now()) {
  if (rateLimits.size < 5000) return;
  for (const [key, entry] of rateLimits.entries()) {
    if (entry.resetAt <= nowMs) rateLimits.delete(key);
  }
}

function clientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket.remoteAddress || "unknown";
}

function sendJson(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  res.end(JSON.stringify(body, null, 2));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  res.end(text);
}

function throwHttp(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function touch(room) {
  room.updatedAt = now();
}

function now() {
  return new Date().toISOString();
}

function normalizeConfig(input, base = DEFAULT_GAME_CONFIG) {
  const next = { ...base };
  next.bidRounds = clampInteger(input.bidRounds, 1, 12, next.bidRounds);
  next.startingCash = clampInteger(input.startingCash, 1_000, MAX_MONEY, next.startingCash);
  next.maxBid = clampInteger(input.maxBid, 1_000, MAX_MONEY, next.maxBid);
  next.bidStep = clampInteger(input.bidStep, 1, 10_000_000, next.bidStep);
  next.warehouseCols = 15;
  next.warehouseFillPercent = clampInteger(input.warehouseFillPercent, 30, 100, next.warehouseFillPercent);
  next.skillRevealCount = clampInteger(input.skillRevealCount, 1, 12, next.skillRevealCount);
  next.disconnectTimeoutSeconds = clampInteger(input.disconnectTimeoutSeconds, 3, 300, next.disconnectTimeoutSeconds);
  next.settlementRevealMs = clampInteger(input.settlementRevealMs, 180, 5_000, next.settlementRevealMs);

  if (next.maxBid < next.bidStep) next.maxBid = next.bidStep;
  if (next.startingCash > next.maxBid) next.startingCash = next.maxBid;
  return next;
}

function loadSavedConfig() {
  try {
    const raw = fsSync.readFileSync(CONFIG_PATH, "utf8");
    return normalizeConfig(JSON.parse(raw), DEFAULT_GAME_CONFIG);
  } catch {
    return { ...DEFAULT_GAME_CONFIG };
  }
}

async function saveConfig(config) {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, `${JSON.stringify(publicConfig(config), null, 2)}\n`, "utf8");
}

function setGameConfigForTest(config) {
  gameConfig = normalizeConfig(config, DEFAULT_GAME_CONFIG);
  return publicConfig(gameConfig);
}

function publicConfig(config) {
  return { ...config };
}

function normalizeBaseValue(entry) {
  return clampInteger(entry.value, 1, MAX_MONEY, 1);
}

function clampInteger(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function clampFloat(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function clampMoney(value) {
  return Math.max(0, Math.min(MAX_MONEY, Math.trunc(Number(value || 0))));
}

function roundToStep(value, step) {
  return Math.round(Number(value || 0) / step) * step;
}

function formatMoney(value) {
  return Math.trunc(Number(value || 0)).toLocaleString("zh-CN");
}

function randomInt(min, max) {
  const low = Math.ceil(Math.min(min, max));
  const high = Math.floor(Math.max(min, max));
  return low + Math.floor(Math.random() * (high - low + 1));
}

function shuffle(items) {
  return items.map((value) => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(({ value }) => value);
}

function getLanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((entry) => entry && entry.family === "IPv4" && !entry.internal)
    .map((entry) => entry.address);
}

function serverUrls() {
  return {
    local: `http://localhost:${PORT}`,
    admin: `http://localhost:${PORT}/admin.html`,
    lan: getLanAddresses().map((address) => `http://${address}:${PORT}`)
  };
}

module.exports = {
  applyRoomAction,
  checkDisconnected,
  createRoom,
  joinRoom,
  publicRoom,
  setGameConfigForTest,
  startServer
};
