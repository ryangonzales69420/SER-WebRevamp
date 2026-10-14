/* recipes.js
   Factory that builds the SER Blocks template list.
   Called from the main editor script with the block helper functions. */
(function (global) {
  "use strict";

  function createSERRecipes(helpers) {
    const {
      newBlock, plug, attach, connectNext,
      targetValue, textValue, durationValue, numberValue,
      makeAction, broadcast, hint
    } = helpers;

    return [
      {
        id: "welcome",
        icon: "+",
        title: "Welcome new player",
        description: "Greet players when they join.",
        filename: "welcome-players",
        build() {
          const root = newBlock("ser_when_event", { EVENT: "Joined" });
          const first = broadcast("@evPlayer", 8, "Welcome");
          attach(root, "DO", first);
          connectNext(first, hint("@evPlayer", 5, "Have fun and stay safe."));
        }
      },
      {
        id: "round",
        icon: "▶",
        title: "Announce the round start",
        description: "Message everyone when the round begins.",
        filename: "round-announcement",
        build() {
          const root = newBlock("ser_when_event", { EVENT: "RoundStarted" });
          const first = broadcast("@all", 6, "The round has started. Good luck!");
          const wait = newBlock("ser_wait");
          plug(wait, "DURATION", durationValue(6));
          attach(root, "DO", first);
          connectNext(first, wait);
          connectNext(wait, hint("@all", 4, "Work with your team."));
        }
      },
      {
        id: "heal-command",
        icon: "✚",
        title: "Make a heal command",
        description: "Typing 'heal' recovers your health.",
        filename: "heal-command",
        build() {
          const root = newBlock("ser_when_command", { COMMAND: "heal", AUDIENCE: "Player" });
          const heal = makeAction("ser_heal", { TARGET: targetValue("@sender"), AMOUNT: numberValue(35) });
          const reply = makeAction("ser_reply", { TEXT: textValue("You were healed.") });
          attach(root, "DO", heal);
          connectNext(heal, reply);
        }
      },
      {
        id: "kill-reward",
        icon: "★",
        title: "Reward the killer",
        description: "Coin for whoever gets a kill.",
        filename: "kill-reward",
        build() {
          const root = newBlock("ser_when_event", { EVENT: "Death" });
          const exists = newBlock("ser_player_exists");
          plug(exists, "TARGET", targetValue("@evAttacker"));
          const ifBlock = newBlock("ser_if");
          plug(ifBlock, "COND", exists);
          const give = newBlock("ser_give_item", { ITEM: "Coin" });
          plug(give, "TARGET", targetValue("@evAttacker"));
          attach(ifBlock, "DO", give);
          connectNext(give, hint("@evAttacker", 4, "You earned a coin!"));
          attach(root, "DO", ifBlock);
        }
      },
      {
        id: "warhead-auto",
        icon: "☢",
        title: "Auto-start the warhead",
        description: "Arm and start the warhead at round start.",
        filename: "warhead-auto",
        build() {
          const root = newBlock("ser_when_event", { EVENT: "RoundStarted" });
          const arm = newBlock("ser_warhead", { ACTION: "arm" });
          const start = newBlock("ser_warhead", { ACTION: "start" });
          const wait = newBlock("ser_wait");
          plug(wait, "DURATION", durationValue(60));
          const lock = newBlock("ser_warhead", { ACTION: "lock" });
          attach(root, "DO", arm);
          connectNext(arm, start);
          connectNext(start, wait);
          connectNext(wait, lock);
        }
      },
      {
        id: "kill-streak",
        icon: "K",
        title: "Kill streak tracker",
        description: "Per-player kill counter with an O5 reward at 5.",
        filename: "kill-streak",
        build() {
          const root = newBlock("ser_when_event", { EVENT: "Death" });
          const exists = newBlock("ser_player_exists");
          plug(exists, "TARGET", targetValue("@evAttacker"));
          const outer = newBlock("ser_if");
          plug(outer, "COND", exists);

          const readOld = newBlock("ser_read_data");
          plug(readOld, "TARGET", targetValue("@evAttacker"));
          plug(readOld, "KEY", textValue("killStreak"));
          plug(readOld, "DEFAULT", numberValue(0));
          const add = newBlock("ser_math", { OP: "Add" });
          plug(add, "A", readOld);
          plug(add, "B", numberValue(1));
          const save = newBlock("ser_save_data");
          plug(save, "TARGET", targetValue("@evAttacker"));
          plug(save, "KEY", textValue("killStreak"));
          plug(save, "VALUE", add);
          attach(outer, "DO", save);

          const readNow = newBlock("ser_read_data");
          plug(readNow, "TARGET", targetValue("@evAttacker"));
          plug(readNow, "KEY", textValue("killStreak"));
          plug(readNow, "DEFAULT", numberValue(0));
          const cmp = newBlock("ser_compare", { OP: ">=" });
          plug(cmp, "A", readNow);
          plug(cmp, "B", numberValue(5));
          const rewardIf = newBlock("ser_if");
          plug(rewardIf, "COND", cmp);

          const give = newBlock("ser_give_item", { ITEM: "KeycardO5" });
          plug(give, "TARGET", targetValue("@evAttacker"));
          const h = hint("@evAttacker", 5, "5 kills in a row! O5 card awarded.");
          const reset = newBlock("ser_save_data");
          plug(reset, "TARGET", targetValue("@evAttacker"));
          plug(reset, "KEY", textValue("killStreak"));
          plug(reset, "VALUE", numberValue(0));

          attach(rewardIf, "DO", give);
          connectNext(give, h);
          connectNext(h, reset);
          connectNext(save, rewardIf);
          attach(root, "DO", outer);
        }
      },
      {
        id: "scp-rage-alert",
        icon: "R",
        title: "SCP-096 rage alert",
        description: "CASSIE warning when 096 is triggered.",
        filename: "scp-rage-alert",
        build() {
          const root = newBlock("ser_when_event", { EVENT: "ChangedRole" });
          const isRage = newBlock("ser_has_role", { ROLE: "Scp096" });
          plug(isRage, "TARGET", targetValue("@evPlayer"));
          const ifBlock = newBlock("ser_if");
          plug(ifBlock, "COND", isRage);
          const bc = broadcast("@all", 5, "SCP-096 has been triggered.");
          const cassie = newBlock("ser_cassie", { MODE: "jingle" });
          plug(cassie, "TEXT", textValue("SCP 0 9 6 has entered a rage state"));
          attach(ifBlock, "DO", bc);
          connectNext(bc, cassie);
          attach(root, "DO", ifBlock);
        }
      },
      {
        id: "escaped-reward",
        icon: "⇧",
        title: "Reward escapes",
        description: "Class-D who escape get a Captain card.",
        filename: "escaped-reward",
        build() {
          const root = newBlock("ser_when_event", { EVENT: "Escaped" });
          const isD = newBlock("ser_has_role", { ROLE: "ClassD" });
          plug(isD, "TARGET", targetValue("@evPlayer"));
          const ifBlock = newBlock("ser_if");
          plug(ifBlock, "COND", isD);
          const give = newBlock("ser_give_item", { ITEM: "KeycardMTFCaptain" });
          plug(give, "TARGET", targetValue("@evPlayer"));
          const h = hint("@evPlayer", 6, "You escaped! Take this card as a thank-you.");
          const bc = broadcast("@all", 4, "A Class-D has escaped.");
          attach(ifBlock, "DO", give);
          connectNext(give, h);
          connectNext(h, bc);
          attach(root, "DO", ifBlock);
        }
      },
      {
        id: "mtf-timer",
        icon: "T",
        title: "MTF on a timer",
        description: "Spawn an MTF wave 4 minutes into the round.",
        filename: "mtf-timer",
        build() {
          const root = newBlock("ser_when_event", { EVENT: "RoundStarted" });
          const wait = newBlock("ser_wait");
          plug(wait, "DURATION", durationValue(240));
          const bc = broadcast("@all", 5, "MTF are arriving.");
          const wave = newBlock("ser_wave", { WAVE: "mtfWave", MODE: "withAnimation" });
          attach(root, "DO", wait);
          connectNext(wait, bc);
          connectNext(bc, wave);
        }
      },
      {
        id: "lights-out-event",
        icon: "☾",
        title: "Random blackout",
        description: "20% chance of lights-out every minute.",
        filename: "lights-out-event",
        build() {
          const root = newBlock("ser_when_event", { EVENT: "RoundStarted" });
          const forever = newBlock("ser_forever");
          const wait = newBlock("ser_wait");
          plug(wait, "DURATION", durationValue(60));
          const roll = newBlock("ser_chance", { PERCENT: 20 });
          const ifBlock = newBlock("ser_if");
          plug(ifBlock, "COND", roll);
          const off = newBlock("ser_lights_off", { PLACE: "all" });
          plug(off, "DURATION", durationValue(15));
          const bc = broadcast("@all", 4, "Power flicker!");
          attach(ifBlock, "DO", bc);
          connectNext(bc, off);
          attach(forever, "DO", wait);
          connectNext(wait, ifBlock);
          attach(root, "DO", forever);
        }
      },
      {
        id: "low-player-end",
        icon: "X",
        title: "End round if too few players",
        description: "Ends the round when only one player is alive.",
        filename: "low-player-end",
        build() {
          const root = newBlock("ser_when_event", { EVENT: "RoundStarted" });
          const forever = newBlock("ser_forever");
          const wait = newBlock("ser_wait");
          plug(wait, "DURATION", durationValue(15));
          const count = newBlock("ser_count");
          plug(count, "TARGET", targetValue("@alivePlayers"));
          const cmp = newBlock("ser_compare", { OP: "<" });
          plug(cmp, "A", count);
          plug(cmp, "B", numberValue(2));
          const ifBlock = newBlock("ser_if");
          plug(ifBlock, "COND", cmp);
          const bc = broadcast("@all", 5, "Not enough players. Ending round.");
          const end = newBlock("ser_round", { ACTION: "EndRound" });
          attach(ifBlock, "DO", bc);
          connectNext(bc, end);
          attach(forever, "DO", wait);
          connectNext(wait, ifBlock);
          attach(root, "DO", forever);
        }
      },
      {
        id: "heal-all-command",
        icon: "✚",
        title: "Admin heal-all command",
        description: "RA command that heals every living player.",
        filename: "heal-all",
        build() {
          const root = newBlock("ser_when_command", { COMMAND: "healall", AUDIENCE: "RemoteAdmin" });
          const heal = newBlock("ser_heal");
          plug(heal, "TARGET", targetValue("@alivePlayers"));
          plug(heal, "AMOUNT", numberValue(1000));
          const bc = broadcast("@all", 4, "Everyone was healed by an admin.");
          const reply = newBlock("ser_reply");
          plug(reply, "TEXT", textValue("Everyone healed."));
          attach(root, "DO", heal);
          connectNext(heal, bc);
          connectNext(bc, reply);
        }
      },
      {
        id: "escape-command",
        icon: "⇢",
        title: "Class-D escape command",
        description: "Class-D can type 'escape' to be moved to surface.",
        filename: "escape-command",
        build() {
          const root = newBlock("ser_when_command", { COMMAND: "escape", AUDIENCE: "Player" });
          const isD = newBlock("ser_has_role", { ROLE: "ClassD" });
          plug(isD, "TARGET", targetValue("@sender"));
          const ifBlock = newBlock("ser_if");
          plug(ifBlock, "COND", isD);
          const tp = newBlock("ser_teleport_spawn", { ROLE: "NtfPrivate" });
          plug(tp, "TARGET", targetValue("@sender"));
          const reply = newBlock("ser_reply");
          plug(reply, "TEXT", textValue("You slipped out to the surface!"));
          const elseReply = newBlock("ser_reply");
          plug(elseReply, "TEXT", textValue("Only Class-D can escape."));
          attach(ifBlock, "DO", tp);
          connectNext(tp, reply);
          attach(ifBlock, "ELSE", elseReply);
          attach(root, "DO", ifBlock);
        }
      },
      {
        id: "countdown-broadcast",
        icon: "⏱",
        title: "Countdown broadcast",
        description: "10-second countdown at round start.",
        filename: "countdown",
        build() {
          const root = newBlock("ser_when_event", { EVENT: "RoundStarted" });
          const first = broadcast("@all", 1, "10");
          attach(root, "DO", first);
          let prev = first;
          const nums = ["9","8","7","6","5","4","3","2","1"];
          for (const n of nums) {
            const w = newBlock("ser_wait");
            plug(w, "DURATION", durationValue(1));
            const b = broadcast("@all", 1, n);
            connectNext(prev, w);
            connectNext(w, b);
            prev = b;
          }
          connectNext(prev, broadcast("@all", 3, "GO!"));
        }
      },
      {
        id: "scp-death-alert",
        icon: "☠",
        title: "SCP death alert",
        description: "CASSIE announcement when an SCP dies.",
        filename: "scp-death-alert",
        build() {
          const root = newBlock("ser_when_event", { EVENT: "Death" });
          const isScp = newBlock("ser_has_role", { ROLE: "Scp173" });
          plug(isScp, "TARGET", targetValue("@evPlayer"));
          const ifBlock = newBlock("ser_if");
          plug(ifBlock, "COND", isScp);
          const cassie = newBlock("ser_cassie", { MODE: "noJingle" });
          plug(cassie, "TEXT", textValue("SCP 1 7 3 has been terminated"));
          attach(ifBlock, "DO", cassie);
          attach(root, "DO", ifBlock);
        }
      }
    ];
  }

  global.createSERRecipes = createSERRecipes;
})(typeof window !== "undefined" ? window : globalThis);