"use strict";

/* ---------- Stato e progresso (localStorage) ---------- */
const STORE_KEY = "tarocchi-progresso";
let done = new Set(JSON.parse(localStorage.getItem(STORE_KEY) || "[]"));

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...done]));
}
function isDone(n) { return done.has(n); }
function toggleDone(n) {
  if (done.has(n)) done.delete(n); else done.add(n);
  save();
}

/* ---------- Indice lezioni ---------- */
const byNum = {};
COURSE.modules.forEach((m) => {
  m.lessons.forEach((l) => { byNum[l.num] = { lesson: l, module: m }; });
});
const total = COURSE.total;

const MODULE_ICONS = {
  bastoni: "cards/wands-01.jpg",
  coppe: "cards/cups-01.jpg",
  spade: "cards/swords-01.jpg",
  denari: "cards/pentacles-01.jpg",
  maggiori: "cards/maj-00.jpg",
  corte: "cards/cups-queen.jpg",
};

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------- DOM ---------- */
const main = document.getElementById("main");
const titleEl = document.getElementById("pageTitle");
const subtitleEl = document.getElementById("pageSubtitle");
const topbar = document.getElementById("topbar");
const backBtn = document.getElementById("backBtn");
const installBtn = document.getElementById("installBtn");
const settingsBtn = document.getElementById("settingsBtn");
const tabHome = document.getElementById("tabHome");
const tabCarta = document.getElementById("tabCarta");
const tabQuiz = document.getElementById("tabQuiz");
const tabProgress = document.getElementById("tabProgress");

function setHeader(title, subtitle, showBack) {
  titleEl.textContent = title;
  subtitleEl.textContent = subtitle || "";
  backBtn.hidden = !showBack;
}

function setTab(active) {
  tabHome.classList.toggle("active", active === "home");
  tabCarta.classList.toggle("active", active === "carta");
  tabQuiz.classList.toggle("active", active === "quiz");
  tabProgress.classList.toggle("active", active === "progress");
}

/* ---------- Impostazioni: tema e colori ---------- */
const ACCENTS = [
  { id: "salvia", nome: "Verde salvia", color: "#5F7B62" },
  { id: "terracotta", nome: "Terracotta", color: "#B3573C" },
  { id: "vinaccia", nome: "Vinaccia", color: "#9C4660" },
  { id: "rosa", nome: "Rosa polveroso", color: "#C4948C" },
  { id: "bosco", nome: "Verde bosco", color: "#3E6B5E" },
];
function hexToRgba(hex, a) {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}, ${a})`;
}
function applyAccent(color) {
  document.documentElement.style.setProperty("--accent", color);
  document.documentElement.style.setProperty("--accent-soft", hexToRgba(color, 0.16));
}
function applyTheme(theme) {
  const dark = theme === "dark" || (theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#0E1715" : "#F4EEE7");
}
function getTema() { return localStorage.getItem("tarocchi-tema") || "auto"; }
function getAccent() { return localStorage.getItem("tarocchi-accento") || ACCENTS[0].id; }

/* ---------- Router ---------- */
function route() {
  const h = location.hash || "#/";
  topbar.classList.remove("small");
  main.scrollTop = 0;
  if (h.startsWith("#/modulo/")) {
    const id = decodeURIComponent(h.split("/")[2]);
    renderModule(id);
  } else if (h.startsWith("#/lezione/")) {
    renderLesson(parseInt(h.split("/")[2], 10));
  } else if (h.startsWith("#/carta")) {
    renderCarta();
  } else if (h.startsWith("#/quiz")) {
    renderQuiz();
  } else if (h.startsWith("#/impostazioni")) {
    renderImpostazioni();
  } else if (h.startsWith("#/progressi")) {
    renderProgress();
  } else {
    renderHome();
  }
}

/* ---------- Home ---------- */
function renderHome() {
  setHeader("Corso", "Carta per carta, dall'Asso al Mondo", false);
  setTab("home");

  const doneCount = [...done].filter((n) => byNum[n]).length;
  const pct = Math.round((doneCount / total) * 100);

  let html = `
    <div class="ornamento">☾ ✦ ✦ ☾</div>
    <section class="hero">
      <div class="candela">🕯️ ✦ 🕯️</div>
      <div class="ring-row">
        <div>
          <div class="big-num">${doneCount}<small> / ${total}</small></div>
          <div class="label">lezioni completate · ${pct}%</div>
        </div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    </section>`;

  COURSE.modules.forEach((m) => {
    const label = m.name.replace(/^\S+\s/, "");
    const doneM = m.lessons.filter((l) => isDone(l.num)).length;
    html += `
      <section class="card">
        <div class="row" role="button" tabindex="0" data-nav="modulo" data-id="${esc(m.id)}">
          <div class="emoji"><img src="${MODULE_ICONS[m.id]}" alt="${esc(label)}"></div>
          <div class="body">
            <div class="t">${esc(label)}</div>
            <div class="s">${esc(m.theme)}</div>
          </div>
          <div class="meta">
            <div class="count">${doneM}/${m.lessons.length}</div>
          </div>
          <span class="chevron"><svg width="10" height="18" viewBox="0 0 10 18"><path d="M1 1l8 8-8 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        </div>
      </section>`;
  });

  main.innerHTML = html;
  bindNav();
}

/* ---------- Modulo ---------- */
function renderModule(id) {
  const m = COURSE.modules.find((x) => x.id === id);
  if (!m) { location.hash = "#/"; return; }
  const [emoji, ...rest] = m.name.split(" ");
  setHeader(rest.join(" "), m.theme, true);
  setTab("home");

  let html = `<section class="card">`;
  m.lessons.forEach((l) => {
    const d = isDone(l.num);
    const badge = l.videoUrl
      ? `<span class="pill">video ${esc(l.videoDur || "")}</span>`
      : `<span class="pill">solo libro</span>`;
    html += `
      <div class="row lesson-row ${d ? "done" : ""}" role="button" tabindex="0" data-nav="lezione" data-id="${l.num}">
        ${d ? `<div class="check"><svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="var(--green)"/><path d="M7 12.5l3 3L17 9" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`
            : `<div class="num">${l.num}</div>`}
        <div class="body">
          <div class="t">${esc(l.card)}</div>
          <div class="s">${badge}</div>
        </div>
        <span class="chevron"><svg width="10" height="18" viewBox="0 0 10 18"><path d="M1 1l8 8-8 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      </div>`;
  });
  html += `</section>`;
  main.innerHTML = html;
  bindNav();
}

/* ---------- Lezione ---------- */
function renderLesson(num) {
  const ref = byNum[num];
  if (!ref) { location.hash = "#/"; return; }
  const { lesson: l, module: m } = ref;
  const [emoji, ...rest] = m.name.split(" ");
  const modLabel = rest.join(" ");
  const d = isDone(l.num);

  setHeader("Lezione", `${modLabel} · ${l.num} di ${total}`, true);
  setTab("home");

  const thumb = l.videoUrl ? getVideoThumb(l.videoUrl) : null;
  const videoBlock = l.videoUrl
    ? `<section class="card detail-card">
        <div class="dt"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 5.5A2.5 2.5 0 016.5 3h11A2.5 2.5 0 0120 5.5v13a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 18.5v-13z" stroke="currentColor" stroke-width="1.6"/><path d="M10 8.5l5.5 3.5L10 15.5v-7z" fill="currentColor"/></svg> Video</div>
        ${thumb ? `<a class="video-thumb" href="${esc(l.videoUrl)}" target="_blank" rel="noopener"><img src="${thumb}" alt="" loading="lazy"><span class="play">▶</span></a>` : ""}
        <div class="dd"><a class="link" href="${esc(l.videoUrl)}" target="_blank" rel="noopener">${esc(l.videoTitle)}</a><span class="pill">${esc(l.videoDur || "")}</span></div>
      </section>`
    : `<section class="card detail-card">
        <div class="dt"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 5.5A2.5 2.5 0 016.5 3h11A2.5 2.5 0 0120 5.5v13a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 18.5v-13z" stroke="currentColor" stroke-width="1.6"/><path d="M10 8.5l5.5 3.5L10 15.5v-7z" fill="currentColor"/></svg> Video</div>
        <div class="dd">Video non ancora pubblicato</div>
      </section>`;

  const carta = getCardByName(l.card);
  let cartaHtml = "";
  if (carta) {
    cartaHtml = `<div class="lesson-card-img"><img src="${cardImg(carta)}" alt="${esc(l.card)}" loading="lazy"></div>`;
  } else if (FIG_PLURAL[l.card]) {
    const imgs = DECK.filter((c) => c.tipo === "corte" && c.nome.startsWith(FIG_PLURAL[l.card])).map((c) => cardImg(c));
    if (imgs.length) cartaHtml = `<div class="lesson-corte">${imgs.map((src) => `<img src="${src}" alt="" loading="lazy">`).join("")}</div>`;
  }

  let html = `
    <div class="lesson-head">
      <h2>${esc(l.card)}</h2>
    </div>

    ${cartaHtml}

    ${videoBlock}

    <section class="card detail-card">
      <div class="dt"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" stroke-width="1.6"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg> Libro</div>
      <div class="dd">«${esc(l.libro)}» · <b>${esc(l.libroPag)}</b>${l.libroNote ? `<div style="font-size:13px;color:var(--label-secondary);margin-top:6px">${esc(l.libroNote)}</div>` : ""}</div>
    </section>

    <section class="card detail-card">
      <div class="dt"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.2 4.5 4.9.7-3.5 3.5.8 4.9L12 14.2 7.6 16.6l.8-4.9L4.9 8.2l4.9-.7L12 3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg> Pratica</div>
      <div class="dd">${esc(l.pratica)}</div>
    </section>`;

  if (l.extra) {
    html += `<section class="card detail-card"><div class="dt">Semi</div><div class="dd">${esc(l.extra)}</div></section>`;
  }

  html += `
    <div class="btn-row">
      <button class="btn ${d ? "btn-done" : "btn-primary"}" id="toggleBtn">
        ${d ? "✓ Completata" : "Segna come completata"}
      </button>
    </div>`;

  main.innerHTML = html;
  document.getElementById("toggleBtn").addEventListener("click", () => {
    toggleDone(l.num);
    renderLesson(l.num);
  });
}

/* ---------- Carta del giorno ---------- */
const semeEmoji = { Bastoni: "🔥", Coppe: "💧", Spade: "🗡️", Denari: "🪙" };
const SEME_ENG = { Bastoni: "wands", Coppe: "cups", Spade: "swords", Denari: "pentacles" };
const FIG_ENG = { Fante: "page", Cavaliere: "knight", Regina: "queen", Re: "king" };
const FIG_PLURAL = { "I Fanti": "Fante", "I Cavalieri": "Cavaliere", "Le Regine": "Regina", "I Re": "Re" };
function cardImg(c) {
  if (!c) return "";
  if (c.tipo === "maggiore") return "cards/maj-" + String(c.num).padStart(2, "0") + ".jpg";
  const s = SEME_ENG[c.seme] || "wands";
  if (c.tipo === "corte") { const fig = (c.nome || "").split(" ")[0]; return "cards/" + s + "-" + (FIG_ENG[fig] || "page") + ".jpg"; }
  return "cards/" + s + "-" + String(c.num).padStart(2, "0") + ".jpg";
}
function getCardByName(nome) { return DECK.find((c) => c.nome === nome); }
function getVideoThumb(url) { const m = /[?&]v=([^&]+)/.exec(url || ""); return m ? "https://img.youtube.com/vi/" + m[1] + "/mqdefault.jpg" : null; }
function romano(n) {
  if (n === 0) return "0";
  const r = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI"];
  return r[n - 1] || String(n);
}
function todayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function notaKey() { return "tarocchi-nota-" + todayKey(); }
function loadCarta() {
  const key = todayKey();
  try {
    const s = JSON.parse(localStorage.getItem("tarocchi-carta") || "null");
    if (s && s.date === key && s.nome) return s;
  } catch (e) {}
  return null;
}
function pescaCarta() {
  const idx = Math.floor(Math.random() * DECK.length);
  const c = DECK[idx];
  const s = { date: todayKey(), nome: c.nome, sig: c.sig, tipo: c.tipo, seme: c.seme || null, num: c.num || null };
  localStorage.setItem("tarocchi-carta", JSON.stringify(s));
  return s;
}

/* --- storico --- */
function loadStorico() {
  try { return JSON.parse(localStorage.getItem("tarocchi-storico") || "[]"); } catch (e) { return []; }
}
function saveStorico(arr) { localStorage.setItem("tarocchi-storico", JSON.stringify(arr)); }
function cardSym(c) { return c.tipo === "maggiore" ? "✦" : (semeEmoji[c.seme] || "✦"); }
function formatData(key) {
  const p = key.split("-").map(Number);
  return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
}
function syncStorico() {
  const card = loadCarta();
  if (!card) return;
  const nota = localStorage.getItem(notaKey()) || "";
  const arr = loadStorico();
  const key = todayKey();
  const idx = arr.findIndex((v) => v.date === key);
  const voce = { date: key, card: { nome: card.nome, sig: card.sig, tipo: card.tipo, seme: card.seme, num: card.num }, nota: nota };
  if (idx >= 0) arr[idx] = voce; else arr.push(voce);
  arr.sort((a, b) => (a.date < b.date ? 1 : -1));
  saveStorico(arr);
}
function cronologiaHtml() {
  const stor = loadStorico().filter((v) => v.date !== todayKey());
  if (!stor.length) return `<div class="empty" style="padding:26px 20px"><div class="big">📖</div>Le tue pescate passate appariranno qui.</div>`;
  let h = `<div class="section-title">Cronologia</div><section class="card">`;
  stor.forEach((v) => {
    const nota = v.nota ? " · " + v.nota.replace(/\s+/g, " ").trim() : "";
    h += `<div class="row">
      <div class="emoji"><img src="${cardImg(v.card)}" alt=""></div>
      <div class="body">
        <div class="t">${esc(v.card.nome)}</div>
        <div class="s">${esc(formatData(v.date))}${esc(nota)}</div>
      </div>
    </div>`;
  });
  h += `</section>`;
  return h;
}

function renderCarta() {
  setHeader("Carta del giorno", "Pesca una carta dal mazzo", false);
  setTab("carta");

  let card = loadCarta();
  if (!card) card = pescaCarta();
  syncStorico();

  let tipoLabel;
  if (card.tipo === "maggiore") tipoLabel = "Arcano maggiore";
  else if (card.tipo === "corte") tipoLabel = "Carta di corte · " + card.seme;
  else tipoLabel = "Arcano minore · " + card.seme;
  const oggi = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

  let html = `
    <div class="ornamento">☾ ✦ ✦ ☾</div>
    <section class="card-day">
      <div class="card-flip"><div class="card-inner"><div class="retro"></div><div class="fronte"><img src="${cardImg(card)}" alt="${esc(card.nome)}"></div></div></div>
      <div class="nome">${esc(card.nome)}</div>
      <div class="sig">${esc(card.sig)}</div>
      <div class="tipo">${esc(tipoLabel)}</div>
      <div class="date">${esc(oggi)}</div>
    </section>
    <div class="section-title">Le tue riflessioni</div>
    <section class="card note-card">
      <textarea id="notaInput" placeholder="Scrivi qui le tue note e riflessioni su questa carta…">${esc(localStorage.getItem(notaKey()) || "")}</textarea>
    </section>
    <div class="btn-row">
      <button class="btn btn-ghost" id="ripescaBtn">Pesca un'altra carta</button>
    </div>
    ${cronologiaHtml()}`;

  main.innerHTML = html;
  const ta = document.getElementById("notaInput");
  ta.addEventListener("input", () => {
    localStorage.setItem(notaKey(), ta.value);
    syncStorico();
  });
  document.getElementById("ripescaBtn").addEventListener("click", () => {
    localStorage.removeItem("tarocchi-carta");
    renderCarta();
  });
}

/* ---------- Quiz ---------- */
let quizState = null;

function renderQuiz() {
  setHeader("Quiz", "Metti alla prova ciò che hai imparato", false);
  setTab("quiz");
  if (!quizState || quizState.done) {
    const shuffled = [...QUIZ].sort(() => Math.random() - 0.5).slice(0, 10);
    quizState = { qs: shuffled, i: 0, score: 0, done: false, answered: false, chosen: null };
  }
  drawQuiz();
}

function drawQuiz() {
  const st = quizState;
  if (st.done) {
    const best = parseInt(localStorage.getItem("tarocchi-quiz-best") || "0", 10);
    const msg = st.score >= 9 ? "Straordinario! Sei una cartomante nata ✨"
      : st.score >= 7 ? "Ottimo lavoro! Conosci bene le carte 🃏"
      : st.score >= 5 ? "Buon risultato, continua ad allenarti!"
      : "Non mollare: ripassa le carte e riprova!";
    main.innerHTML = `
      <div class="quiz-result">
        <div class="score">${st.score}/10</div>
        <div class="msg">${esc(msg)}</div>
      </div>
      <div class="quiz-best">Record personale: ${best}/10</div>
      <div class="btn-row">
        <button class="btn btn-primary" id="againBtn">Ricomincia</button>
        <button class="btn btn-ghost" id="homeBtn">Torna al corso</button>
      </div>`;
    document.getElementById("againBtn").addEventListener("click", () => { quizState = null; renderQuiz(); });
    document.getElementById("homeBtn").addEventListener("click", () => { location.hash = "#/"; });
    return;
  }

  const q = st.qs[st.i];
  let opts = "";
  q.o.forEach((opt, idx) => {
    let cls = "option";
    let dot = String.fromCharCode(65 + idx);
    if (st.answered) {
      cls += " locked";
      if (idx === q.a) { cls += " correct"; dot = "✓"; }
      else if (idx === st.chosen) { cls += " wrong"; dot = "✗"; }
      else dot = String.fromCharCode(65 + idx);
    }
    opts += `<button class="${cls}" data-opt="${idx}"><span class="dot">${dot}</span>${esc(opt)}</button>`;
  });

  const nextLabel = st.i === st.qs.length - 1 ? "Vedi risultato" : "Prossima";
  main.innerHTML = `
    <div class="quiz-count">Domanda ${st.i + 1} di ${st.qs.length} · Punteggio ${st.score}</div>
    <div class="quiz-q">${esc(q.q)}</div>
    ${opts}
    ${st.answered ? `<div class="btn-row"><button class="btn btn-primary" id="nextBtn">${nextLabel}</button></div>` : ""}`;

  document.querySelectorAll(".option").forEach((el) => {
    el.addEventListener("click", () => {
      if (st.answered) return;
      st.chosen = parseInt(el.getAttribute("data-opt"), 10);
      st.answered = true;
      if (st.chosen === q.a) st.score++;
      drawQuiz();
    });
  });
  const nb = document.getElementById("nextBtn");
  if (nb) nb.addEventListener("click", () => {
    st.i++;
    st.answered = false;
    st.chosen = null;
    if (st.i >= st.qs.length) {
      st.done = true;
      const best = parseInt(localStorage.getItem("tarocchi-quiz-best") || "0", 10);
      if (st.score > best) localStorage.setItem("tarocchi-quiz-best", String(st.score));
    }
    drawQuiz();
  });
}

/* ---------- Impostazioni ---------- */
function renderImpostazioni() {
  setHeader("Impostazioni", "Personalizza la tua app", true);
  setTab("home");

  const tema = getTema();
  const accId = getAccent();
  const acc = ACCENTS.find((a) => a.id === accId) || ACCENTS[0];

  const temaOpts = [["auto", "Sistema"], ["light", "Chiaro"], ["dark", "Scuro"]];
  const temaBtns = temaOpts.map(([v, label]) =>
    `<button class="${tema === v ? "active" : ""}" data-tema="${v}">${label}</button>`).join("");

  const swatches = ACCENTS.map((a) =>
    `<div class="swatch ${accId === a.id ? "active" : ""}" data-accent="${a.id}" style="background:${a.color}" title="${esc(a.nome)}"></div>`).join("");

  let html = `
    <div class="section-label">Aspetto</div>
    <section class="card" style="padding:12px 16px">
      <div class="segmented">${temaBtns}</div>
    </section>

    <div class="section-label">Colore accento</div>
    <section class="card" style="padding:16px">
      <div class="swatches">${swatches}</div>
      <div class="swatch-name">${esc(acc.nome)}</div>
    </section>

    <div class="section-label">Dati</div>
    <section class="card">
      <div class="row" id="resetRow">
        <div class="body">
          <div class="t">Reimposta i progressi</div>
          <div class="s">Azzera lezioni completate, quiz e cronologia</div>
        </div>
      </div>
    </section>

    <div class="ornamento" style="margin-top:22px">☾ ✦ ✦ ☾</div>
    <div class="swatch-name" style="text-align:center;margin-top:4px">Corso di Tarocchi · ${total} carte</div>`;

  main.innerHTML = html;

  document.querySelectorAll("[data-tema]").forEach((b) => {
    b.addEventListener("click", () => {
      localStorage.setItem("tarocchi-tema", b.getAttribute("data-tema"));
      applyTheme(getTema());
      renderImpostazioni();
    });
  });
  document.querySelectorAll("[data-accent]").forEach((s) => {
    s.addEventListener("click", () => {
      const id = s.getAttribute("data-accent");
      localStorage.setItem("tarocchi-accento", id);
      const a = ACCENTS.find((x) => x.id === id);
      if (a) applyAccent(a.color);
      renderImpostazioni();
    });
  });
  const rr = document.getElementById("resetRow");
  if (rr) rr.addEventListener("click", () => {
    if (confirm("Reimpostare tutti i progressi? Questa azione non può essere annullata.")) {
      ["tarocchi-progresso", "tarocchi-storico", "tarocchi-quiz-best"].forEach((k) => localStorage.removeItem(k));
      done = new Set();
      renderImpostazioni();
    }
  });
}

/* ---------- Progressi ---------- */
function renderProgress() {
  setHeader("Progressi", "Il tuo percorso nel mazzo", false);
  setTab("progress");

  const doneCount = [...done].filter((n) => byNum[n]).length;
  const pct = Math.round((doneCount / total) * 100);

  let html = `
    <div class="ornamento">☾ ✦ ✦ ☾</div>
    <section class="hero">
      <div class="ring-row">
        <div>
          <div class="big-num">${doneCount}<small> / ${total}</small></div>
          <div class="label">lezioni completate · ${pct}%</div>
        </div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    </section>`;

  if (doneCount === 0) {
    html += `<div class="empty"><div class="big">🃏</div>Nessuna lezione ancora completata.</div>
      <div class="btn-row"><button class="btn btn-primary" data-nav="lezione" data-id="1">Inizia la prima lezione</button></div>`;
  } else {
    html += `<div class="section-label">Completate</div><section class="card">`;
    COURSE.modules.forEach((m) => {
      m.lessons.forEach((l) => {
        if (isDone(l.num)) {
          html += `<div class="row lesson-row done" role="button" tabindex="0" data-nav="lezione" data-id="${l.num}">
            <div class="check"><svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="var(--green)"/><path d="M7 12.5l3 3L17 9" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <div class="body"><div class="t">${esc(l.card)}</div><div class="s">${esc(m.name.split(" ").slice(1).join(" "))}</div></div>
            <span class="chevron"><svg width="10" height="18" viewBox="0 0 10 18"><path d="M1 1l8 8-8 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
          </div>`;
        }
      });
    });
    html += `</section>`;
  }

  main.innerHTML = html;
  bindNav();
}

/* ---------- Navigazione ---------- */
function bindNav() {
  document.querySelectorAll("[data-nav]").forEach((el) => {
    const go = () => {
      const nav = el.getAttribute("data-nav");
      const id = el.getAttribute("data-id");
      if (nav === "modulo") location.hash = "#/modulo/" + encodeURIComponent(id);
      else if (nav === "lezione") location.hash = "#/lezione/" + id;
    };
    el.addEventListener("click", go);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    });
  });
}

backBtn.addEventListener("click", () => {
  if (location.hash.startsWith("#/lezione/")) {
    const ref = byNum[parseInt(location.hash.split("/")[2], 10)];
    if (ref) location.hash = "#/modulo/" + encodeURIComponent(ref.module.id);
    else history.back();
  } else {
    history.back();
  }
});

tabHome.addEventListener("click", () => { location.hash = "#/"; });
tabCarta.addEventListener("click", () => { location.hash = "#/carta"; });
tabQuiz.addEventListener("click", () => { location.hash = "#/quiz"; });
tabProgress.addEventListener("click", () => { location.hash = "#/progressi"; });
settingsBtn.addEventListener("click", () => { location.hash = "#/impostazioni"; });

/* ---------- Large title che si riduce ---------- */
main.addEventListener("scroll", () => {
  topbar.classList.toggle("small", main.scrollTop > 12);
}, { passive: true });

/* ---------- PWA: install ---------- */
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

/* ---------- Service worker ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

/* ---------- Init tema e colori ---------- */
applyTheme(getTema());
const _acc = ACCENTS.find((a) => a.id === getAccent());
if (_acc) applyAccent(_acc.color);
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (getTema() === "auto") applyTheme("auto");
});

window.addEventListener("hashchange", route);
route();
