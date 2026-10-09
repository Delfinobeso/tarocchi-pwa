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
    <section class="hero">
      <div class="ring-row">
        <div>
          <div class="big-num">${doneCount}<small> / ${total}</small></div>
          <div class="label">lezioni completate · ${pct}%</div>
        </div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    </section>`;

  COURSE.modules.forEach((m) => {
    const [emoji, ...rest] = m.name.split(" ");
    const label = rest.join(" ");
    const doneM = m.lessons.filter((l) => isDone(l.num)).length;
    html += `
      <section class="card">
        <div class="row" data-nav="modulo" data-id="${esc(m.id)}">
          <div class="emoji">${emoji}</div>
          <div class="body">
            <div class="t">${esc(label)}</div>
            <div class="s">${esc(m.theme)}</div>
          </div>
          <div class="meta">
            <div class="count">${doneM}/${m.lessons.length}</div>
            <div class="frac">${m.lessons.length} lezioni</div>
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

  let html = `<div class="section-label">${esc(m.theme)}</div><section class="card">`;
  m.lessons.forEach((l) => {
    const d = isDone(l.num);
    const badge = l.videoUrl
      ? `<span class="pill">video ${esc(l.videoDur || "")}</span>`
      : `<span class="pill">solo libro</span>`;
    html += `
      <div class="row lesson-row ${d ? "done" : ""}" data-nav="lezione" data-id="${l.num}">
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

  const videoBlock = l.videoUrl
    ? `<section class="card detail-card">
        <div class="dt"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 5.5A2.5 2.5 0 016.5 3h11A2.5 2.5 0 0120 5.5v13a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 18.5v-13z" stroke="currentColor" stroke-width="1.6"/><path d="M10 8.5l5.5 3.5L10 15.5v-7z" fill="currentColor"/></svg> Video</div>
        <div class="dd"><a class="link" href="${esc(l.videoUrl)}" target="_blank" rel="noopener">${esc(l.videoTitle)}</a><span class="pill">${esc(l.videoDur || "")}</span></div>
      </section>`
    : `<section class="card detail-card">
        <div class="dt"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 5.5A2.5 2.5 0 016.5 3h11A2.5 2.5 0 0120 5.5v13a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 18.5v-13z" stroke="currentColor" stroke-width="1.6"/><path d="M10 8.5l5.5 3.5L10 15.5v-7z" fill="currentColor"/></svg> Video</div>
        <div class="dd">Video non ancora pubblicato</div>
      </section>`;

  let html = `
    <div class="lesson-head">
      <div class="kicker">Lezione ${l.num} · ${esc(modLabel)}</div>
      <h2>${esc(l.card)}</h2>
    </div>

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

function renderCarta() {
  setHeader("Carta del giorno", "Pesca dal mazzo Rider-Waite", false);
  setTab("carta");

  let card = loadCarta();
  if (!card) card = pescaCarta();

  let sym, sub, tipoLabel;
  if (card.tipo === "maggiore") {
    sym = "✦"; sub = romano(card.num);
    tipoLabel = "Arcano maggiore";
  } else {
    const emoji = semeEmoji[card.seme] || "✦";
    if (card.tipo === "corte") {
      sym = emoji; sub = card.nome.split(" ")[0];
      tipoLabel = "Carta di corte · " + card.seme;
    } else {
      sym = emoji; sub = card.num === 1 ? "A" : String(card.num);
      tipoLabel = "Arcano minore · " + card.seme;
    }
  }
  const oggi = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

  let html = `
    <section class="card-day">
      <div class="art"><div class="sym">${esc(sym)}</div><div class="sub">${esc(sub)}</div></div>
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
    </div>`;

  main.innerHTML = html;
  const ta = document.getElementById("notaInput");
  ta.addEventListener("input", () => localStorage.setItem(notaKey(), ta.value));
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

/* ---------- Progressi ---------- */
function renderProgress() {
  setHeader("Progressi", "Il tuo percorso nel mazzo", false);
  setTab("progress");

  const doneCount = [...done].filter((n) => byNum[n]).length;
  const pct = Math.round((doneCount / total) * 100);

  let html = `
    <section class="hero">
      <div class="ring-row">
        <div>
          <div class="big-num">${doneCount}<small> / ${total}</small></div>
          <div class="label">carte studiate · ${pct}%</div>
        </div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    </section>`;

  if (doneCount === 0) {
    html += `<div class="empty"><div class="big">🃏</div>Non hai ancora completato nessuna lezione.<br>Inizia dall'Asso di Bastoni!</div>`;
  } else {
    html += `<div class="section-label">Completate</div><section class="card">`;
    COURSE.modules.forEach((m) => {
      m.lessons.forEach((l) => {
        if (isDone(l.num)) {
          const [emoji] = m.name.split(" ");
          html += `<div class="row lesson-row done" data-nav="lezione" data-id="${l.num}">
            <div class="check"><svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="var(--green)"/><path d="M7 12.5l3 3L17 9" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <div class="body"><div class="t">${esc(l.card)}</div><div class="s">${emoji} ${esc(m.name.split(" ").slice(1).join(" "))}</div></div>
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
    el.addEventListener("click", () => {
      const nav = el.getAttribute("data-nav");
      const id = el.getAttribute("data-id");
      if (nav === "modulo") location.hash = "#/modulo/" + encodeURIComponent(id);
      else if (nav === "lezione") location.hash = "#/lezione/" + id;
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

window.addEventListener("hashchange", route);
route();
