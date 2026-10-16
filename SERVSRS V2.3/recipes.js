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
  ];
};