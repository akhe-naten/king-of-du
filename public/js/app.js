const MAX_MONEY = 999_999_999;

const DEFAULT_GAME_CONFIG = {
  bidRounds: 6,
  startingCash: 900_000,
  maxBid: MAX_MONEY,
  bidStep: 10_000,
  warehouseCols: 15,
  warehouseFillPercent: 92,
  skillRevealCount: 2,
  disconnectTimeoutSeconds: 10,
  settlementRevealMs: 260
};
const SETTLEMENT_AUTO_CONFIRM_MS = 5_000;

const RARITY = {
  junk: { label: "灰色", color: "#9aa2a9", floor: 0.25 },
  common: { label: "白色", color: "#f0f4f7", floor: 0.38 },
  green: { label: "绿色", color: "#79e28c", floor: 0.48 },
  blue: { label: "蓝色", color: "#52c8ff", floor: 0.58 },
  gold: { label: "金色", color: "#d9a941", floor: 0.68 },
  red: { label: "红色", color: "#ff6579", floor: 0.78 }
};
const RARITY_ORDER = ["junk", "common", "green", "blue", "gold", "red"];
const WAREHOUSE_COLS = 15;
const DEFAULT_ITEM_IMAGE = "assets/item-textures/placeholder.png";
const PLACEHOLDER_IMAGE_ROOT = "assets/item-textures/placeholders";
const VOICE_EVENTS = {
  auctionWin: "assets/audio/events/auction-win.wav",
  settlementProfit: "assets/audio/events/settlement-profit.wav",
  settlementLoss: "assets/audio/events/settlement-loss.wav"
};
let ROLES = [
  { id: "god-gambler", name: "Gambler", shortName: "G", trait: 1.08, portrait: "assets/characters/god-gambler.png", avatar: "assets/characters/god-gambler.png", voice: "assets/audio/roles/god-gambler.wav", voices: { start: "assets/audio/roles/god-gambler.wav", skill: "assets/audio/roles/god-gambler-skill.wav", auctionWin: VOICE_EVENTS.auctionWin, profit: VOICE_EVENTS.settlementProfit, loss: VOICE_EVENTS.settlementLoss }, summary: "Reveal all outlines at game start.", skillScript: "role-skills/god-gambler.js" },
  { id: "teacher", name: "Teacher", shortName: "T", trait: 0.98, portrait: "assets/characters/teacher.png", avatar: "assets/characters/teacher.png", voice: "assets/audio/roles/teacher.wav", voices: { start: "assets/audio/roles/teacher.wav", skill: "assets/audio/roles/teacher-skill.wav", auctionWin: VOICE_EVENTS.auctionWin, profit: VOICE_EVENTS.settlementProfit, loss: VOICE_EVENTS.settlementLoss }, summary: "Reveal two item outlines and rarities before each bid round.", skillScript: "role-skills/teacher.js" },
  { id: "star", name: "Star", shortName: "S", trait: 1.02, portrait: "assets/characters/star.png", avatar: "assets/characters/star.png", voice: "assets/audio/roles/star.wav", voices: { start: "assets/audio/roles/star.wav", skill: "assets/audio/roles/star-skill.wav", auctionWin: VOICE_EVENTS.auctionWin, profit: VOICE_EVENTS.settlementProfit, loss: VOICE_EVENTS.settlementLoss }, summary: "Reveal rarity cells at start and each round.", skillScript: "role-skills/star.js" }
];
let DEFAULT_ROLE_ID = ROLES[0].id;
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

const playersSeed = [
  { id: "you", name: "KNZEO", roleId: "god-gambler", cash: DEFAULT_GAME_CONFIG.startingCash, human: true, items: [] },
  { id: "sophia", name: "棱哈二世", roleId: "teacher", cash: DEFAULT_GAME_CONFIG.startingCash, items: [] },
  { id: "cloud", name: "云玩家", roleId: "star", cash: DEFAULT_GAME_CONFIG.startingCash, items: [] },
  { id: "curious", name: "瞎奇", roleId: "god-gambler", cash: DEFAULT_GAME_CONFIG.startingCash, items: [] }
];

const fallbackWarehouses = [
  warehouse("文博集装箱", "本场拍卖共有金色品质道具 4 件", 15, 1, [
    loot("古董书柜", 2, 2, "gold", 260, "柜"),
    loot("军用电台", 3, 2, "blue", 210, "台"),
    loot("银质怀表", 1, 1, "gold", 180, "表"),
    loot("旧画框", 2, 3, "green", 120, "画"),
    loot("破布包", 2, 1, "junk", 35, "包"),
    loot("密封药盒", 2, 2, "red", 360, "药"),
    loot("机械零件箱", 3, 2, "common", 90, "件"),
    loot("蓝宝石胸针", 1, 1, "blue", 230, "针"),
    loot("航海罗盘", 2, 2, "gold", 300, "盘")
  ]),
  warehouse("废弃安保仓", "红色品质道具至少 1 件，但大件占格较多", 15, 1, [
    loot("防弹插板", 2, 3, "blue", 220, "板"),
    loot("光学瞄具", 2, 1, "gold", 280, "镜"),
    loot("旧保险箱", 3, 3, "red", 430, "箱"),
    loot("钥匙串", 1, 1, "green", 110, "钥"),
    loot("散装弹匣", 3, 1, "common", 100, "匣"),
    loot("损坏头盔", 2, 2, "junk", 55, "盔"),
    loot("加密硬盘", 1, 1, "gold", 320, "盘"),
    loot("工具箱", 3, 2, "green", 160, "具")
  ]),
  warehouse("港口无人认领箱", "货箱很重，蓝色品质道具数量偏多", 15, 1, [
    loot("潜水腕表", 1, 1, "gold", 310, "表"),
    loot("船用仪表", 2, 2, "blue", 190, "仪"),
    loot("密封金属盒", 2, 2, "blue", 240, "盒"),
    loot("湿报纸", 2, 2, "junk", 20, "纸"),
    loot("铜制船灯", 2, 3, "green", 150, "灯"),
    loot("进口酒箱", 3, 2, "common", 130, "酒"),
    loot("古币袋", 1, 2, "gold", 260, "币"),
    loot("发动机残件", 4, 2, "junk", 70, "机")
  ]),
  warehouse("剧院后台柜", "白色和绿色物品很多，疑似藏着一件小尺寸高价值物", 15, 1, [
    loot("手工戏服", 2, 4, "green", 180, "服"),
    loot("镀金面具", 2, 2, "gold", 340, "面"),
    loot("签名剧本", 2, 1, "blue", 210, "本"),
    loot("旧灯泡箱", 2, 2, "common", 80, "灯"),
    loot("木偶头", 1, 1, "red", 390, "偶"),
    loot("海报卷筒", 1, 4, "green", 140, "报"),
    loot("残破幕布", 3, 2, "junk", 45, "布"),
    loot("银质胸针", 1, 1, "blue", 200, "针")
  ]),
  warehouse("古玩街尾货", "摊主声称有军品和文玩混放，低价值杂物也不少", 15, 1, [
    loot("青瓷杯", 1, 1, "gold", 300, "瓷"),
    loot("老木雕", 2, 3, "green", 170, "雕"),
    loot("仿古钱串", 2, 1, "junk", 40, "钱"),
    loot("军用水壶", 2, 2, "blue", 190, "壶"),
    loot("玉牌", 1, 1, "red", 420, "玉"),
    loot("竹编箱", 3, 2, "common", 95, "竹"),
    loot("老相机", 2, 2, "gold", 280, "机"),
    loot("破陶罐", 2, 2, "junk", 35, "罐")
  ]),
  warehouse("私人收藏柜", "物品数量少，但高品质道具占用格子更集中", 15, 1, [
    loot("限量模型车", 3, 2, "red", 460, "车"),
    loot("签名棒球", 1, 1, "gold", 240, "球"),
    loot("纪念徽章盒", 2, 2, "blue", 210, "章"),
    loot("收藏卡册", 2, 4, "gold", 330, "册"),
    loot("空展示盒", 3, 2, "junk", 25, "空"),
    loot("老式游戏机", 3, 2, "green", 180, "游"),
    loot("加密 U 盘", 1, 1, "red", 380, "U")
  ])
];

let warehouses = fallbackWarehouses;
let mapTemplates = [];
let lootCatalogItems = catalogItemsFromWarehouses(fallbackWarehouses);
let modalMode = "close";

let state = {};
let networkState = {
  online: false,
  roomId: null,
  playerId: null,
  account: null,
  pollTimer: null,
  lastRound: null,
  lastAccountRefreshKey: null,
  playedVoiceKeys: new Set()
};

let warehouseState = {
  selectedInstanceId: null,
  search: "",
  filter: "all"
};

let lobbyState = {
  selectedMapId: DEFAULT_MAP_ID,
  selectedRoleId: DEFAULT_ROLE_ID,
  selectedToolIds: [...DEFAULT_TOOL_IDS],
  activeToolId: DEFAULT_TOOL_IDS[0]
};

function warehouse(name, hint, cols, rows, items, allItems = items) {
  return { name, type: "战利品仓库", hint, cols, rows, items, allItems };
}

function loot(name, w, h, rarity, value) {
  return { id: makeId(), name, x: 1, y: 1, w, h, rarity, value, infoLevel: "hidden", revealed: false, justRevealed: false };
}

async function loadLootConfigForClient() {
  try {
    const response = await fetch("/loot-config.json", { cache: "no-store" });
    if (!response.ok) throw new Error("loot_config_unavailable");
    const config = await response.json();
    const items = normalizeLootItems(config.items);
    const templates = buildWarehouseTemplates(config.warehouses, items);
    const maps = buildMapTemplates(config.mapSettings || config.maps, config.warehouses, items);
    if (items.length && templates.length) {
      lootCatalogItems = items;
      warehouses = templates;
      mapTemplates = maps;
      lobbyState.selectedMapId = mapTemplateById(lobbyState.selectedMapId).id;
    }
  } catch (error) {
    console.warn("使用内置藏品配置", error);
  }
  renderMapChoices();
  renderRoleChoices();
  renderToolChoices();
}

async function loadRolesConfigForClient() {
  try {
    const response = await fetch(networkState.online && location.protocol !== "file:" ? "/api/roles" : "/roles-config.json", { cache: "no-store" });
    if (!response.ok) throw new Error("roles_config_unavailable");
    const data = await response.json();
    const roles = normalizeRoles(data.roles || data.config?.roles || []);
    if (roles.length) {
      ROLES = roles;
      DEFAULT_ROLE_ID = data.defaultRoleId || roles[0].id;
      if (!ROLES.some((role) => role.id === lobbyState.selectedRoleId)) lobbyState.selectedRoleId = DEFAULT_ROLE_ID;
    }
  } catch (error) {
    console.warn("使用内置角色配置", error);
  }
  renderRoleChoices();
}

function normalizeRoles(entries = []) {
  return entries.map((entry, index) => {
    const id = String(entry.id || `role-${index + 1}`);
    const voices = entry.voices && typeof entry.voices === "object" ? entry.voices : {};
    return {
      id,
      name: String(entry.name || entry.role || id),
      shortName: String(entry.shortName || entry.name || id).slice(0, 2),
      trait: Number(entry.trait || 1),
      portrait: normalizeCharacterPath(entry.portrait),
      avatar: normalizeCharacterPath(entry.avatar || entry.portrait),
      voice: normalizeAudioPath(entry.voice || voices.start),
      voices: {
        start: normalizeAudioPath(voices.start || entry.voice),
        skill: normalizeAudioPath(voices.skill || `assets/audio/roles/${id}-skill.wav`),
        auctionWin: normalizeAudioPath(voices.auctionWin || VOICE_EVENTS.auctionWin),
        profit: normalizeAudioPath(voices.profit || VOICE_EVENTS.settlementProfit),
        loss: normalizeAudioPath(voices.loss || VOICE_EVENTS.settlementLoss)
      },
      summary: String(entry.summary || ""),
      skillScript: String(entry.skillScript || `role-skills/${id}.js`)
    };
  });
}

function normalizeCharacterPath(value) {
  const raw = String(value || "").trim();
  return /^assets\/characters\/.+\.png$/i.test(raw) && !raw.includes("..") ? raw : "assets/characters/god-gambler.png";
}

function normalizeAudioPath(value) {
  const raw = String(value || "").trim();
  return /^assets\/audio\/(roles|events)\/.+\.(wav|mp3|ogg)$/i.test(raw) && !raw.includes("..") ? raw : "";
}

function normalizeLootItems(entries = []) {
  return entries.map((entry) => ({
    id: String(entry.id || makeId()),
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

function rootAssetPath(value, fallback = "assets/images/background-default.png") {
  const raw = String(value || fallback).trim();
  const cleaned = raw.replaceAll("\\", "/").replace(/^\/+/, "").split(/[?#]/)[0];
  if (!cleaned || cleaned.includes("..")) return `/${fallback}`;
  return `/${cleaned}`;
}

function buildWarehouseTemplates(entries = [], items = []) {
  const source = entries.length ? entries : [{ name: "混合暗仓", hint: "全部藏品混合。", tags: [] }];
  return source.map((entry) => {
    const tags = Array.isArray(entry.tags) ? entry.tags.map(String) : [];
    const selected = tags.length ? items.filter((item) => item.tags.some((tag) => tags.includes(tag))) : items;
    return warehouse(entry.name || "混合暗仓", entry.hint || "藏品信息不明。", DEFAULT_GAME_CONFIG.warehouseCols, 1, selected.length ? selected : items, items);
  });
}

function buildMapTemplates(entries = [], warehouseEntries = [], items = []) {
  const source = entries.length ? entries : defaultMapEntries(warehouseEntries);
  return source.map((entry, index) => normalizeMapTemplate(entry, index, items));
}

function defaultMapEntries(warehouseEntries = []) {
  const allTags = uniqueTags(warehouseEntries.flatMap((entry) => entry.tags || CATEGORY_TAGS));
  return [
    { id: "shipwreck-hold", tier: 1, name: "沉船货舱", hint: "低门槛旧货地图，白绿蓝物品多，偶尔混入小件高价藏品。", ticketCost: 5000, resourceRoll: [1200, 2550, 3800, 6000], rarityWeights: { junk: 80, common: 200, green: 240, blue: 240, gold: 120, red: 70 }, tags: ["航海", "食品", "工业", "杂物", "科技"] },
    { id: "flea-yard", tier: 2, name: "跳蚤旧货场", hint: "杂货和收藏品混排，稳定产出中低价物。", ticketCost: 15000, resourceRoll: [2500, 3800, 6000, 7600], rarityWeights: { junk: 60, common: 220, green: 260, blue: 220, gold: 90, red: 45 }, tags: ["杂物", "文玩", "工业", "玩具", "食品", "服饰"] },
    { id: "security-cache", tier: 3, name: "废弃安保站", hint: "安防、军品、科技件偏多，蓝金物品的出现率明显提高。", ticketCost: 40000, resourceRoll: [4200, 6000, 8200, 10000], rarityWeights: { junk: 30, common: 160, green: 240, blue: 260, gold: 160, red: 90 }, tags: ["军品", "安防", "科技", "工业"] },
    { id: "collector-vault", tier: 4, name: "私人收藏库", hint: "高价文玩、宝石和科技收藏混放，门票高但回报上限更高。", ticketCost: 90000, resourceRoll: [6500, 8500, 10500, 13000], rarityWeights: { junk: 20, common: 120, green: 220, blue: 260, gold: 210, red: 140 }, tags: ["文玩", "宝石", "服饰", "科技", "家具"] },
    { id: "hidden-auction", tier: 5, name: "隐拍黑箱", hint: "最高收益地图，所有品类进入同一池子，稀有物品权重最高。", ticketCost: 180000, resourceRoll: [10000, 12000, 15000, 18000], rarityWeights: { junk: 10, common: 100, green: 200, blue: 240, gold: 220, red: 200 }, categoryMode: "singlePool", tags: allTags }
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
    cols: DEFAULT_GAME_CONFIG.warehouseCols,
    rows: 1,
    items: selected.length ? selected : items,
    allItems: items
  };
}

function normalizeResourceRoll(values, tier = 1) {
  const fallback = [1200, 2550, 3800, 6000].map((value) => value * Math.max(1, tier));
  const source = Array.isArray(values) && values.length ? values : fallback;
  return source.map((value) => clampInteger(value, 100, 50000, 1000));
}

function normalizeRarityWeights(weights = {}) {
  const result = {};
  RARITY_ORDER.forEach((rarity) => {
    result[rarity] = Math.max(0.001, Number(weights?.[rarity] ?? RARITY_DROP_WEIGHT[rarity] ?? 1));
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
  if (!mapTemplates.length) mapTemplates = buildMapTemplates([], [], catalogItemsFromWarehouses(fallbackWarehouses));
  return mapTemplates.find((map) => map.id === id) || mapTemplates.find((map) => map.id === DEFAULT_MAP_ID) || mapTemplates[0];
}

function publicMap(map) {
  return {
    id: map.id,
    tier: map.tier,
    name: map.name,
    hint: map.hint,
    background: normalizeBackgroundPath(map.background),
    ticketCost: map.ticketCost,
    categoryMode: map.categoryMode
  };
}

function roleById(id) {
  return ROLES.find((role) => role.id === id) || ROLES[0];
}

function roleName(id) {
  return roleById(id).name;
}

function toolById(id) {
  return TOOL_DEFS.find((tool) => tool.id === id) || TOOL_DEFS[0];
}

function normalizeToolIds(ids = lobbyState.selectedToolIds) {
  const source = Array.isArray(ids) ? ids : [];
  const unique = [];
  source.forEach((id) => {
    const normalized = toolById(id).id;
    if (!unique.includes(normalized)) unique.push(normalized);
  });
  if (!unique.length) unique.push(...DEFAULT_TOOL_IDS);
  return unique.slice(0, MAX_LOADOUT_TOOLS);
}

function catalogItemsFromWarehouses(templates) {
  const seen = new Map();
  templates.forEach((template) => {
    template.items.forEach((item) => {
      const key = item.id || `${item.name}-${item.w}x${item.h}-${item.rarity}`;
      if (!seen.has(key)) seen.set(key, { ...item, tags: item.tags || [] });
    });
  });
  return [...seen.values()];
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

function activeConfig() {
  return { ...DEFAULT_GAME_CONFIG, ...(state.config || {}) };
}

function maxBidRounds() {
  return state.maxBidRounds || activeConfig().bidRounds || DEFAULT_GAME_CONFIG.bidRounds;
}

function formatMoney(value) {
  return Math.trunc(Number(value || 0)).toLocaleString("zh-CN");
}

function formatSignedMoney(value) {
  const amount = Math.trunc(Number(value || 0));
  return `${amount >= 0 ? "+" : ""}${formatMoney(amount)}`;
}

function roundToStep(value, step) {
  return Math.round(Number(value || 0) / step) * step;
}

function clampMoney(value) {
  return Math.max(0, Math.min(MAX_MONEY, Math.trunc(Number(value || 0))));
}

function randomInt(min, max) {
  const low = Math.ceil(Math.min(min, max));
  const high = Math.floor(Math.max(min, max));
  return low + Math.floor(Math.random() * (high - low + 1));
}

function clampInteger(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function normalizeBaseValue(entry) {
  return clampInteger(entry.value, 1, MAX_MONEY, 1);
}

function resetGame() {
  const config = { ...DEFAULT_GAME_CONFIG };
  const map = mapTemplateById(lobbyState.selectedMapId);
  const lot = prepareWarehouse(structuredClone(map), config);
  const ticketCost = clampMoney(lot.ticketCost || 0);
  state = {
    bidRound: 0,
    maxBidRounds: config.bidRounds,
    config,
    players: structuredClone(playersSeed).map((player) => ({
      ...player,
      role: roleName(player.roleId),
      trait: roleById(player.roleId).trait,
      toolIds: normalizeToolIds(lobbyState.selectedToolIds),
      cash: clampMoney(config.startingCash - ticketCost),
      ticketCost,
      bidHistory: Array(config.bidRounds).fill(null)
    })),
    lot,
    locked: false,
    roundUsedSkill: false,
    roundUsedTool: false,
    autoRoleRounds: {},
    estimateFactor: 0.28,
    intel: [],
    settlement: null
  };
  addIntel("本局地图·竞拍信息", `${lot.name} 已开启，门票 ${formatMoney(ticketCost)}。开局只展示仓库行列规模，藏品位置需要通过技能或道具确认。`, "图");
  addIntel("规则", `共 ${config.bidRounds} 轮报价。角色技能自动触发，每轮仍可使用 1 次道具。最高报价平局会重开本轮；本轮最高价达到第二名 x${formatMultiplier(bidCloseoutMultiplier(0))} 会提前成交。`, String(config.bidRounds));
  applyGameStartRoleSkills();
  applyRoundStartRoleSkills();
  seedBidInput();
  render();
}

function prepareWarehouse(lot, config = DEFAULT_GAME_CONFIG) {
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
    const fill = layout.rows > 0 ? area / (lot.cols * layout.rows) : 0;
    const score = Math.min(resourceSpent, budget) * 8 + area + layout.items.length * 2 + fill * 160 - layout.rows * 1.5 - Math.max(0, resourceSpent - budget) * 0.3;
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
  return rarityFit * categoryFit * mapFit * sizeFit * budgetFit * (0.85 + Math.random() * 0.3);
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
      for (let x = spot.x; x < spot.x + item.w; x += 1) {
        occupied[y][x] = true;
      }
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
      for (let x = item.x; x < item.x + item.w; x += 1) {
        cells.add(`${x}:${y}`);
      }
    }
  });
  return [...cells].map((key) => {
    const [x, y] = key.split(":").map(Number);
    return { x, y };
  });
}

function lotValue(lot = state.lot) {
  return lot.items.reduce((sum, item) => sum + item.value, 0);
}

function visibleEstimate(lot = state.lot) {
  if (typeof state.visibleEstimate === "number") return state.visibleEstimate;
  const footprint = lot.occupiedCells.length * 7;
  const infoBonus = lot.items.reduce((sum, item) => {
    if (itemInfoHas(item, "revealed")) return sum + item.value;
    if (itemInfoHas(item, "rarity")) return sum + item.value * RARITY[item.rarity].floor;
    if (itemInfoHas(item, "outline")) return sum + item.value * 0.18;
    return sum;
  }, 0);
  return Math.round(Math.max(footprint, lotValue(lot) * state.estimateFactor + infoBonus * 0.28));
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

function itemInfoFlags(item = {}) {
  if (item.revealed || item.infoLevel === "revealed") return { outline: true, rarity: true, revealed: true, rarityCells: normalizeRarityCells(item, item.info?.rarityCells) };
  if (item.info && typeof item.info === "object") {
    return {
      outline: Boolean(item.info.outline),
      rarity: Boolean(item.info.rarity),
      revealed: Boolean(item.info.revealed),
      rarityCells: normalizeRarityCells(item, item.info.rarityCells)
    };
  }
  const level = String(item.infoLevel || "hidden");
  const info = {
    outline: level === "outline" || level === "outline-rarity",
    rarity: level === "rarity" || level === "outline-rarity",
    revealed: false,
    rarityCells: []
  };
  if (info.rarity && !info.outline) ensureRarityCell(info, item);
  return info;
}

function itemInfoHas(item, flag) {
  return Boolean(itemInfoFlags(item)[flag]);
}

function setItemInfoFlag(item, flag) {
  const info = itemInfoFlags(item);
  if (flag === "revealed") {
    info.outline = true;
    info.rarity = true;
    info.revealed = true;
    item.revealed = true;
  } else if (flag === "outline" || flag === "rarity") {
    info[flag] = true;
    if (flag === "rarity") ensureRarityCell(info, item);
  }
  item.info = info;
  item.infoLevel = info.revealed ? "revealed" : info.outline && info.rarity ? "outline-rarity" : info.outline ? "outline" : info.rarity ? "rarity" : "hidden";
}

function currentBid(player) {
  for (let index = state.bidRound; index >= 0; index -= 1) {
    if (player.bidHistory[index] !== null) return player.bidHistory[index];
  }
  return 0;
}

function leadingBid() {
  return Math.max(...state.players.map(currentBid));
}

function leader() {
  const high = leadingBid();
  return state.players.find((player) => currentBid(player) === high) || state.players[0];
}

function score(player) {
  const inventoryValue = Number.isFinite(player.inventoryValue)
    ? player.inventoryValue
    : (player.items || []).reduce((sum, item) => sum + item.value, 0);
  return player.cash + inventoryValue;
}

function localPlayer() {
  if (networkState.playerId) {
    return state.players.find((player) => player.id === networkState.playerId) || state.players[0];
  }
  return state.players[0];
}

function clampBid(value) {
  const you = localPlayer();
  const config = activeConfig();
  const minimum = currentBid(you);
  const maximum = Math.min(you.cash, config.maxBid);
  return Math.max(minimum, Math.min(maximum, clampMoney(value)));
}

function seedBidInput() {
  const config = activeConfig();
  const input = document.querySelector("#bidInput");
  if (!input) return;
  const you = localPlayer();
  const minimum = currentBid(you);
  const target = Math.max(minimum + config.bidStep * 3, visibleEstimate() * (0.48 + state.bidRound * 0.08));
  input.value = clampBid(target);
}


function useTool(toolId = lobbyState.activeToolId) {
  if (state.roundUsedTool || state.locked || state.settlement) return;
  const you = localPlayer();
  const toolIds = normalizeToolIds(you.toolIds || lobbyState.selectedToolIds);
  const tool = toolById(toolIds.includes(toolId) ? toolId : toolIds[0]);
  lobbyState.activeToolId = tool.id;
  state.roundUsedTool = true;
  state.estimateFactor = Math.min(0.95, state.estimateFactor + 0.08);
  const result = applyToolEffect(tool);
  addIntel(`道具·${tool.name}`, result, TOOL_RARITY[tool.rarity].label.slice(0, 1));
  seedBidInput();
  render();
}

function applyToolEffect(tool) {
  if (tool.id === "common-inspect") {
    const selected = revealRandomItems({ revealed: true }, 1);
    return selected.length ? `已揭示 ${selected[0].name} 的完整内容。` : "没有可揭示的藏品。";
  }
  if (tool.id === "common-probe") {
    const selected = revealRandomItems({ outline: true }, 2);
    return `已摸索出 ${selected.length} 件藏品轮廓。`;
  }
  if (tool.id === "rare-double") {
    const selected = revealRandomItems({ outline: true, rarity: true }, 2);
    return `已鉴定 ${selected.length} 件藏品的轮廓和稀有度。`;
  }
  if (tool.id === "rare-heavy") {
    const item = biggestHiddenItem();
    if (!item) return "没有可查看的藏品。";
    setItemInfoFlag(item, "outline");
    setItemInfoFlag(item, "rarity");
    return `已锁定最大面积藏品：${RARITY[item.rarity].label}，占用 ${item.w}x${item.h}。`;
  }
  if (tool.id === "epic-gold-value") {
    const value = state.lot.items.filter((item) => item.rarity === "gold").reduce((sum, item) => sum + item.value, 0);
    state.estimateFactor = Math.min(0.98, state.estimateFactor + 0.16);
    return `所有金色藏品总价值约为 ${formatMoney(value)}。`;
  }
  if (tool.id === "legendary-total-value") {
    state.visibleEstimate = lotValue();
    state.estimateFactor = 1;
    return `所有藏品总价值为 ${formatMoney(lotValue())}。`;
  }
  return "道具没有产生效果。";
}

function biggestHiddenItem() {
  return [...state.lot.items]
    .filter((item) => !item.revealed && (!itemInfoHas(item, "outline") || !itemInfoHas(item, "rarity")))
    .sort((a, b) => b.w * b.h - a.w * a.h || b.value - a.value)[0] || null;
}

function revealItemInfo(level, count) {
  const flag = level === "revealed" ? "revealed" : level === "rarity" ? "rarity" : "outline";
  const candidates = state.lot.items
    .filter((item) => !item.revealed && !itemInfoHas(item, flag))
    .sort((a, b) => b.w * b.h - a.w * a.h || b.value - a.value);
  const selected = candidates.slice(0, count);
  selected.forEach((item) => {
    setItemInfoFlag(item, flag);
  });
  return selected;
}

function revealRarityInfo(rarity) {
  const selected = state.lot.items.filter((item) => !item.revealed && item.rarity === rarity && !itemInfoHas(item, "rarity"));
  selected.forEach((item) => {
    setItemInfoFlag(item, "rarity");
  });
  return selected;
}

function pickBestRarityForTool() {
  const order = ["red", "gold", "blue", "green", "common", "junk"];
  return order.find((rarity) => state.lot.items.some((item) => item.rarity === rarity && !itemInfoHas(item, "rarity"))) || order[0];
}



function revealRandomItems(flags, count) {
  const candidates = shuffle(state.lot.items.filter((item) => {
    if (item.revealed) return false;
    if (flags.revealed && !itemInfoHas(item, "revealed")) return true;
    if (flags.outline && !itemInfoHas(item, "outline")) return true;
    if (flags.rarity && !itemInfoHas(item, "rarity")) return true;
    return false;
  })).slice(0, count);
  candidates.forEach((item) => {
    if (flags.outline) setItemInfoFlag(item, "outline");
    if (flags.rarity) setItemInfoFlag(item, "rarity");
    if (flags.revealed) setItemInfoFlag(item, "revealed");
  });
  return candidates;
}

function useRoleSkill() {
  const role = roleById(localPlayer()?.roleId);
  addIntel("角色技能", "角色技能会在开局或每轮出价前自动触发。", role.shortName, roleSkillVoice(role.id));
  renderIntel();
}

function applyGameStartRoleSkills() {
  const player = localPlayer();
  const role = roleById(player?.roleId);
  if (!["god-gambler", "star"].includes(role.id)) return;
  if (role.voices?.start) addIntel("角色登场", `${role.name} 已准备就绪。`, role.shortName, role.voices.start);
  if (role.id === "god-gambler") {
    state.lot.items.forEach((item) => setItemInfoFlag(item, "outline"));
    addIntel("赌神·开局读仓", "已展示所有藏品轮廓。", role.shortName, roleSkillVoice(role.id));
  } else if (role.id === "star") {
    const selected = revealRandomItems({ rarity: true }, 5);
    addIntel("女星·开场直觉", `已标出 ${selected.length} 件藏品各 1 格的稀有度反应。`, role.shortName, roleSkillVoice(role.id));
  }
}

function applyRoundStartRoleSkills() {
  const player = localPlayer();
  const role = roleById(player?.roleId);
  const round = state.bidRound || 0;
  state.autoRoleRounds ||= {};
  if (state.autoRoleRounds[player.id] === round) return;
  state.autoRoleRounds[player.id] = round;
  if (role.id === "teacher") {
    const selected = revealRandomItems({ outline: true, rarity: true }, 2);
    addIntel("老师·课前点名", `第 ${round + 1} 轮前，已识别 ${selected.length} 件藏品的轮廓和稀有度。`, role.shortName, roleSkillVoice(role.id));
  } else if (role.id === "star" && round > 0) {
    const selected = revealRandomItems({ rarity: true }, 2);
    addIntel("女星·镜头感", `第 ${round + 1} 轮前，已在 ${selected.length} 件藏品各 1 格标出稀有度反应。`, role.shortName, roleSkillVoice(role.id));
  }
}

function countRarity(lot) {
  return lot.items.reduce(
    (counts, item) => {
      counts[item.rarity] += 1;
      return counts;
    },
    { junk: 0, common: 0, green: 0, blue: 0, gold: 0, red: 0 }
  );
}

function submitBid() {
  if (state.locked || state.settlement) return;
  state.locked = true;
  const you = localPlayer();
  you.bidHistory[state.bidRound] = clampBid(document.querySelector("#bidInput").value);

  state.players.slice(1).forEach((player) => {
    player.bidHistory[state.bidRound] = aiBid(player);
  });

  const bids = state.players
    .map((player) => ({ player, bid: player.bidHistory[state.bidRound] }))
    .sort((a, b) => b.bid - a.bid);
  const high = bids[0].bid;
  const top = bids.filter((entry) => entry.bid === high);
  if (top.length > 1) {
    restartLocalRound(bids);
    render();
    return;
  }

  const roundWinner = bids[0];
  addIntel(`第 ${state.bidRound + 1} 轮开标`, bids.map((entry) => `${entry.player.name} ${formatMoney(entry.bid)}`).join(" / "), "标");
  const closeout = bidCloseoutInfo(bids, state.bidRound);
  renderRoundResult(bids, roundWinner, closeout);

  if (closeout || state.bidRound >= maxBidRounds() - 1) {
    if (closeout) addIntel("提前成交", `${roundWinner.player.name} 报价达到第 ${state.bidRound + 1} 轮 x${formatMultiplier(closeout.multiplier)} 提前成交线，直接进入清点。`, "成");
    startSettlement(roundWinner.player, state.lot, roundWinner.bid);
    render();
    return;
  }

  state.bidRound += 1;
  state.locked = false;
  state.roundUsedSkill = false;
  state.roundUsedTool = false;
  applyRoundStartRoleSkills();
  seedBidInput();
  render();
}

function restartLocalRound(bids) {
  const tied = bids.filter((entry) => entry.bid === bids[0].bid).map((entry) => entry.player.name).join("、");
  state.players.forEach((player) => {
    player.bidHistory[state.bidRound] = null;
  });
  state.locked = false;
  seedBidInput();
  document.querySelector("#roundResult").innerHTML = `<div class="result-card">第 ${state.bidRound + 1} 轮最高价平局：${tied} 同为 ${formatMoney(bids[0].bid)}，本轮重新开始。</div>`;
  addIntel("平局重开", `${tied} 同为 ${formatMoney(bids[0].bid)}，本轮重新报价。`, "平");
}

function aiBid(player) {
  const config = activeConfig();
  const previous = currentBid(player);
  const trueValue = lotValue();
  const pressure = (state.bidRound + 1) / maxBidRounds();
  const noise = 0.86 + Math.random() * 0.26;
  const target = trueValue * (0.36 + pressure * 0.52) * player.trait * noise;
  const raise = Math.max(config.bidStep * 2, roundToStep(target - previous, config.bidStep));
  const nextBid = previous + Math.max(0, raise);
  return Math.min(Math.min(player.cash, config.maxBid), Math.max(previous, roundToStep(nextBid, config.bidStep)));
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

function startSettlement(winner, lot, finalBid) {
  playVoice(roleById(winner.roleId).voices?.auctionWin || VOICE_EVENTS.auctionWin);
  lot.items.forEach((item) => {
    item.locked = shouldAutoLockSettlementItem(item);
  });
  state.settlement = {
    winner,
    lot,
    cost: finalBid,
    revealOrder: settlementRevealItems(lot),
    index: 0,
    value: 0,
    items: [],
    readyToSave: false,
    autoConfirmAt: null,
    saved: false
  };
  winner.cash -= finalBid;
  lot.items.forEach((item) => {
    item.infoLevel = "hidden";
    item.info = { outline: false, rarity: false, revealed: false };
    item.revealed = false;
    item.justRevealed = false;
  });
  showSettlementPage();
  renderSettlement();
  setTimeout(revealNextSettlementItem, activeConfig().settlementRevealMs);
}

function shouldAutoLockSettlementItem(item) {
  return item.rarity === "red" || item.rarity === "gold";
}

function revealNextSettlementItem() {
  const settlement = state.settlement;
  if (!settlement || settlement.saved || settlement.readyToSave) return;
  settlement.lot.items.forEach((item) => {
    item.justRevealed = false;
  });

  const item = settlement.revealOrder[settlement.index];
  if (!item) {
    markLocalSettlementReady(settlement);
    return;
  }

  setItemInfoFlag(item, "revealed");
  item.justRevealed = true;
  settlement.index += 1;
  settlement.value += item.value;
  settlement.items.push(item);
  if (settlement.index >= settlement.revealOrder.length) markLocalSettlementReady(settlement);
  else setTimeout(revealNextSettlementItem, activeConfig().settlementRevealMs);
  try {
    renderSettlement();
  } catch (error) {
    console.error("settlement_render_failed", error);
  }
}

function markLocalSettlementReady(settlement) {
  if (!settlement || settlement.saved || settlement.readyToSave) return;
  settlement.readyToSave = true;
  settlement.autoConfirmAt = null;
  settlement.lot.items.forEach((entry) => {
    entry.justRevealed = false;
  });
}

function skipSettlementReveal() {
  const settlement = state.settlement;
  if (!settlement || settlement.saved || isSettlementVisuallyReady(settlement)) return;
  const lot = settlement.lot || state.lot;
  const orderedItems = settlementOrderedItems(settlement, lot);
  lot.items.forEach((item) => {
    item.justRevealed = false;
  });
  orderedItems.forEach((item) => {
    setItemInfoFlag(item, "revealed");
  });
  settlement.index = orderedItems.length;
  settlement.items = orderedItems;
  settlement.value = orderedItems.reduce((sum, item) => sum + item.value, 0);
  markLocalSettlementReady(settlement);
  renderSettlement();
}

function finishSettlementReveal() {
  const settlement = state.settlement;
  if (!settlement || settlement.saved) return;
  settlement.readyToSave = true;
  settlement.saved = true;
  settlement.lot.items.forEach((item) => {
    item.justRevealed = false;
  });
  const profit = settlement.value - settlement.cost;
  const resultVoice = profit >= 0 ? roleById(settlement.winner.roleId).voices?.profit : roleById(settlement.winner.roleId).voices?.loss;
  playVoice(resultVoice || (profit >= 0 ? VOICE_EVENTS.settlementProfit : VOICE_EVENTS.settlementLoss));
  const consolationBonus = clampMoney(Math.floor(Math.abs(profit) / 10));
  settlement.profit = profit;
  settlement.consolationBonus = consolationBonus;
  settlement.bonuses = state.players
    .filter((player) => player.id !== settlement.winner.id)
    .map((player) => ({ playerId: player.id, name: player.name, amount: consolationBonus }));
  state.players.forEach((player) => {
    if (player.id !== settlement.winner.id) player.cash = clampMoney(player.cash + consolationBonus);
  });
  const keptItems = settlement.lot.items.filter((item) => item.locked);
  const soldItems = settlement.lot.items.filter((item) => !item.locked);
  const soldValue = soldItems.reduce((sum, item) => sum + item.value, 0);
  const keptValue = keptItems.reduce((sum, item) => sum + item.value, 0);
  settlement.soldValue = soldValue;
  settlement.keptValue = keptValue;
  settlement.soldCount = soldItems.length;
  settlement.keptCount = keptItems.length;
  settlement.winner.cash = clampMoney(settlement.winner.cash + soldValue);
  settlement.winner.items.push(...keptItems.map((item) => ({ ...item, locked: true })));
  renderRoundResultFinal(settlement.winner, profit);
  renderSettlement();
  renderPlayers();
  renderCollection();
}

async function toggleSettlementItemLock(itemId) {
  const settlement = state.settlement;
  if (!settlement || settlement.saved) return;
  const item = settlement.lot.items.find((entry) => entry.id === itemId);
  if (!item || !item.revealed) return;
  const locked = !item.locked;
  if (inOnlineRoom() && settlement.winner?.id === networkState.playerId) {
    await sendOnlineAction("setSettlementLock", { itemId, locked });
    return;
  }
  item.locked = locked;
  renderSettlement();
}

async function confirmSettlementReveal() {
  const settlement = state.settlement;
  if (!settlement || settlement.saved || !isSettlementVisuallyReady(settlement)) return;
  if (inOnlineRoom()) {
    if (settlement.winner?.id !== networkState.playerId) return;
    await sendOnlineAction("confirmSettlement");
    return;
  }
  finishSettlementReveal();
}

async function finalizeSettlementBeforeLeaving() {
  const settlement = state.settlement;
  if (!settlement) return false;
  if (settlement.saved) return true;
  if (!isSettlementVisuallyReady(settlement)) return false;
  await confirmSettlementReveal();
  if (inOnlineRoom()) return true;
  return Boolean(state.settlement?.saved);
}

function continueAfterSettlement() {
  if (!state.settlement || !state.settlement.saved) return;
  showGamePage();
  resetGame();
}

function render() {
  const you = localPlayer();
  const config = activeConfig();
  const rounds = maxBidRounds();
  document.querySelector("#coinLabel").textContent = formatMoney(state.lot.ticketCost || localPlayer().ticketCost || 0);
  document.querySelector("#cashLabel").textContent = formatMoney(you.cash);
  document.querySelector("#roundLabel").textContent = `第 ${state.bidRound + 1} / ${rounds} 轮`;
  document.querySelector("#lotType").textContent = state.lot.type;
  document.querySelector("#lotName").textContent = state.lot.name;
  document.querySelector("#timerLabel").textContent = rounds - state.bidRound;
  document.querySelector("#estimateLabel").textContent = formatMoney(visibleEstimate());
  document.querySelector("#bidInput").max = Math.min(you.cash, config.maxBid);
  document.querySelector("#bidInput").step = 1;
  const role = roleById(you.roleId);
  renderGameToolSelect(you);
  document.querySelector("#qualityBtn").textContent = state.roundUsedTool ? "道具已用" : `使用${toolById(lobbyState.activeToolId).name}`;
  document.querySelector("#qualityBtn").disabled = state.locked || state.roundUsedTool || Boolean(state.settlement);
  document.querySelector("#bidBtn").disabled = state.locked || Boolean(state.settlement);
  updateBidPanel();

  renderPlayers();
  renderIntel();
  renderWarehouse();
  renderCollection();
}

function updateBidPanel() {
  const input = document.querySelector("#bidInput");
  if (!input || !state.players) return;
  const you = localPlayer();
  const config = activeConfig();
  const minimum = currentBid(you);
  const maximum = Math.min(you.cash, config.maxBid);
  const multiplier = bidCloseoutMultiplier(state.bidRound || 0);
  const reference = bidReferenceStats();
  document.querySelector("#bidRangeLabel").textContent = `请输入竞拍价格：${formatMoney(minimum)} --- ${formatMoney(maximum)}`;
  document.querySelector("#bidRoundNotice").textContent = `注意：本轮最高价达到第二名 x${formatMultiplier(multiplier)} 将直接成交`;
  document.querySelector("#bidMultiplier").textContent = `x${formatMultiplier(multiplier)}`;
  document.querySelector("#bidPreviousLabel").textContent = formatMoney(reference.previousHigh);
  document.querySelector("#bidRunnerLabel").textContent = reference.runnerUp > 0 ? formatMoney(reference.runnerUp) : "等待开标";
  input.max = maximum;
  input.step = 1;
}

function bidReferenceStats() {
  const previousRound = Math.max(0, state.bidRound - 1);
  const previousBids = state.players
    .map((player) => player.bidHistory?.[previousRound])
    .filter((bid) => typeof bid === "number")
    .sort((a, b) => b - a);
  const currentBids = state.players.map(currentBid).sort((a, b) => b - a);
  return {
    previousHigh: previousBids[0] || 0,
    runnerUp: currentBids[1] || 0
  };
}

function setBidInputValue(value) {
  const input = document.querySelector("#bidInput");
  input.value = clampBid(value);
  updateBidPanel();
}

function sanitizeBidInput(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 9);
  if (!digits) return "0";
  return String(clampMoney(Number(digits)));
}

function appendBidDigits(digits) {
  if (state.locked || state.settlement) return;
  const input = document.querySelector("#bidInput");
  const current = String(input.value || "0").replace(/\D/g, "");
  const next = `${current === "0" ? "" : current}${digits}`.slice(0, 9) || "0";
  setBidInputValue(Number(next));
}

function backspaceBid() {
  if (state.locked || state.settlement) return;
  const input = document.querySelector("#bidInput");
  const current = String(input.value || "0").replace(/\D/g, "");
  setBidInputValue(Number(current.slice(0, -1) || 0));
}

function multiplyBidByCloseout() {
  if (state.locked || state.settlement) return;
  const input = document.querySelector("#bidInput");
  const base = Number(input.value || 0);
  setBidInputValue(Math.ceil(base * bidCloseoutMultiplier(state.bidRound || 0)));
}

function useLastRoundBid() {
  if (state.locked || state.settlement) return;
  const you = localPlayer();
  const previous = state.bidRound > 0 ? you.bidHistory[state.bidRound - 1] : currentBid(you);
  setBidInputValue(previous || currentBid(you));
}

function clearBid() {
  if (state.locked || state.settlement) return;
  setBidInputValue(0);
}

function renderPlayers() {
  const currentLeader = leader();
  document.querySelector("#players").innerHTML = state.players
    .map((player, index) => {
      const role = roleById(player.roleId);
      const isLeader = player.id === currentLeader.id && leadingBid() > 0;
      const isSelf = player.id === localPlayer().id;
      const submitted = playerBidSubmitted(player);
      const playerClasses = [
        "player-card",
        isLeader ? "leader" : "",
        isSelf ? "self" : "",
        submitted ? "bid-submitted" : "bid-waiting",
        player.human ? "" : "ai-player",
        player.connected === false ? "offline" : ""
      ]
        .filter(Boolean)
        .join(" ");
      const latest = currentBid(player);
      const slots = player.bidHistory
        .map((bid, slotIndex) => {
          const active = slotIndex === state.bidRound && !state.settlement;
          return `<span class="bid-slot ${active ? "active" : ""} ${bid !== null ? "filled" : ""}">${bid !== null ? formatMoney(bid) : slotIndex + 1}</span>`;
        })
        .join("");
      return `<article class="${playerClasses}">
        <span class="seat">${index + 1}</span>
        <div class="portrait role-portrait" style="--role-portrait:url('${escapeHtml(rootAssetPath(role.avatar || role.portrait, "assets/characters/god-gambler.png"))}')"><span>${role.shortName}</span></div>
        <div class="player-info">
          <strong>${player.name}</strong>
          <span class="player-id" title="${player.id}">ID ${formatPlayerId(player.id)}</span>
          <span>${role.name} · ${role.summary}</span>
          <span>现金 ${formatMoney(player.cash)} · 当前 ${formatMoney(latest)} · 资产 ${formatMoney(score(player))}</span>
          <span class="bid-status ${submitted ? "submitted" : ""}">${submitted ? "本轮已出价" : "等待出价"}</span>
          <div class="bid-history">${slots}</div>
        </div>
        <div class="bid-chip">${formatMoney(latest)}</div>
      </article>`;
    })
    .join("");
}

function playerBidSubmitted(player) {
  if (state.settlement) return false;
  if (typeof player.bidSubmitted === "boolean") return player.bidSubmitted;
  const action = state.roundActions?.[player.id];
  if (action && typeof action.bid === "boolean") return action.bid;
  return player.bidHistory?.[state.bidRound] !== null && player.bidHistory?.[state.bidRound] !== undefined;
}

function renderIntel() {
  document.querySelector("#intelFeed").innerHTML = state.intel
    .map(
      (entry) => `<article class="intel-card">
        <div class="intel-icon">${entry.icon}</div>
        <div><strong>${entry.title}</strong><span>${entry.text}</span></div>
      </article>`
    )
    .join("");
}

function formatPlayerId(id) {
  if (!id) return "UNKNOWN";
  if (id.startsWith("ai-")) return id.toUpperCase();
  return id.slice(0, 8).toUpperCase();
}

function renderWarehouse() {
  const grid = document.querySelector("#warehouseGrid");
  grid.style.setProperty("--cols", state.lot.cols);
  grid.style.setProperty("--rows", state.lot.rows);
  const cells = Array.from({ length: state.lot.cols * state.lot.rows }, () => `<div class="grid-cell"></div>`).join("");
  const rarityCells = renderRarityCellMarkers();
  const visibleItems = state.lot.items.filter((item) => itemInfoHas(item, "outline") || itemInfoHas(item, "revealed")).map(renderWarehouseItem).join("");
  grid.innerHTML = cells + rarityCells + visibleItems;
}


function renderRarityCellMarkers() {
  return state.lot.items
    .filter((item) => itemInfoHas(item, "rarity") && !itemInfoHas(item, "outline") && !itemInfoHas(item, "revealed"))
    .flatMap((item) => {
      const info = itemInfoFlags(item);
      const rarity = RARITY[item.rarity] || RARITY.common;
      const cells = info.rarityCells.length ? info.rarityCells : [randomItemCell(item)];
      return cells.map((cell) =>
        `<div class="rarity-cell-marker" style="--x:${cell.x};--y:${cell.y};--rarity-color:${rarity.color}" title="${rarity.label}"></div>`
      );
    })
    .join("");
}

function renderWarehouseItem(item) {
  const rarity = RARITY[item.rarity] || RARITY.common;
  const pulseClass = item.justRevealed ? "settle-new" : "";
  const fullyRevealed = itemInfoHas(item, "revealed");
  const rarityKnown = itemInfoHas(item, "rarity");
  const stateClass = fullyRevealed ? "revealed" : rarityKnown ? "outline-rarity" : "outline";
  const title = fullyRevealed ? `${item.name} · 点击查看详情` : rarityKnown ? `${rarity.label}藏品 · 轮廓已识别` : "已识别轮廓";
  const label = fullyRevealed ? item.name : "";
  return `<button class="loot-item ${stateClass} ${pulseClass} ${fullyRevealed ? textureClass(item) : ""}" type="button" data-inspect-kind="lot" data-inspect-id="${escapeHtml(item.id)}" style="--x:${item.x};--y:${item.y};--w:${item.w};--h:${item.h};--rarity-color:${rarity.color}" title="${title}">
    ${fullyRevealed ? renderItemImageOverlay(item) : ""}
    <div>
      <span class="name">${label}</span>
    </div>
  </button>`;
}

function renderRoundResult(bids, roundWinner, closeout = null) {
  document.querySelector("#roundResult").innerHTML = `<div class="result-card">
    第 ${state.bidRound + 1} 轮最高报价：<strong>${roundWinner.player.name} ${formatMoney(roundWinner.bid)}</strong>。
    ${bids.map((entry) => `${entry.player.name}: ${formatMoney(entry.bid)}`).join(" / ")}
    ${closeout ? `<br><strong>提前成交：</strong>${roundWinner.player.name} 已达到第二名 ${formatMoney(closeout.runnerUp.bid)} 的 x${formatMultiplier(closeout.multiplier)} 线，直接清点。` : ""}
  </div>`;
}

function renderRoundResultFinal(winner, profit) {
  const bonus = state.settlement?.consolationBonus || 0;
  document.querySelector("#roundResult").innerHTML = `<div class="result-card">
    <strong>${winner.name}</strong> 以 ${formatMoney(state.settlement.cost)} 拿下 ${state.lot.name}。真实价值 ${formatMoney(lotValue())}，最终${profit >= 0 ? "盈利" : "亏损"} ${formatMoney(Math.abs(profit))}。
    未拍中玩家各获得系统补贴 ${formatMoney(bonus)}。
  </div>`;
}

function renderSettlement() {
  const settlement = state.settlement;
  if (!settlement) return;
  const lot = settlement.lot || state.lot;
  const revealStats = settlementRevealStats(settlement, lot);
  const total = revealStats.total;
  if (!inOnlineRoom() && !settlement.saved && !settlement.readyToSave && revealStats.allRevealed) {
    markLocalSettlementReady(settlement);
  }
  const done = Boolean(settlement.saved);
  const visibleValue = done ? settlement.value : revealStats.value;
  const profitNow = visibleValue - settlement.cost;
  const profitChip = document.querySelector("#profitChip");
  const progress = total > 0 ? Math.min(100, Math.round((revealStats.count / total) * 100)) : 0;
  document.querySelector("#settlementTitle").textContent = lot.name || "战利品";
  document.querySelector("#settlementLotName").textContent = `${lot.name || "未知仓库"} · ${lot.type || "战利品仓库"}`;
  document.querySelector("#settlementWinnerName").textContent = settlement.winner.name;
  document.querySelector("#settlementWinnerId").textContent = `ID ${formatPlayerId(settlement.winner.id)}`;
  document.querySelector("#settlementWinnerAvatar").textContent = settlement.winner.name.slice(0, 1);
  document.querySelector("#settlementGridSize").textContent = lot.cols * lot.rows;
  document.querySelector("#settleCost").textContent = formatMoney(settlement.cost);
  document.querySelector("#settleValue").textContent = formatMoney(visibleValue);
  document.querySelector("#settleBonus").textContent = formatMoney(settlement.consolationBonus || Math.floor(Math.abs(profitNow) / 10));
  document.querySelector("#settleCount").textContent = `${revealStats.count} / ${total}`;
  document.querySelector("#settlementProgressBar").style.width = `${progress}%`;
  profitChip.textContent = formatSignedMoney(profitNow);
  profitChip.classList.toggle("loss", profitNow < 0);
  profitChip.classList.toggle("gain", profitNow >= 0);
  renderSettlementTicker(revealStats.items);
  renderSettlementWarehouse(lot);
  const confirmBtn = document.querySelector("#settlementConfirmBtn");
  const skipBtn = document.querySelector("#settlementSkipBtn");
  const nextBtn = document.querySelector("#settlementNextBtn");
  const lobbyBtn = document.querySelector("#settlementLobbyBtn");
  const warehouseBtn = document.querySelector("#settlementWarehouseBtn");
  const visuallyReady = isSettlementVisuallyReady(settlement, lot);
  const canConfirm = false;
  const waitingForWinner = !done && visuallyReady && inOnlineRoom() && settlement.winner?.id !== networkState.playerId;
  const canSkip = !done && !visuallyReady && (!inOnlineRoom() || settlement.winner?.id === networkState.playerId);
  const autoSeconds = settlement.autoConfirmAt ? Math.max(0, Math.ceil((settlement.autoConfirmAt - Date.now()) / 1000)) : 0;
  if (confirmBtn) {
    confirmBtn.disabled = !canConfirm;
    confirmBtn.textContent = done
      ? "已结算"
      : waitingForWinner
        ? `等待赢家确认${autoSeconds ? ` ${autoSeconds}s` : ""}`
        : visuallyReady
          ? `确认入库/出售${autoSeconds ? ` ${autoSeconds}s` : ""}`
          : "清点中";
    confirmBtn.classList.toggle("hidden", done);
  }
  if (skipBtn) {
    skipBtn.disabled = done || visuallyReady || !canSkip;
    skipBtn.textContent = done
      ? "已结算"
      : visuallyReady
        ? "已清点"
        : canSkip
          ? "跳过清点"
          : "等待赢家跳过";
    skipBtn.classList.toggle("hidden", done);
  }
  if (confirmBtn) confirmBtn.classList.add("hidden");
  nextBtn.disabled = !done && !visuallyReady;
  if (lobbyBtn) lobbyBtn.disabled = !done && !visuallyReady;
  warehouseBtn.disabled = (!done && !visuallyReady) || !networkState.account;
  warehouseBtn.textContent = done ? "进入仓库" : "清点中";
  nextBtn.textContent = done ? "继续下一局" : "清点中";
  if (lobbyBtn) lobbyBtn.textContent = done ? "返回大厅" : "清点中";
  if (done) {
    warehouseBtn.textContent = "进入仓库";
    nextBtn.textContent = "继续下一局";
    if (lobbyBtn) lobbyBtn.textContent = "返回大厅";
  } else if (visuallyReady) {
    warehouseBtn.textContent = "结算并进入仓库";
    nextBtn.textContent = "结算并继续";
    if (lobbyBtn) lobbyBtn.textContent = "结算并返回大厅";
  } else {
    warehouseBtn.textContent = "清点中";
    nextBtn.textContent = "清点中";
    if (lobbyBtn) lobbyBtn.textContent = "清点中";
  }
}

function renderSettlementTicker(items) {
  const list = document.querySelector("#settlementList");
  const shown = items.slice(-6).reverse();
  const signature = shown.map((item) => `${item.id}:${item.locked ? 1 : 0}:${item.image || ""}:${item.value}`).join("|") || "empty";
  if (list.dataset.renderSignature === signature) return;
  list.dataset.renderSignature = signature;
  list.innerHTML =
    shown.length === 0
      ? `<div class="settlement-empty">正在打开仓库，等待第一件藏品清点。</div>`
      : shown
          .map((item) => {
            const rarity = RARITY[item.rarity] || RARITY.common;
            const lockLabel = item.locked ? "保留入仓" : "自动出售";
            return `<button class="settlement-ticker-item" type="button" data-inspect-kind="settlement" data-inspect-id="${escapeHtml(item.id)}" style="--rarity-color:${rarity.color}">
              <div class="settlement-mini-art ${textureClass(item)}" ${itemArtStyle(item)}>${renderItemPreviewArt(item)}</div>
              <div><strong>${escapeHtml(item.name)}</strong><span>${rarity.label} · ${itemConditionLabel(item)} · ${item.w}x${item.h} · ${lockLabel}</span></div>
              <b>${formatMoney(item.value)}</b>
            </button>`;
          })
          .join("");
}

function settlementRevealItems(lot) {
  return [...lot.items].sort((a, b) => a.y - b.y || a.x - b.x || b.w * b.h - a.w * a.h || b.value - a.value);
}

function settlementOrderedItems(settlement, lot) {
  const lotItems = Array.isArray(lot?.items) ? lot.items : [];
  const revealOrder = Array.isArray(settlement?.revealOrder) ? settlement.revealOrder : [];
  if (!revealOrder.length) return settlementRevealItems(lot || { items: lotItems });
  return revealOrder
    .map((entry) => {
      if (entry && typeof entry === "object") return entry;
      return lotItems.find((item) => item.id === entry);
    })
    .filter(Boolean);
}

function settlementRevealStats(settlement, lot) {
  const orderedItems = settlementOrderedItems(settlement, lot);
  const revealedItems = orderedItems.filter((item) => item.revealed);
  const total = orderedItems.length;
  const value = revealedItems.reduce((sum, item) => sum + item.value, 0);
  return {
    total,
    count: revealedItems.length,
    value,
    items: revealedItems,
    allRevealed: total > 0 && revealedItems.length >= total
  };
}

function isSettlementVisuallyReady(settlement, lot = settlement?.lot || state.lot) {
  if (!settlement || settlement.saved || !settlement.readyToSave) return false;
  return settlementRevealStats(settlement, lot).allRevealed;
}

function settlementRevealTotal(settlement, lot) {
  return settlementRevealStats(settlement, lot).total;
}

function renderSettlementWarehouse(lot) {
  const grid = document.querySelector("#settlementWarehouseGrid");
  grid.style.setProperty("--cols", lot.cols);
  grid.style.setProperty("--rows", lot.rows);
  const signature = settlementWarehouseSignature(lot);
  if (grid.dataset.renderSignature === signature) return;
  grid.dataset.renderSignature = signature;
  const cells = Array.from({ length: lot.cols * lot.rows }, () => `<div class="grid-cell"></div>`).join("");
  const items = settlementRevealItems(lot).map(renderSettlementWarehouseItem).join("");
  grid.innerHTML = cells + items;
}

function settlementWarehouseSignature(lot) {
  const settlement = state.settlement || {};
  return [
    lot.cols,
    lot.rows,
    settlement.saved ? "saved" : "open",
    settlement.winner?.id || "",
    localPlayer()?.id || "",
    ...settlementRevealItems(lot).map((item) => [
      item.id,
      item.revealed ? 1 : 0,
      item.justRevealed ? 1 : 0,
      item.locked ? 1 : 0,
      item.image || "",
      item.condition || "",
      item.value || 0
    ].join(":"))
  ].join("|");
}

function renderSettlementWarehouseItem(item) {
  const rarity = RARITY[item.rarity] || RARITY.common;
  const revealed = Boolean(item.revealed);
  const pulseClass = item.justRevealed ? "settle-new" : "";
  const title = revealed ? `${item.name} · ${itemConditionLabel(item)} · ${formatMoney(item.value)}` : "待清点藏品";
  const canToggle = revealed && state.settlement && !state.settlement.saved && state.settlement.winner?.id === localPlayer()?.id;
  return `<button class="settlement-loot-item ${revealed ? "revealed" : "pending"} ${pulseClass} ${item.locked ? "locked" : "sell-mark"} ${revealed ? textureClass(item) : ""}" type="button" data-inspect-kind="settlement" data-inspect-id="${escapeHtml(item.id)}" style="--x:${item.x};--y:${item.y};--w:${item.w};--h:${item.h};--rarity-color:${rarity.color}" title="${title}">
    ${revealed ? renderItemImageOverlay(item) : ""}
    <div>
      <span class="name">${revealed ? escapeHtml(item.name) : ""}</span>
    </div>
    ${canToggle ? `<span class="settlement-lock-toggle" data-settlement-lock="${escapeHtml(item.id)}">${item.locked ? "取消" : "保留"}</span>` : ""}
  </button>`;
}

function renderCollection() {
  const you = localPlayer();
  document.querySelector("#scoreLabel").textContent = `资产 ${formatMoney(score(you))}`;
  document.querySelector("#collection").innerHTML =
    you.items.length === 0
      ? `<div class="result-card">本局还未成交。六轮报价后，最高价玩家会拿下整仓并逐件清点。</div>`
      : you.items
          .map((item) => {
            const rarity = RARITY[item.rarity];
            return `<button class="collection-item" type="button" data-inspect-kind="inventory" data-inspect-id="${escapeHtml(item.instanceId || item.id)}">
              <div class="collection-art ${textureClass(item)}" style="--rarity-color:${rarity.color};--item-w:${clampInteger(item.storageW || item.w, 1, 5, 1)};--item-h:${clampInteger(item.storageH || item.h, 1, 5, 1)};">${renderItemPreviewArt(item)}</div>
              <strong>${item.name}</strong>
              <span>${rarity.label} · ${itemConditionLabel(item)} · ${item.w}x${item.h} · ${formatMoney(item.value)}</span>
            </button>`;
          })
          .join("");
}

function openPedia() {
  const modal = document.querySelector("#modal");
  const box = modal.querySelector(".modal-box");
  const title = document.querySelector("#modalTitle");
  const body = document.querySelector("#modalBody");
  const button = document.querySelector("#modalBtn");
  const items = [...lootCatalogItems].sort((a, b) => rarityRank(b.rarity) - rarityRank(a.rarity) || b.value - a.value || b.w * b.h - a.w * a.h);
  modalMode = "pedia";
  box.classList.add("pedia-modal");
  title.textContent = "藏品百科";
  button.textContent = "关闭";
  body.innerHTML = `
    <div class="pedia-tools">
      <input id="pediaSearch" type="search" placeholder="搜索藏品、标签或稀有度">
      <div class="pedia-filters">
        <button class="small-btn active" type="button" data-rarity="all">全部</button>
        ${[...RARITY_ORDER].reverse().map((rarity) => `<button class="small-btn" type="button" data-rarity="${rarity}"><span class="rarity-dot" style="--rarity-color:${RARITY[rarity].color}"></span>${RARITY[rarity].label}</button>`).join("")}
      </div>
    </div>
    <div id="pediaStats" class="pedia-stats"></div>
    <div id="pediaList" class="pedia-grid"></div>
  `;
  modal.classList.remove("hidden");
  let activeRarity = "all";
  const renderFiltered = () => renderPediaList(items, activeRarity, document.querySelector("#pediaSearch").value);
  document.querySelector("#pediaSearch").addEventListener("input", renderFiltered);
  body.querySelectorAll("[data-rarity]").forEach((filter) => {
    filter.addEventListener("click", () => {
      activeRarity = filter.dataset.rarity;
      body.querySelectorAll("[data-rarity]").forEach((entry) => entry.classList.toggle("active", entry === filter));
      renderFiltered();
    });
  });
  renderFiltered();
}

function renderPediaList(items, rarity, query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const filtered = items.filter((item) => {
    const rarityOk = rarity === "all" || item.rarity === rarity;
    const haystack = `${item.name} ${RARITY[item.rarity].label} ${(item.tags || []).join(" ")} ${item.w}x${item.h}`.toLowerCase();
    return rarityOk && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
  const totalBaseValue = filtered.reduce((sum, item) => sum + item.value, 0);
  const totalArea = filtered.reduce((sum, item) => sum + item.w * item.h, 0);
  document.querySelector("#pediaStats").innerHTML = `
    <span>藏品 ${filtered.length} 件</span>
    <span>基础总值 ${formatMoney(totalBaseValue)}</span>
    <span>占格 ${totalArea}</span>
  `;
  document.querySelector("#pediaList").innerHTML = filtered.length
    ? filtered.map(renderPediaItem).join("")
    : `<div class="result-card">没有匹配的藏品。</div>`;
}

function renderPediaItem(item) {
  const rarity = RARITY[item.rarity] || RARITY.common;
  const tags = (item.tags || []).slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  return `<article class="pedia-item" style="--rarity-color:${rarity.color}">
    ${renderPediaVisual(item)}
    <div class="pedia-copy">
      <strong>${escapeHtml(item.name)}</strong>
      <span>${rarity.label} · ${item.w}x${item.h} · 基础值 ${formatMoney(item.value)}</span>
      <div class="pedia-tags">${tags}</div>
    </div>
  </article>`;
}

function renderPediaVisual(item) {
  return `<div class="pedia-art pedia-visual ${textureClass(item)}" ${itemArtStyle(item)}>
    ${renderItemPreviewArt(item)}
  </div>`;
}

function renderItemPreviewArt(item = {}) {
  return renderItemImageOverlay(item);
}

function renderItemImageOverlay(item = {}, options = {}) {
  const src = normalizeAssetPath(item.image) || placeholderImageForItem(item) || DEFAULT_ITEM_IMAGE;
  const loading = options.eager ? "eager" : "lazy";
  return src ? `<img class="item-art-image" src="${escapeHtml(src)}" alt="" loading="${loading}" onerror="this.onerror=null;this.src='${DEFAULT_ITEM_IMAGE}'">` : "";
}

function renderPopoverArtImage(item = {}) {
  const src = normalizeAssetPath(item.image) || placeholderImageForItem(item) || DEFAULT_ITEM_IMAGE;
  return src ? `<img class="popover-art-image" src="${escapeHtml(src)}" alt="" loading="eager" decoding="sync" onerror="this.onerror=null;this.src='${DEFAULT_ITEM_IMAGE}'">` : "";
}

function placeholderImageForItem(item = {}) {
  const w = clampInteger(item.storageW || item.w, 1, 5, 1);
  const h = clampInteger(item.storageH || item.h, 1, 5, 1);
  return `${PLACEHOLDER_IMAGE_ROOT}/${w}x${h}.png`;
}

function itemArtStyle(item = {}) {
  const w = clampInteger(item.storageW || item.w, 1, 5, 1);
  const h = clampInteger(item.storageH || item.h, 1, 5, 1);
  return `style="--item-w:${w};--item-h:${h};"`;
}

function itemConditionLabel(item) {
  return item.condition || "未定品相";
}

function renderItemArt(item = {}) {
  return renderItemPreviewArt(item);
}

function textureClass(item = {}) {
  const texture = String(item.texture || textureKeyForItem(item)).replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "lacquer";
  return `texture-${texture}`;
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

function playVoice(src) {
  if (!src || typeof Audio === "undefined") return;
  try {
    const audio = new Audio(src);
    audio.volume = 0.7;
    const result = audio.play();
    if (result?.catch) result.catch(() => {});
  } catch {}
}

function roleSkillVoice(roleId) {
  return roleById(roleId).voices?.skill || `assets/audio/roles/${roleId}-skill.wav`;
}

function playNewIntelVoices(entries = []) {
  entries.forEach((entry) => {
    if (!entry?.voice) return;
    const key = `${entry.scope || ""}:${entry.title}:${entry.text}:${entry.voice}`;
    if (networkState.playedVoiceKeys.has(key)) return;
    networkState.playedVoiceKeys.add(key);
    playVoice(entry.voice);
  });
  if (networkState.playedVoiceKeys.size > 80) {
    networkState.playedVoiceKeys = new Set([...networkState.playedVoiceKeys].slice(-40));
  }
}

function playSettlementResultVoice(settlement) {
  if (!settlement?.saved) return;
  const voice = settlement.resultVoice || (Number(settlement.profit) >= 0 ? VOICE_EVENTS.settlementProfit : VOICE_EVENTS.settlementLoss);
  const key = `settlement:${settlement.winner?.id || ""}:${settlement.cost}:${settlement.value}:${voice}`;
  if (networkState.playedVoiceKeys.has(key)) return;
  networkState.playedVoiceKeys.add(key);
  playVoice(voice);
}

function addIntel(title, text, icon, voice = null) {
  state.intel.unshift({ title, text, icon, voice });
  state.intel = state.intel.slice(0, 10);
  playVoice(voice);
}

function shuffle(items) {
  return items
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function inOnlineRoom() {
  return Boolean(networkState.roomId && networkState.playerId);
}

function clearOnlineRoomSession() {
  if (networkState.pollTimer) clearTimeout(networkState.pollTimer);
  networkState.pollTimer = null;
  networkState.roomId = null;
  networkState.playerId = null;
  networkState.lastRound = null;
  networkState.lastAccountRefreshKey = null;
}

async function leaveOnlineRoom() {
  if (!inOnlineRoom()) {
    clearOnlineRoomSession();
    return;
  }
  const roomId = networkState.roomId;
  const playerId = networkState.playerId;
  clearOnlineRoomSession();
  try {
    await postJson(`/api/rooms/${roomId}/action`, { playerId, type: "leaveRoom", payload: {} });
  } catch (error) {
    console.warn("leave_room_failed", error);
  }
}

async function handleNewGame() {
  if (inOnlineRoom()) {
    await sendOnlineAction("startGame");
    return;
  }
  resetGame();
}

async function handleUseSkill() {
  if (inOnlineRoom() && state.players.some((player) => player.id === networkState.playerId)) {
    await sendOnlineAction("useSkill");
    return;
  }
  useRoleSkill();
}

async function handleUseTool() {
  const selectedToolId = document.querySelector("#toolSelect")?.value || lobbyState.activeToolId;
  if (inOnlineRoom() && state.players.some((player) => player.id === networkState.playerId)) {
    await sendOnlineAction("useTool", { toolId: selectedToolId });
    return;
  }
  useTool(selectedToolId);
}

async function handleSubmitBid() {
  if (inOnlineRoom() && state.players.some((player) => player.id === networkState.playerId)) {
    await sendOnlineAction("submitBid", { bid: Number(document.querySelector("#bidInput").value || 0) });
    return;
  }
  submitBid();
}

async function handleSettlementNext() {
  if (!(await finalizeSettlementBeforeLeaving())) return;
  if (inOnlineRoom()) {
    await sendOnlineAction("startGame");
    return;
  }
  continueAfterSettlement();
}

async function handleSettlementLobby() {
  if (!(await finalizeSettlementBeforeLeaving())) return;
  if (inOnlineRoom()) {
    await leaveOnlineRoom();
    showRoomPage();
    return;
  }
  state.settlement = null;
  resetGame();
  showRoomPage();
}

async function handleRoomBack() {
  await leaveOnlineRoom();
  showLoadoutPage();
}

async function handleLoadoutBack() {
  await leaveOnlineRoom();
  showAuthPage();
}

async function handleSettlementConfirm() {
  await finalizeSettlementBeforeLeaving();
}

async function handleSettlementSkip() {
  if (inOnlineRoom()) {
    await sendOnlineAction("skipSettlement");
    return;
  }
  skipSettlementReveal();
}

document.querySelector("#newGameBtn").addEventListener("click", handleNewGame);
document.querySelector("#qualityBtn").addEventListener("click", handleUseTool);
document.querySelector("#bidBtn").addEventListener("click", handleSubmitBid);
document.querySelector("#modalBtn").addEventListener("click", () => {
  document.querySelector("#modal").classList.add("hidden");
  document.querySelector("#modal .modal-box")?.classList.remove("pedia-modal");
  if (modalMode === "newGame") resetGame();
  modalMode = "close";
  document.querySelector("#modalBtn").textContent = "关闭";
});
document.querySelector("#pediaBtn").addEventListener("click", openPedia);
document.querySelector("#settlementPediaBtn").addEventListener("click", openPedia);
document.querySelector("#settlementConfirmBtn").addEventListener("click", handleSettlementConfirm);
document.querySelector("#settlementSkipBtn").addEventListener("click", handleSettlementSkip);
document.querySelector("#settlementNextBtn").addEventListener("click", handleSettlementNext);
document.querySelector("#settlementLobbyBtn").addEventListener("click", handleSettlementLobby);
document.querySelector("#settlementWarehouseBtn").addEventListener("click", openAccountWarehouse);
document.querySelector("#authContinueBtn").addEventListener("click", showLoadoutPage);
document.querySelector("#loadoutBackBtn").addEventListener("click", handleLoadoutBack);
document.querySelector("#loadoutNextBtn").addEventListener("click", showRoomPage);
document.querySelector("#roomBackBtn").addEventListener("click", handleRoomBack);
document.querySelector("#createRoomBtn").addEventListener("click", createOnlineRoom);
document.querySelector("#joinRoomBtn").addEventListener("click", joinOnlineRoom);
document.querySelector("#startRoomBtn").addEventListener("click", startOnlineGame);
document.querySelector("#loginBtn").addEventListener("click", loginAccount);
document.querySelector("#registerBtn").addEventListener("click", registerAccount);
document.querySelector("#logoutBtn").addEventListener("click", logoutAccount);
document.querySelector("#accountWarehouseBtn").addEventListener("click", openAccountWarehouse);
document.querySelector("#warehouseBackBtn").addEventListener("click", returnFromWarehouse);
document.querySelector("#clearDisplayBtn").addEventListener("click", clearDisplayCase);
document.querySelector("#batchLockBtn").addEventListener("click", () => batchWarehouseItems("lock"));
document.querySelector("#batchUnlockBtn").addEventListener("click", () => batchWarehouseItems("unlock"));
document.querySelector("#batchUndisplayBtn").addEventListener("click", () => batchWarehouseItems("undisplay"));
document.querySelector("#batchSellBtn").addEventListener("click", () => batchWarehouseItems("sell"));
document.querySelector("#storageSearch").addEventListener("input", (event) => {
  warehouseState.search = event.target.value;
  renderAccountWarehousePage();
});
document.querySelector("#storageFilter").addEventListener("change", (event) => {
  warehouseState.filter = event.target.value;
  renderAccountWarehousePage();
});
document.querySelector("#itemPopover")?.addEventListener("pointerdown", (event) => event.stopPropagation());
document.querySelector("#itemPopover")?.addEventListener("click", (event) => event.stopPropagation());
document.addEventListener("click", handleItemInspectClick, true);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideItemPopover();
});
document.querySelectorAll("[data-bid-key]").forEach((button) => {
  button.addEventListener("click", () => appendBidDigits(button.dataset.bidKey));
});
document.querySelector("#bidBackspace").addEventListener("click", backspaceBid);
document.querySelector("#bidMultiplier").addEventListener("click", multiplyBidByCloseout);
document.querySelector("#bidLastRound").addEventListener("click", useLastRoundBid);
document.querySelector("#bidClear").addEventListener("click", clearBid);
document.querySelector("#bidInput").addEventListener("change", (event) => {
  event.target.value = clampBid(event.target.value);
  updateBidPanel();
});
document.querySelector("#bidInput").addEventListener("input", (event) => {
  event.target.value = sanitizeBidInput(event.target.value);
  updateBidPanel();
});
window.addEventListener("resize", scheduleAdaptiveButtonText);

let adaptiveButtonFrame = null;
let adaptiveButtonObserver = null;

initApp();

async function initApp() {
  initAdaptiveButtonText();
  resetGame();
  await checkServerStatus();
  await Promise.all([loadLootConfigForClient(), loadRolesConfigForClient()]);
  const account = await refreshAccount();
  if (account) showLoadoutPage();
  else showAuthPage();
}

function initAdaptiveButtonText() {
  if (adaptiveButtonObserver || !document.body) return;
  adaptiveButtonObserver = new MutationObserver(scheduleAdaptiveButtonText);
  adaptiveButtonObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
  scheduleAdaptiveButtonText();
}

function scheduleAdaptiveButtonText() {
  if (adaptiveButtonFrame) cancelAnimationFrame(adaptiveButtonFrame);
  adaptiveButtonFrame = requestAnimationFrame(fitAdaptiveButtonText);
}

function fitAdaptiveButtonText() {
  adaptiveButtonFrame = null;
  document.querySelectorAll(".bid-btn, .small-btn, .tool-btn, .step-btn").forEach((button) => {
    if (!(button instanceof HTMLElement) || !button.isConnected) return;
    const width = button.clientWidth;
    if (!width || button.classList.contains("hidden")) return;
    const computed = getComputedStyle(button);
    const base = Number(button.dataset.baseFontSize || parseFloat(computed.fontSize) || 14);
    button.dataset.baseFontSize = String(base);
    button.style.fontSize = `${base}px`;
    const available = Math.max(24, width - 16);
    const overflow = button.scrollWidth - available;
    if (overflow <= 0) return;
    const nextSize = Math.max(11, Math.floor(base * (available / Math.max(button.scrollWidth, 1))));
    button.style.fontSize = `${nextSize}px`;
  });
}

async function checkServerStatus() {
  if (location.protocol === "file:") {
    setNetworkText("单机模式", "通过 npm start 启动后可创建好友房。");
    renderAccountPanel();
    return;
  }

  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    if (!response.ok) throw new Error("offline");
    const data = await response.json();
    networkState.online = true;
    setNetworkText("服务器在线", `当前房间数 ${data.rooms}`);
  } catch {
    networkState.online = false;
    setNetworkText("单机模式", "未检测到本地服务器。");
  }
  renderAccountPanel();
}

async function refreshAccount() {
  if (!networkState.online || location.protocol === "file:") {
    networkState.account = null;
    renderAccountPanel();
    return null;
  }
  try {
    const response = await fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) throw new Error("auth_check_failed");
    const data = await response.json();
    networkState.account = data.account || null;
    if (networkState.account) {
      document.querySelector("#playerNameInput").value = networkState.account.displayName || networkState.account.username;
    }
  } catch {
    networkState.account = null;
  }
  renderAccountPanel();
  if (!document.querySelector("#accountWarehousePage")?.classList.contains("hidden")) {
    renderAccountWarehousePage();
  }
  return networkState.account;
}

function renderAccountPanel() {
  const account = networkState.account;
  const online = networkState.online && location.protocol !== "file:";
  document.querySelector("#accountStatus").textContent = !online ? "本地服务未连接" : account ? "已登录" : "未登录";
  document.querySelector("#authForm").classList.toggle("hidden", Boolean(account));
  document.querySelector("#accountCard").classList.toggle("hidden", !account);
  document.querySelector("#createRoomBtn").disabled = online && !account;
  document.querySelector("#joinRoomBtn").disabled = online && !account;
  document.querySelector("#startRoomBtn").disabled = online && !account && !inOnlineRoom();
  document.querySelector("#authContinueBtn").disabled = !account;
  document.querySelector("#loadoutNextBtn").disabled = online && !account;
  updateRoomActionState();
  scheduleAdaptiveButtonText();
  updateLoadoutHint();
  if (!account) return;
  document.querySelector("#accountName").textContent = `${account.displayName || account.username} @${account.username}`;
  document.querySelector("#accountMeta").textContent = `现金 ${formatMoney(account.cash)} · 仓库 ${account.itemCount} 件 · 估值 ${formatMoney(account.inventoryValue)}`;
}

async function loginAccount() {
  await submitAuth("/api/auth/login");
}

async function registerAccount() {
  await submitAuth("/api/auth/register");
}

async function submitAuth(url) {
  if (!networkState.online) await checkServerStatus();
  if (!networkState.online) {
    setNetworkText("无法登录", "请先用 npm start 启动本地服务。");
    return;
  }
  const username = document.querySelector("#authUsername").value.trim();
  const password = document.querySelector("#authPassword").value;
  const displayName = document.querySelector("#authDisplayName").value.trim() || document.querySelector("#playerNameInput").value.trim();
  try {
    const data = await postJson(url, { username, password, displayName });
    networkState.account = data.account;
    document.querySelector("#authPassword").value = "";
    document.querySelector("#playerNameInput").value = data.account.displayName || data.account.username;
    renderAccountPanel();
    setNetworkText("账户已连接", `欢迎 ${data.account.displayName || data.account.username}，现金 ${formatMoney(data.account.cash)}。`);
    showLoadoutPage();
  } catch (error) {
    setNetworkText("账户操作失败", authErrorText(error.message));
  }
}

async function logoutAccount() {
  await leaveOnlineRoom();
  try {
    await postJson("/api/auth/logout", {});
  } catch {
    // Logout should still clear the local view if the server is unreachable.
  }
  networkState.account = null;
  clearOnlineRoomSession();
  showAuthPage();
  renderAccountPanel();
  setNetworkText("已退出账户", "登录或注册后可以继续创建/加入好友房。");
}

async function openAccountWarehouse() {
  if (state.settlement && !(await finalizeSettlementBeforeLeaving())) return;
  if (state.settlement?.saved && inOnlineRoom()) await leaveOnlineRoom();
  if (!networkState.account && !(await refreshAccount())) {
    setNetworkText("未登录", "请先登录或注册账户。");
    return;
  }
  showAccountWarehousePage();
  renderAccountWarehousePage();
}

function renderAccountWarehousePage() {
  const account = networkState.account;
  if (!account) return;
  const items = account.items || [];
  const filtered = filteredWarehouseItems(items);
  const selected = filtered.find((item) => item.instanceId === warehouseState.selectedInstanceId) || filtered[0] || null;
  if (selected) warehouseState.selectedInstanceId = selected.instanceId;
  document.querySelector("#warehouseCashLabel").textContent = `现金 ${formatMoney(account.cash)}`;
  document.querySelector("#warehouseValueLabel").textContent = `仓库估值 ${formatMoney(account.inventoryValue)}`;
  document.querySelector("#storageCountLabel").textContent = `${items.length} 件藏品`;
  renderDisplayShelves(items);
  const packed = packStorageItems(filtered);
  const storageGrid = document.querySelector("#personalStorageGrid");
  const storageRows = Math.max(8, packed.rows);
  storageGrid.style.setProperty("--cols", WAREHOUSE_COLS);
  storageGrid.style.setProperty("--rows", storageRows);
  storageGrid.innerHTML = filtered.length
    ? renderStorageCells(storageRows) + packed.items.map((item) => renderStorageCard(item, selected?.instanceId === item.instanceId)).join("")
    : `<div class="storage-empty">暂无藏品</div>`;
  updateWarehouseBatchButtons(filtered);
  document.querySelectorAll("[data-select-item]").forEach((button) => {
    button.addEventListener("click", () => {
      warehouseState.selectedInstanceId = button.dataset.selectItem;
    });
  });
}

function filteredWarehouseItems(items) {
  const query = String(warehouseState.search || "").trim().toLowerCase();
  return [...items]
    .filter((item) => {
      const rarity = RARITY[item.rarity] || RARITY.common;
      const haystack = `${item.name} ${rarity.label} ${item.sourceLot || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
      const queryOk = !query || haystack.includes(query);
      const filter = warehouseState.filter;
      const filterOk =
        filter === "all" ||
        (filter === "displayed" && item.displaySlot !== null && item.displaySlot !== undefined) ||
        (filter === "locked" && item.locked) ||
        (filter === "sellable" && !item.locked);
      return queryOk && filterOk;
    })
    .sort((a, b) => {
      const displayA = a.displaySlot ?? 99;
      const displayB = b.displaySlot ?? 99;
      return displayA - displayB || Number(b.locked) - Number(a.locked) || rarityRank(b.rarity) - rarityRank(a.rarity) || b.value - a.value;
    });
}

function packStorageItems(items) {
  const rows = [];
  const placed = [];
  const ordered = [...items].sort((a, b) => Number(b.locked) - Number(a.locked) || rarityRank(b.rarity) - rarityRank(a.rarity) || b.w * b.h - a.w * a.h || b.value - a.value);
  const ensureRows = (count) => {
    while (rows.length < count) rows.push(Array(WAREHOUSE_COLS).fill(false));
  };
  const canPlace = (x, y, w, h) => {
    ensureRows(y + h);
    for (let row = y; row < y + h; row += 1) {
      for (let col = x; col < x + w; col += 1) {
        if (rows[row][col]) return false;
      }
    }
    return true;
  };
  const occupy = (x, y, w, h) => {
    ensureRows(y + h);
    for (let row = y; row < y + h; row += 1) {
      for (let col = x; col < x + w; col += 1) rows[row][col] = true;
    }
  };
  ordered.forEach((item) => {
    const w = Math.max(1, Math.min(WAREHOUSE_COLS, Number(item.w) || 1));
    const h = Math.max(1, Number(item.h) || 1);
    let spot = null;
    for (let y = 0; !spot; y += 1) {
      ensureRows(y + h);
      for (let x = 0; x <= WAREHOUSE_COLS - w; x += 1) {
        if (canPlace(x, y, w, h)) {
          spot = { x, y };
          break;
        }
      }
    }
    occupy(spot.x, spot.y, w, h);
    placed.push({ ...item, storageX: spot.x + 1, storageY: spot.y + 1, storageW: w, storageH: h });
  });
  return { items: placed, rows: rows.length };
}

function renderStorageCells(rows) {
  return Array.from({ length: WAREHOUSE_COLS * Math.max(1, rows) }, () => `<div class="storage-grid-cell"></div>`).join("");
}

function renderDisplayShelves(items) {
  const slots = Number(networkState.account?.shelfSlots || 8);
  document.querySelector("#displayShelves").innerHTML = Array.from({ length: slots }, (_, slot) => {
    const item = items.find((entry) => entry.displaySlot === slot);
    if (!item) {
      return `<button class="display-slot empty" type="button" data-display-slot="${slot}">
        <span class="shelf-board"></span>
        <strong>空展位</strong>
      </button>`;
    }
    const rarity = RARITY[item.rarity] || RARITY.common;
    return `<button class="display-slot filled" type="button" data-select-item="${escapeHtml(item.instanceId)}" data-inspect-kind="account" data-inspect-id="${escapeHtml(item.instanceId)}" style="--rarity-color:${rarity.color}">
      <span class="shelf-board"></span>
      <span class="display-art ${textureClass(item)}" ${itemArtStyle(item)}>${renderItemPreviewArt(item)}</span>
      <strong>${escapeHtml(item.name)}</strong>
      <small>${rarity.label} · ${formatMoney(item.value)}</small>
    </button>`;
  }).join("");
  document.querySelectorAll("[data-display-slot]").forEach((slotButton) => {
    slotButton.addEventListener("click", () => {
      const selected = selectedWarehouseItem();
      if (selected) setItemDisplay(selected.instanceId, Number(slotButton.dataset.displaySlot));
    });
  });
}

function renderStorageCard(item, selected) {
  const rarity = RARITY[item.rarity] || RARITY.common;
  const lowProfile = Number(item.storageH || item.h || 1) <= 1;
  const flags = [
    item.locked ? "已锁" : "",
    item.displaySlot !== null && item.displaySlot !== undefined ? `展位 ${item.displaySlot + 1}` : ""
  ].filter(Boolean).join(" · ");
  return `<button class="storage-card ${selected ? "selected" : ""} ${item.locked ? "locked" : ""} ${lowProfile ? "low-profile" : ""}" type="button" data-select-item="${escapeHtml(item.instanceId)}" data-inspect-kind="account" data-inspect-id="${escapeHtml(item.instanceId)}" style="--x:${item.storageX};--y:${item.storageY};--w:${item.storageW};--h:${item.storageH};--rarity-color:${rarity.color}">
    <span class="storage-art ${textureClass(item)}" ${itemArtStyle(item)}>${renderItemPreviewArt(item)}</span>
    <span class="storage-card-copy">
      <strong>${escapeHtml(item.name)}</strong>
    </span>
  </button>`;
}

function selectedWarehouseItem() {
  return (networkState.account?.items || []).find((item) => item.instanceId === warehouseState.selectedInstanceId) || null;
}

function firstAvailableDisplaySlot() {
  const items = networkState.account?.items || [];
  const slots = Number(networkState.account?.shelfSlots || 8);
  for (let slot = 0; slot < slots; slot += 1) {
    if (!items.some((item) => item.displaySlot === slot)) return slot;
  }
  return 0;
}

async function clearDisplayCase() {
  const displayed = (networkState.account?.items || []).filter((item) => item.displaySlot !== null && item.displaySlot !== undefined);
  for (const item of displayed) {
    await postAccountItemAction(item.instanceId, "exhibit", { displaySlot: null });
  }
}

async function setItemDisplay(instanceId, displaySlot) {
  await postAccountItemAction(instanceId, "exhibit", { displaySlot });
}

async function setItemLock(instanceId, locked) {
  await postAccountItemAction(instanceId, "lock", { locked });
}

async function sellWarehouseItem(instanceId) {
  const item = (networkState.account?.items || []).find((entry) => entry.instanceId === instanceId);
  if (!item || item.locked) return;
  await postAccountItemAction(instanceId, "sell", {});
}

function currentFilteredWarehouseItems() {
  return filteredWarehouseItems(networkState.account?.items || []);
}

function updateWarehouseBatchButtons(filtered = currentFilteredWarehouseItems()) {
  const lockButton = document.querySelector("#batchLockBtn");
  const unlockButton = document.querySelector("#batchUnlockBtn");
  const undisplayButton = document.querySelector("#batchUndisplayBtn");
  const sellButton = document.querySelector("#batchSellBtn");
  if (!lockButton || !unlockButton || !undisplayButton || !sellButton) return;
  lockButton.disabled = !filtered.some((item) => !item.locked);
  unlockButton.disabled = !filtered.some((item) => item.locked);
  undisplayButton.disabled = !filtered.some((item) => item.displaySlot !== null && item.displaySlot !== undefined);
  sellButton.disabled = !filtered.some((item) => !item.locked);
}

async function batchWarehouseItems(mode) {
  const targets = currentFilteredWarehouseItems().filter((item) => {
    if (mode === "lock") return !item.locked;
    if (mode === "unlock") return item.locked;
    if (mode === "undisplay") return item.displaySlot !== null && item.displaySlot !== undefined;
    if (mode === "sell") return !item.locked;
    return false;
  });
  if (!targets.length) return;
  if (mode === "sell" && !confirm(`确认出售当前筛选结果中的 ${targets.length} 件可出售藏品？`)) return;

  const batchButtons = document.querySelectorAll(".storage-batch-actions button");
  batchButtons.forEach((button) => { button.disabled = true; });
  try {
    for (const item of targets) {
      const action = mode === "sell" ? "sell" : mode === "undisplay" ? "exhibit" : "lock";
      const payload =
        mode === "lock" ? { locked: true } :
        mode === "unlock" ? { locked: false } :
        mode === "undisplay" ? { displaySlot: null } :
        {};
      const data = await postJson(`/api/account/items/${encodeURIComponent(item.instanceId)}/${action}`, payload);
      networkState.account = data.account;
    }
    if (!networkState.account.items.some((item) => item.instanceId === warehouseState.selectedInstanceId)) {
      warehouseState.selectedInstanceId = networkState.account.items[0]?.instanceId || null;
    }
    renderAccountPanel();
    renderAccountWarehousePage();
  } catch (error) {
    setNetworkText("仓库批量操作失败", authErrorText(error.message));
    renderAccountWarehousePage();
  }
}

async function postAccountItemAction(instanceId, action, payload) {
  try {
    const data = await postJson(`/api/account/items/${encodeURIComponent(instanceId)}/${action}`, payload);
    networkState.account = data.account;
    if (!networkState.account.items.some((item) => item.instanceId === warehouseState.selectedInstanceId)) {
      warehouseState.selectedInstanceId = networkState.account.items[0]?.instanceId || null;
    }
    renderAccountPanel();
    renderAccountWarehousePage();
  } catch (error) {
    setNetworkText("仓库操作失败", authErrorText(error.message));
  }
}

function handleItemInspectClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  const popoverAction = target?.closest("[data-popover-action]");
  if (popoverAction) {
    event.preventDefault();
    event.stopPropagation();
    handleAccountPopoverAction(popoverAction);
    return;
  }
  const lockButton = target?.closest("[data-settlement-lock]");
  if (lockButton) {
    event.preventDefault();
    event.stopPropagation();
    toggleSettlementItemLock(lockButton.dataset.settlementLock);
    return;
  }
  const trigger = target?.closest("[data-inspect-kind]");
  if (!trigger) {
    if (!target?.closest("#itemPopover")) hideItemPopover();
    return;
  }
  const item = findInspectableItem(trigger.dataset.inspectKind, trigger.dataset.inspectId);
  if (!item) return;
  if (!canInspectItemDetails(item, trigger.dataset.inspectKind)) {
    hideItemPopover();
    return;
  }
  showItemPopover(item, trigger, trigger.dataset.inspectKind);
}

function canInspectItemDetails(item, kind) {
  if (kind === "account" || kind === "inventory") return true;
  if (kind === "settlement") return Boolean(item.revealed || itemInfoHas(item, "revealed"));
  if (kind === "lot") return itemInfoHas(item, "revealed");
  return false;
}

function findInspectableItem(kind, id) {
  if (!id) return null;
  if (kind === "account") return (networkState.account?.items || []).find((item) => item.instanceId === id) || null;
  if (kind === "inventory") return (localPlayer()?.items || []).find((item) => (item.instanceId || item.id) === id) || null;
  if (kind === "settlement") {
    const lot = state.settlement?.lot || state.lot;
    return lot?.items?.find((item) => item.id === id) || null;
  }
  if (kind === "lot") return state.lot?.items?.find((item) => item.id === id) || null;
  return null;
}

function showItemPopover(item, anchor, kind) {
  const popover = document.querySelector("#itemPopover");
  if (!popover) return;
  const rarity = RARITY[item.rarity] || RARITY.common;
  const fullyRevealed = kind === "account" || kind === "inventory" || Boolean(item.revealed) || itemInfoHas(item, "revealed");
  const rarityKnown = fullyRevealed || itemInfoHas(item, "rarity");
  const outlineKnown = fullyRevealed || itemInfoHas(item, "outline");
  const title = fullyRevealed ? item.name || "未知藏品" : rarityKnown ? `${rarity.label}藏品` : outlineKnown ? "已识别轮廓" : "未揭露藏品";
  const mark = rarityKnown ? rarity.label.slice(0, 1) : "?";
  const artClass = fullyRevealed ? "revealed" : "unknown";
  const tags = fullyRevealed && Array.isArray(item.tags) && item.tags.length
    ? item.tags.slice(0, 6).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")
    : "";
  const sourceLine = fullyRevealed && item.sourceLot ? `<span>来源 ${escapeHtml(item.sourceLot)}</span>` : "";
  const lockLine = fullyRevealed && item.locked ? `<span>已上锁</span>` : "";
  const displayLine = fullyRevealed && item.displaySlot !== null && item.displaySlot !== undefined ? `<span>展示架 ${item.displaySlot + 1}</span>` : "";
  const detailLine = fullyRevealed
    ? `基础值 ${formatMoney(item.baseValue || item.value || 0)} · 当前估值 ${formatMoney(item.value || 0)}`
    : rarityKnown
      ? `稀有度已揭露 · ${rarity.label}`
      : outlineKnown
        ? "轮廓已揭露 · 详细信息未知"
        : "尚未获得线索";
  const description = fullyRevealed
    ? `${escapeHtml(item.name || "这件藏品")} 是一件 ${rarity.label}、${escapeHtml(itemConditionLabel(item))} 品相的藏品，占用 ${item.w || 1}x${item.h || 1} 格。`
    : "当前视角还不能确认名称、价格和品相，需要继续使用技能、道具或等待清点。";

  popover.innerHTML = `<article class="item-popover-card" style="--rarity-color:${rarity.color}">
    <div class="item-popover-art ${artClass}" ${itemArtStyle(item)}>${fullyRevealed ? renderPopoverArtImage(item) : `<span class="popover-art-mark">${escapeHtml(mark)}</span>`}</div>
    <div class="item-popover-copy">
      <strong>${escapeHtml(title)}</strong>
      <span>${fullyRevealed ? `${rarity.label} · ${escapeHtml(itemConditionLabel(item))} · ${item.w || 1}x${item.h || 1}` : detailLine}</span>
      ${fullyRevealed ? `<span>${detailLine}</span>` : ""}
      ${sourceLine}
      ${lockLine}
      ${displayLine}
      <p>${description}</p>
      ${tags ? `<div class="item-popover-tags">${tags}</div>` : ""}
      ${kind === "account" ? renderAccountItemPopoverActions(item) : ""}
    </div>
  </article>`;
  popover.dataset.inspectKind = kind || "";
  popover.dataset.accountItemId = kind === "account" ? item.instanceId || "" : "";
  popover.classList.remove("hidden");
  attachAccountItemPopoverActions(popover, item, kind);

  const rect = anchor.getBoundingClientRect();
  const margin = 12;
  const popRect = popover.getBoundingClientRect();
  const width = Math.max(280, popRect.width || 320);
  const height = Math.max(160, popRect.height || 220);
  let left = rect.right + margin;
  if (left + width + margin > window.innerWidth) left = rect.left - width - margin;
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  let top = rect.top;
  if (top + height + margin > window.innerHeight) top = window.innerHeight - height - margin;
  top = Math.max(margin, top);
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
}

async function handleAccountPopoverAction(button) {
  const popover = button.closest("#itemPopover");
  const instanceId = popover?.dataset.accountItemId;
  if (!instanceId || button.disabled) return;
  const item = (networkState.account?.items || []).find((entry) => entry.instanceId === instanceId);
  if (!item) {
    hideItemPopover();
    return;
  }
  const actionMap = {
    display: () => setItemDisplay(instanceId, firstAvailableDisplaySlot()),
    undisplay: () => setItemDisplay(instanceId, null),
    lock: () => setItemLock(instanceId, !item.locked),
    sell: () => sellWarehouseItem(instanceId)
  };
  const action = actionMap[button.dataset.popoverAction];
  if (!action) return;
  button.disabled = true;
  await action();
  hideItemPopover();
}

function renderAccountItemPopoverActions(item) {
  const displayed = item.displaySlot !== null && item.displaySlot !== undefined;
  return `<div class="item-popover-actions">
    <button class="small-btn" type="button" data-popover-action="display">${displayed ? "更换展位" : "展出"}</button>
    <button class="small-btn" type="button" data-popover-action="undisplay" ${displayed ? "" : "disabled"}>下架</button>
    <button class="small-btn" type="button" data-popover-action="lock">${item.locked ? "解锁" : "上锁"}</button>
    <button class="small-btn danger" type="button" data-popover-action="sell" ${item.locked ? "disabled" : ""}>出售</button>
  </div>`;
}

function attachAccountItemPopoverActions(popover, item, kind) {
  if (kind !== "account") return;
  const actionMap = {
    display: () => setItemDisplay(item.instanceId, firstAvailableDisplaySlot()),
    undisplay: () => setItemDisplay(item.instanceId, null),
    lock: () => setItemLock(item.instanceId, !item.locked),
    sell: () => sellWarehouseItem(item.instanceId)
  };
  popover.querySelectorAll("[data-popover-action]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const action = actionMap[button.dataset.popoverAction];
      if (!action) return;
      await action();
      hideItemPopover();
    });
  });
}

function hideItemPopover() {
  document.querySelector("#itemPopover")?.classList.add("hidden");
}

function authErrorText(code) {
  const messages = {
    invalid_username: "账号只能使用 3-20 位小写字母、数字或下划线。",
    weak_password: "密码至少需要 6 位。",
    username_taken: "这个账号已经被注册。",
    invalid_credentials: "账号或密码不正确。",
    auth_required: "请先登录账户。",
    forbidden_player: "当前账户不能操作这个玩家席位。",
    player_not_found: "没有找到对应玩家席位。",
    item_not_found: "没有找到这件藏品。",
    item_locked: "这件藏品已上锁，不能出售。",
    ticket_not_enough_cash: "有玩家现金不足，无法支付当前地图门票。",
    room_full: "房间已满。",
    room_not_found: "房间不存在。",
    game_already_started: "对局已经开始。"
  };
  return messages[code] || "请检查账号、密码和服务器状态。";
}

async function createOnlineRoom() {
  if (!networkState.online) {
    await checkServerStatus();
  }
  if (!networkState.online) return;
  if (!networkState.account && !(await refreshAccount())) {
    setNetworkText("请先登录", "账户登录后，金币和仓库才能持久保存。");
    showAuthPage();
    return;
  }

  const hostName = document.querySelector("#playerNameInput").value.trim() || "房主";
  try {
    const data = await postJson("/api/rooms", { hostName, mapId: lobbyState.selectedMapId, roleId: lobbyState.selectedRoleId, toolIds: normalizeToolIds(lobbyState.selectedToolIds) });
    enterRoom(data.room, data.playerId);
  } catch (error) {
    setNetworkText("创建失败", authErrorText(error.message));
  }
}

async function startOnlineGame() {
  if (!inOnlineRoom()) {
    setNetworkText("未进入房间", "请先创建或加入一个好友房。");
    return;
  }
  await sendOnlineAction("startGame");
}

async function joinOnlineRoom() {
  if (!networkState.online) {
    await checkServerStatus();
  }
  if (!networkState.online) return;
  if (!networkState.account && !(await refreshAccount())) {
    setNetworkText("请先登录", "账户登录后才能加入好友房。");
    showAuthPage();
    return;
  }

  const roomId = document.querySelector("#roomCodeInput").value.trim().toUpperCase();
  const name = document.querySelector("#playerNameInput").value.trim() || "玩家";
  if (!roomId) {
    setNetworkText("服务器在线", "请输入房间号。");
    return;
  }

  try {
    const data = await postJson(`/api/rooms/${roomId}/join`, { name, roleId: lobbyState.selectedRoleId, toolIds: normalizeToolIds(lobbyState.selectedToolIds) });
    enterRoom(data.room, data.playerId);
  } catch (error) {
    setNetworkText("加入失败", authErrorText(error.message));
  }
}

function enterRoom(room, playerId) {
  networkState.roomId = room.id;
  networkState.playerId = playerId;
  networkState.lastAccountRefreshKey = null;
  document.querySelector("#roomCodeInput").value = room.id;
  applyOnlineRoom(room);
  schedulePoll(350);
}

async function pollRoom() {
  if (!networkState.roomId) return;
  try {
    const response = await fetch(`/api/rooms/${networkState.roomId}?playerId=${encodeURIComponent(networkState.playerId)}`, { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) throw new Error("room_offline");
    const data = await response.json();
    if (!data.room) {
      clearOnlineRoomSession();
      showRoomPage();
      return;
    }
    applyOnlineRoom(data.room);
    schedulePoll(nextPollDelay());
  } catch (error) {
    console.warn("room_poll_failed", error);
    if (!inOnlineRoom()) return;
    setNetworkText("连接重试中", "房间同步短暂失败，正在自动重连。");
    schedulePoll(1200);
  }
}

function schedulePoll(delay) {
  if (networkState.pollTimer) clearTimeout(networkState.pollTimer);
  networkState.pollTimer = setTimeout(pollRoom, delay);
}

function nextPollDelay() {
  if (state.settlement && !state.settlement.saved) return Math.max(100, Math.min(activeConfig().settlementRevealMs || 260, 180));
  return 900;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "request_failed");
  return data;
}

function setNetworkText(status, detail) {
  document.querySelector("#serverStatus").textContent = status;
  document.querySelector("#roomStatus").textContent = detail;
}

async function sendOnlineAction(type, payload = {}) {
  if (!inOnlineRoom()) return;
  try {
    const data = await postJson(`/api/rooms/${networkState.roomId}/action`, {
      playerId: networkState.playerId,
      type,
      payload
    });
    if (!data.room) {
      clearOnlineRoomSession();
      return;
    }
    applyOnlineRoom(data.room);
  } catch (error) {
    setNetworkText("操作失败", authErrorText(error.message));
  }
}

function showRoomPage() {
  setAppBackground(mapTemplateById(lobbyState.selectedMapId)?.background);
  document.querySelector("#authPage")?.classList.add("hidden");
  document.querySelector("#loadoutPage")?.classList.add("hidden");
  document.querySelector("#roomPage")?.classList.remove("hidden");
  document.querySelector("#gamePage")?.classList.add("hidden");
  document.querySelector("#settlementPage")?.classList.add("hidden");
  document.querySelector("#accountWarehousePage")?.classList.add("hidden");
  renderMapChoices();
  renderAccountPanel();
  updateLoadoutHint();
  if (!inOnlineRoom()) renderEmptyLobbyState();
}

function showAuthPage() {
  setAppBackground("assets/images/background-default.png");
  document.querySelector("#authPage")?.classList.remove("hidden");
  document.querySelector("#loadoutPage")?.classList.add("hidden");
  document.querySelector("#roomPage")?.classList.add("hidden");
  document.querySelector("#gamePage")?.classList.add("hidden");
  document.querySelector("#settlementPage")?.classList.add("hidden");
  document.querySelector("#accountWarehousePage")?.classList.add("hidden");
  renderAccountPanel();
}

function showLoadoutPage() {
  if (!networkState.account && networkState.online && location.protocol !== "file:") {
    showAuthPage();
    setNetworkText("请先登录", "登录后再选择角色和进入房间。");
    return;
  }
  document.querySelector("#authPage")?.classList.add("hidden");
  document.querySelector("#loadoutPage")?.classList.remove("hidden");
  document.querySelector("#roomPage")?.classList.add("hidden");
  document.querySelector("#gamePage")?.classList.add("hidden");
  document.querySelector("#settlementPage")?.classList.add("hidden");
  document.querySelector("#accountWarehousePage")?.classList.add("hidden");
  setAppBackground("assets/images/background-default.png");
  renderRoleChoices();
  renderToolChoices();
  renderAccountPanel();
}

function showGamePage() {
  setAppBackground(state.lot?.background || mapTemplateById(lobbyState.selectedMapId)?.background);
  document.querySelector("#authPage")?.classList.add("hidden");
  document.querySelector("#loadoutPage")?.classList.add("hidden");
  document.querySelector("#roomPage")?.classList.add("hidden");
  document.querySelector("#gamePage")?.classList.remove("hidden");
  document.querySelector("#settlementPage")?.classList.add("hidden");
  document.querySelector("#accountWarehousePage")?.classList.add("hidden");
}

function showSettlementPage() {
  setAppBackground(state.settlement?.lot?.background || state.lot?.background || mapTemplateById(lobbyState.selectedMapId)?.background);
  document.querySelector("#authPage")?.classList.add("hidden");
  document.querySelector("#loadoutPage")?.classList.add("hidden");
  document.querySelector("#roomPage")?.classList.add("hidden");
  document.querySelector("#gamePage")?.classList.add("hidden");
  document.querySelector("#settlementPage")?.classList.remove("hidden");
  document.querySelector("#accountWarehousePage")?.classList.add("hidden");
}

function showAccountWarehousePage() {
  setAppBackground("assets/images/warehouse-room.png");
  document.querySelector("#authPage")?.classList.add("hidden");
  document.querySelector("#loadoutPage")?.classList.add("hidden");
  document.querySelector("#roomPage")?.classList.add("hidden");
  document.querySelector("#gamePage")?.classList.add("hidden");
  document.querySelector("#settlementPage")?.classList.add("hidden");
  document.querySelector("#accountWarehousePage")?.classList.remove("hidden");
}

function setAppBackground(src = "assets/images/background-default.png") {
  const normalized = normalizeBackgroundPath(src);
  document.documentElement.style.setProperty("--app-bg-image", `url("${rootAssetPath(normalized)}")`);
}

function returnFromWarehouse() {
  clearOnlineRoomSession();
  showLoadoutPage();
}

function updateLoadoutHint() {
  const role = roleById(lobbyState.selectedRoleId);
  const toolNames = normalizeToolIds(lobbyState.selectedToolIds).map((id) => toolById(id).name).join("、");
  const target = document.querySelector("#roomLoadoutHint");
  if (target) target.textContent = `${role.name} · 道具：${toolNames}`;
}

function renderRoomStatus(room) {
  const phaseText = room.game ? `第 ${room.game.bidRound + 1} 轮 · ${room.phase}` : "等待开始";
  setNetworkText(`房间 ${room.id}`, `${room.players.length}/${room.maxPlayers} 人 · ${phaseText}`);
  document.querySelector("#lobbyRoomCode").textContent = `房间号 ${room.id} · ${room.map?.name || mapTemplateById(lobbyState.selectedMapId).name}`;
  renderMapChoices(room);
  renderRoleChoices(room);
  renderToolChoices(room);
  renderLobbyPlayers(room);
  updateRoomActionState(room);
}

function renderEmptyLobbyState() {
  const code = document.querySelector("#lobbyRoomCode");
  if (code) code.textContent = "未进入房间";
  const list = document.querySelector("#lobbyPlayers");
  if (list) {
    list.innerHTML = Array.from({ length: 4 }, (_, index) =>
      `<article class="lobby-player empty"><strong>座位 ${index + 1}</strong><span>等待玩家加入</span></article>`
    ).join("");
  }
  updateRoomActionState();
}

function updateRoomActionState(room = null) {
  const inRoom = Boolean(room || inOnlineRoom());
  const roomActions = document.querySelector(".room-actions");
  const startButton = document.querySelector("#startRoomBtn");
  if (roomActions) roomActions.classList.toggle("in-room", inRoom);
  if (!startButton) return;
  const hostId = room?.players?.[0]?.id;
  const isHost = !room || !hostId || hostId === networkState.playerId;
  startButton.disabled = !inRoom || !isHost || Boolean(room?.game);
  startButton.textContent = isHost ? "开始对局" : "等待房主开始";
  scheduleAdaptiveButtonText();
}

function renderMapChoices(room = null) {
  const container = document.querySelector("#mapChoices");
  if (!container) return;
  const maps = room?.maps?.length ? room.maps : mapTemplates.map(publicMap);
  if (!maps.length) return;
  const selectedId = room?.map?.id || lobbyState.selectedMapId || maps[0].id;
  lobbyState.selectedMapId = selectedId;
  const selected = maps.find((map) => map.id === selectedId) || maps[0];
  document.querySelector("#selectedMapHint").textContent = `${selected.name} · 门票 ${formatMoney(selected.ticketCost)}`;
  const canChange = !room || (!room.game && room.phase === "lobby" && room.players?.[0]?.id === networkState.playerId);
  container.innerHTML = maps
    .map((map) => `<button class="map-card ${map.id === selectedId ? "selected" : ""}" type="button" data-map-id="${escapeHtml(map.id)}" ${canChange ? "" : "disabled"}>
      <span>档位 ${map.tier}</span>
      <strong>${escapeHtml(map.name)}</strong>
      <small>门票 ${formatMoney(map.ticketCost)}</small>
      <em>${escapeHtml(map.hint || "")}</em>
    </button>`)
    .join("");
  container.querySelectorAll("[data-map-id]").forEach((button) => {
    button.addEventListener("click", () => {
      lobbyState.selectedMapId = button.dataset.mapId;
      renderMapChoices(room);
      if (inOnlineRoom()) sendOnlineAction("setMap", { mapId: lobbyState.selectedMapId });
    });
  });
}

function renderRoleChoices(room = null) {
  const container = document.querySelector("#roleChoices");
  if (!container) return;
  const currentPlayer = room?.players?.find((player) => player.id === networkState.playerId);
  const selectedId = currentPlayer?.roleId || lobbyState.selectedRoleId || DEFAULT_ROLE_ID;
  lobbyState.selectedRoleId = selectedId;
  const selected = roleById(selectedId);
  document.querySelector("#selectedRoleHint").textContent = `${selected.name} · ${selected.summary}`;
  updateLoadoutHint();
  const canChange = !room || (!room.game && room.phase === "lobby" && Boolean(networkState.playerId));
  container.innerHTML = ROLES.map((role) => `<button class="role-card ${role.id === selectedId ? "selected" : ""}" type="button" data-role-id="${role.id}" ${canChange ? "" : "disabled"}>
    <img src="${escapeHtml(role.portrait)}" alt="">
    <strong>${role.name}</strong>
    <span>${role.summary}</span>
  </button>`).join("");
  container.querySelectorAll("[data-role-id]").forEach((button) => {
    button.addEventListener("click", () => {
      lobbyState.selectedRoleId = button.dataset.roleId;
      updateLoadoutHint();
      renderRoleChoices(room);
      if (inOnlineRoom()) sendOnlineAction("setRole", { roleId: lobbyState.selectedRoleId });
    });
  });
}

function renderToolChoices(room = null) {
  const container = document.querySelector("#toolLoadoutGrid");
  if (!container) return;
  const currentPlayer = room?.players?.find((player) => player.id === networkState.playerId);
  lobbyState.selectedToolIds = normalizeToolIds(currentPlayer?.toolIds || lobbyState.selectedToolIds);
  const selected = new Set(lobbyState.selectedToolIds);
  const canChange = !room || (!room.game && room.phase === "lobby" && Boolean(networkState.playerId));
  const hint = document.querySelector("#selectedToolsHint") || document.querySelector(".tool-loadout-panel .panel-title span");
  if (hint) hint.textContent = `已携带 ${selected.size}/${MAX_LOADOUT_TOOLS} · 数量不限`;
  container.innerHTML = TOOL_DEFS.map((tool) => {
    const rarity = TOOL_RARITY[tool.rarity];
    const checked = selected.has(tool.id);
    const disabled = !canChange || (!checked && selected.size >= MAX_LOADOUT_TOOLS);
    return `<button class="tool-loadout-card ${checked ? "selected" : ""}" type="button" data-tool-id="${tool.id}" style="--tool-color:${rarity.color}" ${disabled ? "disabled" : ""}>
      <span class="tool-rarity">${rarity.label}</span>
      <strong>${tool.name}</strong>
      <span>${tool.summary}</span>
    </button>`;
  }).join("");
  container.querySelectorAll("[data-tool-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.toolId;
      const next = new Set(lobbyState.selectedToolIds);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else if (next.size < MAX_LOADOUT_TOOLS) {
        next.add(id);
      }
      lobbyState.selectedToolIds = normalizeToolIds([...next]);
      if (!lobbyState.selectedToolIds.includes(lobbyState.activeToolId)) lobbyState.activeToolId = lobbyState.selectedToolIds[0];
      updateLoadoutHint();
      renderToolChoices(room);
      if (inOnlineRoom()) sendOnlineAction("setTools", { toolIds: lobbyState.selectedToolIds });
    });
  });
}

function renderGameToolSelect(player = localPlayer()) {
  let select = document.querySelector("#toolSelect");
  const qualityBtn = document.querySelector("#qualityBtn");
  if (!select && qualityBtn) {
    select = document.createElement("select");
    select.id = "toolSelect";
    select.className = "tool-select";
    qualityBtn.before(select);
  }
  if (!select) return;
  const toolIds = normalizeToolIds(player?.toolIds || lobbyState.selectedToolIds);
  if (!toolIds.includes(lobbyState.activeToolId)) lobbyState.activeToolId = toolIds[0];
  select.innerHTML = toolIds.map((id) => {
    const tool = toolById(id);
    const rarity = TOOL_RARITY[tool.rarity];
    return `<option value="${tool.id}">${rarity.label} · ${tool.name}</option>`;
  }).join("");
  select.value = lobbyState.activeToolId;
  select.disabled = state.locked || state.roundUsedTool || Boolean(state.settlement);
  select.onchange = () => {
    lobbyState.activeToolId = select.value;
    const button = document.querySelector("#qualityBtn");
    if (button && !state.roundUsedTool) button.textContent = `使用${toolById(lobbyState.activeToolId).name}`;
  };
}

function renderLobbyPlayers(room) {
  const players = [...room.players];
  while (players.length < room.maxPlayers) players.push(null);
  document.querySelector("#lobbyPlayers").innerHTML = players
    .map((player, index) => {
      if (!player) {
        return `<article class="lobby-player empty"><strong>座位 ${index + 1}</strong><span>等待玩家加入</span></article>`;
      }
      const role = roleById(player.roleId);
      return `<article class="lobby-player">
        <img src="${escapeHtml(role.portrait)}" alt="">
        <strong>${index + 1}. ${player.name}</strong>
        <span>ID ${formatPlayerId(player.id)} · ${role.name}${player.accountName ? ` · @${escapeHtml(player.accountName)}` : ""}</span>
      </article>`;
    })
    .join("");
}

function applyOnlineRoom(room) {
  renderRoomStatus(room);
  if (!room.game) {
    const loadoutOpen = !document.querySelector("#loadoutPage")?.classList.contains("hidden");
    if (!loadoutOpen) showRoomPage();
    return;
  }

  const game = structuredClone(room.game);
  const action = game.roundActions?.[networkState.playerId] || {};
  state = game;
  state.roundUsedSkill = Boolean(action.skill);
  state.roundUsedTool = Boolean(action.tool);
  state.locked = Boolean(action.bid) || room.phase === "settlement" || room.phase === "finished";
  playNewIntelVoices(game.intel);

  if (!state.settlement && networkState.lastRound !== state.bidRound) {
    seedBidInput();
    networkState.lastRound = state.bidRound;
  }

  if (state.settlement) {
    if (state.settlement.saved && !document.querySelector("#accountWarehousePage")?.classList.contains("hidden")) {
      maybeRefreshAccountAfterSettlement(room);
      return;
    }
    showSettlementPage();
    renderSettlement();
    playSettlementResultVoice(state.settlement);
    maybeRefreshAccountAfterSettlement(room);
    return;
  }

  showGamePage();
  render();
  document.querySelector("#roundResult").innerHTML = game.roundResult
    ? `<div class="result-card">${game.roundResult}</div>`
    : "";
}

function maybeRefreshAccountAfterSettlement(room) {
  const settlement = room.game?.settlement;
  if (!settlement?.saved || !networkState.account) return;
  const refreshKey = `${room.id}:${settlement.winner?.id || ""}:${settlement.index}:${settlement.value}`;
  if (networkState.lastAccountRefreshKey === refreshKey) return;
  networkState.lastAccountRefreshKey = refreshKey;
  refreshAccount();
}
