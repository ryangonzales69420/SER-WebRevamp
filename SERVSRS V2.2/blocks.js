(function defineSerBlocks() {
  "use strict";

  const indent = "    ";
  const actionCheck = "SER_ACTION";
  const playerCheck = "Player";
  const groupTargets = new Set(["@all", "@alivePlayers", "@scpPlayers", "@classDPlayers"]);
  const colours = { start: 282, players: 203, messages: 326, world: 190, logic: 165, server: 80, variables: 260, libraries: 30 };
  const categories = [
    ["start", "Start"], ["players", "Players"], ["messages", "Messages"], ["world", "World"],
    ["logic", "Logic & values"], ["variables", "Variables"], ["server", "Server"], ["libraries", "Libraries"]
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
  const items = ["Coin", "Medkit", "Painkillers", "Adrenaline", "Radio", "Flashlight", "MicroHID", "GunE11SR", "GunCOM15", "GunCrossvec", "GunShotgun", "GunLogicer", "GunRevolver", "GunAK", "GunFSP9", "GrenadeHE", "GrenadeFlash", "ArmorLight", "ArmorCombat", "ArmorHeavy", "SCP500", "SCP207", "SCP018", "SCP268", "SCP330", "SCP2176", "KeycardO5", "KeycardMTFCaptain", "KeycardGuard", "KeycardScientist", "Ammo9x19", "Ammo556x45", "Ammo762x39", "Ammo12gauge", "Ammo44cal", "Jailbird", "SurfaceAccessPass"];
  const effects = ["AmnesiaItems", "AmnesiaVision", "AnomalousRegeneration", "AnomalousTarget", "Asphyxiated", "Bleeding", "Blindness", "Blurred", "BodyshotReduction", "Burned", "CardiacArrest", "AntiScp207", "Scp207", "Concussed", "Corroding", "DamageReduction", "Deafened", "Decontaminating", "Disabled", "Ensnared", "Exhausted", "Fade", "Flashed", "FocusedVision", "FogControl", "Ghostly", "HeavyFooted", "Hemorrhage", "InsufficientLighting", "Invigorated", "Invisible", "Lightweight", "MovementBoost", "NightVision", "PitDeath", "PocketCorroding", "Poisoned", "RainbowTaste", "Scanned", "Scp1344", "Scp1853", "SeveredEyes", "SeveredHands", "SilentWalk", "Sinkhole", "Slowness", "SoundtrackMute", "SpawnProtected", "Stained", "Strangled", "Traumatized", "Vitality", "Hypothermia"];
  const flagMethods = { godmode: "SetGodMode", noclip: "SetNoclip", bypass: "SetBypass", spectatable: "SetSpectatability" };

  const glyph = hex => {
    const code = Number.parseInt(hex, 16);
    return Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  };  const prettyLabel = value => value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, character => character.toUpperCase());
  const asOptions = list => list.map(value => [prettyLabel(value), value]);
  const roomNames = SER_TRUTH_TABLE.methods.GetRoomByName.arguments[0].enumValues.filter(room => room !== "Unnamed");
  const placeOptions = [["everywhere", "all"], ...zones.map(zone => [`${prettyLabel(zone)} zone`, zone]), ...asOptions(roomNames)];
  const itemOptions = asOptions(items);
  const noneItemOptions = [["nothing", "none"], ...itemOptions];
  const effectOptions = asOptions(effects);
  const eventOptions = [
    ["the round starts", "RoundStarted"], ["the round ends", "RoundEnded"], ["the round is ending", "RoundEnding"],
    ["a player joins", "Joined"], ["a player leaves", "Left"], ["a player spawns", "Spawned"], ["a player dies", "Death"],
    ["a player is hurt", "Hurt"], ["a player escapes", "Escaped"], ["a player changes role", "ChangedRole"],
    ["a player uses an item", "UsedItem"], ["a player picks up an item", "PickedUpItem"], ["a player is kicked", "Kicked"],
    ["a player is banned", "Banned"], ["a player enters a new room", "RoomChanged"], ["a player enters a new zone", "ZoneChanged"],
    ["a player triggers a tesla", "TriggeredTesla"], ["a player opens or uses a door", "InteractedDoor"],
    ["a player uses the intercom", "UsedIntercom"], ["the warhead starts", "Started"], ["the warhead detonates", "Detonated"],
    ["a respawn wave is starting", "WaveRespawning"], ["decontamination starts", "LczDecontaminationStarting"],
    ["CASSIE announces something", "CassieAnnouncing"], ["a generator is activated", "GeneratorActivated"]
  ].filter(([, value]) => value in (SER_TRUTH_TABLE.eventDetails || {}));
  const eventLabels = Object.fromEntries(eventOptions.map(([label, value]) => [value, label]));

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
  const quote = value => `"${String(value ?? "").replace(/~/g, "~~").replace(/"/g, '~"')}"`;
  const unindent = code => code.split("\n").map(line => line.startsWith(indent) ? line.slice(indent.length) : line).join("\n");
  const cleanName = (value, fallback) => (String(value ?? "").trim().replace(/[^A-Za-z0-9_]/g, "") || fallback);
  const hexOf = (value, fallback) => {
    const hex = String(value ?? "").replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    return hex.length === 6 ? hex : fallback;
  };
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
    id: "ser_when_command", cat: "start", kind: "hat", icon: "f075", title: "When a player types a command",
    tip: "Creates a custom command. The blocks inside run when someone types it.",
    parts: ["Command", tf("COMMAND", "heal"), "from", dd("AUDIENCE", [["players", "Player"], ["Remote Admin", "RemoteAdmin"], ["server console", "Server"]]), "do", { body: "DO" }],
    code: (block, g) => {
      const senderLine = usedTargets(block).includes("@sender") ? "-- requireSender\n" : "";
      return `!-- CustomCommand ${block.getFieldValue("COMMAND").trim()}\n-- availableFor ${block.getFieldValue("AUDIENCE")}\n${senderLine}\n${unindent(g.statementToCode(block, "DO"))}`;
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
    id: "ser_heal", cat: "players", kind: "statement", icon: "f004", title: "Heal",
    tip: "Restores health without going over the player's maximum. Use a very large amount to fully heal.",
    parts: ["heal", playerInput, "by", { input: "AMOUNT", check: "Number" }],
    defaults: { ...evTarget, AMOUNT: num(25) },
    code: block => `Heal ${valueOf(block, "TARGET")} ${valueOf(block, "AMOUNT")}\n`
  });

  def({
    id: "ser_hurt", cat: "players", kind: "statement", icon: "f7a9", title: "Hurt",
    tip: "Removes health from the chosen players.",
    parts: ["hurt", playerInput, "by", { input: "AMOUNT", check: "Number" }],
    defaults: { ...evTarget, AMOUNT: num(10) },
    code: block => `Damage ${valueOf(block, "TARGET")} ${valueOf(block, "AMOUNT")}\n`
  });

  def({
    id: "ser_kill", cat: "players", kind: "statement", icon: "f714", title: "Kill",
    tip: "Kills the chosen players.",
    parts: ["kill", playerInput],
    defaults: evTarget,
    code: block => `Kill ${valueOf(block, "TARGET")}\n`
  });

  def({
    id: "ser_set_health", cat: "players", kind: "statement", icon: "f21e", title: "Set health",
    tip: "Sets health to an exact value. Unlike Heal, this can also lower health.",
    parts: ["set health of", playerInput, "to", { input: "AMOUNT", check: "Number" }],
    defaults: { ...evTarget, AMOUNT: num(100) },
    code: block => `SetHealth ${valueOf(block, "TARGET")} ${valueOf(block, "AMOUNT")}\n`
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
    id: "ser_clear_inventory", cat: "players", kind: "statement", icon: "f49e", title: "Clear inventory",
    tip: "Destroys every item in the chosen players' inventories.",
    parts: ["clear inventory of", playerInput],
    defaults: evTarget,
    code: block => `ClearInventory ${valueOf(block, "TARGET")}\n`
  });

  def({
    id: "ser_give_effect", cat: "players", kind: "statement", icon: "f48e", title: "Give effect",
    tip: "Gives a status effect for a duration. Intensity 1 is the normal strength.",
    parts: ["give effect", dd("EFFECT", effectOptions), "to", playerInput, "for", { input: "DURATION", check: "Duration" }, "intensity", { input: "INTENSITY", check: "Number" }],
    defaults: { ...evTarget, DURATION: dur(10), INTENSITY: num(1) },
    code: block => `GiveEffect ${valueOf(block, "TARGET")} ${block.getFieldValue("EFFECT")} ${valueOf(block, "DURATION")} ${valueOf(block, "INTENSITY")}\n`
  });

  def({
    id: "ser_remove_effect", cat: "players", kind: "statement", icon: "f00d", title: "Remove effect",
    tip: "Removes one status effect, or every status effect.",
    parts: ["remove effect", dd("EFFECT", [["all effects", "all"], ...effectOptions]), "from", playerInput],
    defaults: evTarget,
    code: block => {
      const effect = block.getFieldValue("EFFECT");
      return `ClearEffect ${valueOf(block, "TARGET")}${effect === "all" ? "" : ` ${effect}`}\n`;
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
    parts: ["set", dd("PROP", [["display name", "display"], ["overhead text", "custom"]]), "of", playerInput, "to", { input: "TEXT", check: "String" }],
    defaults: { ...evTarget, TEXT: txt("VIP") },
    code: block => {
      const method = block.getFieldValue("PROP") === "display" ? "SetDisplayName" : "SetCustomInfo";
      return `${method} ${valueOf(block, "TARGET")} ${valueOf(block, "TEXT")}\n`;
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
    id: "ser_foreach_player", cat: "players", kind: "statement", icon: "f363", title: "For each player",
    tip: "Runs the blocks inside once per player in the chosen group.",
    note: "Inside the loop, read the current player with a 'Variable value' block using the same name, e.g. p.",
    parts: ["for each player in", playerInput, "as", tf("VAR", "p"), "do", { body: "DO" }],
    defaults: { TARGET: tgt("@alivePlayers") },
    code: (block, g) => `Foreach ${cleanName(block.getFieldValue("VAR"), "p")} ${valueOf(block, "TARGET")}\n${bodyOf(block, "DO")}end\n`
  });

  def({
    id: "ser_player_name", cat: "players", kind: "value", output: "String", icon: "f031", title: "Player name",
    tip: "The display name of one player.",
    parts: ["name of", playerInput],
    defaults: evTarget, single: singleTarget,
    code: block => [`{${valueOf(block, "TARGET")} -> name}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_player_id", cat: "players", kind: "value", output: "Number", icon: "f292", title: "Player ID",
    tip: "The in-round player ID used by Remote Admin.",
    parts: ["ID of", playerInput],
    defaults: evTarget, single: singleTarget,
    code: block => [`{${valueOf(block, "TARGET")} -> playerId}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_broadcast", cat: "messages", kind: "statement", icon: "f0a1", title: "Show big message",
    tip: "Shows a large message to the chosen players for a set time.",
    parts: ["show big message to", playerInput, "for", { input: "DURATION", check: "Duration" }, "saying", { input: "TEXT", check: "String" }],
    defaults: { ...allTarget, DURATION: dur(5), TEXT: txt("The round has started!") },
    code: block => `Broadcast ${valueOf(block, "TARGET")} ${valueOf(block, "DURATION")} ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_hint", cat: "messages", kind: "statement", icon: "f05a", title: "Show small hint",
    tip: "Shows a smaller message to the chosen players.",
    parts: ["show hint to", playerInput, "for", { input: "DURATION", check: "Duration" }, "saying", { input: "TEXT", check: "String" }],
    defaults: { ...evTarget, DURATION: dur(4), TEXT: txt("Welcome!") },
    code: block => `Hint ${valueOf(block, "TARGET")} ${valueOf(block, "DURATION")} ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_reply", cat: "messages", kind: "statement", icon: "f112", title: "Reply to command",
    tip: "Sends a reply to whoever typed the command.",
    parts: ["reply to the command with", { input: "TEXT", check: "String" }],
    defaults: { TEXT: txt("Done!") },
    code: block => `Reply ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_cassie", cat: "messages", kind: "statement", icon: "f028", title: "CASSIE announcement",
    tip: "Makes an announcement over CASSIE.",
    parts: ["announce on CASSIE", dd("MODE", [["with jingle", "jingle"], ["without jingle", "noJingle"]]), { input: "TEXT", check: "String" }],
    defaults: { TEXT: txt("Attention all personnel") },
    code: block => `Cassie ${block.getFieldValue("MODE")} ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_doors", cat: "world", kind: "statement", icon: "f52b", title: "Doors",
    tip: "Opens, closes, locks, unlocks, breaks, or repairs doors in the chosen place. 'Everywhere' affects every door.",
    parts: [dd("ACTION", [["open", "OpenDoor"], ["close", "CloseDoor"], ["lock", "LockDoor"], ["unlock", "UnlockDoor"], ["break", "BreakDoor"], ["repair", "RepairDoor"]]), "doors in", dd("PLACE", placeOptions)],
    code: block => `${block.getFieldValue("ACTION")} ${block.getFieldValue("PLACE")}\n`
  });

  def({
    id: "ser_lights_color", cat: "world", kind: "statement", icon: "f0eb", title: "Set light color",
    tip: "Sets the light color in the chosen place. Use a 6-digit hex color like FF0000.",
    parts: ["set lights in", dd("PLACE", placeOptions), "to color #", tf("COLOR", "FF0000")],
    code: block => `SetLightColor ${block.getFieldValue("PLACE")} ${hexOf(block.getFieldValue("COLOR"), "FFFFFF")}\n`
  });

  def({
    id: "ser_lights_off", cat: "world", kind: "statement", icon: "f186", title: "Turn lights off",
    tip: "Turns off the lights in the chosen place for a duration.",
    parts: ["turn lights off in", dd("PLACE", placeOptions), "for", { input: "DURATION", check: "Duration" }],
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
    id: "ser_warhead", cat: "world", kind: "statement", icon: "f1e2", title: "Warhead",
    tip: "Performs an alpha warhead action.",
    parts: ["warhead", dd("ACTION", [["open doors", "open"], ["close doors", "close"], ["arm", "arm"], ["disarm", "disarm"], ["lock", "lock"], ["unlock", "unlock"], ["start countdown", "start"], ["stop countdown", "stop"], ["detonate", "detonate"], ["shake", "shake"]])],
    code: block => `Warhead ${block.getFieldValue("ACTION")}\n`
  });

  def({
    id: "ser_round", cat: "world", kind: "statement", icon: "f11e", title: "Round control",
    tip: "Starts, ends, or restarts the round.",
    parts: [dd("ACTION", [["start", "StartRound"], ["end", "EndRound"], ["restart", "RestartRound"]]), "round"],
    code: block => `${block.getFieldValue("ACTION")}\n`
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
    id: "ser_if", cat: "logic", kind: "statement", icon: "f126", title: "If",
    tip: "Runs the first set of blocks when the condition is true. Otherwise runs the second set, if any.",
    note: "Nest one If inside another to require two things at once.",
    parts: ["if", { input: "COND", check: "Boolean" }, "then", { body: "DO" }, "otherwise", { body: "ELSE" }],
    code: (block, g) => {
      const elseBody = bodyOf(block, "ELSE");
      return `if ${conditionOf(block)}\n${bodyOf(block, "DO")}${elseBody ? `else\n${elseBody}` : ""}end\n`;
    }
  });

  def({
    id: "ser_match", cat: "logic", kind: "statement", icon: "f126", title: "Match value",
    tip: "Compares one value against up to three cases and runs the first case that matches. 'Otherwise' runs when no case matches.",
    note: "Case 1 is required. Cases 2 and 3 are optional: leave them empty to skip them.",
    parts: ["match", { input: "VALUE", check: null }, "case", { input: "CASE1", check: null }, "do", { body: "DO1" },
      "case", { input: "CASE2", check: null }, "do", { body: "DO2" },
      "case", { input: "CASE3", check: null }, "do", { body: "DO3" },
      "otherwise", { body: "ELSE" }],
    defaults: { VALUE: num(1), CASE1: num(1) },
    code: block => {
      const value = valueOf(block, "VALUE");
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
    parts: ["count", tf("VAR", "i"), "from", { input: "FROM", check: "Number" }, "to", { input: "TO", check: "Number" }, "do", { body: "DO" }],
    defaults: { FROM: num(1), TO: num(5) },
    code: block => {
      const name = cleanName(block.getFieldValue("VAR"), "i");
      return `SetVar ${name} ${valueOf(block, "FROM")}\nwhile $${name} <= ${valueOf(block, "TO")}\n${bodyOf(block, "DO")}SetVar ${name} {Add $${name} 1}\nend\n`;
    }
  });

  def({
    id: "ser_repeat", cat: "logic", kind: "statement", icon: "f01e", title: "Repeat",
    tip: "Repeats the blocks inside a set number of times.",
    parts: ["repeat", nf("COUNT", 3, 1, 100, 1), "times, do", { body: "DO" }],
    code: block => `repeat ${Math.max(1, Math.round(Number(block.getFieldValue("COUNT"))))}\n${bodyOf(block, "DO")}end\n`
  });

  def({
    id: "ser_while", cat: "logic", kind: "statement", icon: "f2f1", title: "While",
    tip: "Repeats the blocks inside while the condition stays true. Add a wait inside so the server keeps running.",
    parts: ["while", { input: "COND", check: "Boolean" }, "do", { body: "DO" }],
    code: (block, g) => `while ${conditionOf(block)}\n${bodyOf(block, "DO")}end\n`
  });

  def({
    id: "ser_forever", cat: "logic", kind: "statement", icon: "f021", title: "Forever",
    tip: "Repeats the blocks inside forever. It must contain a wait.",
    parts: ["forever, do", { body: "DO" }],
    code: block => `forever\n${bodyOf(block, "DO")}end\n`
  });

  def({
    id: "ser_wait", cat: "logic", kind: "statement", icon: "f017", title: "Wait",
    tip: "Pauses before the next block runs.",
    parts: ["wait", { input: "DURATION", check: "Duration" }],
    defaults: { DURATION: dur(1) },
    code: block => `wait ${valueOf(block, "DURATION")}\n`
  });

  def({
    id: "ser_wait_until", cat: "logic", kind: "statement", icon: "f252", title: "Wait until",
    tip: "Pauses until the condition becomes true.",
    parts: ["wait until", { input: "COND", check: "Boolean" }],
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
    id: "ser_compare", cat: "logic", kind: "value", output: "Boolean", icon: "f1ec", title: "Compare",
    tip: "True when the comparison holds. Works with numbers and text.",
    parts: [{ input: "A" }, dd("OP", [["is", "is"], ["is greater than", ">"], ["is less than", "<"], ["is at least", ">="], ["is at most", "<="]]), { input: "B" }],
    code: block => [`${valueOf(block, "A")} ${block.getFieldValue("OP")} ${valueOf(block, "B")}`, gen.ORDER_NONE]
  });

  def({
    id: "ser_chance", cat: "logic", kind: "value", output: "Boolean", icon: "f522", title: "Random chance",
    tip: "True for the chosen percentage of checks.",
    parts: ["random chance", nf("PERCENT", 50, 1, 100, 1), "%"],
    code: block => [`{Chance ${Number(block.getFieldValue("PERCENT")) / 100}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_is_alive", cat: "logic", kind: "value", output: "Boolean", icon: "f004", title: "Is alive",
    tip: "True if the player is alive.",
    parts: [playerInput, "is alive"],
    defaults: evTarget, single: singleTarget,
    code: block => [`{${valueOf(block, "TARGET")} -> isAlive}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_has_role", cat: "logic", kind: "value", output: "Boolean", icon: "f007", title: "Has role",
    tip: "True if the player currently has the chosen role.",
    parts: [playerInput, "has role", dd("ROLE", asOptions(roles))],
    defaults: evTarget, single: singleTarget,
    code: block => [`{${valueOf(block, "TARGET")} -> role} is ${quote(block.getFieldValue("ROLE"))}`, gen.ORDER_NONE]
  });

  def({
    id: "ser_has_effect", cat: "logic", kind: "value", output: "Boolean", icon: "f48e", title: "Has effect",
    tip: "True if the player currently has the chosen effect.",
    parts: [playerInput, "has effect", dd("EFFECT", effectOptions)],
    defaults: evTarget, single: singleTarget,
    code: block => [`{HasEffect ${valueOf(block, "TARGET")} ${block.getFieldValue("EFFECT")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_read_player", cat: "logic", kind: "value", output: null, icon: "f0cb", title: "Player value",
    tip: "Reads a value from one player, such as health or position.",
    parts: [dd("PROP", [["health", "health"], ["max health", "maxHealth"], ["X position", "PosX"], ["Y position", "PosY"], ["Z position", "PosZ"], ["role", "role"], ["team", "team"]]), "of", playerInput],
    defaults: evTarget, single: singleTarget,
    code: block => [`{${valueOf(block, "TARGET")} -> ${block.getFieldValue("PROP")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_count", cat: "logic", kind: "value", output: "Number", icon: "f0c0", title: "Count players",
    tip: "The number of players in the chosen group.",
    parts: ["number of players in", playerInput],
    defaults: { TARGET: tgt("@alivePlayers") },
    code: block => [`{AmountOf ${valueOf(block, "TARGET")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_player_exists", cat: "logic", kind: "value", output: "Boolean", icon: "f002", title: "Player exists",
    tip: "True if the event player, such as an attacker, is available. Check this before using an attacker.",
    parts: [playerInput, "exists"],
    defaults: { TARGET: tgt("@evAttacker") },
    code: block => [`{VarExists ${valueOf(block, "TARGET")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_random", cat: "logic", kind: "value", output: "Number", icon: "f522", title: "Random number",
    tip: "A random whole number between the two values.",
    parts: ["random number from", { input: "MIN", check: "Number" }, "to", { input: "MAX", check: "Number" }],
    defaults: { MIN: num(1), MAX: num(10) },
    code: block => [`{Random ${valueOf(block, "MIN")} ${valueOf(block, "MAX")} int}`, gen.ORDER_ATOMIC]
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
    tip: "An amount of time, such as 5 seconds.",
    parts: [nf("AMOUNT", 5), dd("UNIT", durationUnits)],
    code: block => [`${block.getFieldValue("AMOUNT")}${block.getFieldValue("UNIT")}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_math", cat: "logic", kind: "value", output: "Number", icon: "f1ec", title: "Math",
    tip: "Basic arithmetic on two numbers. Remainder gives the leftover after dividing. Power raises the first number to the second.",
    parts: [
      { input: "A", check: "Number" },
      dd("OP", [["add", "Add"], ["subtract", "Sub"], ["multiply", "Mul"], ["divide", "Div"], ["remainder", "Mod"], ["power", "Pow"]]),
      { input: "B", check: "Number" }
    ],
    defaults: { A: num(1), B: num(1) },
    code: block => [`{${block.getFieldValue("OP")} ${valueOf(block, "A")} ${valueOf(block, "B")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_round_value", cat: "logic", kind: "value", output: "Number", icon: "f0c8", title: "Round number",
    tip: "Rounds a decimal number to a whole number.",
    parts: [dd("MODE", [["down", "floor"], ["up", "ceil"], ["nearest", "round"]]), { input: "VALUE", check: "Number" }],
    defaults: { VALUE: num(1.5) },
    code: block => {
      const fn = { floor: "Floor", ceil: "Ceil", round: "Round" }[block.getFieldValue("MODE")];
      return [`{${fn} ${valueOf(block, "VALUE")}}`, gen.ORDER_ATOMIC];
    }
  });

  def({
    id: "ser_clamp", cat: "logic", kind: "value", output: "Number", icon: "f07e", title: "Clamp number",
    tip: "Keeps a number between a minimum and maximum.",
    parts: [{ input: "VALUE", check: "Number" }, "between", { input: "MIN", check: "Number" }, "and", { input: "MAX", check: "Number" }],
    defaults: { VALUE: num(0), MIN: num(0), MAX: num(100) },
    code: block => [`{Clamp ${valueOf(block, "VALUE")} ${valueOf(block, "MIN")} ${valueOf(block, "MAX")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_join", cat: "logic", kind: "value", output: "String", icon: "f0c1", title: "Join text",
    tip: "Glues two pieces of text (or numbers) together into one string.",
    parts: ["join", { input: "A", check: null }, "with", { input: "B", check: null }],
    defaults: { A: txt("Hello, "), B: txt("world!") },
    code: block => [`{Concat ${valueOf(block, "A")} ${valueOf(block, "B")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_text_length", cat: "logic", kind: "value", output: "Number", icon: "f0cc", title: "Text length",
    tip: "The number of characters in a piece of text.",
    parts: ["length of", { input: "TEXT", check: "String" }],
    defaults: { TEXT: txt("Hello") },
    code: block => [`{StrLength ${valueOf(block, "TEXT")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_text_contains", cat: "logic", kind: "value", output: "Boolean", icon: "f002", title: "Text contains",
    tip: "True if the text contains the searched word or phrase.",
    parts: [{ input: "TEXT", check: "String" }, "contains", { input: "NEEDLE", check: "String" }],
    defaults: { TEXT: txt("hello world"), NEEDLE: txt("world") },
    code: block => [`{Contains ${valueOf(block, "TEXT")} ${valueOf(block, "NEEDLE")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_boolean", cat: "logic", kind: "value", output: "Boolean", icon: "f205", title: "True / false",
    tip: "A fixed true or false value.",
    parts: [dd("VALUE", [["true", "true"], ["false", "false"]])],
    code: block => [block.getFieldValue("VALUE"), gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_not", cat: "logic", kind: "value", output: "Boolean", icon: "f0ec", title: "Not",
    tip: "Flips true to false and false to true.",
    parts: ["not", { input: "COND", check: "Boolean" }],
    code: block => [`{Not ${conditionOf(block)}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_and_or", cat: "logic", kind: "value", output: "Boolean", icon: "f0c9", title: "And / or",
    tip: "Combines two true/false values. 'And' needs both true. 'Or' needs at least one.",
    parts: [{ input: "A", check: "Boolean" }, dd("OP", [["and", "And"], ["or", "Or"]]), { input: "B", check: "Boolean" }],
    code: block => [`{${block.getFieldValue("OP")} ${valueOf(block, "A")} ${valueOf(block, "B")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_pick", cat: "logic", kind: "value", output: null, icon: "f0e2", title: "Pick a value",
    tip: "If the condition is true, gives the first value. Otherwise gives the second.",
    parts: ["if", { input: "COND", check: "Boolean" }, "then", { input: "A", check: null }, "otherwise", { input: "B", check: null }],
    defaults: { A: num(1), B: num(0) },
    code: block => [`{If ${conditionOf(block)} then ${valueOf(block, "A")} else ${valueOf(block, "B")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_comment", cat: "logic", kind: "statement", icon: "f249", title: "Comment",
    tip: "A note to yourself. Never runs.",
    parts: ["note:", tf("TEXT", "explain what this does")],
    code: block => `-- ${block.getFieldValue("TEXT")}\n`
  });

  def({
    id: "ser_set_var", cat: "variables", kind: "statement", icon: "f044", title: "Set variable",
    tip: "Stores a value under a name so you can use it later.",
    note: "Give it a short name (letters, numbers, _). Read it back with 'Variable value'.",
    parts: ["set", tf("NAME", "myVariable"), "to", { input: "VALUE", check: null }],
    defaults: { VALUE: num(0) },
    code: block => `SetVar ${cleanName(block.getFieldValue("NAME"), "myVariable")} ${valueOf(block, "VALUE")}\n`
  });

  def({
    id: "ser_change_var", cat: "variables", kind: "statement", icon: "f067", title: "Change variable",
    tip: "Adds an amount to a number stored in a variable. Negative amounts subtract.",
    parts: ["change", tf("NAME", "myVariable"), "by", { input: "AMOUNT", check: "Number" }],
    defaults: { AMOUNT: num(1) },
    code: block => {
      const name = cleanName(block.getFieldValue("NAME"), "myVariable");
      return `SetVar ${name} {Add $${name} ${valueOf(block, "AMOUNT")}}\n`;
    }
  });

  def({
    id: "ser_get_var", cat: "variables", kind: "value", output: null, icon: "f02b", title: "Variable value",
    tip: "Reads the value stored in a variable.",
    parts: ["variable", tf("NAME", "myVariable")],
    code: block => [`$${cleanName(block.getFieldValue("NAME"), "myVariable")}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_delete_var", cat: "variables", kind: "statement", icon: "f1f8", title: "Delete variable",
    tip: "Removes a variable entirely.",
    parts: ["delete variable", tf("NAME", "myVariable")],
    code: block => `DeleteVar ${cleanName(block.getFieldValue("NAME"), "myVariable")}\n`
  });

  def({
    id: "ser_stopwatch_start", cat: "variables", kind: "statement", icon: "f2f2", title: "Start stopwatch",
    tip: "Remembers the current server uptime under a name. Use 'Seconds since stopwatch' later to measure how long something took.",
    parts: ["start stopwatch", tf("NAME", "roundClock")],
    code: block => `SetVar ${cleanName(block.getFieldValue("NAME"), "roundClock")} {RoundInfo uptime}\n`
  });

  def({
    id: "ser_stopwatch_read", cat: "variables", kind: "value", output: "Number", icon: "f2f2", title: "Seconds since stopwatch",
    tip: "Seconds that passed since the stopwatch with this name was started.",
    parts: ["seconds since stopwatch", tf("NAME", "roundClock")],
    code: block => [`{Sub {RoundInfo uptime} $${cleanName(block.getFieldValue("NAME"), "roundClock")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_command", cat: "server", kind: "statement", icon: "f120", title: "Run command",
    tip: "Runs a server or Remote Admin command. Remote Admin commands start with '/', console commands with '.'.",
    parts: ["run command", { input: "TEXT", check: "String" }],
    defaults: { TEXT: txt("/cassie Hello") },
    code: block => `Command ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_print", cat: "server", kind: "statement", icon: "f02f", title: "Print to console",
    tip: "Writes text to the server console. Useful for checking that a script runs.",
    parts: ["print to console", { input: "TEXT", check: "String" }],
    defaults: { TEXT: txt("Script ran") },
    code: block => `Print ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_run_script", cat: "server", kind: "statement", icon: "f56d", title: "Run another script",
    tip: "Runs another script by name.",
    parts: ["run script named", { input: "TEXT", check: "String" }],
    defaults: { TEXT: txt("myScript") },
    code: block => `RunScript ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_trigger", cat: "server", kind: "statement", icon: "f0e7", title: "Fire trigger",
    tip: "Fires a custom trigger, which runs every script set to listen for it.",
    parts: ["fire trigger", { input: "TEXT", check: "String" }],
    defaults: { TEXT: txt("myTrigger") },
    code: block => `Trigger ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_save_data", cat: "server", kind: "statement", icon: "f0c7", title: "Save player data",
    tip: "Stores a value for one player under a name. Saved values persist between rounds and can be read later.",
    note: "Use this instead of variables to remember numbers or text between events.",
    parts: ["save", { input: "VALUE", check: null }, "for", playerInput, "as", { input: "KEY", check: "String" }],
    defaults: { ...evTarget, KEY: txt("points"), VALUE: num(1) },
    single: singleTarget,
    code: block => `SetPlayerData ${valueOf(block, "TARGET")} ${valueOf(block, "KEY")} ${valueOf(block, "VALUE")}\n`
  });

  def({
    id: "ser_read_data", cat: "server", kind: "value", output: null, icon: "f1c0", title: "Read player data",
    tip: "Reads a value saved with 'save'. If nothing was saved, the default is used.",
    parts: ["saved", { input: "KEY", check: "String" }, "of", playerInput, "or", { input: "DEFAULT", check: null }],
    defaults: { ...evTarget, KEY: txt("points"), DEFAULT: num(0) },
    single: singleTarget,
    code: block => [`{GetPlayerData ${valueOf(block, "TARGET")} ${valueOf(block, "KEY")} ${valueOf(block, "DEFAULT")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_save_add", cat: "server", kind: "statement", icon: "f055", title: "Add to saved data",
    tip: "Adds an amount to a number saved for one player. If nothing was saved yet, it starts from 0.",
    note: "Good for scores, kill counts, or coins that should last across rounds.",
    parts: ["add", { input: "AMOUNT", check: "Number" }, "to saved", { input: "KEY", check: "String" }, "of", playerInput],
    defaults: { ...evTarget, KEY: txt("points"), AMOUNT: num(1) },
    single: singleTarget,
    code: block => {
      const target = valueOf(block, "TARGET");
      const key = valueOf(block, "KEY");
      return `SetPlayerData ${target} ${key} {Add {GetPlayerData ${target} ${key} 0} ${valueOf(block, "AMOUNT")}}\n`;
    }
  });

  def({
    id: "ser_server_info", cat: "server", kind: "value", output: "Number", icon: "f233", title: "Server info",
    tip: "Reads a number about the server.",
    parts: ["server", dd("INFO", [["player count", "playerCount"], ["max players", "maxPlayers"], ["TPS", "tps"]])],
    code: block => [`{ServerInfo ${block.getFieldValue("INFO")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_round_info", cat: "server", kind: "value", output: "Number", icon: "f2f2", title: "Round info",
    tip: "Reads a number about the round or the server clock.",
    parts: ["round", dd("INFO", [["round number", "roundNumber"], ["seconds since round start", "roundTime"], ["server uptime (seconds)", "uptime"], ["players online", "playerCount"], ["alive players", "aliveCount"]])],
    code: block => [`{RoundInfo ${block.getFieldValue("INFO")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_lib_random_loot", cat: "libraries", kind: "statement", icon: "f522", title: "Library: Random loot",
    tip: "Rolls a number from 1 to 3 and gives the player the matching item. Each item has the same chance.",
    parts: ["Give", playerInput, "one random item from", dd("ITEM1", itemOptions), dd("ITEM2", itemOptions), dd("ITEM3", itemOptions)],
    defaults: { ...evTarget },
    code: block => {
      const target = valueOf(block, "TARGET");
      const picks = ["ITEM1", "ITEM2", "ITEM3"]
        .map((field, index) => `if $libLoot is ${index + 1}\nGiveItem ${target} ${block.getFieldValue(field)}\nend\n`)
        .join("");
      return `SetVar libLoot {Random 1 3 int}\n${picks}`;
    }
  });

    def({
    id: "ser_var_from_player", cat: "variables", kind: "statement", icon: "f007", title: "Store player value",
    tip: "Copies one value from a player, such as health, role, or position, into a variable.",
    note: "Read it back with 'Variable value'.",
    parts: ["store", dd("PROP", [["health", "health"], ["max health", "maxHealth"], ["X position", "PosX"], ["Y position", "PosY"], ["Z position", "PosZ"], ["role", "role"], ["team", "team"]]), "of", playerInput, "in variable", tf("NAME", "myVariable")],
    defaults: evTarget, single: singleTarget,
    code: block => `SetVar ${cleanName(block.getFieldValue("NAME"), "myVariable")} {${valueOf(block, "TARGET")} -> ${block.getFieldValue("PROP")}}\n`
  });

  def({
    id: "ser_var_from_data", cat: "variables", kind: "statement", icon: "f0c7", title: "Load saved data into variable",
    tip: "Reads a value saved for a player with 'Save player data' and stores it in a variable. If nothing was saved, the default is used.",
    note: "Use this when a later block needs the saved number in a calculation or message.",
    parts: ["load saved", { input: "KEY", check: "String" }, "of", playerInput, "into variable", tf("NAME", "savedValue"), "default", { input: "DEFAULT", check: null }],
    defaults: { TARGET: tgt("@evPlayer"), KEY: txt("points"), DEFAULT: num(0) },
    single: singleTarget,
    code: block => `SetVar ${cleanName(block.getFieldValue("NAME"), "savedValue")} {GetPlayerData ${valueOf(block, "TARGET")} ${valueOf(block, "KEY")} ${valueOf(block, "DEFAULT")}}\n`
  });

  def({
    id: "ser_var_copy", cat: "variables", kind: "statement", icon: "f0c5", title: "Copy variable",
    tip: "Copies the value of one variable into another variable.",
    parts: ["copy variable", tf("FROM", "myVariable"), "into", tf("TO", "myCopy")],
    code: block => `SetVar ${cleanName(block.getFieldValue("TO"), "myCopy")} $${cleanName(block.getFieldValue("FROM"), "myVariable")}\n`
  });

  def({
    id: "ser_var_print", cat: "variables", kind: "statement", icon: "f02f", title: "Print variable to console",
    tip: "Writes a label and the value of a variable to the server console. Useful for checking what a variable holds.",
    parts: ["print variable", tf("NAME", "myVariable"), "with label", { input: "TEXT", check: "String" }],
    defaults: { TEXT: txt("Value: ") },
    code: block => `Print {Concat ${valueOf(block, "TEXT")} $${cleanName(block.getFieldValue("NAME"), "myVariable")}}\n`
  });

  def({
    id: "ser_lib_flicker", cat: "libraries", kind: "statement", icon: "f0eb", title: "Flicker lights",
    tip: "Turns the lights in a place off and back on several times, like a power fault.",
    parts: ["flicker lights in", dd("PLACE", placeOptions), "for", nf("TIMES", 5, 1, 100, 1), "blinks"],
    code: block => `repeat ${Math.max(1, Math.round(Number(block.getFieldValue("TIMES"))))}\nDisableLights ${block.getFieldValue("PLACE")} 500ms\nwait 1s\nend\n`
  });

  def({
    id: "ser_min_max", cat: "logic", kind: "value", output: "Number", icon: "f07e", title: "Smaller or larger of",
    tip: "Gives the smaller or the larger of two numbers.",
    parts: [dd("MODE", [["smaller of", "Min"], ["larger of", "Max"]]), { input: "A", check: "Number" }, "and", { input: "B", check: "Number" }],
    defaults: { A: num(0), B: num(0) },
    code: block => [`{${block.getFieldValue("MODE")} ${valueOf(block, "A")} ${valueOf(block, "B")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_abs", cat: "logic", kind: "value", output: "Number", icon: "f0ec", title: "Absolute value",
    tip: "Removes the minus sign from a number. -5 becomes 5.",
    parts: ["absolute value of", { input: "VALUE", check: "Number" }],
    defaults: { VALUE: num(-1) },
    code: block => [`{Abs ${valueOf(block, "VALUE")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_set_max_health", cat: "players", kind: "statement", icon: "f004", title: "Set max health",
    tip: "Changes the maximum health of the chosen players.",
    parts: ["set max health of", playerInput, "to", { input: "AMOUNT", check: "Number" }],
    defaults: { ...evTarget, AMOUNT: num(100) },
    code: block => `SetMaxHealth ${valueOf(block, "TARGET")} ${valueOf(block, "AMOUNT")}\n`
  });

    def({
    id: "ser_warhead_info", cat: "world", kind: "value", output: null, icon: "f1e2", title: "Warhead status",
    tip: "Reads one fact about the alpha warhead, such as whether it is armed or how long until it detonates.",
    parts: ["warhead", dd("PROP", [["is locked", "isLocked"], ["is open", "isOpen"], ["is armed", "isArmed"], ["has started", "hasStarted"], ["has detonated", "isDetonated"], ["time to detonation", "timeToDenotation"]])],
    code: block => [`{WarheadInfo ${block.getFieldValue("PROP")}}`, gen.ORDER_ATOMIC]
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
    id: "ser_text_replace", cat: "logic", kind: "value", output: "String", icon: "f0cc", title: "Replace text",
    tip: "Returns the text with every match of the first phrase swapped for the replacement.",
    parts: ["replace", { input: "FIND", check: "String" }, "with", { input: "REPLACEMENT", check: "String" }, "in", { input: "TEXT", check: "String" }],
    defaults: { TEXT: txt("Hello world"), FIND: txt("world"), REPLACEMENT: txt("everyone") },
    code: block => [`{Text.Replace ${valueOf(block, "TEXT")} ${valueOf(block, "FIND")} ${valueOf(block, "REPLACEMENT")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_text_pad", cat: "logic", kind: "value", output: "String", icon: "f0cc", title: "Pad text",
    tip: "Adds one repeated character to one side of the text until it reaches the chosen length. Useful for aligning numbers.",
    parts: ["pad", { input: "TEXT", check: "String" }, dd("SIDE", [["on the left", "left"], ["on the right", "right"]]), "to", { input: "LENGTH", check: "Number" }, "characters using", tf("CHAR", "0")],
    defaults: { TEXT: txt("5"), LENGTH: num(3) },
    code: block => [`{Text.Pad ${valueOf(block, "TEXT")} ${block.getFieldValue("SIDE")} ${valueOf(block, "LENGTH")} ${quote(String(block.getFieldValue("CHAR")).slice(0, 1) || "0")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_clock", cat: "server", kind: "value", output: null, icon: "f017", title: "Real-world clock",
    tip: "Reads the real-world time or date from the server clock.",
    parts: ["real clock:", dd("INFO", [["second", "second"], ["minute", "minute"], ["hour", "hour"], ["day of week", "dayOfWeek"], ["day of month", "dayOfMonth"], ["Unix time (UTC)", "unixTimeUtc"]])],
    code: block => [`{TimeInfo ${block.getFieldValue("INFO")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_countdown", cat: "messages", kind: "statement", icon: "f017", title: "Countdown",
    tip: "Shows a countdown on screen for the chosen players. Use %seconds% in the title to show the time left.",
    parts: ["show countdown to", playerInput, "for", { input: "DURATION", check: "Duration" }, "titled", { input: "TEXT", check: "String" }],
    defaults: { ...allTarget, DURATION: dur(30), TEXT: txt("%seconds% seconds left") },
    code: block => `Countdown ${valueOf(block, "TARGET")} ${valueOf(block, "DURATION")} ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_animated_broadcast", cat: "messages", kind: "statement", icon: "f0a1", title: "Typed broadcast",
    tip: "Shows a message that types itself out on screen, with a CASSIE voice. Stops any CASSIE announcement already playing.",
    parts: ["typed broadcast to", playerInput, "for", { input: "DURATION", check: "Duration" }, "saying", { input: "TEXT", check: "String" }],
    defaults: { ...allTarget, DURATION: dur(8), TEXT: txt("Attention all personnel.") },
    code: block => `AnimatedBroadcast ${valueOf(block, "TARGET")} ${valueOf(block, "DURATION")} ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_player_cassie", cat: "messages", kind: "statement", icon: "f028", title: "CASSIE to players",
    tip: "Makes a CASSIE announcement that only the chosen players hear.",
    parts: ["announce to", playerInput, "on CASSIE", dd("MODE", [["with jingle", "jingle"], ["without jingle", "noJingle"]]), { input: "TEXT", check: "String" }],
    defaults: { ...allTarget, TEXT: txt("Attention, staff.") },
    code: block => `PlayerCassie ${valueOf(block, "TARGET")} ${block.getFieldValue("MODE")} ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_ban", cat: "players", kind: "statement", icon: "f05e", title: "Ban player",
    tip: "Bans the chosen players for a set time with a reason shown to them.",
    parts: ["ban", playerInput, "for", { input: "DURATION", check: "Duration" }, "reason", { input: "REASON", check: "String" }],
    defaults: { ...evTarget, DURATION: dur(1, "h"), REASON: txt("Banned by server rule") },
    code: block => `Ban ${valueOf(block, "TARGET")} ${valueOf(block, "DURATION")} ${valueOf(block, "REASON")}\n`
  });

  def({
    id: "ser_mute", cat: "players", kind: "statement", icon: "f131", title: "Mute player",
    tip: "Mutes the chosen players, either temporarily or until someone unmutes them.",
    parts: ["mute", playerInput, dd("MODE", [["temporarily", "true"], ["until unmuted", "false"]])],
    defaults: evTarget,
    code: block => `Mute ${valueOf(block, "TARGET")} ${block.getFieldValue("MODE")}\n`
  });

  def({
    id: "ser_explode", cat: "players", kind: "statement", icon: "f1e2", title: "Explode player",
    tip: "Explodes the chosen players.",
    parts: ["explode", playerInput],
    defaults: evTarget,
    code: block => `Explode ${valueOf(block, "TARGET")}\n`
  });

  def({
    id: "ser_ahp", cat: "players", kind: "statement", icon: "f067", title: "Artificial health",
    tip: "Gives the chosen players temporary health that absorbs damage before their normal health is hit.",
    parts: ["give", playerInput, { input: "AMOUNT", check: "Number" }, "artificial health, capped at", { input: "LIMIT", check: "Number" }],
    defaults: { ...evTarget, AMOUNT: num(50), LIMIT: num(75) },
    code: block => `SetAHP ${valueOf(block, "TARGET")} ${valueOf(block, "AMOUNT")} ${valueOf(block, "LIMIT")}\n`
  });

  def({
    id: "ser_regen", cat: "players", kind: "statement", icon: "f004", title: "Health regeneration",
    tip: "Adds health regeneration to the chosen players for a set number of seconds.",
    parts: ["regenerate", playerInput, "by", { input: "RATE", check: "Number" }, "per second for", { input: "DURATION", check: "Number" }, "seconds"],
    defaults: { ...evTarget, RATE: num(2), DURATION: num(10) },
    code: block => `SetRegeneration ${valueOf(block, "TARGET")} ${valueOf(block, "RATE")} ${valueOf(block, "DURATION")}\n`
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
    parts: ["set gravity of", playerInput, "to", { input: "GRAVITY", check: "Number" }],
    defaults: { ...evTarget, GRAVITY: num(-9.81) },
    code: block => `SetGravity ${valueOf(block, "TARGET")} ${valueOf(block, "GRAVITY")}\n`
  });

  def({
    id: "ser_has_perm", cat: "logic", kind: "value", output: "Boolean", icon: "f132", title: "Has permission",
    tip: "True if the player has the given permission.",
    parts: [playerInput, "has permission", { input: "PERM", check: "String" }],
    defaults: { ...evTarget, PERM: txt("ban.use") }, single: singleTarget,
    code: block => [`{HasPermission ${valueOf(block, "TARGET")} ${valueOf(block, "PERM")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_is_allowed", cat: "logic", kind: "statement", icon: "f00c", title: "EXPIREMENTAL - Allow or cancel event",
    tip: "Lets the event that started this script go ahead or cancels it. Only works in events that can be cancelled, and before any Wait block.",
    parts: ["set this event to", dd("STATE", [["allowed", "true"], ["cancelled", "false"]])],
    code: block => `IsAllowed ${block.getFieldValue("STATE")}\n`
  });

  def({
    id: "ser_event_toggle", cat: "server", kind: "statement", icon: "f011", title: "Enable or disable event",
    tip: "Turns a game event on or off. Works on events that can be cancelled.",
    parts: [dd("ACTION", [["disable", "DisableEvent"], ["enable", "EnableEvent"]]), "the event named", { input: "NAME", check: "String" }],
    defaults: { NAME: txt("RoundStarted") },
    code: block => `${block.getFieldValue("ACTION")} ${valueOf(block, "NAME")}\n`
  });

  def({
    id: "ser_db_save", cat: "server", kind: "statement", icon: "f1c0", title: "EXPIREMENTAL - Save to database",
    tip: "Stores a value in a permanent database that survives restarts. Use the same database name and key to read it back.",
    note: "Only plain numbers, text, and player values can be saved.",
    parts: ["save", { input: "VALUE", check: null }, "in database", tf("DATABASE", "saves"), "under key", { input: "KEY", check: "String" }],
    defaults: { VALUE: num(0), KEY: txt("roundCount") },
    code: block => `DB.Add ${cleanName(block.getFieldValue("DATABASE"), "saves")} ${valueOf(block, "KEY")} ${valueOf(block, "VALUE")}\n`
  });

  def({
    id: "ser_db_read", cat: "server", kind: "value", output: null, icon: "f1c0", title: "Read from database",
    tip: "Reads a value saved with 'Save to database'. Errors if the key was never saved, so save it first.",
    parts: ["read key", { input: "KEY", check: "String" }, "from database", tf("DATABASE", "saves")],
    defaults: { KEY: txt("roundCount") },
    code: block => [`{DB.Get ${cleanName(block.getFieldValue("DATABASE"), "saves")} ${valueOf(block, "KEY")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_run_wait", cat: "server", kind: "statement", icon: "f253", title: "Run script and wait",
    tip: "Runs another script and pauses this one until that script finishes.",
    parts: ["run script", { input: "TEXT", check: "String" }, "and wait for it to finish"],
    defaults: { TEXT: txt("myScript") },
    code: block => `RunScriptAndWait ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_script_running", cat: "server", kind: "value", output: "Boolean", icon: "f04b", title: "Script is running",
    tip: "True if the named script is currently running.",
    parts: ["script", { input: "TEXT", check: "String" }, "is running"],
    defaults: { TEXT: txt("myScript") },
    code: block => [`{IsRunning ${valueOf(block, "TEXT")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_tp_room", cat: "players", kind: "statement", icon: "f124", title: "Teleport to room",
    tip: "Teleports the chosen players to a room or zone, with an offset from its center.",
    parts: ["teleport", playerInput, "to", dd("PLACE", placeOptions.slice(1)), "offset x", { input: "X", check: "Number" }, "y", { input: "Y", check: "Number" }, "z", { input: "Z", check: "Number" }],
    defaults: { ...evTarget, X: num(0), Y: num(0), Z: num(0) },
    code: block => `TPRoom ${valueOf(block, "TARGET")} ${block.getFieldValue("PLACE")} ${valueOf(block, "X")} ${valueOf(block, "Y")} ${valueOf(block, "Z")}\n`
  });

  def({
    id: "ser_tp_position", cat: "players", kind: "statement", icon: "f124", title: "Teleport to position",
    tip: "Teleports the chosen players to exact world coordinates.",
    parts: ["teleport", playerInput, "to x", { input: "X", check: "Number" }, "y", { input: "Y", check: "Number" }, "z", { input: "Z", check: "Number" }],
    defaults: { ...evTarget, X: num(0), Y: num(0), Z: num(0) },
    code: block => `TPPosition ${valueOf(block, "TARGET")} ${valueOf(block, "X")} ${valueOf(block, "Y")} ${valueOf(block, "Z")}\n`
  });

  def({
    id: "ser_filter_players", cat: "players", kind: "value", output: "Player", icon: "f0c0", title: "Filter players",
    tip: "Keeps only the players in the group whose chosen property matches the value.",
    parts: ["players in", playerInput, "where", dd("PROP", [["role", "Role"], ["team", "Team"], ["alive", "IsAlive"], ["health", "Health"], ["room", "RoomRef"], ["group", "GroupName"]]), "is", { input: "VALUE", check: null }],
    defaults: { TARGET: tgt("@alivePlayers"), VALUE: txt("ClassD") },
    code: block => [`{Filter ${valueOf(block, "TARGET")} ${block.getFieldValue("PROP")} ${valueOf(block, "VALUE")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_take_players", cat: "players", kind: "value", output: "Player", icon: "f0c0", title: "Take some players",
    tip: "Keeps up to the chosen number of players from the group.",
    parts: ["take up to", { input: "LIMIT", check: "Number" }, "of", playerInput],
    defaults: { TARGET: tgt("@alivePlayers"), LIMIT: num(1) },
    code: block => [`{Take ${valueOf(block, "TARGET")} ${valueOf(block, "LIMIT")}}`, gen.ORDER_ATOMIC]
  });

  def({
    id: "ser_loadout", cat: "players", kind: "statement", icon: "f291", title: "Give role kit",
    tip: "Gives the chosen players the starting items and ammo of a role, without changing their role.",
    parts: ["give", playerInput, "the starting kit of role", dd("ROLE", asOptions(roles))],
    defaults: evTarget,
    code: block => `GrantLoadout ${valueOf(block, "TARGET")} ${block.getFieldValue("ROLE")}\n`
  });

  def({
    id: "ser_clear_data", cat: "players", kind: "statement", icon: "f1f8", title: "Clear saved data",
    tip: "Erases every value saved for the chosen players with 'Save player data'.",
    parts: ["clear all saved data of", playerInput],
    defaults: evTarget,
    code: block => `ClearPlayerData ${valueOf(block, "TARGET")}\n`
  });

  def({
    id: "ser_door_health", cat: "world", kind: "statement", icon: "f52b", title: "Set door health",
    tip: "Sets the remaining health of doors that can be broken. Gates cannot be damaged this way.",
    parts: ["set health of doors in", dd("PLACE", placeOptions), "to", { input: "HEALTH", check: "Number" }],
    defaults: { HEALTH: num(100) },
    code: block => `SetDoorHealth ${block.getFieldValue("PLACE")} ${valueOf(block, "HEALTH")}\n`
  });

  def({
    id: "ser_door_permission", cat: "world", kind: "statement", icon: "f084", title: "Set door access",
    tip: "Sets which keycard access the chosen doors require. This replaces the doors' current permissions.",
    parts: ["set doors in", dd("PLACE", placeOptions), "to require", dd("PERM", asOptions(["Checkpoints", "ExitGates", "Intercom", "AlphaWarhead", "ContainmentLevelOne", "ContainmentLevelTwo", "ContainmentLevelThree", "ArmoryLevelOne", "ArmoryLevelTwo", "ArmoryLevelThree", "ScpOverride", "All", "None"]))],
    code: block => `SetDoorPermission ${block.getFieldValue("PLACE")} ${block.getFieldValue("PERM")}\n`
  });

  def({
    id: "ser_elevator_text", cat: "world", kind: "statement", icon: "f0ec", title: "Elevator panel text",
    tip: "Changes the text on the elevator panels. An empty text resets it.",
    parts: ["set elevator panel text to", { input: "TEXT", check: "String" }],
    defaults: { TEXT: txt("Maintenance") },
    code: block => `SetElevatorText ${valueOf(block, "TEXT")}\n`
  });

  def({
    id: "ser_lights_reset", cat: "world", kind: "statement", icon: "f0eb", title: "Reset light color",
    tip: "Restores the normal light color in the chosen place.",
    parts: ["reset light color in", dd("PLACE", placeOptions)],
    code: block => `ResetLightColor ${block.getFieldValue("PLACE")}\n`
  });

  def({
    id: "ser_wave_timer", cat: "world", kind: "statement", icon: "f017", title: "Respawn timer",
    tip: "Changes how long until a respawn wave arrives.",
    parts: ["change", dd("WAVE", waveOptions), "respawn timer", dd("MODE", [["set to", "set"], ["add", "add"], ["remove", "remove"]]), { input: "TIME", check: "Duration" }],
    defaults: { TIME: dur(30) },
    code: block => `WaveRespawnTime ${block.getFieldValue("WAVE")} ${block.getFieldValue("MODE")} ${valueOf(block, "TIME")}\n`
  });

  def({
    id: "ser_audio_load", cat: "world", kind: "statement", icon: "f001", title: "Load audio clip",
    tip: "Loads an .ogg file from SER's data folder under a name you choose. The file must be 48kHz, mono.",
    parts: ["load audio file", { input: "FILE", check: "String" }, "as clip", { input: "CLIP", check: "String" }],
    defaults: { FILE: txt("alarm.ogg"), CLIP: txt("alarm") },
    code: block => `Audio.Load ${valueOf(block, "FILE")} ${valueOf(block, "CLIP")}\n`
  });

  def({
    id: "ser_speaker_create", cat: "world", kind: "statement", icon: "f028", title: "Create speaker",
    tip: "Creates a speaker that plays audio to everyone. Volume is a percentage.",
    parts: ["create speaker", { input: "NAME", check: "String" }, "at volume", { input: "VOLUME", check: "Number" }],
    defaults: { NAME: txt("main"), VOLUME: num(100) },
    code: block => `Speaker.CreateGlobal ${valueOf(block, "NAME")} ${valueOf(block, "VOLUME")}\n`
  });

  def({
    id: "ser_audio_play", cat: "world", kind: "statement", icon: "f001", title: "Play audio clip",
    tip: "Plays a loaded clip through a speaker, optionally on repeat.",
    parts: ["play clip", { input: "CLIP", check: "String" }, "through speaker", { input: "SPEAKER", check: "String" }, "loop", dd("LOOP", boolOptions)],
    defaults: { CLIP: txt("alarm"), SPEAKER: txt("main") },
    code: block => `Audio.Play ${valueOf(block, "SPEAKER")} ${valueOf(block, "CLIP")} ${block.getFieldValue("LOOP")}\n`
  });

  def({
    id: "ser_audio_stop", cat: "world", kind: "statement", icon: "f04d", title: "Stop audio",
    tip: "Stops every clip playing through a speaker.",
    parts: ["stop all audio on speaker", { input: "SPEAKER", check: "String" }],
    defaults: { SPEAKER: txt("main") },
    code: block => `Audio.Stop ${valueOf(block, "SPEAKER")}\n`
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
    // if (spec.icon) ensureRow().appendField(new Blockly.FieldLabel(glyph(spec.icon), "ser-icon"));
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
        const input = block.appendValueInput(part.input);
        if (part.check !== undefined) input.setCheck(part.check);
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