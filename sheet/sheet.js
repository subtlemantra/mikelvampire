// Character sheet form for mikelvampire.com/sheet
// Sends to a Google Apps Script web app that writes one row per character into Mikel's Google Sheet.
(function () {
  "use strict";

  // Google Apps Script web app URL (ends in /exec). Empty = sending not switched on yet.
  var ENDPOINT = "";

  var DRAFT_KEY = "mvm-sheet-draft";
  var form = document.getElementById("sheet");
  var statusEl = document.getElementById("status");
  var saveBtn = document.getElementById("saveBtn");

  var DISCIPLINES = {
    "Animalism": ["Bond Famulus", "Sense the Beast", "Feral Whispers", "Animal Succulence", "Quell the Beast", "Unliving Hive", "Subsume the Spirit", "Animal Dominion", "Drawing Out the Beast"],
    "Auspex": ["Heightened Senses", "Sense the Unseen", "Premonition", "Scry the Soul", "Share the Senses", "Spirit's Touch", "Clairvoyance", "Possession", "Telepathy"],
    "Blood Sorcery": ["Corrosive Vitae", "A Taste for Blood", "Extinguish Vitae", "Blood of Potency", "Scorpion's Touch", "Theft of Vitae", "Baal's Caress", "Cauldron of Blood"],
    "Celerity": ["Cat's Grace", "Rapid Reflexes", "Fleetness", "Blink", "Traversal", "Draught of Elegance", "Unerring Aim", "Lightning Strike", "Split Second"],
    "Dominate": ["Cloud Memory", "Compel", "Mesmerize", "Dementation", "Forgetful Mind", "Submerged Directive", "Rationalize", "Mass Manipulation", "Terminal Decree"],
    "Fortitude": ["Resilience", "Unswayable Mind", "Toughness", "Enduring Beasts", "Defy Bane", "Fortify the Inner Façade", "Draught of Endurance", "Flesh of Marble", "Prowess from Pain"],
    "Obfuscate": ["Cloak of Shadows", "Silence of Death", "Unseen Passage", "Ghost in the Machine", "Mask of a Thousand Faces", "Conceal", "Vanish", "Cloak the Gathering", "Impostor's Guise"],
    "Potence": ["Lethal Body", "Soaring Leap", "Prowess", "Brutal Feed", "Spark of Rage", "Uncanny Grip", "Draught of Might", "Earthshock", "Fist of Caine"],
    "Presence": ["Awe", "Daunt", "Lingering Kiss", "Dread Gaze", "Entrancement", "Irresistible Voice", "Summon", "Majesty", "Star Magnetism"],
    "Protean": ["Eyes of the Beast", "Weight of the Feather", "Feral Weapons", "Earth Meld", "Shapechange", "Metamorphosis", "Mist Form", "The Unfettered Heart"],
    "Thin-Blood Alchemy": ["Far Reach", "Haze", "Envelop", "Defractionate", "Profane Hieros Gamos", "Airborne Momentum", "Awaken the Sleeper", "Counterfeit"]
  };

  var CLANS = {
    "Brujah": { d: ["Celerity", "Potence", "Presence"], bane: "Violent Temper: subtract dice equal to Bane Severity from rolls to resist fury frenzy (minimum 1 die).\nCompulsion: Rebellion." },
    "Gangrel": { d: ["Animalism", "Fortitude", "Protean"], bane: "Bestial Features: in frenzy gain animal features equal to Bane Severity, each lowering an Attribute by 1 until the next night (only one if Riding the Wave).\nCompulsion: Feral Impulses." },
    "Malkavian": { d: ["Auspex", "Dominate", "Obfuscate"], bane: "Fractured Mind: on a bestial failure or Compulsion, suffer a penalty equal to Bane Severity to one category of pools (Physical, Social or Mental) for the scene. Affliction: \nCompulsion: Delusion." },
    "Nosferatu": { d: ["Animalism", "Obfuscate", "Potence"], bane: "Repulsiveness: always have the Repulsive Flaw and can't take Looks; attempts to pass as normal lose dice equal to Bane Severity.\nCompulsion: Cryptophilia." },
    "Toreador": { d: ["Auspex", "Celerity", "Presence"], bane: "Aesthetic Fixation: in ugly surroundings lose dice equal to Bane Severity from Discipline pools.\nCompulsion: Obsession." },
    "Tremere": { d: ["Auspex", "Blood Sorcery", "Dominate"], bane: "Deficient Blood: cannot Blood Bond other Kindred; Bonding a mortal or ghoul takes extra drinks equal to Bane Severity.\nCompulsion: Perfectionism." },
    "Ventrue": { d: ["Dominate", "Fortitude", "Presence"], bane: "Rarefied Palate: can only feed from one kind of mortal: \nFeeding outside it costs Willpower equal to Bane Severity.\nCompulsion: Arrogance." },
    "Caitiff": { d: [], bane: "Clanless: start with the Suspect Flaw; no positive Status at creation; Kindred who know may impose -1 or -2 dice on Social rolls.\nNo clan Compulsion." },
    "Thin-Blooded": { d: ["Thin-Blood Alchemy"], bane: "Thin-blooded: no clan bane or Compulsion. Take damage like a mortal; sunlight deals 1 Superficial per turn.\nTake 1–3 Thin-Blood Merits and the same number of Thin-Blood Flaws." }
  };

  // Blood Potency table (index = Blood Potency 0–10)
  var BP = {
    surge: ["+1 die", "+2 dice", "+2 dice", "+3 dice", "+3 dice", "+4 dice", "+4 dice", "+5 dice", "+5 dice", "+6 dice", "+6 dice"],
    mend: ["1 Superficial", "1 Superficial", "2 Superficial", "2 Superficial", "3 Superficial", "3 Superficial", "3 Superficial", "3 Superficial", "4 Superficial", "4 Superficial", "5 Superficial"],
    bonus: ["None", "None", "+1 die", "+1 die", "+2 dice", "+2 dice", "+3 dice", "+3 dice", "+4 dice", "+4 dice", "+5 dice"],
    reroll: ["None", "Level 1", "Level 1", "Level 2 & below", "Level 2 & below", "Level 3 & below", "Level 3 & below", "Level 4 & below", "Level 4 & below", "Level 5 & below", "Level 5 & below"],
    bane: [0, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6],
    feed: ["No effect", "No effect", "Animal/bagged blood slakes half", "Animal/bagged blood slakes none", "No animal/bagged; -1 per human", "-1 per human; kill to go below 2", "-2 per human", "-2 per human; kill to go below 2", "-2 per human; kill to go below 3", "-2 per human; kill to go below 3", "-3 per human; kill to go below 3"]
  };

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "className") e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  // ---------- Dot pickers ----------
  function dotPicker(name, label, max, def) {
    var hidden = el("input", { type: "hidden", name: name, value: def || "0" });
    var wrap = el("span", { className: "dots" + (name === "hunger" || name === "humanity" ? " square" : ""), role: "group", "aria-label": label });
    var val = el("span", { className: "dotval", "aria-hidden": "true" });
    var buttons = [];
    for (var i = 1; i <= max; i++) {
      (function (n) {
        var b = el("button", { type: "button", className: "dot", "aria-label": label + " " + n });
        b.addEventListener("click", function () {
          var cur = parseInt(hidden.value || "0", 10);
          set(cur === n ? n - 1 : n); changed();
        });
        buttons.push(b); wrap.appendChild(b);
        if (max === 10 && n === 5) wrap.appendChild(el("span", { className: "gap" }));
      })(i);
    }
    function set(v) {
      v = Math.max(0, Math.min(max, parseInt(v || "0", 10) || 0));
      hidden.value = String(v); val.textContent = v;
      buttons.forEach(function (b, i) { b.classList.toggle("on", i < v); b.setAttribute("aria-pressed", i < v ? "true" : "false"); });
    }
    hidden._set = set; set(hidden.value);
    var box = el("span", { className: "dots-box" }, [wrap, val]);
    box.style.display = "inline-flex"; box.style.alignItems = "center"; box.style.gap = ".4rem";
    return { box: box, hidden: hidden };
  }

  document.querySelectorAll(".dots-list").forEach(function (list) {
    var max = parseInt(list.getAttribute("data-max") || "5", 10);
    var def = list.getAttribute("data-default") || "0";
    var isSkill = list.getAttribute("data-group") === "skill";
    list.getAttribute("data-keys").split(",").forEach(function (pair) {
      var p = pair.split(":"), key = p[0], label = p[1];
      var dp = dotPicker(key, label, max, def);
      var row = el("div", { className: "dot-row" }, [el("span", { className: "lbl", text: label }), dp.box, dp.hidden]);
      if (isSkill) row.appendChild(el("input", { className: "spec", name: "spec_" + key, maxlength: "60", placeholder: "Specialty", "aria-label": label + " specialty" }));
      list.appendChild(row);
    });
  });

  // ---------- Disciplines ----------
  var dl = el("datalist", { id: "discNames" });
  Object.keys(DISCIPLINES).forEach(function (d) { dl.appendChild(el("option", { value: d })); });
  document.body.appendChild(dl);
  Object.keys(DISCIPLINES).forEach(function (d) {
    var l = el("datalist", { id: "pw-" + d.replace(/\W+/g, "") });
    DISCIPLINES[d].forEach(function (p) { l.appendChild(el("option", { value: p })); });
    document.body.appendChild(l);
  });
  var grid = document.getElementById("discGrid");
  for (var n = 1; n <= 6; n++) {
    var name = el("input", { name: "disc" + n, list: "discNames", maxlength: "40", placeholder: "Discipline " + n, "aria-label": "Discipline " + n });
    var dp = dotPicker("disc" + n + "_dots", "Discipline " + n + " dots", 5, "0");
    var box = el("div", { className: "disc" }, [el("div", { className: "head" }, [name, dp.box, dp.hidden])]);
    for (var i = 1; i <= 5; i++) box.appendChild(el("input", { className: "pw", name: "disc" + n + "_power" + i, maxlength: "60", placeholder: "Power " + i, "aria-label": "Discipline " + n + " power " + i }));
    (function (nameInput, box) {
      function link() {
        var id = "pw-" + (nameInput.value || "").replace(/\W+/g, "");
        box.querySelectorAll("input.pw").forEach(function (p) { if (document.getElementById(id)) p.setAttribute("list", id); else p.removeAttribute("list"); });
      }
      nameInput.addEventListener("input", link); nameInput._link = link;
    })(name, box);
    grid.appendChild(box);
  }

  // ---------- Advantages ----------
  var adv = document.getElementById("advList");
  for (var a = 1; a <= 11; a++) {
    var adp = dotPicker("adv" + a + "_dots", "Advantage " + a + " dots", 5, "0");
    adv.appendChild(el("div", { className: "adv-row" }, [el("input", { name: "adv" + a, maxlength: "80", placeholder: a <= 2 ? (a === 1 ? "e.g. Haven" : "e.g. Flaw: Prey Exclusion") : "", "aria-label": "Advantage or Flaw " + a }), adp.box, adp.hidden]));
  }

  // ---------- Values ----------
  function field(name) { return form.querySelector('[name="' + name + '"]'); }
  function num(name) { var f = field(name); return f ? (parseInt(f.value || "0", 10) || 0) : 0; }
  function setVal(name, v) {
    var f = field(name); if (!f) return;
    if (f._set) f._set(v); else f.value = v == null ? "" : v;
    if (/^disc\d$/.test(name) && f._link) f._link();
  }
  function collect() {
    var data = {};
    form.querySelectorAll("[name]").forEach(function (f) { data[f.name] = f.value; });
    return data;
  }

  // ---------- Auto-filled fields ----------
  form.querySelectorAll("[data-auto]").forEach(function (f) {
    f.addEventListener("input", function () { f.dataset.touched = "1"; });
  });
  function auto(name, v) { var f = field(name); if (f && !f.dataset.touched) f.value = v; }
  function updateDerived() {
    var clan = field("clan").value, bp = num("blood_potency");
    var thin = clan === "Thin-Blooded";
    auto("blood_surge", BP.surge[bp]); auto("mend_amount", BP.mend[bp]); auto("power_bonus", BP.bonus[bp]);
    auto("rouse_reroll", BP.reroll[bp]); auto("feeding_penalty", BP.feed[bp]);
    auto("bane_severity", String(thin ? 0 : BP.bane[bp]));
    auto("clan_bane", CLANS[clan] ? CLANS[clan].bane : "");
    var hint = document.getElementById("clanHint");
    if (CLANS[clan] && CLANS[clan].d.length) hint.textContent = clan + " Disciplines: " + CLANS[clan].d.join(", ") + ".";
    else if (clan === "Caitiff") hint.textContent = "Caitiff: choose any two Disciplines (2 dots in one, 1 in the other).";
    else hint.textContent = "";
    var st = num("stamina"), co = num("composure"), re = num("resolve");
    document.getElementById("hp").textContent = st ? st + 3 : "—";
    document.getElementById("wp").textContent = (co || re) ? co + re : "—";
    counters();
  }

  function counters() {
    var attrs = ["strength", "dexterity", "stamina", "charisma", "manipulation", "composure", "intelligence", "wits", "resolve"].map(num);
    var want = [4, 3, 3, 3, 2, 2, 2, 2, 1];
    var got = attrs.slice().sort(function (a, b) { return b - a; });
    var ok = got.join() === want.join();
    var ac = document.getElementById("attrCount");
    ac.innerHTML = ok ? '<span class="ok">✓ Matches the starting spread (4, 3, 3, 3, 2, 2, 2, 2, 1).</span>'
      : '<span class="warn">Your dots: ' + got.join(", ") + '</span> · Starting spread is 4, 3, 3, 3, 2, 2, 2, 2, 1.';
    var skills = Array.prototype.map.call(document.querySelectorAll('.skills input[type="hidden"]'), function (i) { return parseInt(i.value || "0", 10); });
    var c = [0, 0, 0, 0, 0, 0]; skills.forEach(function (v) { c[v]++; });
    var spreads = { "Jack of all trades": [0, 10, 8, 1, 0], "Balanced": [0, 7, 5, 3, 0], "Specialist": [0, 3, 3, 3, 1] };
    var match = Object.keys(spreads).filter(function (k) { var s = spreads[k]; return c[1] === s[1] && c[2] === s[2] && c[3] === s[3] && c[4] === s[4] && c[5] === 0; })[0];
    document.getElementById("skillCount").innerHTML = match ? '<span class="ok">✓ ' + match + ' spread.</span>'
      : '<span class="warn">Skills at 4: ' + c[4] + ' · at 3: ' + c[3] + ' · at 2: ' + c[2] + ' · at 1: ' + c[1] + (c[5] ? ' · at 5: ' + c[5] : '') + '</span>';
  }

  // ---------- Draft (this device only) ----------
  var draftTimer;
  function saveDraft() {
    try {
      var d = collect();
      d._touched = Array.prototype.filter.call(form.querySelectorAll("[data-auto]"), function (f) { return f.dataset.touched; }).map(function (f) { return f.name; });
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch (e) {}
  }
  function changed() {
    updateDerived();
    clearTimeout(draftTimer); draftTimer = setTimeout(saveDraft, 400);
    setStatus("Draft saved on this device. Press “Send to Mikel” when you're ready.", "");
  }
  function fill(d) {
    (d._touched || []).forEach(function (n) { var f = field(n); if (f) f.dataset.touched = "1"; });
    Object.keys(d).forEach(function (k) { if (k.charAt(0) !== "_" && k !== "updated") setVal(k, d[k]); });
    // values loaded from Mikel's sheet count as chosen, so don't overwrite them automatically
    form.querySelectorAll("[data-auto]").forEach(function (f) { if (d[f.name]) f.dataset.touched = "1"; });
    updateDerived();
  }
  form.addEventListener("input", changed);
  form.addEventListener("change", changed);
  try { var saved = localStorage.getItem(DRAFT_KEY); if (saved) fill(JSON.parse(saved)); } catch (e) {}
  updateDerived();

  // ---------- Talking to Mikel's sheet ----------
  function setStatus(msg, cls) { statusEl.textContent = msg; statusEl.className = cls || ""; }

  var dlg = document.getElementById("riddleDlg"), ansInput = document.getElementById("riddleAns");
  function getAnswer() {
    return new Promise(function (resolve) {
      var saved = null;
      try { saved = sessionStorage.getItem("mvm-word"); } catch (e) {}
      if (saved) return resolve(saved);
      if (!dlg.showModal) { var a = window.prompt("Answer the riddle:\nWhat bitter rose / Of liquid splendor / Can feed both thirst / And boisterous humor?"); return resolve(a); }
      ansInput.value = ""; dlg.showModal(); ansInput.focus();
      function done(v) { dlg.close(); cleanup(); resolve(v); }
      function onSubmit(e) { e.preventDefault(); done(ansInput.value); }
      function onCancel() { done(null); }
      var f = document.getElementById("riddleForm"), c = document.getElementById("riddleCancel");
      function cleanup() { f.removeEventListener("submit", onSubmit); c.removeEventListener("click", onCancel); dlg.removeEventListener("cancel", onCancel); }
      f.addEventListener("submit", onSubmit); c.addEventListener("click", onCancel); dlg.addEventListener("cancel", onCancel);
    });
  }

  function post(payload) {
    return fetch(ENDPOINT, { method: "POST", body: JSON.stringify(payload) }).then(function (r) { return r.json(); });
  }

  function needNames() {
    var ok = true;
    ["player", "character"].forEach(function (n) {
      var f = field(n), bad = !f.value.trim();
      f.parentElement.classList.toggle("invalid", bad); if (bad) ok = false;
    });
    if (!ok) { document.getElementById("s-who").scrollIntoView({ behavior: "smooth" }); setStatus("Enter your player name and character name first.", "bad"); }
    return ok;
  }

  function call(action, extra) {
    if (!ENDPOINT) { setStatus("Sending isn't switched on yet. Your draft is safe on this device.", "bad"); return Promise.resolve(null); }
    return getAnswer().then(function (answer) {
      if (!answer) { setStatus("Not sent. The riddle needs an answer.", "bad"); return null; }
      saveBtn.disabled = true;
      var payload = Object.assign({ action: action, answer: answer }, extra);
      return post(payload).then(function (res) {
        saveBtn.disabled = false;
        if (res && res.error === "riddle") {
          try { sessionStorage.removeItem("mvm-word"); } catch (e) {}
          setStatus("The seal holds. That is not the answer.", "bad"); return null;
        }
        try { sessionStorage.setItem("mvm-word", answer); } catch (e) {}
        return res;
      }).catch(function () {
        saveBtn.disabled = false;
        setStatus("Couldn't reach Mikel's sheet. Check your connection and try again; your draft is safe.", "bad"); return null;
      });
    });
  }

  saveBtn.addEventListener("click", function () {
    if (!needNames()) return;
    saveDraft();
    setStatus("Sending…", "");
    call("save", { data: collect() }).then(function (res) {
      if (!res) return;
      if (res.ok) setStatus("✓ Sent! Mikel has " + field("character").value.trim() + "'s sheet. You can keep editing and send again any time.", "good");
      else setStatus("Not sent: " + (res.error || "something went wrong."), "bad");
    });
  });

  document.getElementById("loadBtn").addEventListener("click", function () {
    if (!needNames()) return;
    setStatus("Looking for your sheet…", "");
    call("load", { player: field("player").value.trim(), character: field("character").value.trim() }).then(function (res) {
      if (!res) return;
      if (res.ok && res.data) { fill(res.data); saveDraft(); setStatus("✓ Loaded your saved sheet. Make your changes, then send again.", "good"); }
      else setStatus("No saved sheet found under those two names. Check the spelling.", "bad");
    });
  });
})();
