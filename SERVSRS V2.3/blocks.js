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
  const truth = SER_TRUTH_TABLE.methods;
  const enumOf = (method, index) => {
    const arg = truth[method].arguments[index];
    return [...(arg.enumValues || []), ...((arg.options || []).map(option => option.value))];
  };

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
  const items = truth.GiveItem.arguments[1].enumValues.filter(item => item !== "None");
  const effects = ["AmnesiaItems", "AmnesiaVision", "AnomalousRegeneration", "AnomalousTarget", "Asphyxiated", "Bleeding", "Blindness", "Blurred", "BodyshotReduction", "Burned", "CardiacArrest", "AntiScp207", "Scp207", "Concussed", "Corroding", "DamageReduction", "Deafened", "Decontaminating", "Disabled", "Ensnared", "Exhausted", "Fade", "Flashed", "FocusedVision", "FogControl", "Ghostly", "HeavyFooted", "Hemorrhage", "InsufficientLighting", "Invigorated", "Invisible", "Lightweight", "MovementBoost", "NightVision", "PitDeath", "PocketCorroding", "Poisoned", "RainbowTaste", "Scanned", "Scp1344", "Scp1853", "SeveredEyes", "SeveredHands", "SilentWalk", "Sinkhole", "Slowness", "SoundtrackMute", "SpawnProtected", "Stained", "Strangled", "Traumatized", "Vitality", "Hypothermia"];
  const flagMethods = { godmode: "SetGodMode", noclip: "SetNoclip", bypass: "SetBypass", spectatable: "SetSpectatability", intercom: "SetPlayerIntercom" };
  const keepScopeOptions = [["until cleared", "keep"], ["this life only", "life"], ["this round only", "round"]];
  const variableScopeOptions = [["this script only", "local"], ["global (all scripts)", "global"]];
  const doorPermissionOptions = ["Checkpoints", "ExitGates", "Intercom", "AlphaWarhead", "ContainmentLevelOne", "ContainmentLevelTwo", "ContainmentLevelThree", "ArmoryLevelOne", "ArmoryLevelTwo", "ArmoryLevelThree", "ScpOverride", "All", "None"];
  const ammoOptions = enumOf("SetAmmoLimit", 1).filter(ammo => ammo !== "None");
  const intercomStates = enumOf("SetIntercomState", 0);
  const intercomInfos = enumOf("IntercomInfo", 0);
  const shownInfos = enumOf("SetShownPlayerInfo", 1);
  const toyTypes = enumOf("Toy.Create", 0);
  const toyProperties = enumOf("Toy.Info", 1);
  const primitiveShapes = enumOf("SetPrimitiveObjectProperties", 1);
  const primitiveFlags = ["Visible", "Collidable", "Visible|Collidable"];
  const crBaseRoles = enumOf("CRole.Register", 2);
  const ucrEvents = SER_TRUTH_TABLE.ucrEvents;
  const hitmarkerTypes = [["regular", "Regular"], ["blocked", "Blocked"]];

  const advancedIds = new Set([
  // logic, data, and functions
  "ser_match", "ser_try", "ser_foreach_list", "ser_reject_range",
  "ser_item_matches", "ser_item_type", "ser_to_duration", "ser_hex",
  "ser_text_pad", "ser_text_part", "ser_round_places",
  "ser_func_define", "ser_func_callback", "ser_func_return",
  "ser_func_run_0", "ser_func_run_1", "ser_func_run_2",
  "ser_list_new", "ser_list_add", "ser_list_remove", "ser_list_item",
  "ser_list_has", "ser_list_combine",
  "ser_dict_new", "ser_dict_set", "ser_dict_remove", "ser_dict_get", "ser_dict_has",
  "ser_vote_option", "ser_vote_go", "ser_vote_wait",
  "ser_script_running", "ser_script_exists",
  // variables and persistence
  "ser_var_by_name", "ser_stopwatch_start", "ser_stopwatch_read",
  "ser_save_data", "ser_read_data", "ser_clear_all_data", "ser_clear_key_data",
  "ser_db_save", "ser_db_read", "ser_db_has", "ser_db_remove",
  // advanced player ops
  "ser_hume_add", "ser_hume_set", "ser_set_appearance", "ser_set_group",
  "ser_has_perm", "ser_firearm_info", "ser_ammo_limit", "ser_ammo_limit_read",
  "ser_scp096_target", "ser_scp173_observers", "ser_scp079",
  "ser_damage_add", "ser_damage_remove",
  "ser_group_ops", "ser_groups_overlap", "ser_take_players",
  // intercom admin
  "ser_intercom_state", "ser_intercom_text", "ser_intercom_info",
  // world admin
  "ser_door_health", "ser_door_permission", "ser_elevator_text",
  "ser_wave_timer", "ser_wave_timer_read", "ser_wave_effect", "ser_wave_tuning",
  "ser_decon_info",
  "ser_audio_load", "ser_speaker_global", "ser_speaker_position",
  "ser_speaker_attached", "ser_speaker_destroy", "ser_speaker_exists",
  "ser_audio_play", "ser_audio_stop", "ser_audio_check",
  "ser_toy_create", "ser_toy_move", "ser_toy_destroy", "ser_toy_info",
  // server control
  "ser_config_load", "ser_config_read", "ser_command",
  "ser_run_script_keep", "ser_run_script_wait", "ser_trigger",
  "ser_event_toggle", "ser_is_allowed",
  // libraries
  "ser_lib_reset_each_round", "ser_lib_custom_keycard",
  "ser_lib_glow_start", "ser_lib_glow_stop",
  "ser_lib_throw_grenade", "ser_lib_spawn_ragdoll",
  "ser_lib_discord_embed", "ser_lib_round_start",
  "ser_lib_colored_shape", "ser_lib_text_sign",
  "ser_lib_crole_register", "ser_lib_crole_unregister",
  "ser_lib_crole_chance", "ser_lib_crole_procedural", "ser_lib_crole_bracket",
  "ser_lib_crole_give", "ser_lib_crole_callbacks", "ser_lib_crole_registered",
  "ser_lib_crole_event",
  "ser_lib_ucr_give", "ser_lib_ucr_remove", "ser_lib_ucr_players", "ser_lib_ucr_event"
]);

  const glyph = hex => {
    const code = Number.parseInt(hex, 16);
    return Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  };
  const prettyLabel = value => value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, character => character.toUpperCase());
  const asOptions = list => list.map(value => [prettyLabel(value), value]);
  const roomNames = truth.GetRoomByName.arguments[0].enumValues.filter(room => room !== "Unnamed");
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

  const useItemFilterOptions = [["any item", "any"], ...itemOptions.map(([label, value]) => [`item: ${label}`, `item:${value}`])];
  const equipItemFilterOptions = [
    ["any item", "any"],
    ["a coin", "kind:coin"],
    ["a firearm", "kind:firearm"],
    ["a keycard (including custom)", "kind:keycard"],
    ["a custom keycard", "kind:customKeycard"],
    ...itemOptions.map(([label, value]) => [`item: ${label}`, `item:${value}`])
  ];

  const gen = new Blockly.Generator("SER");
  gen.ORDER_ATOMIC = 0;
  gen.ORDER_NONE = 99;
  gen.INDENT = indent;
  gen.scrub_ = function (block, code, thisOnly) {
    const next = block.nextConnection && block.nextConnection.targetBlock();
    return code + (thisOnly || !next ? "" : this.blockToCode(next));
  };

  const valueOf = (block, name) => gen.valueToCode(block, name, gen.ORDER_ATOMIC) || "...";
  const conditionOf = (block, name = "COND") => gen.valueToCode(block, name, gen.ORDER_NONE) || "...";
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
  const keyCode = (block, keyName, targetName) => {
    const scope = block.getFieldValue("SCOPE");
    if (scope === "life") return `"${textPart(block, keyName)}_{${valueOf(block, targetName)} -> LifeId}"`;
    if (scope === "round") return `"${textPart(block, keyName)}_{$roundStamp}"`;
    return valueOf(block, keyName);
  };
  const usedTargets = root => [...new Set(
    root.getDescendants(false).filter(block => block.type === "ser_target").map(block => block.getFieldValue("TARGET"))
  )].sort();
  const isEveryone = (block, name) => {
    const target = block.getInputTargetBlock(name);
    return Boolean(target && target.type === "ser_target" && target.getFieldValue("TARGET") === "@all");
  };

  const itemTest = (ref, kind, exact) => {
    const needles = { coin: "Coin", firearm: "Gun", keycard: "Keycard", customKeycard: "KeycardCustom" };
    return kind === "exact"
      ? `{*${ref} -> type} is ${quote(exact)}`
      : `{Text.Contains {*${ref} -> type} ${quote(needles[kind])}}`;
  };
  const itemFilterTest = (ref, value) => {
    if (!value || value === "any") return "";
    const separator = value.indexOf(":");
    const type = value.slice(0, separator);
    const key = value.slice(separator + 1);
    return type === "kind" ? itemTest(ref, key) : itemTest(ref, "exact", key);
  };

  const plusIcon = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><circle cx='8' cy='8' r='7' fill='#ffffff' stroke='#333' stroke-width='1'/><path d='M8 4.5v7M4.5 8h7' stroke='#222' stroke-width='2' stroke-linecap='round'/></svg>");
  const minusIcon = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><circle cx='8' cy='8' r='7' fill='#ffffff' stroke='#333' stroke-width='1'/><path d='M4.5 8h7' stroke='#222' stroke-width='2' stroke-linecap='round'/></svg>");

  const specs = [];
  const def = spec => {
    spec.advanced = advancedIds.has(spec.id);
    specs.push(spec);
  };
  const tgt = value => ["ser_target", { TARGET: value }];
  const num = number => ["ser_number", { NUMBER: number }];
  const txt = text => ["ser_text", { TEXT: text }];
  const dur = (amount, unit = "s") => ["ser_duration", { AMOUNT: amount, UNIT: unit }];
  const dd = (field, options) => ({ field, options });
  const tf = (field, text) => ({ field, text });
  const nf = (field, number, min = -1000000, max = 1000000, precision = 0.01) => ({ field, number, min, max, precision });
  const inputOf = (name, check) => ({ input: name, check });
  const playerInput = { input: "TARGET", check: playerCheck };
  const playerIn = name => ({ input: name, check: playerCheck });
  const evTarget = { TARGET: tgt("@evPlayer") };
  const allTarget = { TARGET: tgt("@all") };
  const singleTarget = ["TARGET"];

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
    id: "ser_when_use_item", cat: "start", kind: "hat", icon: "f466", title: "When a player uses an item",
    tip: "Runs the blocks inside when a player uses an item that matches the filter.",
    note: "Coins, keycards, and firearms cannot be used, so pick a specific item or 'any item' here.",
    parts: ["When a player uses", dd("FILTER", useItemFilterOptions), "do", { body: "DO" }],
    code: (block, g) => {
      const test = itemFilterTest("evUsableItem", block.getFieldValue("FILTER"));
      const body = g.statementToCode(block, "DO");
      return `!-- OnEvent UsedItem\n-- require @evPlayer *evUsableItem\n\n${test ? `if ${test}\n${body}end\n` : unindent(body)}`;
    }
  });

  def({
    id: "ser_when_equip_item", cat: "start", kind: "hat", icon: "f466", title: "When a player equips an item",
    tip: "Runs the blocks inside when a player equips an item that matches the filter.",
    note: "Only coins, keycards, and firearms can be equipped, and any item in the list above can be picked.",
    parts: ["When a player equips", dd("FILTER", equipItemFilterOptions), "do", { body: "DO" }],
    code: (block, g) => {
      const test = itemFilterTest("evNewItem", block.getFieldValue("FILTER"));
      const body = g.statementToCode(block, "DO");
      return `!-- OnEvent ChangedItem\n-- require @evPlayer *evNewItem\n\n${test ? `if ${test}\n${body}end\n` : unindent(body)}`;
    }
  });

  def({
    id: "ser_when_command", cat: "start", kind: "hat", icon: "f075", title: "When a player types a command",
    tip: "Creates a custom command. The blocks inside run when someone types it.",
    note: "Spaces and symbols are removed from the command name.",
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
    id: "ser_set_max_health", cat: "players", kind: "statement", icon: "f004", title: "Set max health",
    tip: "Changes the maximum health of the chosen players. The value must be at least 1.",
    note: "The reference does not say whether current health is lowered when the maximum drops.",
    parts: ["set max health of", playerInput, "to", inputOf("AMOUNT", "Number")],
    defaults: { ...evTarget, AMOUNT: num(100) },
    code: block => `SetMaxHealth ${valueOf(block, "TARGET")} ${valueOf(block, "AMOUNT")}\n`
  });

  def({
    id: "ser_regen", cat: "players", kind: "statement", icon: "f004", title: "Health regeneration",
    tip: "Adds health regeneration to the chosen players for a set duration.",
    note: "The reference gives no units for the rate or duration, so check them in-game before relying on them.",
    parts: ["regenerate", playerInput, "at rate", inputOf("RATE", "Number"), "for", inputOf("DURATION", "Number")],
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
    id: "ser_hume_add", cat: "players", kind: "statement", icon: "f3c5", title: "Add to hume shield",
    tip: "Adds an amount to the hume shield of the chosen players.",
    parts: ["add", inputOf("AMOUNT", "Number"), "to hume shield of", playerInput],
    defaults: { ...evTarget, AMOUNT: num(50) },
    code: block => `AddHume ${valueOf(block, "TARGET")} ${valueOf(block, "AMOUNT")}\n`
  });

  def({
    id: "ser_hume_set", cat: "players", kind: "statement", icon: "f3c5", title: "Set hume shield",
    tip: "Sets the hume shield of the chosen players: current amount, limit, regen rate, and regen cooldown.",
    note: "The reference does not define the units of the regen rate.",
    parts: ["set hume shield of", playerInput, "amount", inputOf("AMOUNT", "Number"), "limit", inputOf("LIMIT", "Number"), "regen rate", inputOf("REGEN", "Number"), "regen cooldown", inputOf("DELAY", "Duration")],
    defaults: { ...evTarget, AMOUNT: num(50), LIMIT: num(100), REGEN: num(1), DELAY: dur(5) },
    code: block => `SetHumeShield ${valueOf(block, "TARGET")} ${valueOf(block, "AMOUNT")} ${valueOf(block, "LIMIT")} ${valueOf(block, "REGEN")} ${valueOf(block, "DELAY")}\n`
  });

  def({
    id: "ser_stamina", cat: "players", kind: "statement", icon: "f70c", title: "Stamina",
    tip: "Adds, removes, or sets the stamina of the chosen players as a percentage of the full bar (0% to 100%).",
    parts: [dd("MODE", [["add", "add"], ["remove", "remove"], ["set", "set"]]), "stamina of", playerInput, "to", inputOf("VALUE", "Number"), "%", dd("DELAY", [["delay regeneration", "true"], ["allow regeneration", "false"]])],
    defaults: { ...evTarget, VALUE: num(100) },
    code: block => `Stamina ${block.getFieldValue("MODE")} ${valueOf(block, "TARGET")} ${valueOf(block, "VALUE")}% ${block.getFieldValue("DELAY")}\n`
  });

  def({
    id: "ser_set_role", cat: "players", kind: "statement", icon: "f4fe", title: "Change role",
    tip: "Changes the chosen players to another role.",
    parts: ["change", playerInput, "to role", dd("ROLE", asOptions(roles))],
    defaults: evTarget,
    code: block => `SetRole ${valueOf(block, "TARGET")} ${block.getFieldValue("ROLE")}\n`
  });

  def({
    id: "ser_set_appearance", cat: "players", kind: "statement", icon: "f508", title: "Change appearance",
    tip: "Makes the chosen players look like another role. Only the chosen viewers see the change.",
    parts: ["make", playerInput, "look like role", dd("ROLE", asOptions(roles)), "for viewers", playerIn("VIEWERS")],
    defaults: { ...evTarget, VIEWERS: tgt("@all") },
    code: block => `SetAppearance ${valueOf(block, "TARGET")} ${block.getFieldValue("ROLE")} ${valueOf(block, "VIEWERS")}\n`
  });

  def({
    id: "ser_teleport_player", cat: "players", kind: "statement", icon: "f124", title: "Teleport to player",
    tip: "Moves the first players to the second player.",
    note: "The destination must be exactly one player.",
    parts: ["teleport", playerInput, "to", playerIn("DEST")],
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
    id: "ser_tp_exact", cat: "players", kind: "statement", icon: "f124", title: "Teleport to coordinates",
    tip: "Teleports the chosen players to exact world coordinates.",
    parts: ["teleport", playerInput, "to exact x", inputOf("X", "Number"), "y", inputOf("Y", "Number"), "z", inputOf("Z", "Number")],
    defaults: { ...evTarget, X: num(0), Y: num(0), Z: num(0) },
    code: block => `TPPosition ${valueOf(block, "TARGET")} ${valueOf(block, "X")} ${valueOf(block, "Y")} ${valueOf(block, "Z")}\n`
  });

  def({
    id: "ser_tp_place", cat: "players", kind: "statement", icon: "f124", title: "Teleport to room or zone",
    tip: "Teleports the chosen players to a room or zone. X, Y, and Z are offsets from its center.",
    parts: ["teleport", playerInput, "to", dd("PLACE", placeOptions.slice(1)), "offset x", inputOf("X", "Number"), "y", inputOf("Y", "Number"), "z", inputOf("Z", "Number")],
    defaults: { ...evTarget, X: num(0), Y: num(0), Z: num(0) },
    code: block => `TPRoom ${valueOf(block, "TARGET")} ${block.getFieldValue("PLACE")} ${valueOf(block, "X")} ${valueOf(block, "Y")} ${valueOf(block, "Z")}\n`
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
    id: "ser_item_remove", cat: "players", kind: "statement", icon: "f1f8", title: "Remove one item type",
    tip: "Destroys or drops a number of one item type from the chosen players' inventories.",
    parts: [dd("MODE", [["destroy", "destroy"], ["drop on the ground", "drop"]]), inputOf("AMOUNT", "Number"), dd("ITEM", itemOptions), "from", playerInput],
    defaults: { ...evTarget, AMOUNT: num(1) },
    code: block => {
      const method = block.getFieldValue("MODE") === "drop" ? "DropItem" : "DestroyItem";
      return `${method} ${valueOf(block, "TARGET")} ${block.getFieldValue("ITEM")} ${valueOf(block, "AMOUNT")}\n`;
    }
  });

  def({
    id: "ser_clear_inventory", cat: "players", kind: "statement", icon: "f1f8", title: "Clear all items",
    tip: "Destroys or drops every item in the chosen players' inventories.",
    parts: [dd("MODE", [["destroy all items of", "destroy"], ["drop all items of", "drop"]]), playerInput],
    defaults: evTarget,
    code: block => `ClearInventory ${valueOf(block, "TARGET")}${block.getFieldValue("MODE") === "drop" ? " drop" : ""}\n`
  });

  def({
    id: "ser_item_spawn", cat: "players", kind: "statement", icon: "f466", title: "Spawn item on player",
    tip: "Creates an item and drops it onto one player.",
    note: "Use one player, not a group.",
    parts: ["spawn", dd("ITEM", itemOptions), "on", playerInput, "as", tf("NAME", "spawnedItem")],
    defaults: evTarget,
    single: singleTarget,
    code: block => {
      const name = cleanName(block.getFieldValue("NAME"), "spawnedItem");
      return `*${name} = CreatePickup ${block.getFieldValue("ITEM")}\nSpawnPickupPlayer *${name} ${valueOf(block, "TARGET")}\n`;
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
    id: "ser_give_effect", cat: "players", kind: "statement", icon: "f48e", title: "Give effect",
    tip: "Gives a status effect to the chosen players for a duration. Intensity 1 is the normal strength.",
    parts: ["give effect", dd("EFFECT", effectOptions), "to", playerInput, "for", inputOf("DURATION", "Duration"), "intensity", inputOf("INTENSITY", "Number")],
    defaults: { ...evTarget, DURATION: dur(10), INTENSITY: num(1) },
    code: block => `GiveEffect ${valueOf(block, "TARGET")} ${block.getFieldValue("EFFECT")} ${valueOf(block, "DURATION")} ${valueOf(block, "INTENSITY")}\n`
  });

  def({
    id: "ser_remove_effect", cat: "players", kind: "statement", icon: "f48e", title: "Remove effect",
    tip: "Removes one status effect, or every status effect, from the chosen players.",
    parts: ["remove", dd("EFFECT", [["all effects", "all"], ...effectOptions]), "from", playerInput],
    defaults: evTarget,
    code: block => {
      const effect = block.getFieldValue("EFFECT");
      return `ClearEffect ${valueOf(block, "TARGET")}${effect === "all" ? "" : ` ${effect}`}\n`;
    }
  });

  def({
    id: "ser_set_flag", cat: "players", kind: "statement", icon: "f3ed", title: "Set player permission",
    tip: "Turns god mode, noclip, bypass, spectatable, or global intercom use on or off for the chosen players.",
    parts: ["set", dd("FLAG", [["god mode", "godmode"], ["noclip", "noclip"], ["bypass", "bypass"], ["spectatable", "spectatable"], ["global intercom use", "intercom"]]), "of", playerInput, "to", dd("STATE", boolOptions)],
    defaults: evTarget,
    code: block => `${flagMethods[block.getFieldValue("FLAG")]} ${valueOf(block, "TARGET")} ${block.getFieldValue("STATE")}\n`
  });

  def({
    id: "ser_set_size", cat: "players", kind: "statement", icon: "f065", title: "Set size",
    tip: "Changes the size of the chosen players. 1 is normal size on each axis.",
    parts: ["set size of", playerInput, "to x", inputOf("X", "Number"), "y", inputOf("Y", "Number"), "z", inputOf("Z", "Number")],
    defaults: { ...evTarget, X: num(1), Y: num(1), Z: num(1) },
    code: block => `SetSize ${valueOf(block, "TARGET")} ${valueOf(block, "X")} ${valueOf(block, "Y")} ${valueOf(block, "Z")}\n`
  });

  def({
    id: "ser_set_group", cat: "players", kind: "statement", icon: "f0c0", title: "Set permission group",
    tip: "Puts the chosen players in a permission group.",
    note: "Type NONE to remove their group.",
    parts: ["set group of", playerInput, "to", inputOf("GROUP", "String")],
    defaults: { ...evTarget, GROUP: txt("NONE") },
    code: block => `SetGroup ${valueOf(block, "TARGET")} ${valueOf(block, "GROUP")}\n`
  });

  def({
    id: "ser_shown_info", cat: "players", kind: "statement", icon: "f2c2", title: "Show player info",
    tip: "Chooses what information about the chosen players is shown to others.",
    parts: ["show", dd("INFO", asOptions(shownInfos)), "of", playerInput],
    defaults: evTarget,
    code: block => `SetShownPlayerInfo ${valueOf(block, "TARGET")} ${block.getFieldValue("INFO")}\n`
  });

  def({
    id: "ser_hitmarker", cat: "players", kind: "statement", icon: "f05b", title: "Hit marker",
    tip: "Shows a hit marker to the chosen players, as if they had hit something.",
    parts: ["show hit marker to", playerInput, "size", inputOf("SIZE", "Number"), "sound", dd("SOUND", boolOptions), "type", dd("TYPE", hitmarkerTypes)],
    defaults: { ...evTarget, SIZE: num(1) },
    code: block => `ShowHitMarker ${valueOf(block, "TARGET")} ${valueOf(block, "SIZE")} ${block.getFieldValue("SOUND")} ${block.getFieldValue("TYPE")}\n`
  });

  def({
    id: "ser_mute", cat: "players", kind: "statement", icon: "f131", title: "Mute player",
    tip: "Mutes the chosen players temporarily, until someone unmutes them, or clears every mute on them.",
    parts: ["mute", playerInput, dd("MODE", [["temporarily", "true"], ["until unmuted", "false"], ["clear all mutes", "clear"]])],
    defaults: evTarget,
    code: block => (
      block.getFieldValue("MODE") === "clear"
        ? `ResetMute ${valueOf(block, "TARGET")}\n`
        : `Mute ${valueOf(block, "TARGET")} ${block.getFieldValue("MODE")}\n`
    )
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
    tip: "Removes the chosen players from the server with a reason shown to them.",
    note: "They can rejoin.",
    parts: ["kick", playerInput, "reason", inputOf("REASON", "String")],
    defaults: { ...evTarget, REASON: txt("Removed by a server rule") },
    code: block => `Kick ${valueOf(block, "TARGET")} ${valueOf(block, "REASON")}\n`
  });

  def({
    id: "ser_damage_add", cat: "players", kind: "statement", icon: "f524", title: "Add damage rule",
    tip: "Multiplies the damage a player deals or takes. Multiplier 2 doubles it, 0.5 halves it.",
    note: "Give each rule an id so you can remove it later with 'Remove damage rule'.",
    parts: [dd("SIDE", [["damage they deal", "attacker"], ["damage they take", "receiver"]]), playerInput, "multiplier", inputOf("MULT", "Number"), "rule id", tf("RULE", "rule")],
    defaults: { ...evTarget, MULT: num(1) },
    code: block => `AddDamageRule ${block.getFieldValue("SIDE")} ${valueOf(block, "TARGET")} ${valueOf(block, "MULT")} ${quote(block.getFieldValue("RULE"))}\n`
  });

  def({
    id: "ser_damage_remove", cat: "players", kind: "statement", icon: "f524", title: "Remove damage rule",
    tip: "Removes a damage rule that was added with 'Add damage rule', using its id.",
    parts: ["remove damage rule with id", tf("RULE", "rule")],
    code: block => `RemoveDamageRule ${quote(block.getFieldValue("RULE"))}\n`
  });

  def({
    id: "ser_foreach_player", cat: "logic", kind: "statement", icon: "f363", title: "For each player",
    tip: "Runs the blocks inside once for each player in a group. The current player is stored under the name you choose.",
    note: "Use the name with @ to refer to the current player, e.g. @p.",
    parts: ["for each player in", playerInput, "as", tf("VAR", "p"), "do", { body: "DO" }],
    defaults: { TARGET: tgt("@alivePlayers") },
    code: (block, g) => {
      const name = cleanName(block.getFieldValue("VAR"), "p");
      return `over ${valueOf(block, "TARGET")} with @${name}\n${bodyOf(block, "DO")}end\n`;
    }
  });

  def({
    id: "ser_foreach_list", cat: "logic", kind: "statement", icon: "f363", title: "For each list item",
    tip: "Runs the blocks inside once for each item in a list. The current item is stored under the name you choose.",
    note: "Use the name with $ to refer to the current item, e.g. $p.",
    parts: ["for each item in list", tf("LIST", "myList"), "as", tf("VAR", "p"), "do", { body: "DO" }],
    code: (block, g) => {
      const name = cleanName(block.getFieldValue("VAR"), "p");
      return `over &${cleanName(block.getFieldValue("LIST"), "myList")} with $${name}\n${bodyOf(block, "DO")}end\n`;
    }
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
    id: "ser_group_ops", cat: "players", kind: "value", output: "Player", icon: "f0c0", title: "Combine player groups",
    tip: "Joins two groups of players, removes the second group from the first, or keeps only the players both groups share.",
    parts: [dd("MODE", [["join", "Join"], ["remove", "Except"], ["keep shared", "Intersect"]]), playerIn("A"), "and", playerIn("B")],
    defaults: { A: tgt("@alivePlayers"), B: tgt("@scpPlayers") },
    code: block => [`{${block.getFieldValue("MODE")} ${valueOf(block, "A")} ${valueOf(block, "B")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_groups_overlap", cat: "players", kind: "value", output: "Boolean", icon: "f0c0", title: "Groups overlap",
    tip: "True if the two groups of players share at least one player.",
    parts: [playerIn("A"), "overlaps", playerIn("B")],
    defaults: { A: tgt("@alivePlayers"), B: tgt("@scpPlayers") },
    code: block => [`{Overlapping ${valueOf(block, "A")} ${valueOf(block, "B")}}`, gen.ORDER_ATOMIC]
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
    id: "ser_ammo_limit", cat: "players", kind: "statement", icon: "f1e2", title: "Set ammo limit",
    tip: "Sets how much of one ammo type the chosen players can carry.",
    parts: ["set", dd("AMMO", asOptions(ammoOptions)), "ammo limit of", playerInput, "to", inputOf("LIMIT", "Number")],
    defaults: { ...evTarget, LIMIT: num(100) },
    code: block => `SetAmmoLimit ${valueOf(block, "TARGET")} ${block.getFieldValue("AMMO")} ${valueOf(block, "LIMIT")}\n`
  });

  def({
    id: "ser_ammo_limit_read", cat: "players", kind: "value", output: "Number", icon: "f1e2", title: "Ammo limit of player",
    tip: "The ammo limit of one player for one ammo type.",
    parts: [dd("AMMO", asOptions(ammoOptions)), "ammo limit of", playerInput],
    defaults: evTarget, single: singleTarget,
    code: block => [`{GetAmmoLimit ${valueOf(block, "TARGET")} ${block.getFieldValue("AMMO")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_scp096_target", cat: "players", kind: "value", output: "Player", icon: "f21e", title: "SCP-096 targets",
    tip: "The players that the chosen SCP-096 is targeting.",
    parts: ["players SCP-096", playerInput, "is targeting"],
    defaults: { TARGET: tgt("@scpPlayers") }, single: singleTarget,
    code: block => [`{Get096Targets ${valueOf(block, "TARGET")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_scp173_observers", cat: "players", kind: "value", output: "Player", icon: "f21e", title: "SCP-173 observers",
    tip: "The players currently looking at the chosen SCP-173.",
    parts: ["players observing SCP-173", playerInput],
    defaults: { TARGET: tgt("@scpPlayers") }, single: singleTarget,
    code: block => [`{Get173Observers ${valueOf(block, "TARGET")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_scp079", cat: "players", kind: "statement", icon: "f2db", title: "SCP-079 stats",
    tip: "Sets one stat of the chosen SCP-079 player: access tier (1 to 5), auxiliary power, or experience.",
    parts: ["set SCP-079", dd("STAT", [["access tier", "tier"], ["auxiliary power", "power"], ["experience", "exp"]]), "of", playerInput, "to", inputOf("VALUE", "Number")],
    defaults: { ...evTarget, VALUE: num(1) },
    code: block => {
      const method = { tier: "Set079AccessTier", power: "Set079AuxPower", exp: "Set079Exp" }[block.getFieldValue("STAT")];
      return `${method} ${valueOf(block, "TARGET")} ${valueOf(block, "VALUE")}\n`;
    }
  });

  def({
    id: "ser_message", cat: "messages", kind: "statement", icon: "f0a1", title: "Show message",
    tip: "Shows a message to the chosen players for a set time.",
    note: "Big and small messages appear at different sizes. Typed messages appear letter by letter with a CASSIE voice, and stop any CASSIE announcement already playing.",
    parts: ["show", dd("STYLE", [["big message", "big"], ["small hint", "small"], ["typed message", "typed"]]), "to", playerInput, "for", inputOf("DURATION", "Duration"), "saying", inputOf("TEXT", "String")],
    defaults: { ...allTarget, DURATION: dur(5), TEXT: txt("The round has started!") },
    code: block => {
      const method = { big: "Broadcast", small: "Hint", typed: "AnimatedBroadcast" }[block.getFieldValue("STYLE")];
      return `${method} ${valueOf(block, "TARGET")} ${valueOf(block, "DURATION")} ${valueOf(block, "TEXT")}\n`;
    }
  });

  def({
    id: "ser_countdown", cat: "messages", kind: "statement", icon: "f017", title: "Countdown",
    tip: "Shows a countdown on screen for the chosen players.",
    note: "Use %seconds% in the title to show the time left.",
    parts: ["show countdown to", playerInput, "for", inputOf("DURATION", "Duration"), "titled", inputOf("TEXT", "String")],
    defaults: { ...allTarget, DURATION: dur(30), TEXT: txt("%seconds% seconds left") },
    code: block => `Countdown ${valueOf(block, "TARGET")} ${valueOf(block, "DURATION")} ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_clear_screen", cat: "messages", kind: "statement", icon: "f00d", title: "Clear screen messages",
    tip: "Removes the big messages, or the countdowns, currently shown to the chosen players.",
    parts: ["clear", dd("MODE", [["big messages", "broadcast"], ["countdowns", "countdown"]]), "for", playerInput],
    defaults: allTarget,
    code: block => `${block.getFieldValue("MODE") === "countdown" ? "ClearCountdown" : "ClearBroadcasts"} ${valueOf(block, "TARGET")}\n`
  });

  def({
    id: "ser_cassie", cat: "messages", kind: "statement", icon: "f028", title: "CASSIE announcement",
    tip: "Makes a CASSIE announcement to the chosen players.",
    note: "Leave the players set to everyone, or pick specific players so only they hear it.",
    parts: ["announce on CASSIE to", playerInput, dd("MODE", [["with jingle", "jingle"], ["without jingle", "noJingle"]]), inputOf("TEXT", "String")],
    defaults: { ...allTarget, TEXT: txt("Attention all personnel") },
    code: block => (
      isEveryone(block, "TARGET")
        ? `Cassie ${block.getFieldValue("MODE")} ${valueOf(block, "TEXT")}\n`
        : `PlayerCassie ${valueOf(block, "TARGET")} ${block.getFieldValue("MODE")} ${valueOf(block, "TEXT")}\n`
    )
  });

  def({
    id: "ser_cassie_stop", cat: "messages", kind: "statement", icon: "f04d", title: "Stop CASSIE",
    tip: "Stops the CASSIE announcement that is playing right now.",
    parts: ["stop the current CASSIE announcement"],
    code: () => "ClearCassie\n"
  });

  def({
    id: "ser_cassie_speaking", cat: "messages", kind: "value", output: "Boolean", icon: "f028", title: "CASSIE is speaking",
    tip: "True while a CASSIE announcement is playing.",
    parts: ["a CASSIE announcement is playing"],
    code: () => ["{IsCassieSpeaking}", gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_intercom_state", cat: "messages", kind: "statement", icon: "f2a1", title: "Set intercom state",
    tip: "Sets the intercom's state, such as ready, in use, or cooldown.",
    parts: ["set intercom state to", dd("STATE", asOptions(intercomStates))],
    code: block => `SetIntercomState ${block.getFieldValue("STATE")}\n`
  });

  def({
    id: "ser_intercom_text", cat: "messages", kind: "statement", icon: "f2a1", title: "Set intercom text",
    tip: "Sets the text shown on the intercom.",
    note: "An empty text resets it.",
    parts: ["set intercom text to", inputOf("TEXT", "String")],
    defaults: { TEXT: txt("") },
    code: block => `SetIntercomText ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_intercom_info", cat: "messages", kind: "value", output: null, icon: "f2a1", title: "Intercom info",
    tip: "Reads one fact about the intercom: its state, the speaker, cooldown, time left to speak, or its text.",
    parts: ["intercom", dd("INFO", asOptions(intercomInfos))],
    code: block => [`{IntercomInfo ${block.getFieldValue("INFO")}}`, gen.ORDER_ATOMIC]
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
    tip: "Opens, closes, locks, unlocks, breaks, or repairs doors in the chosen place.",
    note: "'Everywhere' affects every door.",
    parts: [dd("ACTION", [["open", "OpenDoor"], ["close", "CloseDoor"], ["lock", "LockDoor"], ["unlock", "UnlockDoor"], ["break", "BreakDoor"], ["repair", "RepairDoor"]]), "doors in", dd("PLACE", placeOptions)],
    code: block => `${block.getFieldValue("ACTION")} ${block.getFieldValue("PLACE")}\n`
  });

  def({
    id: "ser_door_health", cat: "world", kind: "statement", icon: "f52b", title: "Set door health",
    tip: "Sets the remaining health of doors that can be broken.",
    note: "Gates cannot be damaged this way.",
    parts: ["set health of doors in", dd("PLACE", placeOptions), "to", inputOf("HEALTH", "Number")],
    defaults: { HEALTH: num(100) },
    code: block => `SetDoorHealth ${block.getFieldValue("PLACE")} ${valueOf(block, "HEALTH")}\n`
  });

  def({
    id: "ser_door_permission", cat: "world", kind: "statement", icon: "f084", title: "Set door access",
    tip: "Sets which keycard access the doors in a place require.",
    note: "This replaces the doors' current permissions.",
    parts: ["set doors in", dd("PLACE", placeOptions), "to require", dd("PERM", asOptions(doorPermissionOptions))],
    code: block => `SetDoorPermission ${block.getFieldValue("PLACE")} ${block.getFieldValue("PERM")}\n`
  });

  def({
    id: "ser_lights_set_color", cat: "world", kind: "statement", icon: "f0eb", title: "Set light color",
    tip: "Sets the light color in the chosen place. Use a 6-digit hex color like FF0000.",
    parts: ["set lights in", dd("PLACE", placeOptions), "to color #", tf("COLOR", "FF0000")],
    code: block => `SetLightColor ${block.getFieldValue("PLACE")} ${hexOf(block.getFieldValue("COLOR"), "FFFFFF")}\n`
  });

  def({
    id: "ser_lights_reset_color", cat: "world", kind: "statement", icon: "f0eb", title: "Reset light color",
    tip: "Puts the lights in the chosen place back to their normal color.",
    parts: ["set lights in", dd("PLACE", placeOptions), "back to normal color"],
    code: block => `ResetLightColor ${block.getFieldValue("PLACE")}\n`
  });

  def({
    id: "ser_lights_off", cat: "world", kind: "statement", icon: "f186", title: "Lights off or blackout",
    tip: "Turns off the lights in a place for a duration, or causes a full room blackout there for a duration.",
    parts: [dd("MODE", [["turn lights off in", "lights"], ["full blackout in", "blackout"]]), dd("PLACE", placeOptions), "for", inputOf("DURATION", "Duration")],
    defaults: { DURATION: dur(10) },
    code: block => (
      block.getFieldValue("MODE") === "blackout"
        ? `Blackout ${block.getFieldValue("PLACE")} ${valueOf(block, "DURATION")}\n`
        : `DisableLights ${block.getFieldValue("PLACE")} ${valueOf(block, "DURATION")}\n`
    )
  });

  def({
    id: "ser_elevators", cat: "world", kind: "statement", icon: "f0ec", title: "Elevators",
    tip: "Applies an action to every elevator.",
    parts: [dd("ACTION", [["lock", "LockElevator"], ["unlock", "UnlockElevator"], ["send", "SendElevator"]]), "all elevators"],
    code: block => `${block.getFieldValue("ACTION")} all\n`
  });

  def({
    id: "ser_elevator_text", cat: "world", kind: "statement", icon: "f0ec", title: "Elevator panel text",
    tip: "Changes the text on the elevator panels.",
    note: "An empty text resets it.",
    parts: ["set elevator panel text to", inputOf("TEXT", "String")],
    defaults: { TEXT: txt("Maintenance") },
    code: block => `SetElevatorText ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_cleanup", cat: "world", kind: "statement", icon: "f1f8", title: "Clean up",
    tip: "Removes dropped items from the map, or every dead body (ragdoll).",
    parts: ["clean up", dd("MODE", [["dropped items", "items"], ["dead bodies", "bodies"]])],
    code: block => (block.getFieldValue("MODE") === "bodies" ? "CleanupRagdolls\n" : "CleanupPickups\n")
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
    id: "ser_wave_timer_read", cat: "world", kind: "value", output: "Duration", icon: "f017", title: "Time until next wave",
    tip: "How long until the next respawn wave of this type.",
    parts: ["time until next", dd("WAVE", waveOptions), "wave"],
    code: block => [`{GetWaveTimer ${block.getFieldValue("WAVE")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_wave_effect", cat: "world", kind: "statement", icon: "f0c0", title: "Wave effect",
    tip: "Plays the visual effect of a respawn wave without spawning anyone.",
    parts: ["play effect of", dd("WAVE", waveOptions)],
    code: block => `PlayWaveEffect ${block.getFieldValue("WAVE")}\n`
  });

  def({
    id: "ser_wave_tuning", cat: "world", kind: "statement", icon: "f0c0", title: "Wave tuning",
    tip: "Changes a wave's respawn tokens (whole number) or its influence (decimal number).",
    note: "Set replaces the value; change by adds to it.",
    parts: [dd("WAVE", waveOptions), dd("WHAT", [["respawn tokens", "tokens"], ["influence", "influence"]]), dd("MODE", [["set to", "set"], ["change by", "changeBy"]]), inputOf("VALUE", "Number")],
    defaults: { VALUE: num(1) },
    code: block => {
      const method = block.getFieldValue("WHAT") === "tokens" ? "WaveRespawnTokens" : "WaveInfluence";
      return `${method} ${block.getFieldValue("WAVE")} ${block.getFieldValue("MODE")} ${valueOf(block, "VALUE")}\n`;
    }
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
    id: "ser_tesla_add", cat: "world", kind: "statement", icon: "f0e7", title: "Tesla ignore players",
    tip: "Makes teslas ignore the chosen players.",
    note: "Use 'Stop tesla ignoring' with the same rule id to undo it.",
    parts: ["make teslas ignore", playerInput, "with rule id", tf("RULE", "rule")],
    defaults: evTarget,
    code: block => `AddTeslaIgnoreRule ${valueOf(block, "TARGET")} ${quote(block.getFieldValue("RULE"))}\n`
  });

  def({
    id: "ser_tesla_remove", cat: "world", kind: "statement", icon: "f0e7", title: "Stop tesla ignoring",
    tip: "Stops a tesla ignore rule that was added with 'Tesla ignore players', using its id.",
    parts: ["stop tesla ignore rule with id", tf("RULE", "rule")],
    code: block => `RemoveTeslaIgnoreRule ${quote(block.getFieldValue("RULE"))}\n`
  });

  def({
    id: "ser_audio_load", cat: "world", kind: "statement", icon: "f001", title: "Load audio clip",
    tip: "Loads an .ogg file from SER's data folder under a name you choose.",
    note: "The file must be 48kHz, mono.",
    parts: ["load audio file", inputOf("FILE", "String"), "as clip", inputOf("CLIP", "String")],
    defaults: { FILE: txt("alarm.ogg"), CLIP: txt("alarm") },
    code: block => `Audio.Load ${valueOf(block, "FILE")} ${valueOf(block, "CLIP")}\n`
  });

  def({
    id: "ser_speaker_global", cat: "world", kind: "statement", icon: "f028", title: "Create global speaker",
    tip: "Creates a speaker that everyone hears from anywhere on the map.",
    parts: ["create speaker for everyone named", inputOf("NAME", "String"), "volume", inputOf("VOLUME", "Number")],
    defaults: { NAME: txt("main"), VOLUME: num(100) },
    code: block => `Speaker.CreateGlobal ${valueOf(block, "NAME")} ${valueOf(block, "VOLUME")}\n`
  });

  def({
    id: "ser_speaker_position", cat: "world", kind: "statement", icon: "f028", title: "Create positioned speaker",
    tip: "Creates a speaker at a position in the map.",
    parts: ["create speaker at x", inputOf("X", "Number"), "y", inputOf("Y", "Number"), "z", inputOf("Z", "Number"), "named", inputOf("NAME", "String"), "volume", inputOf("VOLUME", "Number")],
    defaults: { NAME: txt("main"), VOLUME: num(100), X: num(0), Y: num(0), Z: num(0) },
    code: block => `Speaker.CreateOnPosition ${valueOf(block, "NAME")} ${valueOf(block, "X")} ${valueOf(block, "Y")} ${valueOf(block, "Z")} ${valueOf(block, "VOLUME")}\n`
  });

  def({
    id: "ser_speaker_attached", cat: "world", kind: "statement", icon: "f028", title: "Create player speaker",
    tip: "Creates a speaker that follows one player.",
    parts: ["create speaker attached to", playerInput, "named", inputOf("NAME", "String"), "volume", inputOf("VOLUME", "Number")],
    defaults: { ...evTarget, NAME: txt("main"), VOLUME: num(100) },
    single: singleTarget,
    code: block => `Speaker.CreatePlayerAttached ${valueOf(block, "TARGET")} ${valueOf(block, "NAME")} ${valueOf(block, "VOLUME")}\n`
  });

  def({
    id: "ser_speaker_destroy", cat: "world", kind: "statement", icon: "f1f8", title: "Destroy speaker",
    tip: "Removes a speaker, and stops anything it is playing.",
    parts: ["destroy speaker", inputOf("NAME", "String")],
    defaults: { NAME: txt("main") },
    code: block => `Speaker.Destroy ${valueOf(block, "NAME")}\n`
  });

  def({
    id: "ser_speaker_exists", cat: "world", kind: "value", output: "Boolean", icon: "f028", title: "Speaker exists",
    tip: "True if a speaker with this name currently exists.",
    parts: ["speaker", inputOf("NAME", "String"), "exists"],
    defaults: { NAME: txt("main") },
    code: block => [`{Speaker.Exists ${valueOf(block, "NAME")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_audio_play", cat: "world", kind: "statement", icon: "f001", title: "Play audio clip",
    tip: "Plays a loaded clip through a speaker.",
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
    id: "ser_audio_check", cat: "world", kind: "value", output: "Boolean", icon: "f001", title: "Audio check",
    tip: "True if a clip is loaded, or if a speaker is currently playing.",
    parts: [dd("WHAT", [["clip is loaded", "loaded"], ["speaker is playing", "playing"]]), inputOf("NAME", "String")],
    defaults: { NAME: txt("alarm") },
    code: block => [
      block.getFieldValue("WHAT") === "playing"
        ? `{Audio.IsPlaying ${valueOf(block, "NAME")}}`
        : `{Audio.IsLoaded ${valueOf(block, "NAME")}}`,
      gen.ORDER_ATOMIC
    ]
  });

  def({
    id: "ser_toy_create", cat: "world", kind: "statement", icon: "f1b2", title: "Create toy",
    tip: "Creates a map object (a light, a shape, a text sign, and so on) under a name.",
    note: "Use the name with 'Move toy', 'Destroy toy', and 'Toy info'.",
    parts: ["create", dd("TYPE", asOptions(toyTypes)), "named", tf("NAME", "toy")],
    code: block => `*${cleanName(block.getFieldValue("NAME"), "toy")} = Toy.Create ${block.getFieldValue("TYPE")}\n`
  });

  def({
    id: "ser_toy_move", cat: "world", kind: "statement", icon: "f1b2", title: "Move toy",
    tip: "Moves a toy created earlier to a position.",
    parts: ["move toy", tf("NAME", "toy"), "to x", inputOf("X", "Number"), "y", inputOf("Y", "Number"), "z", inputOf("Z", "Number")],
    defaults: { X: num(0), Y: num(0), Z: num(0) },
    code: block => `Toy.Move *${cleanName(block.getFieldValue("NAME"), "toy")} ${valueOf(block, "X")} ${valueOf(block, "Y")} ${valueOf(block, "Z")}\n`
  });

  def({
    id: "ser_toy_destroy", cat: "world", kind: "statement", icon: "f1f8", title: "Destroy toy",
    tip: "Destroys a toy created earlier.",
    parts: ["destroy toy", tf("NAME", "toy")],
    code: block => `Toy.Destroy *${cleanName(block.getFieldValue("NAME"), "toy")}\n`
  });

  def({
    id: "ser_toy_info", cat: "world", kind: "value", output: "Number", icon: "f1b2", title: "Toy info",
    tip: "Reads a position, rotation, or scale value of a toy created earlier.",
    parts: [dd("PROP", asOptions(toyProperties)), "of toy", tf("NAME", "toy")],
    code: block => [`{Toy.Info *${cleanName(block.getFieldValue("NAME"), "toy")} ${block.getFieldValue("PROP")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_if", cat: "logic", kind: "statement", icon: "f126", title: "If",
    tip: "Runs the blocks inside when the conditions are true. Press + to add a condition, − to remove one.",
    note: "'Any of these' joins conditions with or; 'all of these' joins them with and. Press + by 'otherwise' to add an else.",
    parts: [],
    code: (block, g) => {
      const count = block.serCount || 1;
      const conditions = Array.from({ length: count }, (_, index) => g.valueToCode(block, `COND${index}`, g.ORDER_NONE) || "...");
      const body = g.statementToCode(block, "DO");
      const elseBody = block.getInput("ELSE") ? g.statementToCode(block, "ELSE") : "";
      if (block.serMode === "all") {
        const nest = index => {
          if (index === conditions.length) return body;
          return `if ${conditions[index]}\n${nest(index + 1)}${elseBody ? `else\n${elseBody}` : ""}end\n`;
        };
        return nest(0);
      }
      let code = `if ${conditions[0]}\n${body}`;
      for (let index = 1; index < conditions.length; index++) code += `elif ${conditions[index]}\n${body}`;
      if (elseBody) code += `else\n${elseBody}`;
      return `${code}end\n`;
    },
    custom: "if"
  });

  def({
    id: "ser_match",
    cat: "logic",
    kind: "statement",
    icon: "f126",
    title: "Match value",
    tip: "Compares one value against up to three cases and runs the first case that matches.",
    note: "Case 1 is required. Cases 2 and 3 appear when you connect a value to them.",
    parts: [
      "match", inputOf("VALUE", null),
      "case", inputOf("CASE1", null), "do", { body: "DO1" },
      "case", inputOf("CASE2", null), "do", { body: "DO2" },
      "case", inputOf("CASE3", null), "do", { body: "DO3" },
      "otherwise", { body: "ELSE" }
    ],
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
    tip: "Runs the blocks inside once for each whole number in a range, from the first number up to the last (both included).",
    note: "The current number is stored in a variable with the name you choose. Read it with a 'Variable value' block using the same name. Keep TO equal to or larger than FROM.",
    parts: ["count", tf("VAR", "i"), "from", inputOf("FROM", "Number"), "to", inputOf("TO", "Number"), "do", { body: "DO" }],
    defaults: { FROM: num(1), TO: num(5) },
    code: block => {
      const name = cleanName(block.getFieldValue("VAR"), "i");
      const from = valueOf(block, "FROM");
      const to = valueOf(block, "TO");
      return `repeat {${to} - ${from} + 1} with $${name}Step\n${indent}$${name} = {$${name}Step + ${from} - 1}\n${bodyOf(block, "DO")}end\n`;
    }
  });

  def({
    id: "ser_while", cat: "logic", kind: "statement", icon: "f2f1", title: "While",
    tip: "Repeats the blocks inside while the condition stays true.",
    note: "Use 'true' as the condition to repeat forever. Add a wait inside so the server keeps running.",
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
    id: "ser_continue", cat: "logic", kind: "statement", icon: "f061", title: "Skip to next loop step",
    tip: "Ends the current pass through the loop early, and moves on to the next one.",
    parts: ["skip to the next loop step"],
    code: () => "continue\n"
  });

  def({
    id: "ser_stop", cat: "logic", kind: "statement", icon: "f04d", title: "Stop script",
    tip: "Stops this script right away.",
    parts: ["stop this script"],
    code: () => "stop\n"
  });

  def({
    id: "ser_reject_cond", cat: "logic", kind: "statement", icon: "f071", title: "Reject if condition is true",
    tip: "Sends the error message to whoever ran the script, then stops the script.",
    note: "Put this near the top of a command to check the input before anything else runs.",
    parts: ["reject if", inputOf("COND", "Boolean"), "with error", inputOf("TEXT", "String")],
    defaults: { TEXT: txt("That did not work.") },
    code: block => `if ${conditionOf(block)}\n${indent}Error ${valueOf(block, "TEXT")}\n${indent}stop\nend\n`
  });

  def({
    id: "ser_reject_range", cat: "logic", kind: "statement", icon: "f071", title: "Reject if number is out of range",
    tip: "Sends the error message to whoever ran the script, then stops the script, if the number is below the minimum or above the maximum.",
    note: "Put this near the top of a command to check the input before anything else runs.",
    parts: ["reject if number", inputOf("VALUE", "Number"), "is below", inputOf("MIN", "Number"), "or above", inputOf("MAX", "Number"), "with error", inputOf("TEXT", "String")],
    defaults: { VALUE: num(0), MIN: num(1), MAX: num(10), TEXT: txt("Pick a number from 1 to 10.") },
    code: block => {
      const failure = `${indent}Error ${valueOf(block, "TEXT")}\n${indent}stop\n`;
      const value = asExpr(valueOf(block, "VALUE"));
      return `if ${value} < ${valueOf(block, "MIN")}\n${failure}end\nif ${value} > ${valueOf(block, "MAX")}\n${failure}end\n`;
    }
  });

  def({
    id: "ser_try", cat: "logic", kind: "statement", icon: "f071", title: "Try, or else",
    tip: "Runs the first set of blocks. If one of them fails, such as when a player can't be found, runs the second set instead.",
    note: "The error text is stored in $message.",
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
    tip: "True when the comparison holds. Works with numbers and text.",
    note: "Plug it into an If, While, Wait until, or Reject block. Comparisons only work as conditions, not as stored values.",
    parts: [inputOf("A", null), dd("OP", [["is", "is"], ["is greater than", ">"], ["is less than", "<"], ["is at least", ">="], ["is at most", "<="]]), inputOf("B", null)],
    defaults: { A: num(0), B: num(0) },
    code: block => [`${asExpr(valueOf(block, "A"))} ${block.getFieldValue("OP")} ${valueOf(block, "B")}`, gen.ORDER_NONE]
  });

  def({
    id: "ser_chance", cat: "logic", kind: "value", output: "Boolean", icon: "f522", title: "Random chance",
    tip: "True for the chosen percentage of checks.",
    parts: ["random chance", nf("PERCENT", 50, 0, 100, 1), "%"],
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
    tip: "True if the player, such as the event attacker, is available.",
    note: "Check this before using an attacker.",
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
    id: "ser_script_exists", cat: "logic", kind: "value", output: "Boolean", icon: "f04b", title: "Script exists",
    tip: "True if a script with this name is installed on the server.",
    parts: ["script", inputOf("TEXT", "String"), "exists"],
    defaults: { TEXT: txt("myScript") },
    code: block => [`{ScriptExists ${valueOf(block, "TEXT")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_item_matches", cat: "logic", kind: "value", output: "Boolean", icon: "f466", title: "Item is a kind",
    tip: "True if the item is a coin, any firearm, any keycard, or any custom keycard.",
    note: "The item comes from an event. Use evNewItem for equipped items and evUsableItem for used items.",
    parts: ["item", tf("REF", "evNewItem"), "is", dd("KIND", [["a coin", "coin"], ["a firearm", "firearm"], ["a keycard (including custom)", "keycard"], ["a custom keycard", "customKeycard"]])],
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
    note: "Curly braces { } are shown as ( ) so text is never read as a variable.",
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
    tip: "Basic arithmetic on two numbers.",
    note: "Remainder gives the leftover after dividing.",
    parts: [inputOf("A", "Number"), dd("OP", [["add", "+"], ["subtract", "-"], ["multiply", "*"], ["divide", "/"], ["remainder", "%"]]), inputOf("B", "Number")],
    defaults: { A: num(1), B: num(1) },
    code: block => [`{${valueOf(block, "A")} ${block.getFieldValue("OP")} ${valueOf(block, "B")}}`, gen.ORDER_ATOMIC]  });

  def({
    id: "ser_round_places", cat: "logic", kind: "value", output: "Number", icon: "f0c8", title: "Round number",
    tip: "Rounds a number to the chosen number of decimal places.",
    note: "Use 0 to round to a whole number.",
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
    tip: "Adds one repeated character to one side of the text until it reaches the chosen length.",
    note: "Useful for aligning numbers.",
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
    id: "ser_func_define", cat: "logic", kind: "hat", icon: "f0c9", title: "Define function",
    tip: "Creates a reusable function with up to two inputs. Its blocks run only when another block runs it by name.",
    note: "Use an input inside the function as $name, using the names you type here. Place it at the top of a script.",
    parts: ["define function", tf("NAME", "myFunction"), "inputs", tf("ARG1", "first"), tf("ARG2", "second"), { body: "DO" }],
    code: (block, g) => {
      const name = cleanName(block.getFieldValue("NAME"), "myFunction");
      const body = g.statementToCode(block, "DO");
      const args = [block.getFieldValue("ARG1"), block.getFieldValue("ARG2")].map(arg => cleanName(arg, "")).filter(Boolean).map(arg => `$${arg}`);
      return `func $${name}${args.length ? ` with ${args.join(" ")}` : ""}\n${body}end\n`;
    }
  });

  def({
    id: "ser_func_callback", cat: "logic", kind: "hat", icon: "f0c9", title: "Define custom role callback",
    tip: "Creates a function that runs when a player gets or loses a custom role. Inside, @player and *role are the player and their role.",
    note: "Connect it to a custom role with 'Set custom role callbacks'.",
    parts: ["define callback function", tf("NAME", "onRoleEvent"), { body: "DO" }],
    code: (block, g) => {
      const name = cleanName(block.getFieldValue("NAME"), "onRoleEvent");
      return `func ${name} with @player *role\n${g.statementToCode(block, "DO")}end\n`;
    }
  });

  def({
    id: "ser_func_return", cat: "logic", kind: "statement", icon: "f3c5", title: "Return value",
    tip: "Sends a value back from the function it is inside.",
    note: "Use it only inside 'Define function'.",
    parts: ["return", inputOf("VALUE", null)],
    code: block => `return ${valueOf(block, "VALUE")}\n`
  });

  [0, 1, 2].forEach(count => {
    const inputNames = ["A1", "A2"].slice(0, count);
    def({
      id: `ser_func_run_${count}`, cat: "logic", kind: "statement", icon: "f04b",
      title: `Run function (${count === 0 ? "no values" : count === 1 ? "1 value" : "2 values"})`,
      tip: "Runs a function made with 'Define function', then optionally stores what it returns in a variable.",
      note: "Leave 'store result in' empty if you don't need the return value.",
      parts: ["run function", tf("NAME", "myFunction"), ...inputNames.flatMap(name => ["value", inputOf(name, null)]), "store result in variable", tf("RESULT", "")],
      defaults: Object.fromEntries(inputNames.map(name => [name, num(0)])),
      code: block => {
        const name = cleanName(block.getFieldValue("NAME"), "myFunction");
        const args = inputNames.map(input => valueOf(block, input));
        const call = `run $${name}${args.length ? ` ${args.join(" ")}` : ""}`;
        const result = cleanName(block.getFieldValue("RESULT"), "");
        return result ? `$${result} = ${call}\n` : `${call}\n`;
      }
    });
  });

  def({
    id: "ser_list_new", cat: "logic", kind: "statement", icon: "f03a", title: "New list",
    tip: "Creates an empty list under a name. Lists keep an order and can hold any values.",
    parts: ["new list named", tf("NAME", "myList")],
    code: block => `&${cleanName(block.getFieldValue("NAME"), "myList")} = Coll.Create\n`
  });

  def({
    id: "ser_list_add", cat: "logic", kind: "statement", icon: "f03a", title: "Add to list",
    tip: "Adds a value to the end of a list.",
    parts: ["add", inputOf("VALUE", null), "to list", tf("NAME", "myList")],
    defaults: { VALUE: txt("item") },
    code: block => `Coll.Insert &${cleanName(block.getFieldValue("NAME"), "myList")} ${valueOf(block, "VALUE")}\n`
  });

  def({
    id: "ser_list_remove", cat: "logic", kind: "statement", icon: "f03a", title: "Remove from list",
    tip: "Removes matching values from a list.",
    note: "'Up to' is how many matches to remove. Use -1 to remove all of them.",
    parts: ["remove", inputOf("VALUE", null), "from list", tf("NAME", "myList"), "up to", inputOf("AMOUNT", "Number"), "matches"],
    defaults: { VALUE: txt("item"), AMOUNT: num(1) },
    code: block => `Coll.Remove &${cleanName(block.getFieldValue("NAME"), "myList")} ${valueOf(block, "VALUE")} ${valueOf(block, "AMOUNT")}\n`
  });

  def({
    id: "ser_list_item", cat: "logic", kind: "value", output: null, icon: "f03a", title: "List item",
    tip: "The item at a position in the list, counting from 1.",
    note: "An error occurs if the position is past the end.",
    parts: ["item", inputOf("INDEX", "Number"), "of list", tf("NAME", "myList")],
    defaults: { INDEX: num(1) },
    code: block => [`{Coll.Fetch &${cleanName(block.getFieldValue("NAME"), "myList")} ${valueOf(block, "INDEX")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_list_has", cat: "logic", kind: "value", output: "Boolean", icon: "f03a", title: "List contains",
    tip: "True if the list contains the value.",
    parts: ["list", tf("NAME", "myList"), "contains", inputOf("VALUE", null)],
    defaults: { VALUE: txt("item") },
    code: block => [`{Coll.Contains &${cleanName(block.getFieldValue("NAME"), "myList")} ${valueOf(block, "VALUE")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_list_combine", cat: "logic", kind: "statement", icon: "f03a", title: "Combine lists",
    tip: "Creates a new list from two lists: joined together, or the first list with the second list's values removed.",
    parts: ["make list", tf("TO", "combined"), "by", dd("MODE", [["joining", "Join"], ["removing items of B from A", "Subtract"]]), "A", tf("A", "listA"), "and B", tf("B", "listB")],
    code: block => {
      const to = cleanName(block.getFieldValue("TO"), "combined");
      const a = cleanName(block.getFieldValue("A"), "listA");
      const b = cleanName(block.getFieldValue("B"), "listB");
      return `&${to} = Coll.${block.getFieldValue("MODE")} &${a} &${b}\n`;
    }
  });

  def({
    id: "ser_dict_new", cat: "logic", kind: "statement", icon: "f02e", title: "New dictionary",
    tip: "Creates an empty dictionary: a set of key and value pairs under a name.",
    parts: ["new dictionary named", tf("NAME", "myDict")],
    code: block => `*${cleanName(block.getFieldValue("NAME"), "myDict")} = Dict.Create\n`
  });

  def({
    id: "ser_dict_set", cat: "logic", kind: "statement", icon: "f02e", title: "Set dictionary value",
    tip: "Stores a value under a key in a dictionary. If the key already exists, its value is replaced.",
    note: "Read values back with 'Dictionary value'. Check with 'Dictionary has key' first if the key may be missing.",
    parts: ["in dictionary", tf("NAME", "myDict"), "set key", inputOf("KEY", null), "to", inputOf("VALUE", null)],
    defaults: { KEY: txt("key"), VALUE: num(0) },
    code: block => `Dict.Add *${cleanName(block.getFieldValue("NAME"), "myDict")} ${valueOf(block, "KEY")} ${valueOf(block, "VALUE")}\n`
  });

  def({
    id: "ser_dict_remove", cat: "logic", kind: "statement", icon: "f02e", title: "Remove dictionary key",
    tip: "Removes a key and its value from a dictionary.",
    parts: ["in dictionary", tf("NAME", "myDict"), "remove key", inputOf("KEY", null)],
    defaults: { KEY: txt("key") },
    code: block => `Dict.Remove *${cleanName(block.getFieldValue("NAME"), "myDict")} ${valueOf(block, "KEY")}\n`
  });

  def({
    id: "ser_dict_get", cat: "logic", kind: "value", output: null, icon: "f02e", title: "Dictionary value",
    tip: "The value stored under a key.",
    note: "An error occurs if the key is missing, so check with 'Dictionary has key' first.",
    parts: ["value of key", inputOf("KEY", null), "in dictionary", tf("NAME", "myDict")],
    defaults: { KEY: txt("key") },
    code: block => [`{Dict.Get *${cleanName(block.getFieldValue("NAME"), "myDict")} ${valueOf(block, "KEY")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_dict_has", cat: "logic", kind: "value", output: "Boolean", icon: "f02e", title: "Dictionary has key",
    tip: "True if the dictionary has a value stored under this key.",
    parts: ["dictionary", tf("NAME", "myDict"), "has key", inputOf("KEY", null)],
    defaults: { KEY: txt("key") },
    code: block => [`{Dict.Contains *${cleanName(block.getFieldValue("NAME"), "myDict")} ${valueOf(block, "KEY")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_vote_option", cat: "logic", kind: "statement", icon: "f164", title: "Make vote option",
    tip: "Creates one option for a vote, with the text players see.",
    note: "Use the name in 'Start vote'.",
    parts: ["make vote option", tf("NAME", "yes"), "showing", inputOf("TEXT", "String")],
    defaults: { TEXT: txt("Yes") },
    code: block => {
      const name = cleanName(block.getFieldValue("NAME"), "yes");
      return `*${name} = Vote.CreateOption ${name} ${valueOf(block, "TEXT")}\n`;
    }
  });

  def({
    id: "ser_vote_go", cat: "logic", kind: "statement", icon: "f164", title: "Start vote and go on",
    tip: "Starts a vote between two options made with 'Make vote option'. The script keeps running while players vote.",
    parts: ["start vote", inputOf("QUESTION", "String"), "with options", tf("OPT1", "yes"), tf("OPT2", "no")],
    defaults: { QUESTION: txt("Do you agree?") },
    code: block => {
      const options = ["OPT1", "OPT2"].map(field => `*${cleanName(block.getFieldValue(field), "yes")}`).join(" ");
      return `Vote.Start ${valueOf(block, "QUESTION")} ${options}\n`;
    }
  });

  def({
    id: "ser_vote_wait", cat: "logic", kind: "statement", icon: "f164", title: "Start vote and wait",
    tip: "Starts a vote between two options made with 'Make vote option'. Pauses this script until the vote ends, then stores the winning option.",
    parts: ["start vote", inputOf("QUESTION", "String"), "with options", tf("OPT1", "yes"), tf("OPT2", "no"), "store winner in", tf("RESULT", "voteResult")],
    defaults: { QUESTION: txt("Do you agree?") },
    code: block => {
      const options = ["OPT1", "OPT2"].map(field => `*${cleanName(block.getFieldValue(field), "yes")}`).join(" ");
      return `$${cleanName(block.getFieldValue("RESULT"), "voteResult")} = {Vote.StartAndWait ${valueOf(block, "QUESTION")} ${options}}\n`;
    }
  });

  def({
    id: "ser_var_by_name", cat: "variables", kind: "value", output: null, icon: "f02b", title: "Variable by name",
    tip: "Reads a variable using a name written as text, so the name can come from another value.",
    parts: ["variable named", inputOf("NAME", "String")],
    defaults: { NAME: txt("myVariable") },
    code: block => [`{GetVariableByName ${valueOf(block, "NAME")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_set_var", cat: "variables", kind: "statement", icon: "f044", title: "Set variable",
    tip: "Stores a value under a name.",
    note: "'This script only' is kept only while this script runs. 'Global' is shared with every other script until the server restarts. Read it back with 'Variable value'.",
    parts: ["set variable", tf("NAME", "myVariable"), "to", inputOf("VALUE", null), "in", dd("SCOPE", variableScopeOptions)],
    defaults: { VALUE: num(0) },
    code: block => {
      const name = cleanName(block.getFieldValue("NAME"), "myVariable");
      const prefix = block.getFieldValue("SCOPE") === "global" ? "global " : "";
      return `${prefix}$${name} = ${valueOf(block, "VALUE")}\n`;
    }
  });

  def({
    id: "ser_change_var", cat: "variables", kind: "statement", icon: "f044", title: "Change variable",
    tip: "Adds an amount to a number already stored in a variable.",
    note: "The variable must already hold a number. Use 'Set variable' first to create it.",
    parts: ["change variable", tf("NAME", "myVariable"), "by", inputOf("VALUE", "Number"), "in", dd("SCOPE", variableScopeOptions)],
    defaults: { VALUE: num(1) },
    code: block => {
      const name = cleanName(block.getFieldValue("NAME"), "myVariable");
      const prefix = block.getFieldValue("SCOPE") === "global" ? "global " : "";
      return `${prefix}$${name} = {$${name} + ${valueOf(block, "VALUE")}}\n`;    }
  });

  def({
    id: "ser_get_var", cat: "variables", kind: "value", output: null, icon: "f02b", title: "Variable value",
    tip: "Reads the value stored in a variable with this name, whether it is local or global.",
    parts: ["variable", tf("NAME", "myVariable")],
    code: block => [`$${cleanName(block.getFieldValue("NAME"), "myVariable")}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_delete_var", cat: "variables", kind: "statement", icon: "f1f8", title: "Delete variable",
    tip: "Removes a variable entirely, whether it is local or global.",
    parts: ["delete variable", tf("NAME", "myVariable")],
    code: block => `delete $${cleanName(block.getFieldValue("NAME"), "myVariable")}\n`
  });

  def({
    id: "ser_stopwatch_start", cat: "variables", kind: "statement", icon: "f2f2", title: "Start stopwatch",
    tip: "Remembers the current time under a name.",
    note: "Use 'Seconds since stopwatch' later to measure how long something took.",
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
    tip: "Saves a value for one player, or adds an amount to a number saved for them.",
    note: "'When it resets' sets how long it lasts: until cleared, this life only, or this round only (this round needs 'Remember round start'). Saved on the server while it runs; use 'Save to server' to survive a restart.",
    parts: [dd("MODE", [["save", "set"], ["add", "add"]]), inputOf("VALUE", null), "for", playerInput, "as", inputOf("KEY", "String"), "when it resets:", dd("SCOPE", keepScopeOptions)],
    defaults: { ...evTarget, KEY: txt("points"), VALUE: num(1) },
    single: singleTarget,
    code: block => {
      const target = valueOf(block, "TARGET");
      const key = keyCode(block, "KEY", "TARGET");
      if (block.getFieldValue("MODE") === "add") {
        return `SetPlayerData ${target} ${key} {{GetPlayerData ${target} ${key} 0} + ${inside(valueOf(block, "VALUE"))}}\n`;
      }
      return `SetPlayerData ${target} ${key} {{GetPlayerData ${target} ${key} 0} + ${valueOf(block, "VALUE")}}\n`;
    }
  });

  def({
    id: "ser_read_data", cat: "variables", kind: "value", output: null, icon: "f1c0", title: "Read player data",
    tip: "Reads a value saved with 'Save player data', using the same reset choice.",
    note: "If nothing was saved, the default is used.",
    parts: ["saved", inputOf("KEY", "String"), "of", playerInput, "when it resets:", dd("SCOPE", keepScopeOptions), "or default", inputOf("DEFAULT", null)],
    defaults: { ...evTarget, KEY: txt("points"), DEFAULT: num(0) },
    single: singleTarget,
    code: block => [`{GetPlayerData ${valueOf(block, "TARGET")} ${keyCode(block, "KEY", "TARGET")} ${valueOf(block, "DEFAULT")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_clear_all_data", cat: "variables", kind: "statement", icon: "f1f8", title: "Clear all player data",
    tip: "Erases every value saved for the chosen player.",
    parts: ["clear all saved data of", playerInput],
    defaults: evTarget,
    code: block => `ClearPlayerData ${valueOf(block, "TARGET")}\n`
  });

  def({
    id: "ser_clear_key_data", cat: "variables", kind: "statement", icon: "f1f8", title: "Clear one saved key",
    tip: "Erases one saved value for the chosen player.",
    parts: ["clear saved key", inputOf("KEY", "String"), "of", playerInput],
    defaults: { ...evTarget, KEY: txt("points") },
    code: block => `ClearPlayerData ${valueOf(block, "TARGET")} ${valueOf(block, "KEY")}\n`
  });

  def({
    id: "ser_db_save", cat: "variables", kind: "statement", icon: "f1c0", title: "Save to server",
    tip: "Saves a value to the server's database on disk. It survives server restarts and is shared by every script.",
    note: "Read it back with the same database name and key. Only plain numbers, text, and player values can be saved.",
    parts: ["save to server", tf("DATABASE", "saves"), "key", inputOf("KEY", "String"), "value", inputOf("VALUE", null)],
    defaults: { VALUE: num(0), KEY: txt("roundCount") },
    code: block => `DB.Add ${cleanName(block.getFieldValue("DATABASE"), "saves")} ${valueOf(block, "KEY")} ${valueOf(block, "VALUE")}\n`
  });

  def({
    id: "ser_db_read", cat: "variables", kind: "value", output: null, icon: "f1c0", title: "Read from server",
    tip: "Reads a value saved with 'Save to server'.",
    note: "An error occurs if the key was never saved, so check it with 'Server has key' first.",
    parts: ["read from server", tf("DATABASE", "saves"), "key", inputOf("KEY", "String")],
    defaults: { KEY: txt("roundCount") },
    code: block => [`{DB.Get ${cleanName(block.getFieldValue("DATABASE"), "saves")} ${valueOf(block, "KEY")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_db_has", cat: "variables", kind: "value", output: "Boolean", icon: "f002", title: "Server has key",
    tip: "True if a value is saved on the server under this key.",
    parts: ["server", tf("DATABASE", "saves"), "has key", inputOf("KEY", "String")],
    defaults: { KEY: txt("roundCount") },
    code: block => [`{DB.Contains ${cleanName(block.getFieldValue("DATABASE"), "saves")} ${valueOf(block, "KEY")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_db_remove", cat: "variables", kind: "statement", icon: "f1f8", title: "Remove from server",
    tip: "Deletes a key and its value from the server's database.",
    parts: ["remove from server", tf("DATABASE", "saves"), "key", inputOf("KEY", "String")],
    defaults: { KEY: txt("roundCount") },
    code: block => `DB.Remove ${cleanName(block.getFieldValue("DATABASE"), "saves")} ${valueOf(block, "KEY")}\n`
  });

  def({
    id: "ser_config_load", cat: "server", kind: "statement", icon: "f085", title: "Load config",
    tip: "Loads a plugin's config file under a name, so its options can be read with 'Config option'.",
    parts: ["load config named", inputOf("CONFIG", "String"), "as", tf("NAME", "config")],
    defaults: { CONFIG: txt("myConfig") },
    code: block => `*${cleanName(block.getFieldValue("NAME"), "config")} = Config.Read ${valueOf(block, "CONFIG")}\n`
  });

  def({
    id: "ser_config_read", cat: "server", kind: "value", output: null, icon: "f085", title: "Config option",
    tip: "Reads one option from a config loaded with 'Load config'.",
    note: "The default is used if the option is missing.",
    parts: ["option", inputOf("KEY", "String"), "of config", tf("NAME", "config"), "or default", inputOf("DEFAULT", null)],
    defaults: { KEY: txt("setting"), DEFAULT: num(0) },
    code: block => [`{Config.GetOption *${cleanName(block.getFieldValue("NAME"), "config")} ${valueOf(block, "KEY")} ${valueOf(block, "DEFAULT")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_command", cat: "server", kind: "statement", icon: "f120", title: "Run command",
    tip: "Runs a server or Remote Admin command.",
    note: "Remote Admin commands start with '/', console commands with '.'.",
    parts: ["run command", inputOf("TEXT", "String")],
    defaults: { TEXT: txt("/cassie Hello") },
    code: block => `Command ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_print", cat: "server", kind: "statement", icon: "f02f", title: "Print to console",
    tip: "Writes text to the server console.",
    note: "Useful for checking that a script runs or what a variable holds.",
    parts: ["print to console", inputOf("TEXT", "String")],
    defaults: { TEXT: txt("Script ran") },
    code: block => `Print ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_run_script_keep", cat: "server", kind: "statement", icon: "f56d", title: "Run another script",
    tip: "Runs another script by name alongside this one. This script keeps going.",
    parts: ["run script named", inputOf("TEXT", "String"), "and keep going"],
    defaults: { TEXT: txt("myScript") },
    code: block => `RunScript ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_run_script_wait", cat: "server", kind: "statement", icon: "f56d", title: "Run another script and wait",
    tip: "Runs another script by name and pauses this one until it finishes.",
    parts: ["run script named", inputOf("TEXT", "String"), "and wait until it finishes"],
    defaults: { TEXT: txt("myScript") },
    code: block => `RunScriptAndWait ${valueOf(block, "TEXT")}\n`
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
    tip: "Turns a game event on or off.",
    note: "Works only on events that can be cancelled.",
    parts: [dd("ACTION", [["disable", "DisableEvent"], ["enable", "EnableEvent"]]), "the event named", inputOf("NAME", "String")],
    defaults: { NAME: txt("RoundStarted") },
    code: block => `${block.getFieldValue("ACTION")} ${valueOf(block, "NAME")}\n`
  });

  def({
    id: "ser_is_allowed", cat: "server", kind: "statement", icon: "f00c", title: "Allow or cancel event (experimental)",
    tip: "Lets the event that started this script go ahead, or cancels it.",
    note: "Only works in events that can be cancelled, and before any Wait block.",
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
    tip: "Every time a round starts, clears one saved key for everyone.",
    note: "Pair it with 'Save player data' set to 'until cleared'. Values saved with 'this life only' are not affected.",
    parts: ["each round start, clear saved key", inputOf("KEY", "String"), "for everyone"],
    defaults: { KEY: txt("points") },
    code: block => `!-- OnEvent RoundStarted\nClearPlayerData @all ${valueOf(block, "KEY")}\n`
  });

  def({
    id: "ser_lib_random_loot", cat: "libraries", kind: "statement", icon: "f522", title: "Library: Random loot",
    tip: "Gives the player one of three items, picked at random. Each item has the same chance.",
    parts: ["give", playerInput, "one random item from", dd("ITEM1", itemOptions), dd("ITEM2", itemOptions), dd("ITEM3", itemOptions)],
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
    tip: "Gives a player a custom keycard and tells them its name.",
    note: "Check for the keycard later with the item blocks, using its type. The name is shown to the player; the type is what scripts check.",
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
    code: block => `repeat ${Math.max(1, Math.round(Number(block.getFieldValue("TIMES"))))}\n${indent}DisableLights ${block.getFieldValue("PLACE")} 500ms\n${indent}wait 1s\nend\n`
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
    tip: "Posts a titled message with a colored sidebar to a Discord channel through its webhook link.",
    note: "Create the webhook link in your Discord channel's settings. Anyone with the link can post to the channel, so keep it private.",
    parts: ["send to Discord webhook", inputOf("URL", "String"), "title", inputOf("TITLE", "String"), "text", inputOf("BODY", "String"), "color #", tf("COLOR", "FFCC55")],
    defaults: { URL: txt("https://discord.com/api/webhooks/..."), TITLE: txt("Server update"), BODY: txt("Something happened.") },
    code: block => (
      `*libEmbed = Embed.Create ${valueOf(block, "TITLE")} ${valueOf(block, "BODY")} ${hexOf(block.getFieldValue("COLOR"), "FFCC55")}\n` +
      `*libMessage = Discord.CreateMessage "" "" "" *libEmbed\n` +
      `Discord.SendMessage ${valueOf(block, "URL")} *libMessage\n`
    )
  });

  def({
    id: "ser_lib_round_start", cat: "libraries", kind: "hat", icon: "f017", title: "Library: Remember round start",
    tip: "Every time a round starts, stores a new round stamp. Player data saved with 'this round only' uses that stamp, so it resets with each round.",
    note: "Put this in any script that uses 'this round only' data. Only one copy is needed per server.",
    parts: ["when a round starts, remember it"],
    code: () => "!-- OnEvent RoundStarted\nglobal $roundStamp = {TimeInfo unixTimeUtc}\n"
  });

  def({
    id: "ser_lib_colored_shape", cat: "libraries", kind: "statement", icon: "f1b2", title: "Library: Colored shape",
    tip: "Creates a shape of the chosen type and color at a position.",
    note: "Sets whether the shape has collision and whether it is visible.",
    parts: ["make a", dd("SHAPE", asOptions(primitiveShapes)), "named", tf("NAME", "shape"), "color #", tf("COLOR", "FF8800"), dd("FLAGS", asOptions(primitiveFlags)), "at x", inputOf("X", "Number"), "y", inputOf("Y", "Number"), "z", inputOf("Z", "Number")],
    defaults: { X: num(0), Y: num(0), Z: num(0) },
    code: block => {
      const name = cleanName(block.getFieldValue("NAME"), "shape");
      return `*${name} = Toy.Create primitiveObject\nToy.Move *${name} ${valueOf(block, "X")} ${valueOf(block, "Y")} ${valueOf(block, "Z")}\nSetPrimitiveObjectProperties *${name} ${block.getFieldValue("SHAPE")} ${hexOf(block.getFieldValue("COLOR"), "FF8800")} ${block.getFieldValue("FLAGS")}\n`;
    }
  });

  def({
    id: "ser_lib_text_sign", cat: "libraries", kind: "statement", icon: "f031", title: "Library: Text sign",
    tip: "Creates a sign with text on it at a position.",
    parts: ["make a text sign named", tf("NAME", "sign"), "saying", inputOf("TEXT", "String"), "at x", inputOf("X", "Number"), "y", inputOf("Y", "Number"), "z", inputOf("Z", "Number")],
    defaults: { TEXT: txt("Keep out"), X: num(0), Y: num(0), Z: num(0) },
    code: block => {
      const name = cleanName(block.getFieldValue("NAME"), "sign");
      return `*${name} = Toy.Create text\nToy.Move *${name} ${valueOf(block, "X")} ${valueOf(block, "Y")} ${valueOf(block, "Z")}\nSetTextProperties *${name} ${valueOf(block, "TEXT")}\n`;
    }
  });

  def({
    id: "ser_lib_crole_register", cat: "libraries", kind: "statement", icon: "f0c0", title: "Library: Register custom role",
    tip: "Registers a new custom role based on an existing role, so it can be given to players.",
    note: "The spawn system and 'remove on death' are optional. 'Remove on death' only applies when a spawn system is named. Create the spawn system first with one of the spawn system blocks.",
    parts: ["register custom role", tf("ID", "siteGuard"), "named", tf("NAME", "Site Guard"), "based on", dd("BASE", asOptions(crBaseRoles)), "spawn system (optional)", tf("SYSTEM", ""), "remove on death", dd("REMOVE", boolOptions)],
    code: block => {
      const id = cleanName(block.getFieldValue("ID"), "siteGuard");
      const system = cleanName(block.getFieldValue("SYSTEM"), "");
      return `CRole.Register ${id} ${quote(block.getFieldValue("NAME"))} ${block.getFieldValue("BASE")}${system ? ` *${system} ${block.getFieldValue("REMOVE")}` : ""}\n`;
    }
  });

  def({
    id: "ser_lib_crole_unregister", cat: "libraries", kind: "statement", icon: "f0c0", title: "Library: Unregister custom role",
    tip: "Removes a custom role that was registered with 'Register custom role'.",
    parts: ["unregister custom role", tf("ID", "siteGuard")],
    code: block => `CRole.Unregister ${cleanName(block.getFieldValue("ID"), "siteGuard")}\n`
  });

  def({
    id: "ser_lib_crole_chance", cat: "libraries", kind: "statement", icon: "f522", title: "Library: Chance spawn system",
    tip: "Makes a spawn system that replaces a base role with the custom role at a chance.",
    note: "Pass the system's name to 'Register custom role'.",
    parts: ["make chance spawn system", tf("SYSTEM", "chanceSystem"), "replacing", dd("BASE", asOptions(crBaseRoles)), "with the custom role at", nf("CHANCE", 50, 0, 100, 1), "%"],
    code: block => `*${cleanName(block.getFieldValue("SYSTEM"), "chanceSystem")} = CRole.CreateChanceSpawnSystem ${block.getFieldValue("BASE")} ${Number(block.getFieldValue("CHANCE"))}%\n`
  });

  def({
    id: "ser_lib_crole_procedural", cat: "libraries", kind: "statement", icon: "f522", title: "Library: Procedural spawn system",
    tip: "Makes a spawn system that gives each player a chance to become the custom role, with a conversion limit and a minimum number of players.",
    note: "Limit and minimum are passed to SER as typed.",
    parts: ["make procedural spawn system", tf("SYSTEM", "procSystem"), "replacing", dd("BASE", asOptions(crBaseRoles)), "per-player chance", nf("CHANCE", 25, 0, 100, 1), "%", "conversion limit", inputOf("LIMIT", "Number"), "minimum players", inputOf("MIN", "Number")],
    defaults: { LIMIT: num(0), MIN: num(0) },
    code: block => `*${cleanName(block.getFieldValue("SYSTEM"), "procSystem")} = CRole.CreateProceduralSpawnSystem ${block.getFieldValue("BASE")} ${Number(block.getFieldValue("CHANCE"))}% ${valueOf(block, "LIMIT")} ${valueOf(block, "MIN")}\n`
  });

  def({
    id: "ser_lib_crole_bracket", cat: "libraries", kind: "statement", icon: "f522", title: "Library: Bracket spawn system",
    tip: "Makes a spawn system that converts a set amount of a base role when the player count is between two numbers.",
    note: "This block makes a system with one bracket. Use one block per range, and give each system its own name.",
    parts: ["make bracket spawn system", tf("SYSTEM", "bracketSystem"), "replacing", dd("BASE", asOptions(crBaseRoles)), "when players are from", inputOf("LOW", "Number"), "to", inputOf("HIGH", "Number"), "convert", inputOf("AMOUNT", "Number")],
    defaults: { LOW: num(1), HIGH: num(10), AMOUNT: num(1) },
    code: block => {
      const system = cleanName(block.getFieldValue("SYSTEM"), "bracketSystem");
      return `*${system}Bracket = CRole.CreateSpawnBracket ${valueOf(block, "LOW")} ${valueOf(block, "HIGH")} ${valueOf(block, "AMOUNT")}\n*${system} = CRole.CreateBracketSpawnSystem ${block.getFieldValue("BASE")} *${system}Bracket\n`;
    }
  });

  def({
    id: "ser_lib_crole_give", cat: "libraries", kind: "statement", icon: "f007", title: "Library: Give custom role",
    tip: "Gives a registered custom role to the chosen players.",
    parts: ["give custom role", tf("ID", "siteGuard"), "to", playerInput],
    defaults: evTarget,
    code: block => `CRole.Set ${valueOf(block, "TARGET")} ${cleanName(block.getFieldValue("ID"), "siteGuard")}\n`
  });

  def({
    id: "ser_lib_crole_callbacks", cat: "libraries", kind: "statement", icon: "f0c0", title: "Library: Set custom role callbacks",
    tip: "Chooses which functions run when a player gets or loses this custom role.",
    note: "Both function names are needed, because SER reads them by position. Use the same name twice if one of them does nothing. The functions are made with 'Define function' or 'Define custom role callback'.",
    parts: ["set callbacks of custom role", tf("ID", "siteGuard"), "spawning runs", tf("SPAWN", "onSpawn"), "removal runs", tf("REMOVE", "onRemove")],
    code: block => `CRole.SetCallbacks ${cleanName(block.getFieldValue("ID"), "siteGuard")} ${cleanName(block.getFieldValue("SPAWN"), "onSpawn")} ${cleanName(block.getFieldValue("REMOVE"), "onRemove")}\n`
  });

  def({
    id: "ser_lib_crole_registered", cat: "libraries", kind: "value", output: "Boolean", icon: "f002", title: "Custom role is registered",
    tip: "True if a custom role with this id is registered on the server.",
    parts: ["custom role", tf("ID", "siteGuard"), "is registered"],
    code: block => [`{CRole.IsRegistered ${cleanName(block.getFieldValue("ID"), "siteGuard")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_lib_crole_event", cat: "libraries", kind: "hat", icon: "f0c0", title: "Library: When a custom role spawns or is removed",
    tip: "Runs the blocks inside when a player gets or loses a custom role.",
    note: "Leave the role blank to run it for every custom role. Inside, @player and *evCRole are the player and their role.",
    parts: ["when a custom role", dd("EVENT", [["spawns", "spawned"], ["is removed", "removed"]]), "for role", tf("ID", ""), "do", { body: "DO" }],
    code: (block, g) => {
      const id = cleanName(block.getFieldValue("ID"), "");
      return `!-- OnCRole ${block.getFieldValue("EVENT")}\n${id ? `-- forRoles ${id}\n` : ""}\n${unindent(g.statementToCode(block, "DO"))}`;
    }
  });

  def({
    id: "ser_lib_ucr_give", cat: "libraries", kind: "statement", icon: "f007", title: "Library: Give UCR role",
    tip: "Gives a player a role from the UncomplicatedCustomRoles plugin, by its number.",
    note: "This needs that plugin installed.",
    parts: ["give UCR role", inputOf("ROLE", "Number"), "to", playerInput],
    defaults: { ...evTarget, ROLE: num(1) },
    single: singleTarget,
    code: block => `UCR.SetRole ${valueOf(block, "TARGET")} ${valueOf(block, "ROLE")}\n`
  });

  def({
    id: "ser_lib_ucr_remove", cat: "libraries", kind: "statement", icon: "f007", title: "Library: Remove UCR role",
    tip: "Removes the UncomplicatedCustomRoles role from the chosen player.",
    note: "This needs that plugin installed.",
    parts: ["remove UCR role from", playerInput],
    defaults: evTarget,
    single: singleTarget,
    code: block => `UCR.RemoveRole ${valueOf(block, "TARGET")}\n`
  });

  def({
    id: "ser_lib_ucr_players", cat: "libraries", kind: "value", output: "Player", icon: "f0c0", title: "Players with UCR role",
    tip: "The players who have a UCR role, by its number.",
    note: "Needs the UncomplicatedCustomRoles plugin.",
    parts: ["players with UCR role", inputOf("ROLE", "Number")],
    defaults: { ROLE: num(1) },
    code: block => [`{UCR.GetPlayersWithRole ${valueOf(block, "ROLE")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_lib_ucr_event", cat: "libraries", kind: "hat", icon: "f0c0", title: "Library: When a UCR event fires",
    tip: "Runs the blocks inside when an UncomplicatedCustomRoles event happens.",
    note: "Needs that plugin installed.",
    parts: ["when UCR", dd("EVENT", asOptions(ucrEvents)), "happens, do", { body: "DO" }],
    code: (block, g) => `!-- OnUCR ${block.getFieldValue("EVENT")}\n\n${unindent(g.statementToCode(block, "DO"))}`
  });

  const specById = Object.fromEntries(specs.map(spec => [spec.id, spec]));

  function renderIf(block) {
    const kept = {};
    for (const input of block.inputList) {
      const child = input.connection && input.connection.targetBlock();
      if (input.name && child) kept[input.name] = child;
    }
    for (const child of Object.values(kept)) child.unplug(false);
    for (const input of [...block.inputList]) if (input.name) block.removeInput(input.name, true);

    const mode = block.serMode || "any";
    const count = block.serCount || 1;
    const head = block.appendDummyInput("HEAD").appendField("if");
    head.appendField(new Blockly.FieldDropdown([["any of these", "any"], ["all of these", "all"]], value => {
      if (value !== block.serMode) {
        block.serMode = value;
        Promise.resolve().then(() => renderIf(block));
      }
      return value;
    }), "MODE");
    block.getField("MODE").setValue(mode);
    head.appendField(new Blockly.FieldImage(plusIcon, 16, 16, "add a condition", () => block.serAddCondition()), "ADD_CONDITION");
    head.appendField(new Blockly.FieldImage(minusIcon, 16, 16, "remove a condition", () => block.serRemoveCondition()), "REMOVE_CONDITION");
    for (let index = 0; index < count; index++) {
      if (index > 0) block.appendDummyInput(`JOIN${index}`).appendField(mode === "all" ? "and" : "or");
      block.appendValueInput(`COND${index}`).setCheck("Boolean");
    }
    block.appendDummyInput("THEN").appendField("then");
    block.appendStatementInput("DO").setCheck(actionCheck);
    block.appendDummyInput("ELSE_ROW").appendField("otherwise").appendField(
      new Blockly.FieldImage(block.serElse ? minusIcon : plusIcon, 16, 16, block.serElse ? "remove the else part" : "add an else part", () => block.serToggleElse()),
      "ELSE_TOGGLE"
    );
    if (block.serElse) block.appendStatementInput("ELSE").setCheck(actionCheck);

    for (const [name, child] of Object.entries(kept)) {
      const input = block.getInput(name);
      if (input && input.connection) {
        input.connection.connect(child.outputConnection || child.previousConnection);
      } else {
        child.dispose(false);
      }
    }
  }

  const ifMethods = {
    serAddCondition() { this.serCount = (this.serCount || 1) + 1; renderIf(this); },
    serRemoveCondition() { if ((this.serCount || 1) > 1) { this.serCount -= 1; renderIf(this); } },
    serToggleElse() { this.serElse = !this.serElse; renderIf(this); },
    saveExtraState() { return { mode: this.serMode || "any", count: this.serCount || 1, hasElse: Boolean(this.serElse) }; },
    loadExtraState(state) {
      this.serMode = state.mode || "any";
      this.serCount = state.count || 1;
      this.serElse = Boolean(state.hasElse);
      renderIf(this);
    },
    mutationToDom() {
      const element = Blockly.utils.xml.createElement("mutation");
      element.setAttribute("mode", this.serMode || "any");
      element.setAttribute("count", String(this.serCount || 1));
      element.setAttribute("else", this.serElse ? "1" : "0");
      return element;
    },
    domToMutation(element) {
      this.serMode = element.getAttribute("mode") || "any";
      this.serCount = Number(element.getAttribute("count")) || 1;
      this.serElse = element.getAttribute("else") === "1";
      renderIf(this);
    }
  };
  specById.ser_if.extra = ifMethods;

  function shadowInputs(defaults) {
    return Object.fromEntries(
      Object.entries(defaults || {})
        .filter(([, value]) => Array.isArray(value))
        .map(([name, [type, fields]]) => [name, { shadow: { type, fields } }])
    );
  }

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
    block.setTooltip(spec.note ? `${spec.tip} ${spec.note}` : spec.tip);
    block.serTitle = spec.title;
    block.serIcon = spec.icon || "";
    block.serTip = spec.tip;
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
      const definition = {
        init() {
          buildBlock(this, spec);
          if (spec.id === "ser_if") {
            this.serMode = "any";
            this.serCount = 1;
            this.serElse = false;
            renderIf(this);
          }
        }
      };
      if (spec.extra) Object.assign(definition, spec.extra);
      Blockly.Blocks[spec.id] = definition;
      gen.forBlock[spec.id] = spec.code;
    }
  }

  function buildToolbox(mode = "simple") {
    const showAll = mode === "advanced";
    return {
      kind: "categoryToolbox",
      contents: categories.map(([key, name]) => {
        const contents = specs
          .filter(spec => spec.cat === key && (showAll || !spec.advanced))
          .map(spec => ({
            kind: "block",
            type: spec.id,
            inputs: shadowInputs(spec.defaults)
          }));
        if (!contents.length) return null;
        return {
          kind: "category",
          name,
          colour: String(colours[key]),
          cssConfig: { icon: `ser-cat-icon ser-cat-${key}` },
          contents
        };
      }).filter(Boolean)
    };
  }

  const removedBlocks = new Set(["ser_clamp", "ser_min_max", "ser_abs", "ser_not", "ser_and_or", "ser_pick", "ser_text_length"]);
  const numberShadow = number => ({ shadow: { type: "ser_number", fields: { NUMBER: number } } });
  const textShadow = text => ({ shadow: { type: "ser_text", fields: { TEXT: text } } });
  const playerShadow = target => ({ shadow: { type: "ser_target", fields: { TARGET: target } } });
  const boolShadow = value => ({ shadow: { type: "ser_boolean", fields: { VALUE: value } } });
  const targetInput = block => block.inputs?.TARGET ?? playerShadow("@evPlayer");
  const markRemoved = (block, label) => {
    block.type = "ser_text";
    block.fields = { TEXT: `REPLACE ME: old ${label} block was removed` };
    block.inputs = {};
  };

  const legacyItemFilter = (fields, allowKinds) => {
    const kinds = { coin: "kind:coin", firearm: "kind:firearm", keycard: "kind:keycard", customKeycard: "kind:customKeycard" };
    if (fields.FILTER === "exact" && fields.EXACT) return `item:${fields.EXACT}`;
    const value = kinds[fields.FILTER] ?? "any";
    return !allowKinds && value.startsWith("kind:") ? "any" : value;
  };

  const splitRules = {
    ser_give_effect: block => (block.fields?.MODE === "remove" ? ["ser_remove_effect", {}] : ["ser_give_effect", {}]),
    ser_damage_rule: block => (block.fields?.MODE === "remove" ? ["ser_damage_remove", {}] : ["ser_damage_add", {}]),
    ser_foreach_player: block => (block.fields?.SOURCE === "list" ? ["ser_foreach_list", { LIST: "myList" }] : ["ser_foreach_player", {}]),
    ser_item_remove: block => (block.fields?.ITEM === "all" ? ["ser_clear_inventory", { MODE: block.fields?.MODE === "drop" ? "drop" : "destroy" }] : ["ser_item_remove", {}]),
    ser_clear_data: block => (block.fields?.MODE === "one" ? ["ser_clear_key_data", {}] : ["ser_clear_all_data", {}]),
    ser_list_change: block => (block.fields?.MODE === "remove" ? ["ser_list_remove", {}] : ["ser_list_add", {}]),
    ser_dict_change: block => (block.fields?.MODE === "remove" ? ["ser_dict_remove", {}] : ["ser_dict_set", {}]),
    ser_check_reject: block => (block.fields?.MODE === "range" ? ["ser_reject_range", {}] : ["ser_reject_cond", {}]),
    ser_func_define: block => (block.fields?.KIND === "callback" ? ["ser_func_callback", {}] : ["ser_func_define", {}]),
    ser_func_run: block => [`ser_func_run_${Number(block.fields?.COUNT ?? 0)}`, {}],
    ser_intercom: block => (block.fields?.MODE === "text" ? ["ser_intercom_text", {}] : ["ser_intercom_state", {}]),
    ser_lights_color: block => (block.fields?.MODE === "reset" ? ["ser_lights_reset_color", {}] : ["ser_lights_set_color", {}]),
    ser_speaker_create: block => {
      if (block.fields?.MODE === "position") return ["ser_speaker_position", {}];
      if (block.fields?.MODE === "attached") return ["ser_speaker_attached", {}];
      return ["ser_speaker_global", {}];
    },
    ser_toy_move: block => (block.fields?.MODE === "destroy" ? ["ser_toy_destroy", {}] : ["ser_toy_move", {}]),
    ser_hume: block => (block.fields?.MODE === "add" ? ["ser_hume_add", {}] : ["ser_hume_set", {}]),
    ser_tesla_rule: block => (block.fields?.MODE === "remove" ? ["ser_tesla_remove", {}] : ["ser_tesla_add", {}]),
    ser_lib_ucr_role: block => (block.fields?.MODE === "remove" ? ["ser_lib_ucr_remove", {}] : ["ser_lib_ucr_give", {}]),
    ser_tp_room: block => (block.fields?.PLACE === "exact" ? ["ser_tp_exact", {}] : ["ser_tp_place", {}])
  };

  const renames = {
    ser_repeat: block => {
      const count = Number(block.fields?.COUNT ?? 3);
      Object.assign(block, { type: "ser_count_loop", fields: { VAR: "i" }, inputs: { FROM: numberShadow(1), TO: numberShadow(count), DO: block.inputs?.DO } });
    },
    ser_forever: block => Object.assign(block, { type: "ser_while", fields: {}, inputs: { COND: boolShadow("true"), DO: block.inputs?.DO } }),
    ser_var_from_player: block => Object.assign(block, {
      type: "ser_set_var", fields: { NAME: block.fields?.NAME ?? "myVariable", MODE: "set", SCOPE: "local" },
      inputs: { VALUE: { block: { type: "ser_player_value", fields: { PROP: block.fields?.PROP ?? "health" }, inputs: { TARGET: targetInput(block) } } } }
    }),
    ser_var_from_data: block => Object.assign(block, {
      type: "ser_set_var", fields: { NAME: block.fields?.NAME ?? "savedValue", MODE: "set", SCOPE: "local" },
      inputs: { VALUE: { block: { type: "ser_read_data", fields: { SCOPE: "keep" }, inputs: { KEY: block.inputs?.KEY ?? textShadow("points"), TARGET: targetInput(block), DEFAULT: block.inputs?.DEFAULT ?? numberShadow(0) } } } }
    }),
    ser_var_copy: block => Object.assign(block, {
      type: "ser_set_var", fields: { NAME: block.fields?.TO ?? "myCopy", MODE: "set", SCOPE: "local" },
      inputs: { VALUE: { block: { type: "ser_get_var", fields: { NAME: block.fields?.FROM ?? "myVariable" } } } }
    }),
    ser_var_print: block => Object.assign(block, {
      type: "ser_print", fields: {},
      inputs: { TEXT: { block: { type: "ser_join", fields: {}, inputs: { A: block.inputs?.TEXT ?? textShadow("Value: "), B: { block: { type: "ser_get_var", fields: { NAME: block.fields?.NAME ?? "myVariable" } } } } } } }
    }),
    ser_player_name: block => Object.assign(block, { type: "ser_player_value", fields: { PROP: "name" }, inputs: { TARGET: targetInput(block) } }),
    ser_player_id: block => Object.assign(block, { type: "ser_player_value", fields: { PROP: "playerId" }, inputs: { TARGET: targetInput(block) } }),
    ser_read_player: block => Object.assign(block, { type: "ser_player_value", fields: { PROP: block.fields?.PROP ?? "health" } }),
    ser_round_value: block => Object.assign(block, { type: "ser_round_places", fields: {}, inputs: { VALUE: block.inputs?.VALUE ?? numberShadow(0), PLACES: numberShadow(0) } }),
    ser_broadcast: block => Object.assign(block, { type: "ser_message", fields: { STYLE: "big" } }),
    ser_hint: block => Object.assign(block, { type: "ser_message", fields: { STYLE: "small" } }),
    ser_animated_broadcast: block => Object.assign(block, { type: "ser_message", fields: { STYLE: "typed" } }),
    ser_player_cassie: block => Object.assign(block, { type: "ser_cassie" }),
    ser_lights_reset: block => Object.assign(block, { type: "ser_lights_reset_color", fields: { PLACE: block.fields?.PLACE ?? "all" } }),
    ser_run_wait: block => Object.assign(block, { type: "ser_run_script_wait", fields: {} }),
    ser_round_info: block => {
      const info = block.fields?.INFO;
      if (info === "roundTime") block.fields = { INFO: "duration" };
      else if (info === "playerCount") Object.assign(block, { type: "ser_server_info", fields: { INFO: "playerCount" } });
      else if (info === "aliveCount") Object.assign(block, { type: "ser_count", fields: {}, inputs: { TARGET: playerShadow("@alivePlayers") } });
      else if (info === "roundNumber" || info === "uptime") markRemoved(block, `round info (${info})`);
    },
    ser_heal: block => Object.assign(block, { type: "ser_health", fields: { MODE: "heal" } }),
    ser_hurt: block => Object.assign(block, { type: "ser_health", fields: { MODE: "hurt" } }),
    ser_set_health: block => Object.assign(block, { type: "ser_health", fields: { MODE: "set" } }),
    ser_item_drop: block => Object.assign(block, { type: "ser_item_remove", fields: { MODE: "drop", ITEM: block.fields?.ITEM ?? "Coin" } }),
    ser_clear_inventory: block => Object.assign(block, { fields: { MODE: block.fields?.MODE ?? "destroy" }, inputs: { TARGET: targetInput(block) } }),
    ser_remove_effect: block => Object.assign(block, { fields: { EFFECT: block.fields?.EFFECT ?? "all" } }),
    ser_tp_position: block => Object.assign(block, { type: "ser_tp_exact", fields: {} }),
    ser_change_var: block => Object.assign(block, { type: "ser_change_var", fields: { NAME: block.fields?.NAME ?? "myVariable", SCOPE: block.fields?.SCOPE ?? "local" }, inputs: { VALUE: block.inputs?.AMOUNT ?? block.inputs?.VALUE ?? numberShadow(1) } }),
    ser_save_add: block => Object.assign(block, { type: "ser_save_data", fields: { MODE: "add", SCOPE: "keep" }, inputs: { VALUE: block.inputs?.AMOUNT ?? numberShadow(1), KEY: block.inputs?.KEY ?? textShadow("points"), TARGET: targetInput(block) } }),
    ser_check_range: block => Object.assign(block, { type: "ser_reject_range", fields: {}, inputs: { VALUE: block.inputs?.VALUE ?? numberShadow(0), MIN: block.inputs?.MIN ?? numberShadow(1), MAX: block.inputs?.MAX ?? numberShadow(10), TEXT: block.inputs?.TEXT ?? textShadow("Pick a number from 1 to 10.") } }),
    ser_if: block => {
      if (!block.inputs || !("COND" in block.inputs)) return;
      const { COND, ...rest } = block.inputs;
      block.inputs = { COND0: COND, ...rest };
      block.extraState = { mode: "any", count: 1, hasElse: Boolean(rest.ELSE) };
    },
    ser_if_either: block => Object.assign(block, {
      type: "ser_if",
      inputs: { COND0: block.inputs?.COND ?? boolShadow("false"), COND1: block.inputs?.COND2 ?? boolShadow("false"), DO: block.inputs?.DO },
      extraState: { mode: "any", count: 2, hasElse: false }
    })
  };

  function pruneToSpec(block) {
    const spec = specById[block.type];
    if (!spec || spec.extra) return;
    const fieldNames = spec.parts.filter(part => typeof part === "object" && part.field).map(part => part.field);
    const inputNames = spec.parts.filter(part => typeof part === "object" && (part.input || part.body)).map(part => part.input ?? part.body);
    if (block.fields) block.fields = Object.fromEntries(Object.entries(block.fields).filter(([name]) => fieldNames.includes(name)));
    if (block.inputs) block.inputs = Object.fromEntries(Object.entries(block.inputs).filter(([name]) => inputNames.includes(name)));
  }

  function migrateBlock(block) {
    const fields = block.fields || {};
    if (block.type === "ser_when_event" && fields.EVENT === "UsedItem") {
      Object.assign(block, { type: "ser_when_use_item", fields: { FILTER: "any" } });
    } else if (block.type === "ser_when_item") {
      const equip = fields.EVENT === "ChangedItem";
      const type = equip ? "ser_when_equip_item" : "ser_when_use_item";
      Object.assign(block, { type, fields: { FILTER: legacyItemFilter(fields, equip) } });
    } else if (removedBlocks.has(block.type)) {
      markRemoved(block, block.type.replace("ser_", ""));
      return;
    } else if (splitRules[block.type]) {
      const [newType, extra] = splitRules[block.type](block);
      block.type = newType;
      block.fields = { ...fields, ...extra };
    } else if (renames[block.type]) {
      renames[block.type](block);
    }
    pruneToSpec(block);
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
    category: categoryNames[spec.cat],
    advanced: spec.advanced
  }));

  const eventLabels = Object.fromEntries(eventOptions.map(([label, value]) => [value, label]));

  window.SER_BLOCKS = {
    gen,
    glyph,
    colours,
    categoryNames,
    targetLabels,
    groupTargets,
    eventLabels,
    specById,
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