window.createSERRecipes = function createSERRecipes(api) {
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