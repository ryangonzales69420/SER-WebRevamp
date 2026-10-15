window.createSERRecipes = function createSERRecipes(api) {
  const { build } = api;

  const txt = TEXT => build("ser_text", { f: { TEXT } });
  const num = NUMBER => build("ser_number", { f: { NUMBER } });
  const tgt = TARGET => build("ser_target", { f: { TARGET } });
  const dur = (AMOUNT, UNIT = "s") => build("ser_duration", { f: { AMOUNT, UNIT } });
  const hat = (type, f, steps) => build(type, { f, b: { DO: steps } });
  const reply = TEXT => build("ser_reply", { i: { TEXT: txt(TEXT) } });
  const doors = (ACTION, PLACE) => build("ser_doors", { f: { ACTION, PLACE } });
  const lights = (PLACE, COLOR) => build("ser_lights_color", { f: { PLACE, COLOR } });
  const cassie = (MODE, TEXT) => build("ser_cassie", { f: { MODE }, i: { TEXT: txt(TEXT) } });
  const broadcast = (target, seconds, message) => build("ser_broadcast", { i: { TARGET: tgt(target), DURATION: dur(seconds), TEXT: txt(message) } });
  const hint = (target, seconds, message) => build("ser_hint", { i: { TARGET: tgt(target), DURATION: dur(seconds), TEXT: txt(message) } });
  const wait = seconds => build("ser_wait", { i: { DURATION: dur(seconds) } });

  return [
    {
      id: "hello-command",
      icon: "f075",
      title: "Hello command",
      description: "Players type a command and get a reply.",
      filename: "hello-command",
      build() {
        return hat("ser_when_command", { COMMAND: "hello", AUDIENCE: "Player" }, [reply("Hi there!")]);
      }
    },
    {
      id: "arena-start",
      icon: "f11e",
      title: "Arena start",
      description: "Opens the doors, sets the lights, announces it, then seals the arena after 20 seconds.",
      filename: "arena-start",
      build() {
        return hat("ser_when_event", { EVENT: "RoundStarted" }, [
          doors("OpenDoor", "all"),
          lights("all", "FF8800"),
          cassie("jingle", "Arena is open"),
          broadcast("@all", 5, "Arena open. Good luck!"),
          wait(20),
          doors("LockDoor", "all"),
          cassie("noJingle", "Arena is now sealed")
        ]);
      }
    },
    {
      id: "kill-rewards",
      icon: "f06b",
      title: "Kill rewards",
      description: "The attacker gets a saved kill point and a hint each time someone dies.",
      filename: "kill-rewards",
      build() {
        return hat("ser_when_event", { EVENT: "Death" }, [
          build("ser_save_add", {
            i: { AMOUNT: num(1), KEY: txt("kills"), TARGET: tgt("@evAttacker") }
          }),
          hint("@evAttacker", 4, "+1 kill")
        ]);
      }
    },
    {
      id: "scores-command",
      icon: "f091",
      title: "Scores command",
      description: "A 'scores' command loads the player's saved kills into a variable and replies with it.",
      filename: "scores-command",
      build() {
        return hat("ser_when_command", { COMMAND: "scores", AUDIENCE: "Player" }, [
          build("ser_var_from_data", {
            f: { NAME: "kills" },
            i: { KEY: txt("kills"), TARGET: tgt("@sender"), DEFAULT: num(0) }
          }),
          build("ser_reply", {
            i: { TEXT: build("ser_join", { i: { A: txt("Your kills: "), B: build("ser_get_var", { f: { NAME: "kills" } }) } }) }
          })
        ]);
      }
    },
    {
      id: "kit-command",
      icon: "f0f1",
      title: "Medkit command",
      description: "A 'kit' command heals the player, gives them a Medkit, and confirms.",
      filename: "medkit-command",
      build() {
        return hat("ser_when_command", { COMMAND: "kit", AUDIENCE: "Player" }, [
          build("ser_heal", { i: { TARGET: tgt("@sender"), AMOUNT: num(1000) } }),
          build("ser_give_item", { f: { ITEM: "Medkit" }, i: { TARGET: tgt("@sender") } }),
          reply("Kit delivered")
        ]);
      }
    },
    {
      id: "warhead-lockdown",
      icon: "f1e2",
      title: "Warhead lockdown",
      description: "When the warhead starts, the facility locks down with red lights and announcements.",
      filename: "warhead-lockdown",
      build() {
        return hat("ser_when_event", { EVENT: "Started" }, [
          doors("LockDoor", "all"),
          lights("all", "FF0000"),
          cassie("jingle", "Warhead activated. Evacuate."),
          broadcast("@all", 10, "Warhead activated!")
        ]);
      }
    },
    {
      id: "count-demo",
      icon: "f0cb",
      title: "Counting demo",
      description: "Shows how a counter loop and a variable work together.",
      filename: "counting-demo",
      build() {
        return hat("ser_when_command", { COMMAND: "count", AUDIENCE: "Player" }, [
          build("ser_count_loop", {
            f: { VAR: "i" },
            i: { FROM: num(1), TO: num(5) },
            b: { DO: [build("ser_reply", { i: { TEXT: build("ser_get_var", { f: { NAME: "i" } }) } })] }
          })
        ]);
      }
    }
  ];
};