// recipes.js
(function () {
  "use strict";

  const SCRIPT_SRC =
    (document.currentScript && document.currentScript.src) || window.location.href;
  const TEMPLATE_DIR = new URL("./templates/", SCRIPT_SRC).href;

  // Flip to false once things work.
  const DEBUG = true;

  // ----------------------------------------------------------------------
  // 1. Blockly project JSON -> { type, f, i, b, extraState }
  // ----------------------------------------------------------------------
  function isStatementKey(k) {
    return /^(DO|ELSE|THEN|BODY|STACK)$/i.test(k);
  }

  function toRecipe(node) {
    if (!node || typeof node !== "object") return node;
    const out = { type: node.type };
    if (node.extraState !== undefined) out.extraState = node.extraState;
    if (node.fields && Object.keys(node.fields).length) {
      out.f = Object.assign({}, node.fields);
    }
    if (node.inputs) {
      for (const k of Object.keys(node.inputs)) {
        const val = node.inputs[k];
        if (!val) continue;
        if (val.shadow) {
          (out.i || (out.i = {}))[k] = toRecipe(val.shadow);
        } else if (val.block) {
          if (isStatementKey(k) || val.block.next) {
            (out.b || (out.b = {}))[k] = chainToArray(val.block);
          } else {
            (out.i || (out.i = {}))[k] = toRecipe(val.block);
          }
        }
      }
    }
    return out;
  }

  function chainToArray(node) {
    const arr = [];
    let cur = node;
    while (cur) {
      arr.push(toRecipe(cur));
      cur = cur.next && cur.next.block;
    }
    return arr;
  }

  function extractRootBlock(project) {
    const list =
      project &&
      project.workspace &&
      project.workspace.blocks &&
      project.workspace.blocks.blocks;
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("no blocks under workspace.blocks.blocks[]");
    }
    return list[0];
  }

  // ----------------------------------------------------------------------
  // 2. Build with api.build(). Two paths:
  //    - No extraState: one call, args = { f, i, b }.
  //    - extraState: build with only fields, call loadExtraState, then
  //      attach every input/statement child via .getInput(name).connection.
  // ----------------------------------------------------------------------
  function connectValueInput(block, name, child) {
    const input = block.getInput(name);
    if (!input) {
      console.warn("[recipes] block has no input '" + name + "' for", block.type);
      return false;
    }
    if (!child.outputConnection) {
      console.warn("[recipes] child of input '" + name + "' has no outputConnection:", child.type);
      return false;
    }
    try {
      input.connection.connect(child.outputConnection);
      return true;
    } catch (e) {
      console.error("[recipes] connect input '" + name + "' (" + child.type + ") failed:", e);
      return false;
    }
  }

  function connectStatementInput(block, name, children) {
    const input = block.getInput(name);
    if (!input) {
      console.warn("[recipes] block has no statement input '" + name + "' for", block.type);
      return false;
    }
    let cursor = input.connection;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child || !child.previousConnection) {
        console.warn("[recipes] statement child " + i + " in '" + name + "' has no previousConnection:", child && child.type);
        continue;
      }
      try {
        cursor.connect(child.previousConnection);
        cursor = child.nextConnection;
      } catch (e) {
        console.error("[recipes] connect statement '" + name + "' child " + i + " (" + child.type + ") failed:", e);
        break;
      }
    }
    return true;
  }

  function rebuildWithApi(build, node, path) {
    if (!node || typeof node !== "object") return node;
    path = path || node.type;

    // Build children first (deepest first) so we always have concrete blocks.
    const builtInputs = {};
    if (node.i) {
      for (const k of Object.keys(node.i)) {
        const child = rebuildWithApi(build, node.i[k], path + ".i." + k);
        if (child == null) {
          console.warn("[recipes] child of " + path + " i." + k + " built to null -> dropped");
        } else {
          builtInputs[k] = child;
        }
      }
    }

    const builtStatements = {};
    if (node.b) {
      for (const k of Object.keys(node.b)) {
        const out = [];
        const list = node.b[k];
        for (let i = 0; i < list.length; i++) {
          const child = rebuildWithApi(build, list[i], path + ".b." + k + "[" + i + "]");
          if (child == null) {
            console.warn("[recipes] child of " + path + " b." + k + "[" + i + "] (" +
                         list[i].type + ") built to null -> dropped");
          } else {
            out.push(child);
          }
        }
        builtStatements[k] = out;
      }
    }

    if (DEBUG) {
      console.log("[recipes] build ->", path, "type=" + node.type,
        "extraState=", node.extraState,
        "f=", node.f ? Object.keys(node.f) : [],
        "i=", Object.keys(builtInputs),
        "b=", Object.keys(builtStatements));
    }

    // --- Path A: no extraState ---------------------------------------
    if (node.extraState === undefined) {
      const args = {};
      if (node.f) args.f = node.f;
      if (Object.keys(builtInputs).length) args.i = builtInputs;
      if (Object.keys(builtStatements).length) args.b = builtStatements;
      try {
        const result = build(node.type, args);
        if (result == null) {
          console.warn("[recipes] build(" + node.type + ") returned null for", path);
        }
        return result;
      } catch (e) {
        console.error("[recipes] build(" + node.type + ") THREW for " + path + ":", e,
          "\n  args:", args);
        return null;
      }
    }

    // --- Path B: extraState ------------------------------------------
    // Step 1: build with fields only (no inputs/statements).
    const shellArgs = {};
    if (node.f) shellArgs.f = node.f;
    let block;
    try {
      block = build(node.type, shellArgs);
    } catch (e) {
      console.error("[recipes] shell build(" + node.type + ") THREW for " + path + ":", e,
        "\n  args:", shellArgs);
      return null;
    }
    if (!block) {
      console.warn("[recipes] shell build(" + node.type + ") returned null for", path);
      return null;
    }

    // Step 2: apply mutator state.
    if (typeof block.loadExtraState === "function") {
      try {
        block.loadExtraState(node.extraState);
      } catch (e) {
        console.error("[recipes] loadExtraState failed on " + node.type + " for " + path + ":", e,
          "\n  extraState:", node.extraState);
      }
    } else {
      console.warn("[recipes] " + node.type + " has extraState but no loadExtraState; ignoring");
    }

    // Step 3: attach value inputs.
    for (const k of Object.keys(builtInputs)) {
      connectValueInput(block, k, builtInputs[k]);
    }

    // Step 4: attach statement inputs (chained).
    for (const k of Object.keys(builtStatements)) {
      connectStatementInput(block, k, builtStatements[k]);
    }

    if (DEBUG) {
      console.log("[recipes] mutator-built", path, "type=" + node.type,
        "inputs now:", (block.inputList || []).map(function (inp) { return inp.name; }));
    }
    return block;
  }

  // ----------------------------------------------------------------------
  // 3. Sync fetch.
  // ----------------------------------------------------------------------
  function syncFetch(url) {
    const xhr = new XMLHttpRequest();
    try { xhr.open("GET", url, false); xhr.send(null); }
    catch (e) { return { ok: false, status: 0, text: "", error: e }; }
    return { ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, text: xhr.responseText || "" };
  }

  // ----------------------------------------------------------------------
  // 4. Discovery.
  // ----------------------------------------------------------------------
  function basenameFromHref(href) {
    let raw = href;
    try { raw = decodeURIComponent(href); } catch (_) {}
    raw = raw.split("#")[0].split("?")[0];
    const parts = raw.split(/[\\/]/);
    return (parts[parts.length - 1] || "").trim();
  }

  function discoverFromDirectoryListing() {
    const res = syncFetch(TEMPLATE_DIR);
    if (!res.ok) throw new Error("dir listing HTTP " + res.status);
    const html = res.text;
    const found = new Set();
    const re = /href\s*=\s*"([^"]+)"/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      const name = basenameFromHref(m[1]);
      if (!name) continue;
      if (!/\.json$/i.test(name)) continue;
      if (/^index\.json$/i.test(name)) continue;
      const abs = new URL(name, TEMPLATE_DIR).href;
      if (abs.startsWith(TEMPLATE_DIR)) found.add(abs);
    }
    if (found.size === 0) throw new Error("no .json links in listing");
    return Array.from(found);
  }

  function discoverFromIndex() {
    const indexUrl = new URL("index.json", TEMPLATE_DIR).href;
    const res = syncFetch(indexUrl);
    if (!res.ok) throw new Error("index.json HTTP " + res.status);
    let index;
    try { index = JSON.parse(res.text); }
    catch (e) { throw new Error("index.json parse: " + e.message); }
    const files = Array.isArray(index.templates) ? index.templates : [];
    return files
      .map(basenameFromHref)
      .filter(function (n) { return n && /\.json$/i.test(n); })
      .map(function (name) { return new URL(name, TEMPLATE_DIR).href; });
  }

  function discoverTemplates() {
    try { return discoverFromDirectoryListing(); }
    catch (e) { console.log("[recipes] dir listing unavailable (" + e.message + "), trying index.json"); }
    try { return discoverFromIndex(); }
    catch (e) {
      console.warn("[recipes] could not auto-discover templates (" + e.message + ").");
      return [];
    }
  }

  // ----------------------------------------------------------------------
  // 5. Loader.
  // ----------------------------------------------------------------------
  const templateCache = new Map();

  function loadTemplate(url) {
    if (templateCache.has(url)) return templateCache.get(url);

    const res = syncFetch(url);
    if (!res.ok) {
      console.error("[recipes] failed " + url + " HTTP " + res.status);
      templateCache.set(url, null);
      return null;
    }

    let project;
    try { project = JSON.parse(res.text); }
    catch (e) {
      console.error("[recipes] JSON parse error in " + url + ": " + e.message);
      templateCache.set(url, null);
      return null;
    }

    let scriptName = null;
    if (typeof project.scriptName === "string") {
      const s = project.scriptName.trim();
      if (s && s.toLowerCase() !== "unnamed") scriptName = s;
    }

    let rawRecipe;
    try { rawRecipe = toRecipe(extractRootBlock(project)); }
    catch (e) {
      console.error("[recipes] bad structure in " + url + ": " + e.message);
      templateCache.set(url, null);
      return null;
    }

    const entry = { project: project, scriptName: scriptName, rawRecipe: rawRecipe };
    templateCache.set(url, entry);
    console.log("[recipes] loaded " + url + " -> " + scriptName);
    if (DEBUG) console.log("[recipes] raw recipe for " + scriptName + ":", rawRecipe);
    return entry;
  }

  // ----------------------------------------------------------------------
  // 6. Recipe objects.
  // ----------------------------------------------------------------------
  let apiRef = null;

  function makeRecipe(entry, url) {
    const name = entry.scriptName || url.split("/").pop().replace(/\.json$/i, "");
    return {
      id: name,
      icon: "f075",
      title: name,
      description: "",
      filename: name,
      build: function () {
        if (!apiRef || typeof apiRef.build !== "function") {
          console.error("[recipes] build() before createSERRecipes(api)");
          return null;
        }
        const cached = templateCache.get(url);
        if (!cached) { console.warn("[recipes] not loaded:", url); return null; }
        const result = rebuildWithApi(apiRef.build, cached.rawRecipe, name);
        if (DEBUG) console.log("[recipes] FINAL built tree for " + name + ":", result);
        return result;
      }
    };
  }

  // ----------------------------------------------------------------------
  // 7. Bootstrap.
  // ----------------------------------------------------------------------
  const recipes = [];
  let loaded = false;

  function loadEverything() {
    if (loaded) return;
    loaded = true;
    const urls = discoverTemplates();
    console.log("[recipes] discovered " + urls.length + " template(s):", urls);
    for (let i = 0; i < urls.length; i++) {
      const entry = loadTemplate(urls[i]);
      if (entry) recipes.push(makeRecipe(entry, urls[i]));
    }
    console.log("[recipes] ready:", recipes.map(function (r) { return r.id; }));
  }

  window.createSERRecipes = function createSERRecipes(api) {
    window.__serApiDebug = api; // keep for debugging; remove later if you like
    apiRef = api;
    loadEverything();
    return recipes;
  };
})();