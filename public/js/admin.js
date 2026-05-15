const state = {
  rooms: [],
  selectedRoomId: null,
  loading: false,
  config: null,
  defaults: null,
  configDraft: null,
  configDirty: false,
  lootConfig: null,
  lootDraft: null,
  lootDirty: false,
  selectedLootId: null,
  selectedMapId: null,
  lootSearch: "",
  rolesConfig: null,
  rolesDraft: null,
  rolesDirty: false,
  selectedRoleId: null,
  adminToken: localStorage.getItem("kwa_admin_token") || new URLSearchParams(location.search).get("admin_token") || ""
};

const phaseLabel = {
  lobby: "大厅",
  bidding: "竞拍中",
  settlement: "清点中",
  finished: "已结束"
};

const actionLabel = {
  startGame: "开始对局",
  useSkill: "使用技能",
  useTool: "使用道具",
  submitBid: "提交报价",
  setSettlementLock: "调整结算上锁",
  confirmSettlement: "确认结算",
  resetRoom: "重置房间"
};

document.querySelector("#refreshBtn").addEventListener("click", () => refreshAdmin(true));
initAdminEnhancements();
document.querySelector("#saveConfigBtn").addEventListener("click", saveConfig);
document.querySelector("#resetConfigBtn").addEventListener("click", resetConfig);
document.querySelector("#saveLootConfigBtn").addEventListener("click", saveLootConfig);
document.querySelector("#reloadLootConfigBtn").addEventListener("click", () => loadLootConfig(true));
document.querySelector("#lootSearchInput")?.addEventListener("input", (event) => {
  state.lootSearch = event.target.value;
  renderLootGui();
});
document.querySelector("#addLootItemBtn")?.addEventListener("click", addLootItem);
document.querySelector("#applyLootItemBtn")?.addEventListener("click", applyLootItemForm);
document.querySelector("#deleteLootItemBtn")?.addEventListener("click", deleteLootItem);
document.querySelector("#lootItemForm")?.addEventListener("input", renderLootPreviewFromForm);
document.querySelector("#lootImageUpload")?.addEventListener("change", uploadLootImage);
document.querySelector("#addMapBtn")?.addEventListener("click", addMap);
document.querySelector("#applyMapBtn")?.addEventListener("click", applyMapForm);
document.querySelector("#deleteMapBtn")?.addEventListener("click", deleteMap);
document.querySelector("#mapForm")?.addEventListener("input", renderMapPreviewFromForm);
document.querySelector("#mapImageUpload")?.addEventListener("change", uploadMapImage);
document.querySelector("#saveRoleConfigBtn")?.addEventListener("click", saveRolesConfig);
document.querySelector("#reloadRoleConfigBtn")?.addEventListener("click", () => loadRolesConfig(true));
document.querySelector("#roleConfigEditor")?.addEventListener("input", () => {
  state.rolesDirty = true;
  document.querySelector("#roleConfigStatus").textContent = "角色 JSON 有未保存修改";
});
document.querySelector("#addRoleBtn")?.addEventListener("click", addRole);
document.querySelector("#applyRoleBtn")?.addEventListener("click", applyRoleForm);
document.querySelector("#deleteRoleBtn")?.addEventListener("click", deleteRole);
document.querySelector("#roleForm")?.addEventListener("input", renderRolePreviewFromForm);
document.querySelector("#rolePortraitUpload")?.addEventListener("change", (event) => uploadRoleImage(event, "portrait"));
document.querySelector("#roleAvatarUpload")?.addEventListener("change", (event) => uploadRoleImage(event, "avatar"));
document.querySelector("#configForm").addEventListener("input", () => {
  state.configDraft = readConfigForm();
  state.configDirty = true;
  document.querySelector("#configStatus").textContent = "有未保存修改";
});
["#mapConfigEditor", "#itemConfigEditor", "#warehouseConfigEditor"].forEach((selector) => {
  document.querySelector(selector).addEventListener("input", () => {
    state.lootDirty = true;
    document.querySelector("#lootConfigStatus").textContent = "有未保存修改";
  });
});

refreshAdmin(true);
loadLootConfig(false);
loadRolesConfig(false);
setInterval(() => refreshAdmin(false), 2200);

function initAdminEnhancements() {
  injectMapEditor();
  collapseJsonEditors();
}

function injectMapEditor() {
  const lootPanel = document.querySelector(".loot-config-panel");
  const lootGui = document.querySelector(".loot-gui");
  if (!lootPanel || !lootGui || document.querySelector("#mapForm")) return;
  const wrapper = document.createElement("div");
  wrapper.className = "map-gui";
  wrapper.innerHTML = `
    <aside class="map-browser">
      <button id="addMapBtn" class="ghost-btn" type="button">Add Map</button>
      <div id="mapItemList" class="map-item-list"></div>
    </aside>
    <form id="mapForm" class="map-form">
      <label><span>ID</span><input name="id" type="text" required></label>
      <label><span>Tier</span><input name="tier" type="number" min="1" max="5"></label>
      <label class="wide"><span>Name</span><input name="name" type="text" required></label>
      <label class="wide"><span>Hint</span><input name="hint" type="text"></label>
      <label><span>Ticket</span><input name="ticketCost" type="number" min="0" max="999999999"></label>
      <label><span>Mode</span><select name="categoryMode"><option value="weighted">Weighted</option><option value="singlePool">Single Pool</option></select></label>
      <label class="wide"><span>Resource Roll</span><input name="resourceRoll" type="text" placeholder="1200, 2550, 3800"></label>
      <label class="wide"><span>Tags</span><input name="tags" type="text" placeholder="tag1, tag2"></label>
      <label class="wide"><span>Background / art path</span><input name="background" type="text" placeholder="assets/images/maps/custom/map.png"></label>
      <label><span>Upload Art</span><input id="mapImageUpload" type="file" accept="image/png,image/jpeg"></label>
      <div class="map-form-actions"><button id="applyMapBtn" class="primary-btn" type="button">Apply Draft</button><button id="deleteMapBtn" class="ghost-btn danger-btn" type="button">Delete Map</button></div>
    </form>
    <section class="map-preview-panel">
      <img id="mapPreviewImage" alt="">
      <strong id="mapPreviewName">-</strong>
      <span id="mapPreviewMeta">Select a map to preview</span>
    </section>`;
  lootPanel.insertBefore(wrapper, lootGui);
}

function collapseJsonEditors() {
  wrapEditorInDetails("#mapConfigEditor", "mapSettings JSON");
  wrapEditorInDetails("#itemConfigEditor", "items JSON");
}

function wrapEditorInDetails(selector, summaryText) {
  const editor = document.querySelector(selector);
  if (!editor || editor.closest("details")) return;
  const parent = editor.parentElement;
  if (!parent) return;
  const details = document.createElement("details");
  details.className = "advanced-config inline-json";
  const summary = document.createElement("summary");
  summary.textContent = summaryText;
  parent.replaceWith(details);
  details.appendChild(summary);
  details.appendChild(editor);
}

async function refreshAdmin(forceDetail) {
  if (state.loading) return;
  state.loading = true;
  try {
    const [status, roomsData, configData] = await Promise.all([getJson("/api/admin/status"), getJson("/api/admin/rooms"), getJson("/api/admin/config")]);
    renderStatus(status);
    state.config = configData.config;
    state.defaults = configData.defaults;
    if (!state.configDirty) state.configDraft = { ...state.config };
    renderConfig(state.configDraft || state.config);
    state.rooms = roomsData.rooms;
    if (state.selectedRoomId && !state.rooms.some((room) => room.id === state.selectedRoomId)) {
      state.selectedRoomId = null;
    }
    if (!state.selectedRoomId && state.rooms.length) {
      state.selectedRoomId = state.rooms[0].id;
      forceDetail = true;
    }
    renderRooms();
    if (state.selectedRoomId) await renderDetail(state.selectedRoomId);
    else renderEmptyDetail();
    document.querySelector("#serverState").textContent = "在线";
  } catch (error) {
    document.querySelector("#serverState").textContent = "离线";
    document.querySelector("#roomList").innerHTML = `<div class="empty-line">后台连接失败：${escapeHtml(error.message)}</div>`;
  } finally {
    state.loading = false;
  }
}

async function getJson(url) {
  const response = await fetch(url, { cache: "no-store", headers: adminHeaders() });
  if (response.status === 401) return handleAdminAuth(url, null, "GET");
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function putJson(url, body) {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify(body)
  });
  if (response.status === 401) return handleAdminAuth(url, body, "PUT");
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify(body)
  });
  if (response.status === 401) return handleAdminAuth(url, body, "POST");
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function adminHeaders() {
  return state.adminToken ? { "X-Admin-Token": state.adminToken } : {};
}

async function handleAdminAuth(url, body, method) {
  const token = prompt("请输入后台 ADMIN_TOKEN");
  if (!token) throw new Error("后台需要 ADMIN_TOKEN");
  state.adminToken = token.trim();
  localStorage.setItem("kwa_admin_token", state.adminToken);
  const response = await fetch(url, {
    method,
    cache: "no-store",
    headers: method === "PUT" || method === "POST" ? { "Content-Type": "application/json", ...adminHeaders() } : adminHeaders(),
    body: method === "PUT" || method === "POST" ? JSON.stringify(body) : undefined
  });
  if (!response.ok) {
    if (response.status === 401) localStorage.removeItem("kwa_admin_token");
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

function renderStatus(status) {
  document.querySelector("#roomCount").textContent = status.rooms;
  document.querySelector("#serverPort").textContent = status.port;
  document.querySelector("#lastUpdated").textContent = formatClock(status.serverTime);
  const links = [
    { label: "玩家页", url: status.urls.local },
    { label: "后台", url: status.urls.admin },
    ...(status.urls.lan || []).flatMap((url) => [
      { label: "局域网玩家", url },
      { label: "局域网后台", url: `${url}/admin.html` }
    ])
  ];
  document.querySelector("#addressList").innerHTML = links
    .map((link) => `<a href="${escapeAttr(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)} · ${escapeHtml(link.url)}</a>`)
    .join("");
}

function renderConfig(config) {
  const form = document.querySelector("#configForm");
  Object.entries(config || {}).forEach(([key, value]) => {
    const input = form.elements[key];
    if (input && document.activeElement !== input) input.value = value;
  });
}

async function saveConfig() {
  try {
    const config = state.configDraft || readConfigForm();
    const data = await putJson("/api/admin/config", { config });
    state.config = data.config;
    state.defaults = data.defaults;
    state.configDraft = { ...state.config };
    state.configDirty = false;
    renderConfig(state.configDraft);
    document.querySelector("#configStatus").textContent = "已保存，新开对局生效";
    await refreshAdmin(true);
  } catch (error) {
    document.querySelector("#configStatus").textContent = `保存失败：${error.message}`;
  }
}

async function resetConfig() {
  if (!state.defaults) return;
  try {
    const data = await putJson("/api/admin/config", { config: state.defaults });
    state.config = data.config;
    state.defaults = data.defaults;
    state.configDraft = { ...state.config };
    state.configDirty = false;
    renderConfig(state.configDraft);
    document.querySelector("#configStatus").textContent = "已恢复默认";
    await refreshAdmin(true);
  } catch (error) {
    document.querySelector("#configStatus").textContent = `恢复失败：${error.message}`;
  }
}

async function loadLootConfig(force) {
  if (state.lootDirty && !force) return;
  try {
    const data = await getJson("/api/admin/loot-config");
    state.lootConfig = data.config;
    state.lootDraft = structuredClone(data.config);
    state.lootDirty = false;
    renderLootConfig(data.config, data.counts);
    document.querySelector("#lootConfigStatus").textContent = "已载入，修改后需手动保存";
  } catch (error) {
    document.querySelector("#lootConfigStatus").textContent = `载入失败：${error.message}`;
  }
}

function renderLootConfig(config, counts = {}) {
  document.querySelector("#mapConfigEditor").value = JSON.stringify(config.mapSettings || [], null, 2);
  document.querySelector("#itemConfigEditor").value = JSON.stringify(config.items || [], null, 2);
  document.querySelector("#warehouseConfigEditor").value = JSON.stringify(config.warehouses || [], null, 2);
  document.querySelector("#lootConfigMeta").textContent = `藏品 ${counts.items ?? (config.items || []).length} 件 · 地图 ${counts.maps ?? (config.mapSettings || []).length} 档 · 模板 ${counts.warehouses ?? (config.warehouses || []).length} 个 · 标签 ${counts.tags ?? "-"} 个`;
  if (!state.selectedLootId || !(config.items || []).some((item) => item.id === state.selectedLootId)) state.selectedLootId = (config.items || [])[0]?.id || null;
  if (!state.selectedMapId || !(config.mapSettings || []).some((map) => map.id === state.selectedMapId)) state.selectedMapId = (config.mapSettings || [])[0]?.id || null;
  renderMapGui();
  renderLootGui();
}

function readLootConfigEditors() {
  const base = structuredClone(state.lootConfig || {});
  return {
    ...base,
    mapSettings: parseEditorJson("#mapConfigEditor", "地图配置"),
    items: parseEditorJson("#itemConfigEditor", "藏品配置"),
    warehouses: parseEditorJson("#warehouseConfigEditor", "暗仓模板")
  };
}

function parseEditorJson(selector, label) {
  try {
    const value = document.querySelector(selector).value.trim();
    return value ? JSON.parse(value) : [];
  } catch (error) {
    throw new Error(`${label} JSON 格式错误：${error.message}`);
  }
}

function syncLootDraftFromEditors() {
  state.lootDraft = readLootConfigEditors();
  return state.lootDraft;
}

function writeLootDraftEditors() {
  const config = state.lootDraft || state.lootConfig || {};
  document.querySelector("#mapConfigEditor").value = JSON.stringify(config.mapSettings || [], null, 2);
  document.querySelector("#itemConfigEditor").value = JSON.stringify(config.items || [], null, 2);
  document.querySelector("#warehouseConfigEditor").value = JSON.stringify(config.warehouses || [], null, 2);
}

function renderMapGui() {
  const config = state.lootDraft || state.lootConfig || {};
  const maps = config.mapSettings || [];
  const list = document.querySelector("#mapItemList");
  if (list) {
    list.innerHTML = maps.map((map) => `<button class="map-row ${map.id === state.selectedMapId ? "active" : ""}" type="button" data-map-id="${escapeAttr(map.id)}">
      <span class="map-row-art"><img src="${escapeAttr(map.background || "assets/images/background-default.png")}" alt="" onerror="this.src='assets/images/background-default.png'"></span>
      <strong>${escapeHtml(map.name || map.id)}</strong>
      <small>${escapeHtml(map.id)} - T${map.tier || 1} - ${formatMoney(map.ticketCost || 0)}</small>
    </button>`).join("") || `<div class="empty-line">No maps</div>`;
    list.querySelectorAll("[data-map-id]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedMapId = button.dataset.mapId;
        renderMapGui();
      });
    });
  }
  const selected = maps.find((map) => map.id === state.selectedMapId) || maps[0] || null;
  if (selected) state.selectedMapId = selected.id;
  fillMapForm(selected);
  renderMapPreview(selected);
}

function fillMapForm(map) {
  const form = document.querySelector("#mapForm");
  if (!form) return;
  form.elements.id.value = map?.id || "";
  form.elements.tier.value = map?.tier || 1;
  form.elements.name.value = map?.name || "";
  form.elements.hint.value = map?.hint || "";
  form.elements.ticketCost.value = map?.ticketCost || 0;
  form.elements.categoryMode.value = map?.categoryMode || "weighted";
  form.elements.resourceRoll.value = (map?.resourceRoll || []).join(", ");
  form.elements.tags.value = (map?.tags || []).join(", ");
  form.elements.background.value = map?.background || "";
}

function readMapForm() {
  const form = document.querySelector("#mapForm");
  const id = slugify(form.elements.id.value || form.elements.name.value || `map-${Date.now().toString(36)}`);
  return {
    id,
    tier: clampNumber(form.elements.tier.value, 1, 5, 1),
    name: form.elements.name.value.trim() || "New Map",
    hint: form.elements.hint.value.trim(),
    ticketCost: clampNumber(form.elements.ticketCost.value, 0, 999999999, 0),
    categoryMode: form.elements.categoryMode.value === "singlePool" ? "singlePool" : "weighted",
    resourceRoll: form.elements.resourceRoll.value.split(/[、,，]/).map((value) => clampNumber(value.trim(), 100, 50000, 1000)).filter(Boolean),
    tags: form.elements.tags.value.split(/[、,，]/).map((tag) => tag.trim()).filter(Boolean),
    background: form.elements.background.value.trim() || "assets/images/background-default.png"
  };
}

function applyMapForm() {
  const config = syncLootDraftFromEditors();
  const map = readMapForm();
  const maps = config.mapSettings || [];
  const index = maps.findIndex((entry) => entry.id === state.selectedMapId);
  if (index >= 0) maps[index] = { ...maps[index], ...map };
  else maps.push(map);
  config.mapSettings = maps;
  state.selectedMapId = map.id;
  state.lootDirty = true;
  writeLootDraftEditors();
  renderMapGui();
  document.querySelector("#lootConfigStatus").textContent = "Map applied to draft. Remember to save.";
}

function addMap() {
  syncLootDraftFromEditors();
  const id = `new-map-${Date.now().toString(36)}`;
  const map = { id, tier: 1, name: "New Map", hint: "", ticketCost: 10000, resourceRoll: [1200, 2550, 3800, 6000], rarityWeights: {}, categoryWeights: {}, categoryMode: "weighted", tags: [], background: "assets/images/background-default.png" };
  state.lootDraft.mapSettings = [...(state.lootDraft.mapSettings || []), map];
  state.selectedMapId = id;
  state.lootDirty = true;
  writeLootDraftEditors();
  renderMapGui();
}

function deleteMap() {
  if (!state.selectedMapId) return;
  const config = syncLootDraftFromEditors();
  config.mapSettings = (config.mapSettings || []).filter((map) => map.id !== state.selectedMapId);
  state.selectedMapId = config.mapSettings[0]?.id || null;
  state.lootDirty = true;
  writeLootDraftEditors();
  renderMapGui();
}

function renderMapPreviewFromForm() {
  renderMapPreview(readMapForm());
}

function renderMapPreview(map) {
  const image = document.querySelector("#mapPreviewImage");
  if (!image) return;
  image.src = map?.background || "assets/images/background-default.png";
  image.onerror = () => { image.src = "assets/images/background-default.png"; };
  document.querySelector("#mapPreviewName").textContent = map?.name || "-";
  document.querySelector("#mapPreviewMeta").textContent = map ? `T${map.tier || 1} - ${formatMoney(map.ticketCost || 0)} - ${(map.tags || []).join(" / ") || "no tags"}` : "Select a map to preview";
}

async function uploadMapImage(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const map = readMapForm();
    const dataUrl = await compressImageFile(file, { maxWidth: 1600, maxHeight: 1000, maxBytes: 3 * 1024 * 1024 });
    const data = await postJson("/api/admin/map-assets", { mapId: map.id, dataUrl });
    document.querySelector("#mapForm").elements.background.value = data.background;
    applyMapForm();
    document.querySelector("#lootConfigStatus").textContent = "Map art uploaded and applied to draft.";
  } catch (error) {
    document.querySelector("#lootConfigStatus").textContent = `Map art upload failed: ${error.message}`;
  } finally {
    event.target.value = "";
  }
}

function renderLootGui() {
  const config = state.lootDraft || state.lootConfig || {};
  const items = config.items || [];
  const query = String(state.lootSearch || "").trim().toLowerCase();
  const filtered = items.filter((item) => `${item.id} ${item.name} ${(item.tags || []).join(" ")}`.toLowerCase().includes(query));
  const list = document.querySelector("#lootItemList");
  if (list) {
    list.innerHTML = filtered.length
      ? filtered.map((item) => `<button class="loot-row ${item.id === state.selectedLootId ? "active" : ""}" type="button" data-loot-id="${escapeAttr(item.id)}">
        <span class="loot-row-art" style="--rarity-color:${rarityColor(item.rarity)}">${renderLootImage(item)}</span>
        <strong>${escapeHtml(item.name || item.id)}</strong>
        <small>${escapeHtml(item.rarity || "common")} · ${item.w || 1}x${item.h || 1} · ${formatMoney(item.value)}</small>
      </button>`).join("")
      : `<div class="empty-line">没有匹配的藏品</div>`;
    list.querySelectorAll("[data-loot-id]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedLootId = button.dataset.lootId;
        renderLootGui();
      });
    });
  }
  const selected = items.find((item) => item.id === state.selectedLootId) || items[0] || null;
  if (selected) state.selectedLootId = selected.id;
  fillLootForm(selected);
  renderLootPreview(selected);
}

function fillLootForm(item) {
  const form = document.querySelector("#lootItemForm");
  if (!form) return;
  form.elements.id.value = item?.id || "";
  form.elements.name.value = item?.name || "";
  form.elements.w.value = item?.w || 1;
  form.elements.h.value = item?.h || 1;
  form.elements.rarity.value = item?.rarity || "common";
  form.elements.value.value = item?.value || 100;
  form.elements.tags.value = (item?.tags || []).join("、");
  form.elements.image.value = item?.image || "";
}

function readLootForm() {
  const form = document.querySelector("#lootItemForm");
  return {
    id: slugify(form.elements.id.value || form.elements.name.value || `item-${Date.now().toString(36)}`),
    name: form.elements.name.value.trim() || "未命名藏品",
    w: clampNumber(form.elements.w.value, 1, 8, 1),
    h: clampNumber(form.elements.h.value, 1, 8, 1),
    rarity: form.elements.rarity.value || "common",
    value: clampNumber(form.elements.value.value, 1, 999999999, 100),
    tags: form.elements.tags.value.split(/[、,，]/).map((tag) => tag.trim()).filter(Boolean),
    image: form.elements.image.value.trim()
  };
}

function applyLootItemForm() {
  const config = syncLootDraftFromEditors();
  const item = readLootForm();
  const items = config.items || [];
  const index = items.findIndex((entry) => entry.id === state.selectedLootId);
  if (index >= 0) items[index] = item;
  else items.push(item);
  config.items = items;
  state.selectedLootId = item.id;
  state.lootDirty = true;
  writeLootDraftEditors();
  renderLootGui();
  document.querySelector("#lootConfigStatus").textContent = "已应用到缓存，记得保存配置";
}

function addLootItem() {
  syncLootDraftFromEditors();
  const item = { id: `new-item-${Date.now().toString(36)}`, name: "新藏品", w: 1, h: 1, rarity: "common", value: 100, tags: [], image: "assets/item-textures/placeholder.png" };
  state.lootDraft.items = [...(state.lootDraft.items || []), item];
  state.selectedLootId = item.id;
  state.lootDirty = true;
  writeLootDraftEditors();
  renderLootGui();
}

function deleteLootItem() {
  if (!state.selectedLootId) return;
  const config = syncLootDraftFromEditors();
  config.items = (config.items || []).filter((item) => item.id !== state.selectedLootId);
  state.selectedLootId = config.items[0]?.id || null;
  state.lootDirty = true;
  writeLootDraftEditors();
  renderLootGui();
}

async function uploadLootImage(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const item = readLootForm();
    const dataUrl = await compressImageFile(file, { maxWidth: 768, maxHeight: 768, maxBytes: 2 * 1024 * 1024 });
    const data = await postJson("/api/admin/item-textures", { itemId: item.id, dataUrl });
    document.querySelector("#lootItemForm").elements.image.value = data.image;
    applyLootItemForm();
    document.querySelector("#lootConfigStatus").textContent = "贴图已上传并应用到缓存";
  } catch (error) {
    document.querySelector("#lootConfigStatus").textContent = `贴图上传失败：${error.message}`;
  } finally {
    event.target.value = "";
  }
}

function renderLootPreviewFromForm() {
  renderLootPreview(readLootForm());
}

function renderLootPreview(item) {
  const preview = document.querySelector("#lootPreview");
  if (!preview) return;
  if (!item) {
    preview.innerHTML = "";
    document.querySelector("#lootPreviewMeta").textContent = "选择藏品后预览";
    return;
  }
  preview.style.setProperty("--w", item.w || 1);
  preview.style.setProperty("--h", item.h || 1);
  preview.style.setProperty("--rarity-color", rarityColor(item.rarity));
  preview.innerHTML = renderLootImage(item);
  document.querySelector("#lootPreviewMeta").textContent = `${item.name} · ${item.w || 1}x${item.h || 1} · ${formatMoney(item.value)}`;
}

function renderLootImage(item) {
  const src = item.image || `assets/item-textures/placeholders/${item.w || 1}x${item.h || 1}.png`;
  return `<img src="${escapeAttr(src)}" alt="" onerror="this.src='assets/item-textures/placeholder.png'">`;
}

function rarityColor(rarity) {
  return { junk: "#9aa2a9", common: "#f0f4f7", green: "#79e28c", blue: "#52c8ff", gold: "#d9a941", red: "#ff6579" }[rarity] || "#f0f4f7";
}

function slugify(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || `item-${Date.now().toString(36)}`;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(number)));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

function compressImageFile(file, options = {}) {
  const maxWidth = options.maxWidth || 1024;
  const maxHeight = options.maxHeight || 1024;
  const maxBytes = options.maxBytes || 3 * 1024 * 1024;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("read_failed"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("image_decode_failed"));
      image.onload = () => {
        let scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
        let width = Math.max(1, Math.round(image.width * scale));
        let height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        let dataUrl = "";
        for (let attempt = 0; attempt < 8; attempt += 1) {
          canvas.width = width;
          canvas.height = height;
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(image, 0, 0, width, height);
          dataUrl = canvas.toDataURL("image/png");
          if (dataUrl.length * 0.75 <= maxBytes || width <= 256 || height <= 256) break;
          scale *= 0.82;
          width = Math.max(1, Math.round(image.width * scale));
          height = Math.max(1, Math.round(image.height * scale));
        }
        resolve(dataUrl);
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

async function loadRolesConfig(force) {
  if (state.rolesDirty && !force) return;
  try {
    const data = await getJson("/api/admin/roles-config");
    state.rolesConfig = data.config;
    state.rolesDraft = structuredClone(data.config);
    state.rolesDirty = false;
    renderRolesConfig(data.config);
    document.querySelector("#roleConfigStatus").textContent = "角色配置已载入";
  } catch (error) {
    document.querySelector("#roleConfigStatus").textContent = `角色载入失败：${error.message}`;
  }
}

function renderRolesConfig(config) {
  document.querySelector("#roleConfigEditor").value = JSON.stringify(config.roles || [], null, 2);
  if (!state.selectedRoleId || !(config.roles || []).some((role) => role.id === state.selectedRoleId)) state.selectedRoleId = (config.roles || [])[0]?.id || null;
  renderRoleGui();
}

function readRolesEditor() {
  const base = structuredClone(state.rolesConfig || { version: 1 });
  const text = document.querySelector("#roleConfigEditor").value.trim();
  return { ...base, roles: text ? JSON.parse(text) : [] };
}

function syncRolesDraftFromEditor() {
  state.rolesDraft = readRolesEditor();
  return state.rolesDraft;
}

function writeRolesEditor() {
  document.querySelector("#roleConfigEditor").value = JSON.stringify(state.rolesDraft?.roles || [], null, 2);
}

async function saveRolesConfig() {
  try {
    const config = syncRolesDraftFromEditor();
    const data = await putJson("/api/admin/roles-config", { config });
    state.rolesConfig = data.config;
    state.rolesDraft = structuredClone(data.config);
    state.rolesDirty = false;
    renderRolesConfig(data.config);
    document.querySelector("#roleConfigStatus").textContent = "角色配置已保存";
  } catch (error) {
    document.querySelector("#roleConfigStatus").textContent = `角色保存失败：${error.message}`;
  }
}

function renderRoleGui() {
  const roles = state.rolesDraft?.roles || [];
  const list = document.querySelector("#roleItemList");
  if (list) {
    list.innerHTML = roles.map((role) => `<button class="role-row ${role.id === state.selectedRoleId ? "active" : ""}" type="button" data-role-id="${escapeAttr(role.id)}">
      <span class="role-row-art"><img src="${escapeAttr(role.avatar || role.portrait || "")}" alt="" onerror="this.src='assets/characters/god-gambler.png'"></span>
      <strong>${escapeHtml(role.name || role.id)}</strong>
      <small>${escapeHtml(role.id)} · ${escapeHtml(role.skillScript || "")}</small>
    </button>`).join("") || `<div class="empty-line">暂无角色</div>`;
    list.querySelectorAll("[data-role-id]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedRoleId = button.dataset.roleId;
        renderRoleGui();
      });
    });
  }
  const selected = roles.find((role) => role.id === state.selectedRoleId) || roles[0] || null;
  if (selected) state.selectedRoleId = selected.id;
  fillRoleForm(selected);
  renderRolePreview(selected);
}

function fillRoleForm(role) {
  const form = document.querySelector("#roleForm");
  if (!form) return;
  const voices = role?.voices || {};
  form.elements.id.value = role?.id || "";
  form.elements.name.value = role?.name || "";
  form.elements.shortName.value = role?.shortName || "";
  form.elements.trait.value = role?.trait || 1;
  form.elements.summary.value = role?.summary || "";
  form.elements.portrait.value = role?.portrait || "";
  form.elements.avatar.value = role?.avatar || "";
  form.elements.voiceStart.value = voices.start || role?.voice || "";
  form.elements.voiceSkill.value = voices.skill || "";
  form.elements.voiceAuctionWin.value = voices.auctionWin || "";
  form.elements.voiceProfit.value = voices.profit || "";
  form.elements.voiceLoss.value = voices.loss || "";
  form.elements.skillScript.value = role?.skillScript || "";
}

function readRoleForm() {
  const form = document.querySelector("#roleForm");
  const id = slugify(form.elements.id.value || form.elements.name.value || `role-${Date.now().toString(36)}`);
  return {
    id,
    name: form.elements.name.value.trim() || "新角色",
    shortName: form.elements.shortName.value.trim().slice(0, 2) || id.slice(0, 1),
    trait: Number(form.elements.trait.value || 1),
    summary: form.elements.summary.value.trim(),
    portrait: form.elements.portrait.value.trim(),
    avatar: form.elements.avatar.value.trim(),
    voice: form.elements.voiceStart.value.trim(),
    voices: {
      start: form.elements.voiceStart.value.trim(),
      skill: form.elements.voiceSkill.value.trim(),
      auctionWin: form.elements.voiceAuctionWin.value.trim(),
      profit: form.elements.voiceProfit.value.trim(),
      loss: form.elements.voiceLoss.value.trim()
    },
    skillScript: form.elements.skillScript.value.trim() || `role-skills/${id}.js`
  };
}

function applyRoleForm() {
  const config = syncRolesDraftFromEditor();
  const role = readRoleForm();
  const roles = config.roles || [];
  const index = roles.findIndex((entry) => entry.id === state.selectedRoleId);
  if (index >= 0) roles[index] = role;
  else roles.push(role);
  config.roles = roles;
  state.selectedRoleId = role.id;
  state.rolesDirty = true;
  writeRolesEditor();
  renderRoleGui();
  document.querySelector("#roleConfigStatus").textContent = "角色已应用到缓存，记得保存";
}

function addRole() {
  syncRolesDraftFromEditor();
  const id = `new-role-${Date.now().toString(36)}`;
  const role = { id, name: "新角色", shortName: "新", trait: 1, summary: "", portrait: "assets/characters/god-gambler.png", avatar: "assets/characters/god-gambler.png", voice: "", voices: { start: "", skill: "", auctionWin: "", profit: "", loss: "" }, skillScript: `role-skills/${id}.js` };
  state.rolesDraft.roles = [...(state.rolesDraft.roles || []), role];
  state.selectedRoleId = id;
  state.rolesDirty = true;
  writeRolesEditor();
  renderRoleGui();
}

function deleteRole() {
  if (!state.selectedRoleId) return;
  const config = syncRolesDraftFromEditor();
  config.roles = (config.roles || []).filter((role) => role.id !== state.selectedRoleId);
  state.selectedRoleId = config.roles[0]?.id || null;
  state.rolesDirty = true;
  writeRolesEditor();
  renderRoleGui();
}

function renderRolePreviewFromForm() {
  renderRolePreview(readRoleForm());
}

function renderRolePreview(role) {
  document.querySelector("#rolePortraitPreview").src = role?.portrait || "assets/characters/god-gambler.png";
  document.querySelector("#roleAvatarPreview").src = role?.avatar || role?.portrait || "assets/characters/god-gambler.png";
  document.querySelector("#rolePreviewName").textContent = role?.name || "-";
  document.querySelector("#rolePreviewSummary").textContent = role?.summary || "-";
}

async function uploadRoleImage(event, type) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const role = readRoleForm();
    const dataUrl = await compressImageFile(file, { maxWidth: type === "avatar" ? 512 : 900, maxHeight: type === "avatar" ? 512 : 1200, maxBytes: 2.5 * 1024 * 1024 });
    const data = await postJson("/api/admin/role-assets", { roleId: role.id, type, dataUrl });
    document.querySelector("#roleForm").elements[type].value = data.path;
    applyRoleForm();
    document.querySelector("#roleConfigStatus").textContent = "角色图片已压缩上传并应用到缓存";
  } catch (error) {
    document.querySelector("#roleConfigStatus").textContent = `角色图片上传失败：${error.message}`;
  } finally {
    event.target.value = "";
  }
}

async function saveLootConfig() {
  try {
    const config = readLootConfigEditors();
    const data = await putJson("/api/admin/loot-config", { config });
    state.lootConfig = data.config;
    state.lootDraft = structuredClone(data.config);
    state.lootDirty = false;
    renderLootConfig(data.config, data.counts);
    document.querySelector("#lootConfigStatus").textContent = "已保存，新开对局生效";
    await refreshAdmin(true);
  } catch (error) {
    document.querySelector("#lootConfigStatus").textContent = `保存失败：${error.message}`;
  }
}

function readConfigForm() {
  const form = document.querySelector("#configForm");
  return Object.fromEntries([...new FormData(form).entries()].map(([key, value]) => [key, Number(value)]));
}

function renderRooms() {
  const list = document.querySelector("#roomList");
  if (!state.rooms.length) {
    list.innerHTML = `<div class="empty-line">暂无房间。打开玩家页创建房间后会显示在这里。</div>`;
    return;
  }

  list.innerHTML = state.rooms
    .map((room) => {
      const active = room.id === state.selectedRoomId ? " active" : "";
      const phaseClass = room.phase === "bidding" ? " live" : room.phase === "settlement" ? " settlement" : "";
      const roundText = room.game ? `第 ${room.game.bidRound + 1}/${room.game.maxBidRounds} 轮` : "未开始";
      const players = room.players.map((player) => player.name).join("、") || "无人";
      return `<button class="room-card${active}" type="button" data-room-id="${escapeAttr(room.id)}">
        <strong><span class="room-code">${escapeHtml(room.id)}</span><span class="tag${phaseClass}">${phaseName(room.phase)}</span></strong>
        <div class="room-meta"><span>${escapeHtml(roundText)}</span><span>${room.playerCount}/${room.maxPlayers} 人</span></div>
        <div class="room-meta"><span>${escapeHtml(room.map?.name || "-")}</span><span>门票 ${formatMoney(room.map?.ticketCost || 0)}</span></div>
        <div class="room-players"><span>${escapeHtml(players)}</span></div>
      </button>`;
    })
    .join("");

  list.querySelectorAll("[data-room-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.selectedRoomId = button.dataset.roomId;
      renderRooms();
      await renderDetail(state.selectedRoomId);
    });
  });
}

async function renderDetail(roomId) {
  const data = await getJson(`/api/admin/rooms/${encodeURIComponent(roomId)}`);
  const room = data.room;
  document.querySelector("#emptyDetail").classList.add("hidden");
  document.querySelector("#detailBody").classList.remove("hidden");
  document.querySelector("#detailTitle").textContent = `房间 ${room.id}`;
  document.querySelector("#detailPhase").textContent = phaseName(room.phase);
  document.querySelector("#metricPhase").textContent = phaseName(room.phase);
  document.querySelector("#metricPlayers").textContent = `${room.playerCount}/${room.maxPlayers}`;
  document.querySelector("#metricRound").textContent = room.game ? `${room.game.bidRound + 1}/${room.game.maxBidRounds}` : "-";
  document.querySelector("#metricValue").textContent = room.game ? formatMoney(room.game.totalValue) : "-";
  document.querySelector("#roundResultText").textContent = room.game?.roundResult || "暂无结果";
  renderPlayers(room);
  renderGameInfo(room);
  renderActionLog(room);
}

function renderEmptyDetail() {
  document.querySelector("#emptyDetail").classList.remove("hidden");
  document.querySelector("#detailBody").classList.add("hidden");
  document.querySelector("#detailTitle").textContent = "选择一个房间";
  document.querySelector("#detailPhase").textContent = "等待";
}

function renderPlayers(room) {
  const players = room.game?.players || room.players;
  document.querySelector("#playerSummary").textContent = `${players.length} 人`;
  document.querySelector("#playerTable").innerHTML =
    players.length === 0
      ? `<div class="empty-line">暂无玩家</div>`
      : players.map(renderPlayerRow).join("");
}

function renderPlayerRow(player) {
  const bidHistory = player.bidHistory || Array(6).fill(null);
  const action = player.action || {};
  const status = player.human === false ? "AI" : player.connected === false ? "离线" : "在线";
  const statusClass = status === "在线" ? " live" : status === "AI" ? "" : " offline";
  const role = player.role || "未分配";
  const currentBid = typeof player.currentBid === "number" ? formatMoney(player.currentBid) : "-";
  return `<article class="player-row">
    <div class="seat">${player.seat || "-"}</div>
    <div class="player-name">
      <strong>${escapeHtml(player.name || "未知玩家")}</strong>
      <span>${escapeHtml(formatPlayerId(player.id))}</span>
    </div>
    <span class="tag${statusClass}">${status}</span>
    <b>${escapeHtml(role)}</b>
    <div class="bid-history">${bidHistory.map((bid, index) => renderBidPill(bid, index)).join("")}</div>
    <div class="actions">
      ${renderActionTag("技", action.skill)}
      ${renderActionTag("道", action.tool)}
      ${renderActionTag("价", action.bid)}
      <span class="tag">${currentBid}</span>
    </div>
  </article>`;
}

function renderBidPill(bid, index) {
  const filled = bid !== null && bid !== undefined;
  return `<span class="bid-pill${filled ? " filled" : ""}">${filled ? formatMoney(bid) : index + 1}</span>`;
}

function renderActionTag(label, done) {
  return `<span class="tag${done ? " live" : ""}">${label}${done ? "已用" : "未用"}</span>`;
}

function renderGameInfo(room) {
  const game = room.game;
  const rows = [];
  rows.push(["房间创建", formatClock(room.createdAt)]);
  rows.push(["最近更新", formatClock(room.updatedAt)]);
  rows.push(["地图", room.map ? `${room.map.name} · 门票 ${formatMoney(room.map.ticketCost)}` : "-"]);
  if (game) {
    rows.push(["拍品", game.lotName]);
    rows.push(["暗仓提示", game.lotHint || "-"]);
    rows.push(["本局暗仓", `${game.lotRows} 行 x ${game.lotCols} 列`]);
    rows.push(["暗仓尺寸", `固定 ${game.config.warehouseCols} 列，行数按藏品自动生成`]);
    rows.push(["目标填充率", `${game.config.warehouseFillPercent}%`]);
    rows.push(["资源预算", `${formatMoney(game.resourceSpent || 0)} / ${formatMoney(game.resourceBudget || 0)}`]);
    rows.push(["藏品数量", `${game.itemCount} 件`]);
    rows.push(["占用格", `${game.occupiedCells} 格`]);
    rows.push(["平局次数", `${game.tieCount} 次`]);
    if (game.settlement) {
      rows.push(["赢家", game.settlement.winnerName]);
      rows.push(["成交价", formatMoney(game.settlement.cost)]);
      rows.push(["清点进度", `${game.settlement.index}/${game.settlement.total}`]);
      rows.push(["当前盈亏", formatSignedMoney(game.settlement.profit)]);
      rows.push(["未拍中补贴", formatMoney(game.settlement.consolationBonus || 0)]);
    }
  }

  document.querySelector("#gameInfo").innerHTML = rows
    .map(([label, value]) => `<div class="info-row"><span>${escapeHtml(label)}</span><b>${escapeHtml(String(value))}</b></div>`)
    .join("");
}

function renderActionLog(room) {
  const actions = room.actions || [];
  document.querySelector("#actionLog").innerHTML =
    actions.length === 0
      ? `<div class="empty-line">暂无事件</div>`
      : actions
          .slice()
          .reverse()
          .map((action) => {
            const player = findPlayerName(room, action.playerId);
            return `<div class="action-row">
              <span>${escapeHtml(formatClock(action.createdAt))}</span>
              <b>${escapeHtml(player)} · ${escapeHtml(actionLabel[action.type] || action.type)}</b>
            </div>`;
          })
          .join("");
}

function findPlayerName(room, playerId) {
  if (!playerId) return "系统";
  const players = [...(room.players || []), ...(room.game?.players || [])];
  return players.find((player) => player.id === playerId)?.name || formatPlayerId(playerId);
}

function phaseName(phase) {
  return phaseLabel[phase] || phase || "-";
}

function formatClock(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("zh-CN", { hour12: false });
}

function formatPlayerId(id) {
  if (!id) return "UNKNOWN";
  if (id.startsWith("ai-")) return id.toUpperCase();
  return id.slice(0, 8).toUpperCase();
}

function formatMoney(value) {
  return Math.trunc(Number(value || 0)).toLocaleString("zh-CN");
}

function formatSignedMoney(value) {
  const amount = Math.trunc(Number(value || 0));
  return `${amount >= 0 ? "+" : ""}${formatMoney(amount)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
