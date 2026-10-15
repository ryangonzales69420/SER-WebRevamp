(function defineSerBlocks() {
  "use strict";

  const indent = "    ";
  const actionCheck = "SER_ACTION";
  const playerCheck = "Player";
  const anyValue = ["Number", "String", "Duration", "Player"];
  const groupTargets = new Set(["@all", "@alivePlayers", "@scpPlayers", "@classDPlayers"]);
  const colours = { start: 45, players: 60, messages: 161, world: 3, logic: 285, server: 208, variables: 265, libraries: 42 };
  const categories = [
    ["start", "Start"], ["players", "Players"], ["messages", "Messages"], ["world", "World"],
    ["logic", "Logic & values"], ["variables", "Variables & saving"], ["server", "Server"], ["libraries", "Libraries"]
  ];
  const categoryNames = Object.fromEntries(categories);

  const targetOptions = [
    ["all players", "@all"], ["living players", "@alivePlayers"], ["SCP players", "@scpPlayers"],
    ["Class-D players", "@classDPlayers"], ["the event player", "@evPlayer"], ["the event attacker", "@evAttacker"],
    ["the command user", "@sender"]
  ];
  const targetLabels = Object.fromEntries(targetOptions.map(([label, value]) => [value, label]));
  const boolOptions = [["on", "true"], ["off", "false"]];
  const durationUnits = [["milliseconds", "ms"], ["seconds", "s"], ["minutes", "m"], ["hours", "h"]];
  const waveOptions = [["Chaos wave", "chaosWave"], ["mini Chaos wave", "miniChaosWave"], ["MTF wave", "mtfWave"], ["mini MTF wave", "miniMtfWave"]];
  const zones = ["LightContainment", "HeavyContainment", "Entrance", "Surface"];
  const roles = ["ClassD", "Scientist", "ChaosConscript", "FacilityGuard", "NtfPrivate", "NtfSergeant", "NtfCaptain", "NtfSpecialist", "Scp173", "Scp049", "Scp096", "Scp106", "Scp079", "Scp939", "Scp3114", "Tutorial", "Spectator"];
  const items = SER_TRUTH_TABLE.methods.GiveItem.arguments[1].enumValues.filter(item => item !== "None");
  const effects = ["AmnesiaItems", "AmnesiaVision", "AnomalousRegeneration", "AnomalousTarget", "Asphyxiated", "Bleeding", "Blindness", "Blurred", "BodyshotReduction", "Burned", "CardiacArrest", "AntiScp207", "Scp207", "Concussed", "Corroding", "DamageReduction", "Deafened", "Decontaminating", "Disabled", "Ensnared", "Exhausted", "Fade", "Flashed", "FocusedVision", "FogControl", "Ghostly", "HeavyFooted", "Hemorrhage", "InsufficientLighting", "Invigorated", "Invisible", "Lightweight", "MovementBoost", "NightVision", "PitDeath", "PocketCorroding", "Poisoned", "RainbowTaste", "Scanned", "Scp1344", "Scp1853", "SeveredEyes", "SeveredHands", "SilentWalk", "Sinkhole", "Slowness", "SoundtrackMute", "SpawnProtected", "Stained", "Strangled", "Traumatized", "Vitality", "Hypothermia"];
  const flagMethods = { godmode: "SetGodMode", noclip: "SetNoclip", bypass: "SetBypass", spectatable: "SetSpectatability" };
  const keepScopeOptions = [["until cleared", "keep"], ["this life only", "life"]];
  const variableScopeOptions = [["this script only", "local"], ["global (shared)", "global"]];
  const clearModeOptions = [["all saved data", "all"], ["one key", "one"]];
  const doorPermissionOptions = ["Checkpoints", "ExitGates", "Intercom", "AlphaWarhead", "ContainmentLevelOne", "ContainmentLevelTwo", "ContainmentLevelThree", "ArmoryLevelOne", "ArmoryLevelTwo", "ArmoryLevelThree", "ScpOverride", "All", "None"];

  const glyph = hex => {
    const code = Number.parseInt(hex, 16);
    return Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  };
  const prettyLabel = value => value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, character => character.toUpperCase());
  const asOptions = list => list.map(value => [prettyLabel(value), value]);
  const roomNames = SER_TRUTH_TABLE.methods.GetRoomByName.arguments[0].enumValues.filter(room => room !== "Unnamed");
  const placeOptions = [["everywhere", "all"], ...zones.map(zone => [`${prettyLabel(zone)} zone`, zone]), ...asOptions(roomNames)];
  const itemOptions = asOptions(items);
  const effectOptions = asOptions(effects);
  const eventOptions = [
    ["the round starts", "RoundStarted"], ["the round ends", "RoundEnded"], ["the round is ending", "RoundEnding"],
    ["a player joins", "Joined"], ["a player leaves", "Left"], ["a player spawns", "Spawned"], ["a player dies", "Death"],
    ["a player is hurt", "Hurt"], ["a player escapes", "Escaped"], ["a player changes role", "ChangedRole"],
    ["a player picks up an item", "PickedUpItem"], ["a player is kicked", "Kicked"],
    ["a player is banned", "Banned"], ["a player enters a new room", "RoomChanged"], ["a player enters a new zone", "ZoneChanged"],
    ["a player triggers a tesla", "TriggeredTesla"], ["a player opens or uses a door", "InteractedDoor"],
    ["a player uses the intercom", "UsedIntercom"], ["the warhead starts", "Started"], ["the warhead detonates", "Detonated"],
    ["a respawn wave is starting", "WaveRespawning"], ["decontamination starts", "LczDecontaminationStarting"],
    ["CASSIE announces something", "CassieAnnouncing"], ["a generator is activated", "GeneratorActivated"]
  ].filter(([, value]) => value in (SER_TRUTH_TABLE.eventDetails || {}));
  const itemEventOptions = [["a player uses an item", "UsedItem"], ["a player equips an item", "ChangedItem"]];
  const eventLabels = Object.fromEntries([...eventOptions, ...itemEventOptions].map(([label, value]) => [value, label]));

  const gen = new Blockly.Generator("SER");
  gen.ORDER_ATOMIC = 0;
  gen.ORDER_NONE = 99;
  gen.INDENT = indent;
  gen.scrub_ = function (block, code, thisOnly) {
    const next = block.nextConnection && block.nextConnection.targetBlock();
    return code + (thisOnly || !next ? "" : this.blockToCode(next));
  };

  const valueOf = (block, name) => gen.valueToCode(block, name, gen.ORDER_ATOMIC) || "...";
  const conditionOf = block => gen.valueToCode(block, "COND", gen.ORDER_NONE) || "...";
  const bodyOf = (block, name) => gen.statementToCode(block, name);
  const escapeText = value => String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\{/g, "(").replace(/\}/g, ")")
    .replace(/~/g, "~~").replace(/"/g, '~"');
  const quote = value => `"${escapeText(value)}"`;
  const unindent = code => code.split("\n").map(line => line.startsWith(indent) ? line.slice(indent.length) : line).join("\n");
  const cleanName = (value, fallback) => (String(value ?? "").trim().replace(/[^A-Za-z0-9_]/g, "") || fallback);
  const hexOf = (value, fallback) => {
    const hex = String(value ?? "").replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    return hex.length === 6 ? hex : fallback;
  };
  const braceEnd = code => {
    let depth = 0;
    let inQuote = false;
    for (let index = 0; index < code.length; index++) {
      const char = code[index];
      if (char === "~") { index++; continue; }
      if (char === '"') inQuote = !inQuote;
      if (inQuote) continue;
      if (char === "{") depth++;
      if (char === "}" && --depth === 0) return index;
    }
    return -1;
  };
  const isBraced = code => code.startsWith("{") && braceEnd(code) === code.length - 1;
  const asExpr = code => (isBraced(code) ? code : `{${code}}`);
  const inside = code => (isBraced(code) ? code.slice(1, -1) : code);
  const textPart = (block, name) => {
    const child = block.getInputTargetBlock(name);
    if (child && child.type === "ser_text") return escapeText(child.getFieldValue("TEXT"));
    const code = valueOf(block, name);
    if (/^"(?:[^"~]|~.)*"$/.test(code)) return code.slice(1, -1);
    return `{${inside(code)}}`;
  };
  const keyCode = (block, keyName, targetName) => (
    block.getFieldValue("SCOPE") === "life"
      ? `"${textPart(block, keyName)}_{${valueOf(block, targetName)} -> LifeId}"`
      : valueOf(block, keyName)
  );
  const usedTargets = root => [...new Set(
    root.getDescendants(false).filter(block => block.type === "ser_target").map(block => block.getFieldValue("TARGET"))
  )].sort();

  const specs = [];
  const def = spec => specs.push(spec);
  const tgt = value => ["ser_target", { TARGET: value }];
  const num = number => ["ser_number", { NUMBER: number }];
  const txt = text => ["ser_text", { TEXT: text }];
  const dur = (amount, unit = "s") => ["ser_duration", { AMOUNT: amount, UNIT: unit }];
  const playerInput = { input: "TARGET", check: playerCheck };
  const dd = (field, options) => ({ field, options });
  const tf = (field, text) => ({ field, text });
  const nf = (field, number, min = -1000000, max = 1000000, precision = 0.01) => ({ field, number, min, max, precision });
  const evTarget = { TARGET: tgt("@evPlayer") };
  const allTarget = { TARGET: tgt("@all") };
  const singleTarget = ["TARGET"];
  const inputOf = (name, check) => ({ input: name, check });

  def({
    id: "ser_when_event", cat: "start", kind: "hat", icon: "f04b", title: "When something happens",
    tip: "Runs the blocks inside whenever the chosen event happens.",
    parts: ["When", dd("EVENT", eventOptions), "do", { body: "DO" }],
    code: (block, g) => {
      const required = usedTargets(block).filter(target => target.startsWith("@ev"));
      const requireLine = required.length ? `-- require ${required.join(" ")}\n` : "";
      return `!-- OnEvent ${block.getFieldValue("EVENT")}\n${requireLine}\n${unindent(g.statementToCode(block, "DO"))}`;
    }
  });

  def({
    id: "ser_when_item", cat: "start", kind: "hat", icon: "f466", title: "When a player uses or equips an item",
    tip: "Runs the blocks inside when a player uses or equips the chosen kind of item. Coins, keycards, and firearms can only be equipped.",
    parts: ["When a player", dd("EVENT", [["uses", "UsedItem"], ["equips", "ChangedItem"]]), "an item", dd("FILTER", [["any item", "any"], ["a coin", "coin"], ["a firearm", "firearm"], ["a keycard", "keycard"], ["a custom keycard", "customKeycard"], ["one exact item", "exact"]]), dd("EXACT", itemOptions), "do", { body: "DO" }],
    code: (block, g) => {
      const event = block.getFieldValue("EVENT");
      const ref = event === "UsedItem" ? "evUsableItem" : "evNewItem";
      const filter = block.getFieldValue("FILTER");
      const test = filter === "any" ? "" : itemTest(ref, filter, block.getFieldValue("EXACT"));
      const header = `!-- OnEvent ${event}\n-- require @evPlayer *${ref}\n`;
      const body = g.statementToCode(block, "DO");
      return `${header}\n${test ? `if ${test}\n${body}end\n` : unindent(body)}`;
    }
  });

  def({
    id: "ser_when_command", cat: "start", kind: "hat", icon: "f075", title: "When a player types a command",
    tip: "Creates a custom command. The blocks inside run when someone types it. Spaces and symbols are removed from the name.",
    parts: ["Command", tf("COMMAND", "heal"), "from", dd("AUDIENCE", [["players", "Player"], ["Remote Admin", "RemoteAdmin"], ["server console", "Server"]]), "do", { body: "DO" }],
    code: (block, g) => {
      const senderLine = usedTargets(block).includes("@sender") ? "-- requireSender\n" : "";
      return `!-- CustomCommand ${cleanName(block.getFieldValue("COMMAND"), "command")}\n-- availableFor ${block.getFieldValue("AUDIENCE")}\n${senderLine}\n${unindent(g.statementToCode(block, "DO"))}`;
    }
  });

  def({
    id: "ser_when_manual", cat: "start", kind: "hat", icon: "f144", title: "When I run it by hand",
    tip: "No automatic trigger. Run this script manually from the server or Remote Admin.",
    parts: ["When I run this by hand, do", { body: "DO" }],
    code: (block, g) => unindent(g.statementToCode(block, "DO"))
  });

  def({
    id: "ser_target", cat: "players", kind: "value", output: playerCheck, icon: "f0c0", title: "Players",
    tip: "Chooses which player or group an action affects.",
    parts: [dd("TARGET", targetOptions)],
    code: block => [block.getFieldValue("TARGET"), gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_health", cat: "players", kind: "statement", icon: "f004", title: "Change health",
    tip: "Heals the chosen players by an amount, hurts them by an amount, or sets their health to an exact value. Healing never goes over the player's maximum.",
    parts: ["health of", playerInput, dd("MODE", [["heal by", "heal"], ["hurt by", "hurt"], ["set to", "set"]]), inputOf("AMOUNT", "Number")],
    defaults: { ...evTarget, AMOUNT: num(25) },
    code: block => {
      const method = { heal: "Heal", hurt: "Damage", set: "SetHealth" }[block.getFieldValue("MODE")];
      return `${method} ${valueOf(block, "TARGET")} ${valueOf(block, "AMOUNT")}\n`;
    }
  });

  def({
    id: "ser_kill", cat: "players", kind: "statement", icon: "f714", title: "Kill",
    tip: "Kills the chosen players.",
    parts: ["kill", playerInput],
    defaults: evTarget,
    code: block => `Kill ${valueOf(block, "TARGET")}\n`
  });

  def({
    id: "ser_set_max_health", cat: "players", kind: "statement", icon: "f004", title: "Set max health",
    tip: "Changes the maximum health of the chosen players.",
    parts: ["set max health of", playerInput, "to", inputOf("AMOUNT", "Number")],
    defaults: { ...evTarget, AMOUNT: num(100) },
    code: block => `SetMaxHealth ${valueOf(block, "TARGET")} ${valueOf(block, "AMOUNT")}\n`
  });

  def({
    id: "ser_regen", cat: "players", kind: "statement", icon: "f004", title: "Health regeneration",
    tip: "Adds health regeneration to the chosen players for a set number of seconds.",
    parts: ["regenerate", playerInput, "by", inputOf("RATE", "Number"), "per second for", inputOf("DURATION", "Number"), "seconds"],
    defaults: { ...evTarget, RATE: num(2), DURATION: num(10) },
    code: block => `SetRegeneration ${valueOf(block, "TARGET")} ${valueOf(block, "RATE")} ${valueOf(block, "DURATION")}\n`
  });

  def({
    id: "ser_ahp", cat: "players", kind: "statement", icon: "f067", title: "Artificial health",
    tip: "Gives the chosen players temporary health that absorbs damage before their normal health is hit.",
    parts: ["give", playerInput, inputOf("AMOUNT", "Number"), "artificial health, capped at", inputOf("LIMIT", "Number")],
    defaults: { ...evTarget, AMOUNT: num(50), LIMIT: num(75) },
    code: block => `SetAHP ${valueOf(block, "TARGET")} ${valueOf(block, "AMOUNT")} ${valueOf(block, "LIMIT")}\n`
  });

  def({
    id: "ser_set_role", cat: "players", kind: "statement", icon: "f4fe", title: "Change role",
    tip: "Changes the chosen players to another role.",
    parts: ["change", playerInput, "to role", dd("ROLE", asOptions(roles))],
    defaults: evTarget,
    code: block => `SetRole ${valueOf(block, "TARGET")} ${block.getFieldValue("ROLE")}\n`
  });

  def({
    id: "ser_teleport_player", cat: "players", kind: "statement", icon: "f124", title: "Teleport to player",
    tip: "Moves the first players to the second player. The destination must be one player.",
    parts: ["teleport", playerInput, "to", { input: "DEST", check: playerCheck }],
    defaults: { ...evTarget, DEST: tgt("@sender") },
    single: ["DEST"],
    code: block => `TPPlayer ${valueOf(block, "TARGET")} ${valueOf(block, "DEST")}\n`
  });

  def({
    id: "ser_teleport_spawn", cat: "players", kind: "statement", icon: "f124", title: "Teleport to spawn",
    tip: "Moves the chosen players to where a role spawns.",
    parts: ["teleport", playerInput, "to spawn of", dd("ROLE", asOptions(roles))],
    defaults: evTarget,
    code: block => `TPSpawn ${valueOf(block, "TARGET")} ${block.getFieldValue("ROLE")}\n`
  });

  def({
    id: "ser_tp_room", cat: "players", kind: "statement", icon: "f124", title: "Teleport to room",
    tip: "Teleports the chosen players to exact world coordinates, or to a room or zone. For a room or zone, x, y, and z are offsets from its center.",
    parts: ["teleport", playerInput, "to", dd("PLACE", [["exact coordinates", "exact"], ...placeOptions.slice(1)]), "x", inputOf("X", "Number"), "y", inputOf("Y", "Number"), "z", inputOf("Z", "Number")],
    defaults: { ...evTarget, X: num(0), Y: num(0), Z: num(0) },
    code: block => {
      const target = valueOf(block, "TARGET");
      const coords = `${valueOf(block, "X")} ${valueOf(block, "Y")} ${valueOf(block, "Z")}`;
      return block.getFieldValue("PLACE") === "exact"
        ? `TPPosition ${target} ${coords}\n`
        : `TPRoom ${target} ${block.getFieldValue("PLACE")} ${coords}\n`;
    }
  });

  def({
    id: "ser_jump", cat: "players", kind: "statement", icon: "f062", title: "Jump",
    tip: "Makes the chosen players jump.",
    parts: ["jump", playerInput],
    defaults: evTarget,
    code: block => `Jump ${valueOf(block, "TARGET")}\n`
  });

  def({
    id: "ser_explode", cat: "players", kind: "statement", icon: "f1e2", title: "Explode player",
    tip: "Explodes the chosen players.",
    parts: ["explode", playerInput],
    defaults: evTarget,
    code: block => `Explode ${valueOf(block, "TARGET")}\n`
  });

  def({
    id: "ser_give_item", cat: "players", kind: "statement", icon: "f466", title: "Give item",
    tip: "Gives one item to the chosen players.",
    parts: ["give", playerInput, "item", dd("ITEM", itemOptions)],
    defaults: evTarget,
    code: block => `GiveItem ${valueOf(block, "TARGET")} ${block.getFieldValue("ITEM")}\n`
  });

  def({
    id: "ser_force_equip", cat: "players", kind: "statement", icon: "f0ad", title: "Force equip",
    tip: "Forces the chosen players to hold the selected item.",
    parts: ["force", playerInput, "to equip", dd("ITEM", itemOptions)],
    defaults: evTarget,
    code: block => `ForceEquip ${valueOf(block, "TARGET")} ${block.getFieldValue("ITEM")}\n`
  });

  def({
    id: "ser_item_spawn", cat: "players", kind: "statement", icon: "f466", title: "Spawn item on player",
    tip: "Creates an item and drops it onto one player. Use one player, not a group.",
    parts: ["spawn", dd("ITEM", itemOptions), "on", playerInput, "as", tf("NAME", "spawnedItem")],
    defaults: evTarget,
    single: singleTarget,
    code: block => {
      const name = cleanName(block.getFieldValue("NAME"), "spawnedItem");
      return `*${name} = CreatePickup ${block.getFieldValue("ITEM")}\nSpawnPickupPlayer *${name} ${valueOf(block, "TARGET")}\n`;
    }
  });

  def({
    id: "ser_item_remove", cat: "players", kind: "statement", icon: "f1f8", title: "Remove items",
    tip: "Destroys or drops a number of one item type from the chosen players' inventories. Choose 'all items' to empty their inventories.",
    parts: [dd("MODE", [["destroy", "destroy"], ["drop on the ground", "drop"]]), inputOf("AMOUNT", "Number"), dd("ITEM", [...itemOptions, ["all items", "all"]]), "from", playerInput],
    defaults: { ...evTarget, AMOUNT: num(1) },
    code: block => {
      const target = valueOf(block, "TARGET");
      const drop = block.getFieldValue("MODE") === "drop";
      if (block.getFieldValue("ITEM") === "all") return `ClearInventory ${target}${drop ? " drop" : ""}\n`;
      const method = drop ? "DropItem" : "DestroyItem";
      return `${method} ${target} ${block.getFieldValue("ITEM")} ${valueOf(block, "AMOUNT")}\n`;
    }
  });

  def({
    id: "ser_loadout", cat: "players", kind: "statement", icon: "f291", title: "Give role kit",
    tip: "Gives the chosen players the starting items and ammo of a role, without changing their role.",
    parts: ["give", playerInput, "the starting kit of role", dd("ROLE", asOptions(roles))],
    defaults: evTarget,
    code: block => `GrantLoadout ${valueOf(block, "TARGET")} ${block.getFieldValue("ROLE")}\n`
  });

  def({
    id: "ser_give_effect", cat: "players", kind: "statement", icon: "f48e", title: "Give or remove effect",
    tip: "Gives a status effect for a duration, or removes one effect (or every effect) from the chosen players. Intensity 1 is the normal strength.",
    note: "When removing, only the effect choice is used. 'All effects' can only be removed, not given.",
    parts: [dd("MODE", [["give effect", "give"], ["remove effect", "remove"]]), dd("EFFECT", [["all effects", "all"], ...effectOptions]), "to", playerInput, "for", inputOf("DURATION", "Duration"), "intensity", inputOf("INTENSITY", "Number")],
    defaults: { ...evTarget, DURATION: dur(10), INTENSITY: num(1) },
    code: block => {
      const effect = block.getFieldValue("EFFECT");
      const target = valueOf(block, "TARGET");
      if (block.getFieldValue("MODE") === "remove") return `ClearEffect ${target}${effect === "all" ? "" : ` ${effect}`}\n`;
      if (effect === "all") return "-- pick one effect to give\n";
      return `GiveEffect ${target} ${effect} ${valueOf(block, "DURATION")} ${valueOf(block, "INTENSITY")}\n`;
    }
  });

  def({
    id: "ser_set_flag", cat: "players", kind: "statement", icon: "f3ed", title: "Set player permission",
    tip: "Turns god mode, noclip, bypass, or spectatable on or off for the chosen players.",
    parts: ["set", dd("FLAG", [["god mode", "godmode"], ["noclip", "noclip"], ["bypass", "bypass"], ["spectatable", "spectatable"]]), "of", playerInput, "to", dd("STATE", boolOptions)],
    defaults: evTarget,
    code: block => `${flagMethods[block.getFieldValue("FLAG")]} ${valueOf(block, "TARGET")} ${block.getFieldValue("STATE")}\n`
  });

  def({
    id: "ser_set_text", cat: "players", kind: "statement", icon: "f031", title: "Set name or overhead text",
    tip: "Changes the name shown to players, or the text shown above a player's head.",
    parts: ["set", dd("PROP", [["display name", "display"], ["overhead text", "custom"]]), "of", playerInput, "to", inputOf("TEXT", "String")],
    defaults: { ...evTarget, TEXT: txt("VIP") },
    code: block => {
      const method = block.getFieldValue("PROP") === "display" ? "SetDisplayName" : "SetCustomInfo";
      return `${method} ${valueOf(block, "TARGET")} ${valueOf(block, "TEXT")}\n`;
    }
  });

  def({
    id: "ser_emote", cat: "players", kind: "statement", icon: "f118", title: "Set expression",
    tip: "Changes the face expression shown on the chosen players.",
    parts: ["set expression of", playerInput, "to", dd("EMOTION", [["neutral", "Neutral"], ["happy", "Happy"], ["awkward smile", "AwkwardSmile"], ["scared", "Scared"], ["angry", "Angry"], ["chad", "Chad"], ["ogre", "Ogre"]])],
    defaults: evTarget,
    code: block => `SetEmote ${valueOf(block, "TARGET")} ${block.getFieldValue("EMOTION")}\n`
  });

  def({
    id: "ser_gravity", cat: "players", kind: "statement", icon: "f062", title: "Set gravity",
    tip: "Changes how strongly gravity pulls the chosen players. Normal gravity is about -9.81.",
    parts: ["set gravity of", playerInput, "to", inputOf("GRAVITY", "Number")],
    defaults: { ...evTarget, GRAVITY: num(-9.81) },
    code: block => `SetGravity ${valueOf(block, "TARGET")} ${valueOf(block, "GRAVITY")}\n`
  });

  def({
    id: "ser_mute", cat: "players", kind: "statement", icon: "f131", title: "Mute player",
    tip: "Mutes the chosen players, either temporarily or until someone unmutes them.",
    parts: ["mute", playerInput, dd("MODE", [["temporarily", "true"], ["until unmuted", "false"]])],
    defaults: evTarget,
    code: block => `Mute ${valueOf(block, "TARGET")} ${block.getFieldValue("MODE")}\n`
  });

  def({
    id: "ser_ban", cat: "players", kind: "statement", icon: "f05e", title: "Ban player",
    tip: "Bans the chosen players for a set time with a reason shown to them.",
    parts: ["ban", playerInput, "for", inputOf("DURATION", "Duration"), "reason", inputOf("REASON", "String")],
    defaults: { ...evTarget, DURATION: dur(1, "h"), REASON: txt("Banned by server rule") },
    code: block => `Ban ${valueOf(block, "TARGET")} ${valueOf(block, "DURATION")} ${valueOf(block, "REASON")}\n`
  });

  def({
    id: "ser_kick", cat: "players", kind: "statement", icon: "f2f5", title: "Kick player",
    tip: "Removes the chosen players from the server with a reason shown to them. They can rejoin.",
    parts: ["kick", playerInput, "reason", inputOf("REASON", "String")],
    defaults: { ...evTarget, REASON: txt("Removed by a server rule") },
    code: block => `Kick ${valueOf(block, "TARGET")} ${valueOf(block, "REASON")}\n`
  });

  def({
    id: "ser_foreach_player", cat: "players", kind: "statement", icon: "f363", title: "For each player",
    tip: "Runs the blocks inside once per player in the chosen group.",
    note: "Inside the loop, the current player is named with @ and your name, e.g. @p.",
    parts: ["for each player in", playerInput, "as", tf("VAR", "p"), "do", { body: "DO" }],
    defaults: { TARGET: tgt("@alivePlayers") },
    code: (block, g) => `over ${valueOf(block, "TARGET")} with @${cleanName(block.getFieldValue("VAR"), "p")}\n${bodyOf(block, "DO")}end\n`
  });

  def({
    id: "ser_filter_players", cat: "players", kind: "value", output: "Player", icon: "f0c0", title: "Filter players",
    tip: "Keeps only the players in the group whose chosen property matches the value.",
    parts: ["players in", playerInput, "where", dd("PROP", [["role", "Role"], ["team", "Team"], ["alive", "IsAlive"], ["health", "Health"], ["room", "RoomRef"], ["group", "GroupName"]]), "is", inputOf("VALUE", null)],
    defaults: { TARGET: tgt("@alivePlayers"), VALUE: txt("ClassD") },
    code: block => [`{Filter ${valueOf(block, "TARGET")} ${block.getFieldValue("PROP")} ${valueOf(block, "VALUE")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_take_players", cat: "players", kind: "value", output: "Player", icon: "f0c0", title: "Take some players",
    tip: "Keeps up to the chosen number of players from the group.",
    parts: ["take up to", inputOf("LIMIT", "Number"), "of", playerInput],
    defaults: { TARGET: tgt("@alivePlayers"), LIMIT: num(1) },
    code: block => [`{Take ${valueOf(block, "TARGET")} ${valueOf(block, "LIMIT")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_player_value", cat: "players", kind: "value", output: null, icon: "f0cb", title: "Player value",
    tip: "Reads one fact about a player: health, max health, position, role, team, name, or player ID.",
    parts: [dd("PROP", [["health", "health"], ["max health", "maxHealth"], ["X position", "PosX"], ["Y position", "PosY"], ["Z position", "PosZ"], ["role", "role"], ["team", "team"], ["name", "name"], ["player ID", "playerId"]]), "of", playerInput],
    defaults: evTarget, single: singleTarget,
    code: block => [`{${valueOf(block, "TARGET")} -> ${block.getFieldValue("PROP")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_is_alive", cat: "players", kind: "value", output: "Boolean", icon: "f004", title: "Is alive",
    tip: "True if the player is alive.",
    parts: [playerInput, "is alive"],
    defaults: evTarget, single: singleTarget,
    code: block => [`{${valueOf(block, "TARGET")} -> isAlive}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_has_role", cat: "players", kind: "value", output: "Boolean", icon: "f007", title: "Has role",
    tip: "True if the player currently has the chosen role.",
    parts: [playerInput, "has role", dd("ROLE", asOptions(roles))],
    defaults: evTarget, single: singleTarget,
    code: block => [`{${valueOf(block, "TARGET")} -> role} is ${quote(block.getFieldValue("ROLE"))}`, gen.ORDER_NONE]
  });

  def({
    id: "ser_has_effect", cat: "players", kind: "value", output: "Boolean", icon: "f48e", title: "Has effect",
    tip: "True if the player currently has the chosen effect.",
    parts: [playerInput, "has effect", dd("EFFECT", effectOptions)],
    defaults: evTarget, single: singleTarget,
    code: block => [`{HasEffect ${valueOf(block, "TARGET")} ${block.getFieldValue("EFFECT")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_has_perm", cat: "players", kind: "value", output: "Boolean", icon: "f132", title: "Has permission",
    tip: "True if the player has the given permission.",
    parts: [playerInput, "has permission", inputOf("PERM", "String")],
    defaults: { ...evTarget, PERM: txt("ban.use") }, single: singleTarget,
    code: block => [`{HasPermission ${valueOf(block, "TARGET")} ${valueOf(block, "PERM")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_firearm_info", cat: "players", kind: "value", output: null, icon: "f1e2", title: "Firearm info",
    tip: "Reads one fact about a firearm: its ammo, its max ammo, whether it is cocked, or whether a magazine is inserted.",
    note: "Only works on firearms. Check the item is a firearm first.",
    parts: [dd("PROP", [["ammo", "ammo"], ["max ammo", "maxAmmo"], ["cocked", "isCocked"], ["magazine inserted", "isMagazineInserted"]]), "of firearm", tf("REF", "evNewItem")],
    code: block => [`{FirearmItemInfo *${cleanName(block.getFieldValue("REF"), "evNewItem")} ${block.getFieldValue("PROP")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_broadcast", cat: "messages", kind: "statement", icon: "f0a1", title: "Show message",
    tip: "Shows a message to the chosen players for a set time. Big and small messages appear at different sizes; typed messages appear letter by letter with a CASSIE voice.",
    note: "Typed messages stop any CASSIE announcement that is already playing.",
    parts: ["show", dd("STYLE", [["big message", "big"], ["small hint", "small"], ["typed message", "typed"]]), "to", playerInput, "for", inputOf("DURATION", "Duration"), "saying", inputOf("TEXT", "String")],
    defaults: { ...allTarget, DURATION: dur(5), TEXT: txt("The round has started!") },
    code: block => {
      const method = { big: "Broadcast", small: "Hint", typed: "AnimatedBroadcast" }[block.getFieldValue("STYLE")];
      return `${method} ${valueOf(block, "TARGET")} ${valueOf(block, "DURATION")} ${valueOf(block, "TEXT")}\n`;
    }
  });

  def({
    id: "ser_countdown", cat: "messages", kind: "statement", icon: "f017", title: "Countdown",
    tip: "Shows a countdown on screen for the chosen players. Use %seconds% in the title to show the time left.",
    parts: ["show countdown to", playerInput, "for", inputOf("DURATION", "Duration"), "titled", inputOf("TEXT", "String")],
    defaults: { ...allTarget, DURATION: dur(30), TEXT: txt("%seconds% seconds left") },
    code: block => `Countdown ${valueOf(block, "TARGET")} ${valueOf(block, "DURATION")} ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_cassie", cat: "messages", kind: "statement", icon: "f028", title: "CASSIE announcement",
    tip: "Makes a CASSIE announcement. Leave the players set to everyone, or pick specific players to only they hear it.",
    parts: ["announce on CASSIE to", playerInput, dd("MODE", [["with jingle", "jingle"], ["without jingle", "noJingle"]]), inputOf("TEXT", "String")],
    defaults: { ...allTarget, TEXT: txt("Attention all personnel") },
    code: block => {
      const target = block.getInputTargetBlock("TARGET");
      const everyone = target && target.type === "ser_target" && target.getFieldValue("TARGET") === "@all";
      return everyone
        ? `Cassie ${block.getFieldValue("MODE")} ${valueOf(block, "TEXT")}\n`
        : `PlayerCassie ${valueOf(block, "TARGET")} ${block.getFieldValue("MODE")} ${valueOf(block, "TEXT")}\n`;
    }
  });

  def({
    id: "ser_reply", cat: "messages", kind: "statement", icon: "f112", title: "Reply to command",
    tip: "Sends a reply to whoever typed the command.",
    parts: ["reply to the command with", inputOf("TEXT", "String")],
    defaults: { TEXT: txt("Done!") },
    code: block => `Reply ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_doors", cat: "world", kind: "statement", icon: "f52b", title: "Doors",
    tip: "Opens, closes, locks, unlocks, breaks, or repairs doors in the chosen place. 'Everywhere' affects every door.",
    parts: [dd("ACTION", [["open", "OpenDoor"], ["close", "CloseDoor"], ["lock", "LockDoor"], ["unlock", "UnlockDoor"], ["break", "BreakDoor"], ["repair", "RepairDoor"]]), "doors in", dd("PLACE", placeOptions)],
    code: block => `${block.getFieldValue("ACTION")} ${block.getFieldValue("PLACE")}\n`
  });

  def({
    id: "ser_door_health", cat: "world", kind: "statement", icon: "f52b", title: "Set door health",
    tip: "Sets the remaining health of doors that can be broken. Gates cannot be damaged this way.",
    parts: ["set health of doors in", dd("PLACE", placeOptions), "to", inputOf("HEALTH", "Number")],
    defaults: { HEALTH: num(100) },
    code: block => `SetDoorHealth ${block.getFieldValue("PLACE")} ${valueOf(block, "HEALTH")}\n`
  });

  def({
    id: "ser_door_permission", cat: "world", kind: "statement", icon: "f084", title: "Set door access",
    tip: "Sets which keycard access the chosen doors require. This replaces the doors' current permissions.",
    parts: ["set doors in", dd("PLACE", placeOptions), "to require", dd("PERM", asOptions(doorPermissionOptions))],
    code: block => `SetDoorPermission ${block.getFieldValue("PLACE")} ${block.getFieldValue("PERM")}\n`
  });

  def({
    id: "ser_lights_color", cat: "world", kind: "statement", icon: "f0eb", title: "Set light color",
    tip: "Sets the light color in the chosen place, or puts the lights back to their normal color. Use a 6-digit hex color like FF0000.",
    parts: ["set lights in", dd("PLACE", placeOptions), dd("MODE", [["to color #", "color"], ["back to normal", "reset"]]), tf("COLOR", "FF0000")],
    code: block => (
      block.getFieldValue("MODE") === "reset"
        ? `ResetLightColor ${block.getFieldValue("PLACE")}\n`
        : `SetLightColor ${block.getFieldValue("PLACE")} ${hexOf(block.getFieldValue("COLOR"), "FFFFFF")}\n`
    )
  });

  def({
    id: "ser_lights_off", cat: "world", kind: "statement", icon: "f186", title: "Turn lights off",
    tip: "Turns off the lights in the chosen place for a duration.",
    parts: ["turn lights off in", dd("PLACE", placeOptions), "for", inputOf("DURATION", "Duration")],
    defaults: { DURATION: dur(10) },
    code: block => `DisableLights ${block.getFieldValue("PLACE")} ${valueOf(block, "DURATION")}\n`
  });

  def({
    id: "ser_elevators", cat: "world", kind: "statement", icon: "f0ec", title: "Elevators",
    tip: "Applies an action to every elevator.",
    parts: [dd("ACTION", [["lock", "LockElevator"], ["unlock", "UnlockElevator"], ["send", "SendElevator"]]), "all elevators"],
    code: block => `${block.getFieldValue("ACTION")} all\n`
  });

  def({
    id: "ser_elevator_text", cat: "world", kind: "statement", icon: "f0ec", title: "Elevator panel text",
    tip: "Changes the text on the elevator panels. An empty text resets it.",
    parts: ["set elevator panel text to", inputOf("TEXT", "String")],
    defaults: { TEXT: txt("Maintenance") },
    code: block => `SetElevatorText ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_warhead", cat: "world", kind: "statement", icon: "f1e2", title: "Warhead",
    tip: "Performs an alpha warhead action.",
    parts: ["warhead", dd("ACTION", [["open doors", "open"], ["close doors", "close"], ["arm", "arm"], ["disarm", "disarm"], ["lock", "lock"], ["unlock", "unlock"], ["start countdown", "start"], ["stop countdown", "stop"], ["detonate", "detonate"], ["shake", "shake"]])],
    code: block => `Warhead ${block.getFieldValue("ACTION")}\n`
  });

  def({
    id: "ser_warhead_info", cat: "world", kind: "value", output: null, icon: "f1e2", title: "Warhead status",
    tip: "Reads one fact about the alpha warhead, such as whether it is armed or how long until it detonates.",
    parts: ["warhead", dd("PROP", [["is locked", "isLocked"], ["is open", "isOpen"], ["is armed", "isArmed"], ["has started", "hasStarted"], ["has detonated", "isDetonated"], ["time to detonation", "timeToDenotation"], ["duration", "duration"]])],
    code: block => [`{WarheadInfo ${block.getFieldValue("PROP")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_round", cat: "world", kind: "statement", icon: "f11e", title: "Round control",
    tip: "Starts, ends, or restarts the round.",
    parts: [dd("ACTION", [["start", "StartRound"], ["end", "EndRound"], ["restart", "RestartRound"]]), "round"],
    code: block => `${block.getFieldValue("ACTION")}\n`
  });

  def({
    id: "ser_round_info", cat: "world", kind: "value", output: null, icon: "f2f2", title: "Round info",
    tip: "Reads one fact about the current round: whether it has started, is in progress, or has ended, or how long it has lasted.",
    parts: ["round", dd("INFO", [["has started", "hasStarted"], ["is in progress", "isInProgress"], ["has ended", "hasEnded"], ["duration", "duration"]])],
    code: block => [`{RoundInfo ${block.getFieldValue("INFO")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_server_setting", cat: "world", kind: "statement", icon: "f013", title: "Server setting",
    tip: "Turns friendly fire, the lobby lock, or the round lock on or off.",
    parts: ["set", dd("SETTING", [["friendly fire", "SetFriendlyFire"], ["lobby lock", "SetLobbyLock"], ["round lock", "SetRoundLock"]]), "to", dd("STATE", boolOptions)],
    code: block => `${block.getFieldValue("SETTING")} ${block.getFieldValue("STATE")}\n`
  });

  def({
    id: "ser_wave", cat: "world", kind: "statement", icon: "f0c0", title: "Spawn wave",
    tip: "Forces a respawn wave to start.",
    parts: ["spawn", dd("WAVE", waveOptions), dd("MODE", [["with animation", "withAnimation"], ["instantly", "instant"]])],
    code: block => `SpawnWave ${block.getFieldValue("WAVE")} ${block.getFieldValue("MODE")}\n`
  });

  def({
    id: "ser_wave_timer", cat: "world", kind: "statement", icon: "f017", title: "Respawn timer",
    tip: "Changes how long until a respawn wave arrives.",
    parts: ["change", dd("WAVE", waveOptions), "respawn timer", dd("MODE", [["set to", "set"], ["add", "add"], ["remove", "remove"]]), inputOf("TIME", "Duration")],
    defaults: { TIME: dur(30) },
    code: block => `WaveRespawnTime ${block.getFieldValue("WAVE")} ${block.getFieldValue("MODE")} ${valueOf(block, "TIME")}\n`
  });

  def({
    id: "ser_decontamination", cat: "world", kind: "statement", icon: "f0e7", title: "LCZ decontamination",
    tip: "Turns light containment decontamination on, off, or forces it to start now.",
    parts: ["set light containment decontamination to", dd("MODE", [["enabled", "enable"], ["disabled", "disable"], ["forced", "force"]])],
    code: block => `Decontamination ${block.getFieldValue("MODE")}\n`
  });

  def({
    id: "ser_decon_info", cat: "world", kind: "value", output: null, icon: "f0e7", title: "LCZ decontamination info",
    tip: "Reads whether light containment decontamination has started, or how long until it starts.",
    parts: ["decontamination", dd("INFO", [["has started", "hasStarted"], ["time until it starts", "timeToStart"]])],
    code: block => [`{DecontaminationInfo ${block.getFieldValue("INFO")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_audio_load", cat: "world", kind: "statement", icon: "f001", title: "Load audio clip",
    tip: "Loads an .ogg file from SER's data folder under a name you choose. The file must be 48kHz, mono.",
    parts: ["load audio file", inputOf("FILE", "String"), "as clip", inputOf("CLIP", "String")],
    defaults: { FILE: txt("alarm.ogg"), CLIP: txt("alarm") },
    code: block => `Audio.Load ${valueOf(block, "FILE")} ${valueOf(block, "CLIP")}\n`
  });

  def({
    id: "ser_speaker_create", cat: "world", kind: "statement", icon: "f028", title: "Create speaker",
    tip: "Creates a speaker that plays audio to everyone. Volume is a percentage.",
    parts: ["create speaker", inputOf("NAME", "String"), "at volume", inputOf("VOLUME", "Number")],
    defaults: { NAME: txt("main"), VOLUME: num(100) },
    code: block => `Speaker.CreateGlobal ${valueOf(block, "NAME")} ${valueOf(block, "VOLUME")}\n`
  });

  def({
    id: "ser_audio_play", cat: "world", kind: "statement", icon: "f001", title: "Play audio clip",
    tip: "Plays a loaded clip through a speaker, optionally on repeat.",
    parts: ["play clip", inputOf("CLIP", "String"), "through speaker", inputOf("SPEAKER", "String"), "loop", dd("LOOP", boolOptions)],
    defaults: { CLIP: txt("alarm"), SPEAKER: txt("main") },
    code: block => `Audio.Play ${valueOf(block, "SPEAKER")} ${valueOf(block, "CLIP")} ${block.getFieldValue("LOOP")}\n`
  });

  def({
    id: "ser_audio_stop", cat: "world", kind: "statement", icon: "f04d", title: "Stop audio",
    tip: "Stops every clip playing through a speaker.",
    parts: ["stop all audio on speaker", inputOf("SPEAKER", "String")],
    defaults: { SPEAKER: txt("main") },
    code: block => `Audio.Stop ${valueOf(block, "SPEAKER")}\n`
  });

  def({
    id: "ser_if", cat: "logic", kind: "statement", icon: "f126", title: "If",
    tip: "Runs the first set of blocks when the condition is true. Otherwise runs the second set, if any.",
    note: "Nest one If inside another to require two things at once.",
    parts: ["if", inputOf("COND", "Boolean"), "then", { body: "DO" }, "otherwise", { body: "ELSE" }],
    code: block => {
      const elseBody = bodyOf(block, "ELSE");
      return `if ${conditionOf(block)}\n${bodyOf(block, "DO")}${elseBody ? `else\n${elseBody}` : ""}end\n`;
    }
  });

  def({
    id: "ser_if_either", cat: "logic", kind: "statement", icon: "f0c9", title: "Run if either is true",
    tip: "Runs the blocks inside when at least one of the two conditions is true. There is no otherwise part.",
    note: "Stack it like any block. Each set of blocks runs once, even when both conditions are true.",
    parts: ["if", inputOf("COND", "Boolean"), "or", inputOf("COND2", "Boolean"), "then", { body: "DO" }],
    code: block => {
      const first = conditionOf(block);
      const second = gen.valueToCode(block, "COND2", gen.ORDER_NONE) || "...";
      const body = bodyOf(block, "DO");
      return `if ${first}\n${body}elif ${second}\n${body}end\n`;
    }
  });

  def({
    id: "ser_match", cat: "logic", kind: "statement", icon: "f126", title: "Match value",
    tip: "Compares one value against up to three cases and runs the first case that matches. 'Otherwise' runs when no case matches.",
    note: "Case 1 is required. Cases 2 and 3 are optional: leave them empty to skip them.",
    parts: ["match", inputOf("VALUE", null), "case", inputOf("CASE1", null), "do", { body: "DO1" },
      "case", inputOf("CASE2", null), "do", { body: "DO2" },
      "case", inputOf("CASE3", null), "do", { body: "DO3" },
      "otherwise", { body: "ELSE" }],
    defaults: { VALUE: num(1), CASE1: num(1) },
    code: block => {
      const value = asExpr(valueOf(block, "VALUE"));
      const used = [1, 2, 3].filter(index => block.getInputTargetBlock(`CASE${index}`));
      if (!used.length) return "";
      let tail = bodyOf(block, "ELSE");
      for (let index = used.length - 1; index >= 0; index--) {
        const caseNumber = used[index];
        tail = `if ${value} is ${valueOf(block, `CASE${caseNumber}`)}\n${bodyOf(block, `DO${caseNumber}`)}${tail ? `else\n${tail}` : ""}end\n`;
      }
      return tail;
    }
  });

  def({
    id: "ser_count_loop", cat: "logic", kind: "statement", icon: "f0cb", title: "Count from to",
    tip: "Runs the blocks inside once for each whole number in a range, from the first number up to the last. The current number is stored in a variable with the name you choose.",
    note: "Read the counter with a 'Variable value' block using the same name, e.g. i.",
    parts: ["count", tf("VAR", "i"), "from", inputOf("FROM", "Number"), "to", inputOf("TO", "Number"), "do", { body: "DO" }],
    defaults: { FROM: num(1), TO: num(5) },
    code: block => {
      const name = cleanName(block.getFieldValue("VAR"), "i");
      const from = inside(valueOf(block, "FROM"));
      const to = inside(valueOf(block, "TO"));
      return `repeat {${to} - ${from} + 1} with $${name}Step\n${indent}$${name} = {$${name}Step + ${from} - 1}\n${bodyOf(block, "DO")}end\n`;
    }
  });

  def({
    id: "ser_while", cat: "logic", kind: "statement", icon: "f2f1", title: "While",
    tip: "Repeats the blocks inside while the condition stays true. Use 'true' as the condition to repeat forever. Add a wait inside so the server keeps running.",
    parts: ["while", inputOf("COND", "Boolean"), "do", { body: "DO" }],
    code: block => `while ${conditionOf(block)}\n${bodyOf(block, "DO")}end\n`
  });

  def({
    id: "ser_wait", cat: "logic", kind: "statement", icon: "f017", title: "Wait",
    tip: "Pauses before the next block runs.",
    parts: ["wait", inputOf("DURATION", "Duration")],
    defaults: { DURATION: dur(1) },
    code: block => `wait ${valueOf(block, "DURATION")}\n`
  });

  def({
    id: "ser_wait_until", cat: "logic", kind: "statement", icon: "f252", title: "Wait until",
    tip: "Pauses until the condition becomes true.",
    parts: ["wait until", inputOf("COND", "Boolean")],
    code: block => `wait_until ${conditionOf(block)}\n`
  });

  def({
    id: "ser_break", cat: "logic", kind: "statement", icon: "f05e", title: "Break out of loop",
    tip: "Leaves the loop immediately.",
    parts: ["break out of loop"],
    code: () => "break\n"
  });

  def({
    id: "ser_stop", cat: "logic", kind: "statement", icon: "f04d", title: "Stop script",
    tip: "Stops this script right away.",
    parts: ["stop this script"],
    code: () => "stop\n"
  });

  def({
    id: "ser_check_reject", cat: "logic", kind: "statement", icon: "f071", title: "Reject if",
    tip: "Sends the error message to whoever ran the script, then stops the script. Checks either a condition, or whether a number is outside a range.",
    note: "Put this near the top of a command to check the input before anything else runs. In range mode, only the number, minimum, and maximum are used.",
    parts: ["reject if", dd("MODE", [["the condition is true", "cond"], ["the number is outside", "range"]]), inputOf("COND", "Boolean"), inputOf("VALUE", "Number"), "below", inputOf("MIN", "Number"), "or above", inputOf("MAX", "Number"), "with error", inputOf("TEXT", "String")],
    defaults: { VALUE: num(0), MIN: num(1), MAX: num(10), TEXT: txt("That did not work.") },
    code: block => {
      const failure = `${indent}Error ${valueOf(block, "TEXT")}\n${indent}stop\n`;
      if (block.getFieldValue("MODE") === "cond") return `if ${conditionOf(block)}\n${failure}end\n`;
      const value = asExpr(valueOf(block, "VALUE"));
      return `if ${value} < ${valueOf(block, "MIN")}\n${failure}end\nif ${value} > ${valueOf(block, "MAX")}\n${failure}end\n`;
    }
  });

  def({
    id: "ser_try", cat: "logic", kind: "statement", icon: "f071", title: "Try, or else",
    tip: "Runs the first set of blocks. If one of them fails, such as when a player can't be found, runs the second set instead.",
    note: "Use this around anything that can fail. The error text is stored in $message.",
    parts: ["try", { body: "DO" }, "if it fails", { body: "ELSE" }],
    code: block => `attempt\n${bodyOf(block, "DO")}end\non_error with $message\n${bodyOf(block, "ELSE")}end\n`
  });

  def({
    id: "ser_comment", cat: "logic", kind: "statement", icon: "f249", title: "Comment",
    tip: "A note to yourself. Never runs.",
    parts: ["note:", tf("TEXT", "explain what this does")],
    code: block => `-- ${String(block.getFieldValue("TEXT")).replace(/[\r\n]+/g, " ")}\n`
  });

  def({
    id: "ser_compare", cat: "logic", kind: "value", output: "Boolean", icon: "f1ec", title: "Compare",
    tip: "True when the comparison holds. Works with numbers and text. Plug it into an If, While, Wait until, or Run if block.",
    note: "Comparisons only work as conditions, not as stored values.",
    parts: [inputOf("A", null), dd("OP", [["is", "is"], ["is greater than", ">"], ["is less than", "<"], ["is at least", ">="], ["is at most", "<="]]), inputOf("B", null)],
    defaults: { A: num(0), B: num(0) },
    code: block => [`${asExpr(valueOf(block, "A"))} ${block.getFieldValue("OP")} ${valueOf(block, "B")}`, gen.ORDER_NONE]
  });

  def({
    id: "ser_chance", cat: "logic", kind: "value", output: "Boolean", icon: "f522", title: "Random chance",
    tip: "True for the chosen percentage of checks.",
    parts: ["random chance", nf("PERCENT", 50, 1, 100, 1), "%"],
    code: block => [`{Chance ${Number(block.getFieldValue("PERCENT")) / 100}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_boolean", cat: "logic", kind: "value", output: null, icon: "f205", title: "True / false",
    tip: "A fixed true or false value. Can be stored in a variable or used as a condition.",
    parts: [dd("VALUE", [["true", "true"], ["false", "false"]])],
    code: block => [block.getFieldValue("VALUE"), gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_player_exists", cat: "logic", kind: "value", output: "Boolean", icon: "f002", title: "Player exists",
    tip: "True if the event player, such as an attacker, is available. Check this before using an attacker.",
    parts: [playerInput, "exists"],
    defaults: { TARGET: tgt("@evAttacker") },
    code: block => [`{VarExists ${valueOf(block, "TARGET")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_count", cat: "logic", kind: "value", output: "Number", icon: "f0c0", title: "Count players",
    tip: "The number of players in the chosen group.",
    parts: ["number of players in", playerInput],
    defaults: { TARGET: tgt("@alivePlayers") },
    code: block => [`{AmountOf ${valueOf(block, "TARGET")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_script_running", cat: "logic", kind: "value", output: "Boolean", icon: "f04b", title: "Script is running",
    tip: "True if the named script is currently running.",
    parts: ["script", inputOf("TEXT", "String"), "is running"],
    defaults: { TEXT: txt("myScript") },
    code: block => [`{IsRunning ${valueOf(block, "TEXT")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_item_matches", cat: "logic", kind: "value", output: "Boolean", icon: "f466", title: "Item is a kind",
    tip: "True if the item is a coin, any firearm, any keycard, or any custom keycard.",
    note: "The item comes from an event. Use evNewItem for equipped items and evUsableItem for used items.",
    parts: ["item", tf("REF", "evNewItem"), "is", dd("KIND", [["a coin", "coin"], ["a firearm", "firearm"], ["a keycard", "keycard"], ["a custom keycard", "customKeycard"]])],
    code: block => [itemTest(cleanName(block.getFieldValue("REF"), "evNewItem"), block.getFieldValue("KIND")), gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_item_type", cat: "logic", kind: "value", output: null, icon: "f466", title: "Item type",
    tip: "The exact type of an item, such as Coin or KeycardO5. Compare it with 'Compare'.",
    parts: ["type of item", tf("REF", "evNewItem")],
    code: block => [`{*${cleanName(block.getFieldValue("REF"), "evNewItem")} -> type}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_number", cat: "logic", kind: "value", output: "Number", icon: "f292", title: "Number",
    tip: "A number value.",
    parts: [nf("NUMBER", 25)],
    code: block => [String(block.getFieldValue("NUMBER")), gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_text", cat: "logic", kind: "value", output: "String", icon: "f031", title: "Text",
    tip: "Text shown to players or saved for later.",
    parts: [tf("TEXT", "Hello!")],
    code: block => [quote(block.getFieldValue("TEXT")), gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_duration", cat: "logic", kind: "value", output: "Duration", icon: "f017", title: "Duration",
    tip: "An amount of time, such as 5 seconds. Whole numbers only.",
    parts: [nf("AMOUNT", 5, 0, 100000, 1), dd("UNIT", durationUnits)],
    code: block => [`${block.getFieldValue("AMOUNT")}${block.getFieldValue("UNIT")}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_to_duration", cat: "logic", kind: "value", output: "Duration", icon: "f017", title: "Number to duration",
    tip: "Turns a number into an amount of time, so a variable can be used as a duration.",
    parts: ["number", inputOf("VALUE", "Number"), "as", dd("UNIT", [["milliseconds", "Milliseconds"], ["seconds", "Seconds"], ["minutes", "Minutes"], ["hours", "Hours"]])],
    defaults: { VALUE: num(10) },
    code: block => [`{ToDuration ${valueOf(block, "VALUE")} ${block.getFieldValue("UNIT")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_math", cat: "logic", kind: "value", output: "Number", icon: "f1ec", title: "Math",
    tip: "Basic arithmetic on two numbers. Remainder gives the leftover after dividing. Power raises the first number to the second.",
    parts: [inputOf("A", "Number"), dd("OP", [["add", "+"], ["subtract", "-"], ["multiply", "*"], ["divide", "/"], ["remainder", "%"]]), inputOf("B", "Number")],
    defaults: { A: num(1), B: num(1) },
    code: block => [`{${inside(valueOf(block, "A"))} ${block.getFieldValue("OP")} ${inside(valueOf(block, "B"))}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_round_places", cat: "logic", kind: "value", output: "Number", icon: "f0c8", title: "Round number",
    tip: "Rounds a number to the chosen number of decimal places. Use 0 to round to a whole number.",
    parts: ["round", inputOf("VALUE", "Number"), "to", inputOf("PLACES", "Number"), "decimal places"],
    defaults: { VALUE: num(1.5), PLACES: num(0) },
    code: block => [`{Round ${valueOf(block, "VALUE")} ${valueOf(block, "PLACES")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_random", cat: "logic", kind: "value", output: "Number", icon: "f522", title: "Random number",
    tip: "A random number between the two values, either a whole number or a decimal.",
    parts: ["random", dd("KIND", [["whole number", "int"], ["decimal", "real"]]), "from", inputOf("MIN", "Number"), "to", inputOf("MAX", "Number")],
    defaults: { MIN: num(1), MAX: num(10) },
    code: block => [`{Random ${valueOf(block, "MIN")} ${valueOf(block, "MAX")} ${block.getFieldValue("KIND")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_hex", cat: "logic", kind: "value", output: null, icon: "f292", title: "Convert hex",
    tip: "Turns a number into hexadecimal text, or hexadecimal text back into a number.",
    parts: [dd("MODE", [["number to hex", "toHex"], ["hex to number", "fromHex"]]), inputOf("VALUE", null)],
    defaults: { VALUE: num(255) },
    code: block => [
      block.getFieldValue("MODE") === "toHex"
        ? `{IntToHex ${valueOf(block, "VALUE")}}`
        : `{HexToInt ${valueOf(block, "VALUE")}}`,
      gen.ORDER_ATOMIC
    ]
  });

  def({
    id: "ser_join", cat: "logic", kind: "value", output: "String", icon: "f0c1", title: "Join text",
    tip: "Glues two pieces of text (or numbers) together into one piece of text.",
    parts: ["join", inputOf("A", null), "with", inputOf("B", null)],
    defaults: { A: txt("Hello, "), B: txt("world!") },
    code: block => [`"${textPart(block, "A")}${textPart(block, "B")}"`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_text_contains", cat: "logic", kind: "value", output: "Boolean", icon: "f002", title: "Text contains",
    tip: "True if the text contains the searched word or phrase.",
    parts: [inputOf("TEXT", "String"), "contains", inputOf("NEEDLE", "String")],
    defaults: { TEXT: txt("hello world"), NEEDLE: txt("world") },
    code: block => [`{Text.Contains ${valueOf(block, "TEXT")} ${valueOf(block, "NEEDLE")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_text_replace", cat: "logic", kind: "value", output: "String", icon: "f0cc", title: "Replace text",
    tip: "Returns the text with every match of the first phrase swapped for the replacement.",
    parts: ["replace", inputOf("FIND", "String"), "with", inputOf("REPLACEMENT", "String"), "in", inputOf("TEXT", "String")],
    defaults: { TEXT: txt("Hello world"), FIND: txt("world"), REPLACEMENT: txt("everyone") },
    code: block => [`{Text.Replace ${valueOf(block, "TEXT")} ${valueOf(block, "FIND")} ${valueOf(block, "REPLACEMENT")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_text_pad", cat: "logic", kind: "value", output: "String", icon: "f0cc", title: "Pad text",
    tip: "Adds one repeated character to one side of the text until it reaches the chosen length. Useful for aligning numbers.",
    parts: ["pad", inputOf("TEXT", "String"), dd("SIDE", [["on the left", "left"], ["on the right", "right"]]), "to", inputOf("LENGTH", "Number"), "characters using", tf("CHAR", "0")],
    defaults: { TEXT: txt("5"), LENGTH: num(3) },
    code: block => [`{Text.Pad ${valueOf(block, "TEXT")} ${block.getFieldValue("SIDE")} ${valueOf(block, "LENGTH")} ${quote(String(block.getFieldValue("CHAR")).slice(0, 1) || "0")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_text_trim", cat: "logic", kind: "value", output: "String", icon: "f0cc", title: "Trim spaces",
    tip: "Returns the text without spaces at the start and end.",
    parts: ["trim spaces from", inputOf("TEXT", "String")],
    defaults: { TEXT: txt("  hello  ") },
    code: block => [`{Text.Trim ${valueOf(block, "TEXT")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_text_part", cat: "logic", kind: "value", output: "String", icon: "f0cc", title: "Cut text",
    tip: "Returns the text after removing a number of characters from its start and a number from its end.",
    parts: ["cut", inputOf("TEXT", "String"), "remove", inputOf("START", "Number"), "from the start and", inputOf("END", "Number"), "from the end"],
    defaults: { TEXT: txt("Hello world"), START: num(0), END: num(0) },
    code: block => [`{Text.Slice ${valueOf(block, "TEXT")} ${valueOf(block, "START")} ${valueOf(block, "END")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_set_var", cat: "variables", kind: "statement", icon: "f044", title: "Set variable",
    tip: "Stores a value under a name, or adds an amount to a number already stored there. 'This script only' is forgotten when the script finishes running. 'Global' is shared with every other script.",
    note: "Give it a short name (letters, numbers, _). Read it back with 'Variable value'.",
    parts: ["set variable", tf("NAME", "myVariable"), dd("MODE", [["to", "set"], ["by adding", "change"]]), inputOf("VALUE", null), "in", dd("SCOPE", variableScopeOptions)],
    defaults: { VALUE: num(0) },
    code: block => {
      const name = cleanName(block.getFieldValue("NAME"), "myVariable");
      const prefix = block.getFieldValue("SCOPE") === "global" ? "global " : "";
      const value = block.getFieldValue("MODE") === "change"
        ? `{$${name} + ${inside(valueOf(block, "VALUE"))}}`
        : valueOf(block, "VALUE");
      return `${prefix}$${name} = ${value}\n`;
    }
  });

  def({
    id: "ser_get_var", cat: "variables", kind: "value", output: null, icon: "f02b", title: "Variable value",
    tip: "Reads the value stored in a local or global variable with this name.",
    parts: ["variable", tf("NAME", "myVariable")],
    code: block => [`$${cleanName(block.getFieldValue("NAME"), "myVariable")}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_delete_var", cat: "variables", kind: "statement", icon: "f1f8", title: "Delete variable",
    tip: "Removes a local or global variable entirely.",
    parts: ["delete variable", tf("NAME", "myVariable")],
    code: block => `delete $${cleanName(block.getFieldValue("NAME"), "myVariable")}\n`
  });

  def({
    id: "ser_stopwatch_start", cat: "variables", kind: "statement", icon: "f2f2", title: "Start stopwatch",
    tip: "Remembers the current time under a name. Use 'Seconds since stopwatch' later to measure how long something took.",
    parts: ["start stopwatch", tf("NAME", "roundClock")],
    code: block => `$${cleanName(block.getFieldValue("NAME"), "roundClock")} = {TimeInfo unixTimeUtc}\n`
  });

  def({
    id: "ser_stopwatch_read", cat: "variables", kind: "value", output: "Number", icon: "f2f2", title: "Seconds since stopwatch",
    tip: "Seconds that passed since the stopwatch with this name was started.",
    parts: ["seconds since stopwatch", tf("NAME", "roundClock")],
    code: block => [`{{TimeInfo unixTimeUtc} - $${cleanName(block.getFieldValue("NAME"), "roundClock")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_save_data", cat: "variables", kind: "statement", icon: "f0c7", title: "Save player data",
    tip: "Stores a value for one player under a name, or adds an amount to the number already saved. 'Until cleared' keeps it until you clear it. 'This life only' uses a separate key for each life, so it starts fresh when the player's next life begins.",
    note: "Use this instead of variables to remember numbers or text about a player between events.",
    parts: [dd("MODE", [["save", "set"], ["add", "add"]]), inputOf("VALUE", null), "for", playerInput, "as", inputOf("KEY", "String"), dd("SCOPE", keepScopeOptions)],
    defaults: { ...evTarget, KEY: txt("points"), VALUE: num(1) },
    single: singleTarget,
    code: block => {
      const target = valueOf(block, "TARGET");
      const key = keyCode(block, "KEY", "TARGET");
      if (block.getFieldValue("MODE") === "add") {
        return `SetPlayerData ${target} ${key} {{GetPlayerData ${target} ${key} 0} + ${inside(valueOf(block, "VALUE"))}}\n`;
      }
      return `SetPlayerData ${target} ${key} ${valueOf(block, "VALUE")}\n`;
    }
  });

  def({
    id: "ser_read_data", cat: "variables", kind: "value", output: null, icon: "f1c0", title: "Read player data",
    tip: "Reads a value saved with 'Save player data' using the same scope. If nothing was saved, the default is used.",
    parts: ["saved", inputOf("KEY", "String"), "of", playerInput, dd("SCOPE", keepScopeOptions), "or", inputOf("DEFAULT", null)],
    defaults: { ...evTarget, KEY: txt("points"), DEFAULT: num(0) },
    single: singleTarget,
    code: block => [`{GetPlayerData ${valueOf(block, "TARGET")} ${keyCode(block, "KEY", "TARGET")} ${valueOf(block, "DEFAULT")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_clear_data", cat: "variables", kind: "statement", icon: "f1f8", title: "Clear saved data",
    tip: "Erases either every value saved for the chosen player, or only the one key.",
    parts: ["clear", dd("MODE", clearModeOptions), "of", playerInput, "key", inputOf("KEY", "String")],
    defaults: { ...evTarget, KEY: txt("points") },
    code: block => (
      block.getFieldValue("MODE") === "one"
        ? `ClearPlayerData ${valueOf(block, "TARGET")} ${valueOf(block, "KEY")}\n`
        : `ClearPlayerData ${valueOf(block, "TARGET")}\n`
    )
  });

  def({
    id: "ser_db_save", cat: "variables", kind: "statement", icon: "f1c0", title: "Save to database",
    tip: "Stores a value in a database on the server's disk. It survives server restarts. Use the same database name and key to read it back.",
    note: "Only plain numbers, text, and player values can be saved.",
    parts: ["save", inputOf("VALUE", null), "to database", tf("DATABASE", "saves"), "under key", inputOf("KEY", "String")],
    defaults: { VALUE: num(0), KEY: txt("roundCount") },
    code: block => `DB.Add ${cleanName(block.getFieldValue("DATABASE"), "saves")} ${valueOf(block, "KEY")} ${valueOf(block, "VALUE")}\n`
  });

  def({
    id: "ser_db_read", cat: "variables", kind: "value", output: null, icon: "f1c0", title: "Read from database",
    tip: "Reads a value saved with 'Save to database'. Errors if the key was never saved, so check it with 'Database has key' first.",
    parts: ["read key", inputOf("KEY", "String"), "from database", tf("DATABASE", "saves")],
    defaults: { KEY: txt("roundCount") },
    code: block => [`{DB.Get ${cleanName(block.getFieldValue("DATABASE"), "saves")} ${valueOf(block, "KEY")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_db_has", cat: "variables", kind: "value", output: "Boolean", icon: "f002", title: "Database has key",
    tip: "True if a value has been saved in the database under this key.",
    parts: ["database", tf("DATABASE", "saves"), "has key", inputOf("KEY", "String")],
    defaults: { KEY: txt("roundCount") },
    code: block => [`{DB.Contains ${cleanName(block.getFieldValue("DATABASE"), "saves")} ${valueOf(block, "KEY")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_db_remove", cat: "variables", kind: "statement", icon: "f1f8", title: "Remove from database",
    tip: "Deletes a key and its value from the database.",
    parts: ["remove key", inputOf("KEY", "String"), "from database", tf("DATABASE", "saves")],
    defaults: { KEY: txt("roundCount") },
    code: block => `DB.Remove ${cleanName(block.getFieldValue("DATABASE"), "saves")} ${valueOf(block, "KEY")}\n`
  });

  def({
    id: "ser_command", cat: "server", kind: "statement", icon: "f120", title: "Run command",
    tip: "Runs a server or Remote Admin command. Remote Admin commands start with '/', console commands with '.'.",
    parts: ["run command", inputOf("TEXT", "String")],
    defaults: { TEXT: txt("/cassie Hello") },
    code: block => `Command ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_print", cat: "server", kind: "statement", icon: "f02f", title: "Print to console",
    tip: "Writes text to the server console. Useful for checking that a script runs or what a variable holds.",
    parts: ["print to console", inputOf("TEXT", "String")],
    defaults: { TEXT: txt("Script ran") },
    code: block => `Print ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_run_script", cat: "server", kind: "statement", icon: "f56d", title: "Run another script",
    tip: "Runs another script by name, either alongside this one or pausing this one until it finishes.",
    parts: ["run script named", inputOf("TEXT", "String"), dd("MODE", [["and keep going", "run"], ["and wait until it finishes", "wait"]])],
    defaults: { TEXT: txt("myScript") },
    code: block => `${block.getFieldValue("MODE") === "wait" ? "RunScriptAndWait" : "RunScript"} ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_trigger", cat: "server", kind: "statement", icon: "f0e7", title: "Fire trigger",
    tip: "Fires a custom trigger, which runs every script set to listen for it.",
    parts: ["fire trigger", inputOf("TEXT", "String")],
    defaults: { TEXT: txt("myTrigger") },
    code: block => `Trigger ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_event_toggle", cat: "server", kind: "statement", icon: "f011", title: "Enable or disable event",
    tip: "Turns a game event on or off. Works on events that can be cancelled.",
    parts: [dd("ACTION", [["disable", "DisableEvent"], ["enable", "EnableEvent"]]), "the event named", inputOf("NAME", "String")],
    defaults: { NAME: txt("RoundStarted") },
    code: block => `${block.getFieldValue("ACTION")} ${valueOf(block, "NAME")}\n`
  });

  def({
    id: "ser_is_allowed", cat: "server", kind: "statement", icon: "f00c", title: "Allow or cancel event (experimental)",
    tip: "Lets the event that started this script go ahead or cancels it. Only works in events that can be cancelled, and before any Wait block.",
    parts: ["set this event to", dd("STATE", [["allowed", "true"], ["cancelled", "false"]])],
    code: block => `IsAllowed ${block.getFieldValue("STATE")}\n`
  });

  def({
    id: "ser_server_info", cat: "server", kind: "value", output: "Number", icon: "f233", title: "Server info",
    tip: "Reads a number about the server.",
    parts: ["server", dd("INFO", [["player count", "playerCount"], ["max players", "maxPlayers"], ["TPS", "tps"], ["max TPS", "maxTps"]])],
    code: block => [`{ServerInfo ${block.getFieldValue("INFO")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_clock", cat: "server", kind: "value", output: "Number", icon: "f017", title: "Real-world clock",
    tip: "Reads the real-world time or date from the server clock.",
    parts: ["real clock:", dd("INFO", [["second", "second"], ["minute", "minute"], ["hour", "hour"], ["day of week", "dayOfWeek"], ["day of week (number)", "dayOfWeekNumber"], ["day of month", "dayOfMonth"], ["day of year", "dayOfYear"], ["month", "month"], ["year", "year"], ["Unix time (UTC)", "unixTimeUtc"], ["Unix time (local)", "unixTimeLocal"]])],
    code: block => [`{TimeInfo ${block.getFieldValue("INFO")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_lib_reset_each_round", cat: "libraries", kind: "hat", icon: "f021", title: "Library: Reset saved value each round",
    tip: "Every time a round starts, clears one saved key for everyone. Use it for player values that should only last one round.",
    note: "Pair it with 'Save player data' using 'until cleared'. Values saved with 'this life only' are not affected.",
    parts: ["each round start, clear saved key", inputOf("KEY", "String"), "for everyone"],
    defaults: { KEY: txt("points") },
    code: block => `!-- OnEvent RoundStarted\nClearPlayerData @all ${valueOf(block, "KEY")}\n`
  });

  def({
    id: "ser_lib_random_loot", cat: "libraries", kind: "statement", icon: "f522", title: "Library: Random loot",
    tip: "Rolls a number from 1 to 3 and gives the player the matching item. Each item has the same chance.",
    parts: ["Give", playerInput, "one random item from", dd("ITEM1", itemOptions), dd("ITEM2", itemOptions), dd("ITEM3", itemOptions)],
    defaults: { ...evTarget },
    code: block => {
      const target = valueOf(block, "TARGET");
      const picks = ["ITEM1", "ITEM2", "ITEM3"]
        .map((field, index) => `if {$libLoot} is ${index + 1}\nGiveItem ${target} ${block.getFieldValue(field)}\nend\n`)
        .join("");
      return `$libLoot = {Random 1 3 int}\n${picks}`;
    }
  });

  def({
    id: "ser_lib_random_role", cat: "libraries", kind: "statement", icon: "f4fe", title: "Library: Random role",
    tip: "Changes the player to one of three roles, picked at random. Each role has the same chance.",
    parts: ["change", playerInput, "to a random one of", dd("ROLE1", asOptions(roles)), dd("ROLE2", asOptions(roles)), dd("ROLE3", asOptions(roles))],
    defaults: { ...evTarget },
    code: block => {
      const target = valueOf(block, "TARGET");
      const picks = ["ROLE1", "ROLE2", "ROLE3"]
        .map((field, index) => `if {$libRole} is ${index + 1}\nSetRole ${target} ${block.getFieldValue(field)}\nend\n`)
        .join("");
      return `$libRole = {Random 1 3 int}\n${picks}`;
    }
  });

  def({
    id: "ser_lib_custom_keycard", cat: "libraries", kind: "statement", icon: "f084", title: "Library: Custom keycard",
    tip: "Gives a player a custom keycard and tells them its name. Check for the keycard later with the item blocks, using its type.",
    note: "There are four custom keycard types. The name is shown to the player when they receive it; the type is what scripts check.",
    parts: ["give", playerInput, "a custom keycard", dd("TYPE", itemOptions.filter(([, value]) => value.startsWith("KeycardCustom"))), "named", tf("NAME", "Vault keycard")],
    defaults: evTarget,
    code: block => {
      const name = String(block.getFieldValue("NAME")).trim() || "Keycard";
      return `GiveItem ${valueOf(block, "TARGET")} ${block.getFieldValue("TYPE")}\nHint ${valueOf(block, "TARGET")} 5s ${quote(`You received the ${name}.`)}\n`;
    }
  });

  def({
    id: "ser_lib_flicker", cat: "libraries", kind: "statement", icon: "f0eb", title: "Library: Flicker lights",
    tip: "Turns the lights in a place off and back on several times, like a power fault.",
    parts: ["flicker lights in", dd("PLACE", placeOptions), "for", nf("TIMES", 5, 1, 100, 1), "blinks"],
    code: block => `repeat ${Math.max(1, Math.round(Number(block.getFieldValue("TIMES"))))}\nDisableLights ${block.getFieldValue("PLACE")} 500ms\nwait 1s\nend\n`
  });

  def({
    id: "ser_lib_glow_start", cat: "libraries", kind: "statement", icon: "f0eb", title: "Library: Glow light",
    tip: "Attaches a colored light to a player's body. It moves with the player until you stop it.",
    note: "Pair it with 'When a player equips an item' to glow while an item is held. Color is 6 hex digits, like FF8800.",
    parts: ["glow light on", playerInput, "color #", tf("COLOR", "FFCC55"), "brightness", nf("INTENSITY", 2, 0, 100, 0.1), "range", nf("RANGE", 6, 0, 100, 0.1), "named", tf("NAME", "glowLight")],
    defaults: evTarget, single: singleTarget,
    code: block => {
      const name = cleanName(block.getFieldValue("NAME"), "glowLight");
      const color = hexOf(block.getFieldValue("COLOR"), "FFCC55");
      return `*${name} = Toy.Create lightSource\nSetLightSourceProperties *${name} ${block.getFieldValue("INTENSITY")} ${block.getFieldValue("RANGE")} ${color} None 0 Point\nToy.SetParent *${name} playerBody ${valueOf(block, "TARGET")}\n`;
    }
  });

  def({
    id: "ser_lib_glow_stop", cat: "libraries", kind: "statement", icon: "f186", title: "Library: Stop glow light",
    tip: "Removes a glow light made with 'Glow light', using the same name.",
    parts: ["stop glow light named", tf("NAME", "glowLight")],
    code: block => `Toy.Destroy *${cleanName(block.getFieldValue("NAME"), "glowLight")}\n`
  });

  def({
    id: "ser_lib_spawn_item_room", cat: "libraries", kind: "statement", icon: "f466", title: "Library: Item in a room",
    tip: "Creates an item and places it on the ground in a room or zone.",
    parts: ["place a", dd("ITEM", itemOptions), "in", dd("PLACE", placeOptions.slice(1))],
    code: block => `*libItem = CreatePickup ${block.getFieldValue("ITEM")}\nSpawnPickupRoom *libItem ${block.getFieldValue("PLACE")}\n`
  });

  def({
    id: "ser_lib_throw_grenade", cat: "libraries", kind: "statement", icon: "f1e2", title: "Library: Grenade at a spot",
    tip: "Creates a grenade thrown by the chosen player and places it at the coordinates.",
    parts: ["throw a", dd("TYPE", [["frag grenade", "GrenadeHE"], ["flash grenade", "GrenadeFlash"]]), "from", playerInput, "to x", inputOf("X", "Number"), "y", inputOf("Y", "Number"), "z", inputOf("Z", "Number")],
    defaults: { ...evTarget, X: num(0), Y: num(0), Z: num(0) },
    single: singleTarget,
    code: block => `*libGrenade = CreateGrenade ${block.getFieldValue("TYPE")} ${valueOf(block, "TARGET")}\nSpawnPickupPos *libGrenade ${valueOf(block, "X")} ${valueOf(block, "Y")} ${valueOf(block, "Z")}\n`
  });

  def({
    id: "ser_lib_spawn_ragdoll", cat: "libraries", kind: "statement", icon: "f508", title: "Library: Spawn a body",
    tip: "Creates a dead body (ragdoll) of the chosen role at the coordinates.",
    parts: ["spawn a body of role", dd("ROLE", asOptions(roles)), "named", inputOf("NAME", "String"), "at x", inputOf("X", "Number"), "y", inputOf("Y", "Number"), "z", inputOf("Z", "Number")],
    defaults: { NAME: txt("Body"), X: num(0), Y: num(0), Z: num(0) },
    code: block => `CreateRagdoll ${block.getFieldValue("ROLE")} ${valueOf(block, "NAME")} ${valueOf(block, "X")} ${valueOf(block, "Y")} ${valueOf(block, "Z")}\n`
  });

  def({
    id: "ser_lib_discord_embed", cat: "libraries", kind: "statement", icon: "f392", title: "Library: Send Discord message",
    tip: "Posts a titled message with colored sidebar to a Discord channel through its webhook link.",
    note: "Create the webhook link in your Discord channel's settings. Anyone with the link can post to the channel, so keep it private.",
    parts: ["send to Discord webhook", inputOf("URL", "String"), "title", inputOf("TITLE", "String"), "text", inputOf("BODY", "String"), "color #", tf("COLOR", "FFCC55")],
    defaults: { URL: txt("https://discord.com/api/webhooks/..."), TITLE: txt("Server update"), BODY: txt("Something happened.") },
    code: block => (
      `*libEmbed = Embed.Create ${valueOf(block, "TITLE")} ${valueOf(block, "BODY")} ${hexOf(block.getFieldValue("COLOR"), "FFCC55")}\n` +
      `*libMessage = Discord.CreateMessage "" "" "" *libEmbed\n` +
      `Discord.SendMessage ${valueOf(block, "URL")} *libMessage\n`
    )
  });

  const specById = Object.fromEntries(specs.map(spec => [spec.id, spec]));

  const shadowInputs = defaults => Object.fromEntries(
    Object.entries(defaults || {})
      .filter(([, value]) => Array.isArray(value))
      .map(([name, [type, fields]]) => [name, { shadow: { type, fields } }])
  );

  function chain(list) {
    for (let index = 1; index < list.length; index++) {
      list[index - 1].nextConnection.connect(list[index].previousConnection);
    }
    return list[0];
  }

  function makeShadow(workspace, type, fields) {
    const block = workspace.newBlock(type);
    for (const [name, value] of Object.entries(fields || {})) block.setFieldValue(String(value), name);
    block.initSvg();
    block.render();
    block.setShadow(true);
    return block;
  }

  function applyDefaults(workspace, block, spec) {
    for (const [name, value] of Object.entries(spec.defaults || {})) {
      if (!Array.isArray(value)) continue;
      const [type, fields] = value;
      block.getInput(name).connection.connect(makeShadow(workspace, type, fields).outputConnection);
    }
  }

  function makeBlock(workspace, type, options = {}) {
    const spec = specById[type];
    const block = workspace.newBlock(type);
    block.initSvg();
    block.render();
    if (spec) applyDefaults(workspace, block, spec);
    for (const [name, value] of Object.entries(options.f || {})) block.setFieldValue(String(value), name);
    for (const [name, child] of Object.entries(options.i || {})) block.getInput(name).connection.connect(child.outputConnection);
    for (const [name, list] of Object.entries(options.b || {})) block.getInput(name).connection.connect(chain(list).previousConnection);
    return block;
  }

  function buildBlock(block, spec) {
    block.setColour(colours[spec.cat]);
    block.setTooltip(spec.tip);
    block.serTitle = spec.title;
    block.serIcon = spec.icon || "";
    block.serNote = spec.note || "";
    block.serSingle = spec.single || [];
    block.setInputsInline(true);
    if (spec.kind === "statement") {
      block.setPreviousStatement(true, actionCheck);
      block.setNextStatement(true, actionCheck);
    }
    if (spec.kind === "value") block.setOutput(true, spec.output ?? null);

    let row = null;
    const ensureRow = () => (row ||= block.appendDummyInput());
    for (const part of spec.parts) {
      if (typeof part === "string") {
        ensureRow().appendField(part);
      } else if (part.options) {
        ensureRow().appendField(new Blockly.FieldDropdown(part.options), part.field);
      } else if (part.text !== undefined) {
        ensureRow().appendField(new Blockly.FieldTextInput(part.text), part.field);
      } else if (part.number !== undefined) {
        ensureRow().appendField(new Blockly.FieldNumber(part.number, part.min, part.max, part.precision), part.field);
      } else if (part.input !== undefined) {
        block.appendValueInput(part.input).setCheck(part.check ?? anyValue);
        row = null;
      } else if (part.body !== undefined) {
        block.appendStatementInput(part.body).setCheck(actionCheck);
        row = null;
      }
    }
  }

  function registerBlocks() {
    for (const spec of specs) {
      Blockly.Blocks[spec.id] = { init() { buildBlock(this, spec); } };
      gen.forBlock[spec.id] = spec.code;
    }
  }

  function buildToolbox() {
    return {
      kind: "categoryToolbox",
      contents: categories.map(([key, name]) => ({
        kind: "category",
        name,
        colour: String(colours[key]),
        cssConfig: { icon: `ser-cat-icon ser-cat-${key}` },
        contents: specs.filter(spec => spec.cat === key).map(spec => ({
          kind: "block",
          type: spec.id,
          inputs: shadowInputs(spec.defaults)
        }))
      }))
    };
  }

  const itemTest = (ref, kind, exact) => {
    const needles = { coin: "Coin", firearm: "Gun", keycard: "Keycard", customKeycard: "KeycardCustom" };
    return kind === "exact"
      ? `{*${ref} -> type} is ${quote(exact)}`
      : `{Text.Contains {*${ref} -> type} ${quote(needles[kind])}}`;
  };

  const removedBlocks = new Set(["ser_clamp", "ser_min_max", "ser_abs", "ser_not", "ser_and_or", "ser_pick", "ser_text_length"]);
  const numberShadow = number => ({ shadow: { type: "ser_number", fields: { NUMBER: number } } });
  const textShadow = text => ({ shadow: { type: "ser_text", fields: { TEXT: text } } });
  const playerShadow = target => ({ shadow: { type: "ser_target", fields: { TARGET: target } } });
  const targetInput = block => block.inputs?.TARGET ?? playerShadow("@evPlayer");
  const markRemoved = (block, label) => {
    block.type = "ser_text";
    block.fields = { TEXT: `REPLACE ME: old ${label} block was removed` };
    block.inputs = {};
  };

  const renames = {
    ser_repeat: block => {
      const count = Number(block.fields?.COUNT ?? 3);
      Object.assign(block, { type: "ser_count_loop", fields: { VAR: "i" }, inputs: { FROM: numberShadow(1), TO: numberShadow(count), DO: block.inputs?.DO } });
    },
    ser_forever: block => Object.assign(block, { type: "ser_while", fields: {}, inputs: { COND: { shadow: { type: "ser_boolean", fields: { VALUE: "true" } } }, DO: block.inputs?.DO } }),
    ser_var_from_player: block => Object.assign(block, {
      type: "ser_set_var", fields: { NAME: block.fields?.NAME ?? "myVariable", SCOPE: "local" },
      inputs: { VALUE: { block: { type: "ser_player_value", fields: { PROP: block.fields?.PROP ?? "health" }, inputs: { TARGET: targetInput(block) } } } }
    }),
    ser_var_from_data: block => Object.assign(block, {
      type: "ser_set_var", fields: { NAME: block.fields?.NAME ?? "savedValue", SCOPE: "local" },
      inputs: { VALUE: { block: { type: "ser_read_data", fields: { SCOPE: "keep" }, inputs: { KEY: block.inputs?.KEY ?? textShadow("points"), TARGET: targetInput(block), DEFAULT: block.inputs?.DEFAULT ?? numberShadow(0) } } } }
    }),
    ser_var_copy: block => Object.assign(block, {
      type: "ser_set_var", fields: { NAME: block.fields?.TO ?? "myCopy", SCOPE: "local" },
      inputs: { VALUE: { block: { type: "ser_get_var", fields: { NAME: block.fields?.FROM ?? "myVariable" } } } }
    }),
    ser_var_print: block => Object.assign(block, {
      type: "ser_print", fields: {},
      inputs: { TEXT: { block: { type: "ser_join", fields: {}, inputs: { A: block.inputs?.TEXT ?? textShadow("Value: "), B: { block: { type: "ser_get_var", fields: { NAME: block.fields?.NAME ?? "myVariable" } } } } } } }
    }),
    ser_player_name: block => Object.assign(block, { type: "ser_player_value", fields: { PROP: "name" }, inputs: { TARGET: targetInput(block) } }),
    ser_player_id: block => Object.assign(block, { type: "ser_player_value", fields: { PROP: "playerId" }, inputs: { TARGET: targetInput(block) } }),
    ser_read_player: block => Object.assign(block, { type: "ser_player_value" }),
    ser_heal: block => Object.assign(block, { type: "ser_health", fields: { MODE: "heal" } }),
    ser_hurt: block => Object.assign(block, { type: "ser_health", fields: { MODE: "hurt" } }),
    ser_set_health: block => Object.assign(block, { type: "ser_health", fields: { MODE: "set" } }),
    ser_item_drop: block => Object.assign(block, { type: "ser_item_remove", fields: { MODE: "drop", ITEM: block.fields?.ITEM ?? "Coin" } }),
    ser_clear_inventory: block => Object.assign(block, { type: "ser_item_remove", fields: { MODE: "destroy", ITEM: "all" }, inputs: { TARGET: targetInput(block), AMOUNT: numberShadow(1) } }),
    ser_remove_effect: block => Object.assign(block, { type: "ser_give_effect", fields: { MODE: "remove", EFFECT: block.fields?.EFFECT ?? "all" } }),
    ser_tp_position: block => Object.assign(block, { type: "ser_tp_room", fields: { PLACE: "exact" } }),
    ser_check_range: block => Object.assign(block, { type: "ser_check_reject", fields: { MODE: "range" }, inputs: { VALUE: block.inputs?.VALUE ?? numberShadow(0), MIN: block.inputs?.MIN ?? numberShadow(1), MAX: block.inputs?.MAX ?? numberShadow(10), TEXT: block.inputs?.TEXT ?? textShadow("Pick a number from 1 to 10.") } }),
    ser_change_var: block => Object.assign(block, { type: "ser_set_var", fields: { NAME: block.fields?.NAME ?? "myVariable", MODE: "change", SCOPE: "local" }, inputs: { VALUE: block.inputs?.AMOUNT ?? numberShadow(1) } }),
    ser_save_add: block => Object.assign(block, { type: "ser_save_data", fields: { MODE: "add", SCOPE: "keep" }, inputs: { VALUE: block.inputs?.AMOUNT ?? numberShadow(1), KEY: block.inputs?.KEY ?? textShadow("points"), TARGET: targetInput(block) } }),
    ser_round_value: block => Object.assign(block, { type: "ser_round_places", fields: {}, inputs: { VALUE: block.inputs?.VALUE ?? numberShadow(0), PLACES: numberShadow(0) } }),
    ser_hint: block => Object.assign(block, { type: "ser_broadcast", fields: { STYLE: "small" } }),
    ser_animated_broadcast: block => Object.assign(block, { type: "ser_broadcast", fields: { STYLE: "typed" } }),
    ser_player_cassie: block => Object.assign(block, { type: "ser_cassie" }),
    ser_cassie: block => { block.inputs = { ...(block.inputs || {}), TARGET: block.inputs?.TARGET ?? playerShadow("@all") }; },
    ser_lights_reset: block => Object.assign(block, { type: "ser_lights_color", fields: { PLACE: block.fields?.PLACE ?? "all", MODE: "reset", COLOR: "FFFFFF" } }),
    ser_run_wait: block => Object.assign(block, { type: "ser_run_script", fields: { MODE: "wait" } }),
    ser_round_info: block => {
      const info = block.fields?.INFO;
      if (info === "roundTime") block.fields = { INFO: "duration" };
      else if (info === "playerCount") Object.assign(block, { type: "ser_server_info", fields: { INFO: "playerCount" } });
      else if (info === "aliveCount") Object.assign(block, { type: "ser_count", fields: {}, inputs: { TARGET: playerShadow("@alivePlayers") } });
      else if (info === "roundNumber" || info === "uptime") markRemoved(block, `round info (${info})`);
    }
  };

  function migrateBlock(block) {
    if (block.type === "ser_when_event" && block.fields?.EVENT === "UsedItem") {
      block.type = "ser_when_item";
      block.fields = { EVENT: "UsedItem", FILTER: "any", EXACT: itemOptions[0][1] };
    }
    if (removedBlocks.has(block.type)) markRemoved(block, block.type.replace("ser_", ""));
    else if (renames[block.type]) renames[block.type](block);
  }

  function visit(block) {
    if (!block) return;
    migrateBlock(block);
    for (const input of Object.values(block.inputs || {})) {
      if (!input) continue;
      visit(input.block);
      visit(input.shadow);
    }
    visit(block.next?.block);
  }

  function migrate(state) {
    (state?.blocks?.blocks || []).forEach(visit);
    return state;
  }

  const catalog = specs.map(spec => ({
    id: spec.id,
    title: spec.title,
    tip: spec.tip,
    icon: spec.icon || "f0c8",
    category: categoryNames[spec.cat]
  }));

  window.SER_BLOCKS = {
    gen,
    glyph,
    colours,
    categoryNames,
    targetLabels,
    groupTargets,
    eventLabels,
    catalog,
    migrate,
    registerBlocks,
    buildToolbox,
    makeBlock,
    chain,
    bind(workspace) {
      return {
        build: (type, options) => makeBlock(workspace, type, options),
        chain
      };
    }
  };
})();