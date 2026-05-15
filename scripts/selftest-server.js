const { applyRoomAction, checkDisconnected, createRoom, joinRoom, publicRoom, setGameConfigForTest } = require("../src/server");

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  setGameConfigForTest({
    bidRounds: 6,
    startingCash: 900000,
    maxBid: 999999999,
    bidStep: 10000,
    warehouseFillPercent: 92,
    skillRevealCount: 2,
    disconnectTimeoutSeconds: 10,
    settlementRevealMs: 800
  });
  testPrivateIntel();
  testTieRestartsRound();
  testEarlyCloseoutSettlement();
  testOnlyHostCanStartGame();
  testCurrentBidPrivacy();
  testDisconnectAiTakeover();
  testSettlementReadyRepair();
  const room = createRoom("Host");
  const playerId = room.players[0].id;

  applyRoomAction(room, { playerId, type: "startGame", payload: {} });
  room.game.config.settlementRevealMs = 1;

  let guardActions = 0;
  while (!room.game.settlement && guardActions < 30) {
    applyRoomAction(room, { playerId, type: "useSkill", payload: {} });
    applyRoomAction(room, { playerId, type: "useTool", payload: {} });
    applyRoomAction(room, { playerId, type: "submitBid", payload: { bid: 900000 } });
    guardActions += 1;
  }
  const expectedRevealOrder = [...room.game.lot.items]
    .sort((a, b) => a.y - b.y || a.x - b.x || b.w * b.h - a.w * a.h || b.value - a.value)
    .map((item) => item.id)
    .join("|");
  assert(room.game.settlement, "game should reach settlement");
  assert(room.game.settlement.revealOrder.join("|") === expectedRevealOrder, "settlement should reveal left-to-right, top-to-bottom");

  for (let guard = 0; !room.game.settlement.readyToSave && guard < 200; guard += 1) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert(room.game.settlement.readyToSave, "settlement should pause after reveal for lock choices");
  const unlockedRevealed = room.game.lot.items.find((item) => item.revealed && item.rarity !== "red" && item.rarity !== "gold");
  if (unlockedRevealed) {
    applyRoomAction(room, { playerId: room.game.settlement.winner.id, type: "setSettlementLock", payload: { itemId: unlockedRevealed.id, locked: true } });
    assert(unlockedRevealed.locked === true, "winner should be able to lock revealed settlement items before saving");
  }
  const expectedKept = room.game.lot.items.filter((item) => item.locked).length;
  const expectedSold = room.game.lot.items.length - expectedKept;
  applyRoomAction(room, { playerId: room.game.settlement.winner.id, type: "confirmSettlement", payload: {} });

  const snapshot = publicRoom(room);
  const winner = snapshot.game.players.find((player) => player.id === snapshot.game.settlement.winner.id);
  const expectedBonus = Math.floor(Math.abs(snapshot.game.settlement.value - snapshot.game.settlement.cost) / 10);
  const ok =
    snapshot.game &&
    snapshot.game.players.length === 4 &&
    snapshot.game.players.some((player) => player.bidHistory.some((bid) => bid !== null)) &&
    winner &&
    winner.items.length === expectedKept &&
    snapshot.game.settlement.saved &&
    snapshot.game.settlement.keptCount === expectedKept &&
    snapshot.game.settlement.soldCount === expectedSold &&
    snapshot.game.settlement.index === snapshot.game.settlement.revealOrder.length &&
    snapshot.game.settlement.consolationBonus === expectedBonus &&
    snapshot.game.settlement.bonuses.length === 3;

  if (!ok) {
    console.error(JSON.stringify(snapshot, null, 2));
    process.exit(1);
  }

  console.log("server-selftest-ok");
}

function testPrivateIntel() {
  const room = createRoom("Host");
  const second = joinRoom(room, "Guest");
  const firstId = room.players[0].id;
  applyRoomAction(room, { playerId: firstId, type: "startGame", payload: {} });
  assert(room.game.lot.rows >= 1, "warehouse rows should be generated after loot selection");
  assert(room.game.lot.cols === 15, "warehouse cols should be fixed at 15");
  assert(room.game.lot.generationMode === "resource-budget", "warehouse should use resource-budget generation");
  assert(room.game.lot.resourceBudget > 0, "warehouse should roll a resource budget");
  assert(room.game.lot.resourceSpent > 0, "warehouse should spend resource while generating loot");
  assert(room.game.lot.ticketCost > 0, "map should charge a ticket");
  assert(room.game.players[0].cash === 900000 - room.game.lot.ticketCost, "ticket should be paid before bidding");
  assert(new Set(room.game.lot.items.map((item) => item.name)).size === room.game.lot.items.length, "warehouse should not duplicate loot names");
  assert(room.game.lot.items.every((item) => item.resourceCost > 0), "loot should record resource cost");
  assert(room.game.lot.items.every((item) => item.baseValue > 0 && item.condition && item.conditionFactor > 0), "loot should have generated condition metadata");
  assert(room.game.lot.items.some((item) => item.value !== item.baseValue), "loot should have condition-based value variance");
  applyRoomAction(room, { playerId: firstId, type: "useSkill", payload: {} });
  const firstView = publicRoom(room, firstId);
  const secondView = publicRoom(room, second.id);
  assert(!("resourceBudget" in firstView.game.lot), "resource budget should not be visible to players");
  assert(!("resourceRoll" in firstView.map), "map resource roll should not be visible to players");
  const firstHints = firstView.game.lot.items.filter((item) => item.infoLevel !== "hidden").length;
  const secondHints = secondView.game.lot.items.filter((item) => item.infoLevel !== "hidden").length;
  assert(firstHints > 0, "private skill hint missing for owner");
  assert(secondHints === 0, "private skill hint leaked to another player");
  assert(firstView.game.roundActions[firstId]?.skill === true, "owner should see own skill action");
  assert(!secondView.game.roundActions[firstId], "private skill action leaked to another player");
}

function testTieRestartsRound() {
  const room = createRoom("Host");
  const guest = joinRoom(room, "Guest");
  const firstId = room.players[0].id;
  applyRoomAction(room, { playerId: firstId, type: "startGame", payload: {} });
  room.game.config.settlementRevealMs = 1;
  room.game.players.filter((player) => !player.human).forEach((player) => {
    player.cash = 0;
  });
  applyRoomAction(room, { playerId: firstId, type: "useSkill", payload: {} });
  applyRoomAction(room, { playerId: firstId, type: "submitBid", payload: { bid: 100000 } });
  applyRoomAction(room, { playerId: guest.id, type: "submitBid", payload: { bid: 100000 } });
  assert(room.game.bidRound === 0, "tie should not advance round");
  assert(room.game.players[0].bidHistory[0] === null, "tie should clear current round bid");
  assert(room.game.roundActions[firstId].skill === true, "tie should preserve used skill for the restarted round");
  assert(room.game.roundActions[firstId].bid === false, "tie should unlock bidding for the restarted round");
  assert(room.game.roundResult.includes("平局"), "tie result should mention restart");
}

function testCurrentBidPrivacy() {
  const room = createRoom("Host");
  const guest = joinRoom(room, "Guest");
  const firstId = room.players[0].id;
  applyRoomAction(room, { playerId: firstId, type: "startGame", payload: {} });
  applyRoomAction(room, { playerId: firstId, type: "submitBid", payload: { bid: 180123 } });
  const firstView = publicRoom(room, firstId);
  const secondView = publicRoom(room, guest.id);
  assert(firstView.game.players[0].bidHistory[0] === 180123, "owner should see exact own current bid without step rounding");
  assert(secondView.game.players[0].bidHistory[0] === null, "current bid leaked before the round opened");
}

function testOnlyHostCanStartGame() {
  const room = createRoom("Host");
  const guest = joinRoom(room, "Guest");
  let blocked = false;
  try {
    applyRoomAction(room, { playerId: guest.id, type: "startGame", payload: {} });
  } catch (error) {
    blocked = error?.statusCode === 403 && error?.message === "forbidden_player";
  }
  assert(blocked, "non-host start should be rejected with forbidden_player");
  assert(room.phase === "lobby", "non-host should not be able to start game");
  assert(room.game === null, "non-host start should not create game state");

  const hostId = room.players[0].id;
  applyRoomAction(room, { playerId: hostId, type: "startGame", payload: {} });
  assert(room.phase === "bidding", "host should be able to start game");
  assert(room.game, "host start should create game state");
}

function testEarlyCloseoutSettlement() {
  const room = createRoom("Host");
  const guest = joinRoom(room, "Guest");
  const firstId = room.players[0].id;
  applyRoomAction(room, { playerId: firstId, type: "startGame", payload: {} });
  room.game.config.settlementRevealMs = 1;
  room.game.players.filter((player) => !player.human).forEach((player) => {
    player.cash = 0;
  });
  applyRoomAction(room, { playerId: firstId, type: "submitBid", payload: { bid: 200000 } });
  applyRoomAction(room, { playerId: guest.id, type: "submitBid", payload: { bid: 100000 } });
  assert(room.phase === "settlement", "first round 2x bid should directly start settlement");
  assert(room.game.bidRound === 0, "early closeout should not advance to next round");
  assert(room.game.roundResult.includes("提前成交线"), "early closeout result should mention the multiplier rule");
}

function testDisconnectAiTakeover() {
  const room = createRoom("Host");
  const guest = joinRoom(room, "Guest");
  const firstId = room.players[0].id;
  applyRoomAction(room, { playerId: firstId, type: "startGame", payload: {} });
  const guestRoomPlayer = room.players.find((player) => player.id === guest.id);
  guestRoomPlayer.lastSeenAt = Date.now() - 60_000;
  checkDisconnected(room);
  const guestGamePlayer = room.game.players.find((player) => player.id === guest.id);
  assert(guestGamePlayer.human === false, "disconnected player should be AI controlled");
}

function testSettlementReadyRepair() {
  const room = createRoom("Host");
  const firstId = room.players[0].id;
  applyRoomAction(room, { playerId: firstId, type: "startGame", payload: {} });
  room.game.config.bidRounds = 1;
  room.game.config.settlementRevealMs = 1_000;
  room.game.players.filter((player) => !player.human).forEach((player) => {
    player.cash = 0;
  });
  applyRoomAction(room, { playerId: firstId, type: "submitBid", payload: { bid: 200000 } });
  const settlement = room.game.settlement;
  assert(settlement, "repair test should reach settlement");
  settlement.index = settlement.revealOrder.length;
  settlement.readyToSave = false;
  settlement.nextRevealAt = Date.now() + 60_000;
  publicRoom(room, firstId);
  assert(settlement.readyToSave === true, "settlement should repair ready state when index reaches total");
  assert(room.game.lot.items.every((item) => item.revealed), "settlement repair should reveal matching warehouse items before ready");
  assert(settlement.items.length === settlement.revealOrder.length, "settlement repair should rebuild revealed item list");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
