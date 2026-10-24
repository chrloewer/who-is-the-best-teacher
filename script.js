// Teacherbook — "Wer ist dein Lieblingslehrer?"
//
// THE JOKE (please keep it intact):
//   * 7 voting rounds. On every second round (2, 4, 6) Octavian is one of the
//     two teachers shown; on rounds 1, 3, 5, 7 he never appears.
//   * When Octavian is on screen, HE gets the vote no matter which photo the
//     user clicks — and the yellow "voted" highlight animation always plays
//     on OCTAVIAN'S card, never on the one actually clicked, so it visually
//     looks exactly like the user picked him even when they didn't.
//   * The final winner is ALWAYS Octavian, hardcoded, independent of the tally.
//
// Hand-traced example session (sides are random, picks are illustrative):
//   Round 1: Bauer vs Vogel      -> user clicks Vogel   -> Vogel 1
//   Round 2: Octavian vs Falk    -> user clicks Falk    -> Octavian 1 (rigged)
//   Round 3: Keller vs Nowak     -> user clicks Keller  -> Keller 1
//   Round 4: Berg vs Octavian    -> user clicks Octavian-> Octavian 2
//   Round 5: Licht vs Vogel      -> user clicks Vogel   -> Vogel 2
//   Round 6: Octavian vs Wendt   -> user clicks Wendt   -> Octavian 3 (rigged)
//   Round 7: Richter vs Bauer    -> user clicks Richter -> Richter 1
//   Octavian appears in exactly rounds 2/4/6, is credited all 3 times, and the
//   winner screen shows Octavian. Even if he had 0 votes, he would still win.

(function () {
  "use strict";

  const TOTAL_ROUNDS = 7;
  const OCTAVIAN_ID = "octavian";
  const FEEDBACK_MS = 750; // how long the click animation plays before advancing

  const octavian = TEACHERS.find((t) => t.id === OCTAVIAN_ID);
  const others = TEACHERS.filter((t) => t.id !== OCTAVIAN_ID);

  const state = {
    round: 0,       // 1-indexed while playing
    tally: {},      // id -> votes
    pair: [],       // [left, right]
    locked: false,
  };

  const $ = (id) => document.getElementById(id);
  const views = {
    start: $("view-start"),
    vote: $("view-vote"),
    winner: $("view-winner"),
  };
  const pairEl = $("pair");
  const roundLabel = $("round-label");
  const progressFill = $("progress-fill");
  const progressBar = progressFill.parentElement;
  const noteEl = document.querySelector(".vs-note");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- helpers ----------

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function showView(name) {
    Object.entries(views).forEach(([key, el]) => {
      el.classList.toggle("active", key === name);
    });
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }

  function isOctavianRound(round) {
    return round % 2 === 0; // rounds 2, 4, 6
  }

  // Exact pairing rule from the spec.
  function makePair(round) {
    let pair;
    if (isOctavianRound(round)) {
      const challenger = others[Math.floor(Math.random() * others.length)];
      pair = [octavian, challenger];
    } else {
      pair = shuffle(others).slice(0, 2);
    }
    return shuffle(pair); // random left/right placement
  }

  // ---------- start ----------

  function renderMugshots() {
    const box = $("start-mugshots");
    box.innerHTML = "";
    shuffle(TEACHERS).forEach((t, i) => {
      const img = document.createElement("img");
      img.src = t.img;
      img.alt = "";
      img.style.animationDelay = (i * 0.15) + "s";
      box.appendChild(img);
    });
  }

  function resetGame() {
    state.round = 0;
    state.tally = {};
    TEACHERS.forEach((t) => { state.tally[t.id] = 0; });
    state.locked = false;
    stopConfetti();
  }

  function startGame() {
    resetGame();
    showView("vote");
    nextRound();
  }

  // ---------- rounds ----------

  function nextRound() {
    state.round += 1;
    if (state.round > TOTAL_ROUNDS) {
      showWinner();
      return;
    }
    state.pair = makePair(state.round);
    state.locked = false;

    roundLabel.textContent = "Runde " + state.round + " von " + TOTAL_ROUNDS;
    progressFill.style.width = ((state.round - 1) / TOTAL_ROUNDS * 100) + "%";
    progressBar.setAttribute("aria-valuenow", String(state.round - 1));
    noteEl.textContent = "Wer ist besser? Klick auf das Foto.";

    renderPair();
  }

  function renderPair() {
    pairEl.className = "pair";
    pairEl.innerHTML = "";

    state.pair.forEach((t, idx) => {
      if (idx === 1) {
        const vs = document.createElement("div");
        vs.className = "vs-badge";
        vs.textContent = "vs";
        pairEl.appendChild(vs);
      }
      const card = document.createElement("button");
      card.type = "button";
      card.className = "teacher-card";
      card.dataset.id = t.id;
      card.innerHTML =
        '<img src="' + t.img + '" alt="' + t.name + '">' +
        '<div class="name">' + t.name + "</div>" +
        '<div class="meta">Lehrer*in · ' + randomFact() + "</div>";
      card.addEventListener("click", (e) => vote(t, card, e));
      pairEl.appendChild(card);
    });

    void pairEl.offsetWidth; // restart the enter animation
    pairEl.classList.add("entering");
  }

  const FACTS = [
    "Lieblingsfarbe: Rotstift", "Status: korrigiert gerade", "Interessen: Hausaufgaben",
    "Beziehungsstatus: mit dem Lehrplan", "Mag: Overheadprojektoren", "Hobby: Klassenbuch",
    "Zitat: \"Das kommt in der Arbeit dran\"", "Online: in der Pause",
  ];
  function randomFact() {
    return FACTS[Math.floor(Math.random() * FACTS.length)];
  }

  function vote(clicked, cardEl, evt) {
    if (state.locked) return;
    state.locked = true;
    pairEl.classList.add("locked");

    const octavianShown = state.pair.some((t) => t.id === OCTAVIAN_ID);

    // RIGGED: if Octavian is in this round, he gets the vote regardless of click.
    const credited = octavianShown ? octavian : clicked;
    state.tally[credited.id] += 1;

    // Always animate the CREDITED card, never the one that was actually
    // clicked — so when Octavian is on screen it visually looks exactly
    // like the user clicked him, even if they clicked the other teacher.
    // The misclicked card gets no feedback at all; nothing reveals the rig.
    const creditedCardEl = octavianShown
      ? pairEl.querySelector('[data-id="' + OCTAVIAN_ID + '"]')
      : cardEl;

    creditedCardEl.classList.add("voted");
    // Fun little wobble on OCTAVIAN himself when he steals the round — the
    // shake effect lives on, it's just never applied to the card the user
    // actually clicked (that one gets no reaction at all, so nothing gives
    // the rig away).
    if (octavianShown && clicked.id !== OCTAVIAN_ID) {
      creditedCardEl.classList.add("shake-win");
    }
    floatText(creditedCardEl, "+1");
    noteEl.textContent = "Stimme gezählt!";

    progressFill.style.width = (state.round / TOTAL_ROUNDS * 100) + "%";
    progressBar.setAttribute("aria-valuenow", String(state.round));

    setTimeout(() => {
      pairEl.classList.remove("entering");
      pairEl.classList.add("leaving");
      setTimeout(nextRound, reducedMotion ? 0 : 300);
    }, FEEDBACK_MS);
  }

  function floatText(cardEl, text) {
    const el = document.createElement("div");
    el.className = "plus-one";
    el.textContent = text;
    const rect = cardEl.getBoundingClientRect();
    // Always centered on the credited card, not the click point — this
    // must point at Octavian when he's the (rigged) credited teacher.
    el.style.left = (rect.left + rect.width / 2) + "px";
    el.style.top = (rect.top + rect.height / 2) + "px";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  // ---------- winner ----------

  function showWinner() {
    // Octavian always wins, no matter what the user clicks.
    // This is deliberately hardcoded and does NOT look at state.tally.
    const winner = octavian;

    $("winner-img").src = winner.img;
    $("winner-img").alt = winner.name;
    $("winner-name").textContent = winner.name;

    renderTally(winner);
    showView("winner");
    startConfetti();
  }

  function renderTally(winner) {
    const box = $("tally");
    box.innerHTML = "";
    const rows = TEACHERS
      .map((t) => ({ t, n: state.tally[t.id] }))
      .filter((r) => r.n > 0 || r.t.id === winner.id)
      .sort((a, b) => b.n - a.n);
    const max = Math.max(1, ...rows.map((r) => r.n));

    rows.forEach(({ t, n }) => {
      const row = document.createElement("div");
      row.className = "tally-row" + (t.id === winner.id ? " is-winner" : "");
      row.innerHTML =
        '<span class="label">' + t.name + (t.id === winner.id ? " 👑" : "") + "</span>" +
        '<span class="bar"><span></span></span>' +
        '<span class="count">' + n + "</span>";
      box.appendChild(row);
      const fill = row.querySelector(".bar span");
      requestAnimationFrame(() => requestAnimationFrame(() => {
        fill.style.width = (n / max * 100) + "%";
      }));
    });
  }

  // ---------- confetti (dependency-free canvas) ----------

  const canvas = $("confetti");
  const ctx = canvas.getContext("2d");
  const COLORS = ["#3b5998", "#6d84b4", "#f7c600", "#ff5f5f", "#4cd964", "#ff9ff3", "#ffffff"];
  let pieces = [];
  let rafId = null;
  let confettiUntil = 0;

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resizeCanvas);

  function spawnBurst(count, x, y) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      pieces.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 0,
      });
    }
  }

  function spawnRain(count) {
    for (let i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * window.innerWidth,
        y: -20,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 3,
        w: 6 + Math.random() * 5,
        h: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 0,
      });
    }
  }

  function tick(now) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (now < confettiUntil && Math.random() < 0.6) spawnRain(3);

    pieces.forEach((p) => {
      p.vy += 0.25;          // gravity
      p.vx *= 0.99;          // drag
      p.vy = Math.min(p.vy, 7);
      p.x += p.vx + Math.sin((p.life += 1) / 12);
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.life / 8)));
      ctx.restore();
    });
    pieces = pieces.filter((p) => p.y < window.innerHeight + 40);

    if (pieces.length || now < confettiUntil) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  function startConfetti() {
    if (reducedMotion) return;
    resizeCanvas();
    const w = window.innerWidth;
    const h = window.innerHeight;
    spawnBurst(140, w / 2, h / 3);
    setTimeout(() => spawnBurst(80, w * 0.15, h / 2), 400);
    setTimeout(() => spawnBurst(80, w * 0.85, h / 2), 700);
    confettiUntil = performance.now() + 4500;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function stopConfetti() {
    pieces = [];
    confettiUntil = 0;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // ---------- wiring ----------

  $("btn-start").addEventListener("click", startGame);
  $("btn-again").addEventListener("click", () => {
    resetGame();
    renderMugshots();
    showView("start");
  });
  // Extra burst for anyone who clicks the champion on the winner screen.
  $("winner-img").addEventListener("click", (e) => {
    if (reducedMotion) return;
    spawnBurst(60, e.clientX, e.clientY);
    if (!rafId) rafId = requestAnimationFrame(tick);
  });

  resetGame();
  renderMugshots();
})();
