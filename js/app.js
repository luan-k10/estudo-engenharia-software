(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const L = "ABCDE";
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };
  const num = (v, d = 2) => Number.isFinite(v) ? v.toLocaleString("pt-BR", { maximumFractionDigits: d }) : "—";
  const val = id => parseFloat(String($("#" + id).value).replace(",", "."));

  QUESTOES.forEach((q, i) => { q.id = i; });
  $("#ano").textContent = new Date().getFullYear();

  // ---------------- tema claro/escuro (igual ao portfólio) ----------------
  $("#theme-toggle").addEventListener("click", () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    store.set("theme", next);
  });

  // ---------------- tabelas empilháveis: rótulos para o celular ----------------
  $$("table.stack").forEach(t => {
    const heads = $$("thead th", t).map(th => th.textContent.trim());
    $$("tbody tr", t).forEach(tr => $$("td", tr).forEach((td, i) => td.setAttribute("data-l", heads[i] || "")));
  });

  // ---------------- progresso ----------------
  const KEY = "es-progresso-v1";
  let prog = {};
  try { prog = JSON.parse(store.get(KEY)) || {}; } catch { prog = {}; }
  const save = () => store.set(KEY, JSON.stringify(prog));
  const registrar = (q, ok) => { prog[q.id] = ok ? 1 : 0; save(); };

  function renderStats() {
    const ids = Object.keys(prog).filter(k => QUESTOES[k]);
    const certas = ids.filter(k => prog[k] === 1).length;
    $("#st-total").textContent = ids.length;
    $("#st-acerto").textContent = ids.length ? Math.round(certas * 100 / ids.length) + "%" : "0%";
    $("#st-erradas").textContent = ids.length - certas;
    $("#progresso-temas").innerHTML = Object.entries(TEMAS).map(([k, nome]) => {
      const qs = QUESTOES.filter(q => q.t === k);
      const ok = qs.filter(q => prog[q.id] === 1).length;
      const pct = qs.length ? Math.round(ok * 100 / qs.length) : 0;
      return `<div class="prog-row"><span>${esc(nome)}</span><div class="bar"><div style="width:${pct}%"></div></div><span class="muted">${ok}/${qs.length}</span></div>`;
    }).join("");
  }
  $("#btn-reset").addEventListener("click", () => {
    if (confirm("Zerar todo o progresso do quiz?")) { prog = {}; save(); renderStats(); renderQuizOptions(); }
  });

  // ---------------- navegação ----------------
  function go(view) {
    if (!$("#view-" + view)) view = "inicio";
    $$("#nav button").forEach(b => b.classList.toggle("active", b.dataset.view === view));
    $$(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + view));
    if (view === "inicio") renderStats();
    if (view === "quiz") { $("#quiz-setup").classList.remove("hidden"); $("#quiz-area").classList.add("hidden"); renderQuizOptions(); }
    if (view !== "simulado") clearInterval(simTimer);
    const active = $(`#nav button[data-view="${view}"]`);
    if (active) active.scrollIntoView({ block: "nearest", inline: "center" });
    if (history.replaceState) history.replaceState(null, "", view === "inicio" ? location.pathname : "#" + view);
    window.scrollTo(0, 0);
  }
  $$("#nav button").forEach(b => b.addEventListener("click", () => go(b.dataset.view)));
  $$("[data-go]").forEach(b => b.addEventListener("click", e => {
    e.preventDefault();
    go(b.dataset.go);
    if (b.dataset.lab) openLab(b.dataset.lab);
  }));
  $$(".practice[data-tema]").forEach(b => b.addEventListener("click", () => {
    go("quiz");
    startQuiz(TEMAS[b.dataset.tema], shuffle(QUESTOES.filter(q => q.t === b.dataset.tema)));
  }));

  // Índice de tópicos: abre o <details> e rola até ele
  $$(".week-index a").forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    const d = $("#" + a.dataset.week);
    d.open = true;
    d.scrollIntoView({ behavior: "smooth", block: "start" });
  }));

  // ---------------- quiz ----------------
  // Em data.js a correta é sempre o índice 0; as alternativas são sempre embaralhadas.
  function prep(q) {
    const ord = shuffle(q.o.map((_, i) => i));
    return { q, ord, correta: ord.indexOf(0) };
  }

  function renderQuizOptions() {
    const erradas = QUESTOES.filter(q => prog[q.id] === 0);
    const nunca = QUESTOES.filter(q => prog[q.id] === undefined);
    const opts = [
      { nome: "Todas misturadas", sub: `${QUESTOES.length} questões`, fn: () => startQuiz("Todas", shuffle(QUESTOES)) },
      { nome: "Todas na ordem dos tópicos", sub: `${QUESTOES.length} questões, na ordem do conteúdo`, fn: () => startQuiz("Ordem dos tópicos", [...QUESTOES]) },
      { nome: "Ainda não respondidas", sub: `${nunca.length} questões`, fn: () => nunca.length ? startQuiz("Não respondidas", shuffle(nunca)) : alert("Você já respondeu todas!") },
      { nome: "Revisar erradas", sub: `${erradas.length} questões`, fn: () => erradas.length ? startQuiz("Revisão de erradas", shuffle(erradas)) : alert("Nenhuma questão errada para revisar") },
      ...Object.entries(TEMAS).map(([k, nome]) => ({ nome, sub: `${QUESTOES.filter(q => q.t === k).length} questões`, fn: () => startQuiz(nome, shuffle(QUESTOES.filter(q => q.t === k))) })),
    ];
    const box = $("#quiz-options");
    box.innerHTML = "";
    opts.forEach(o => {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = `<b>${esc(o.nome)}</b><small>${esc(o.sub)}</small>`;
      b.addEventListener("click", o.fn);
      box.appendChild(b);
    });
  }

  function startQuiz(titulo, lista) {
    const itens = lista.map(prep);
    let i = 0, acertos = 0;
    const resp = new Array(itens.length).fill(null);
    $("#quiz-setup").classList.add("hidden");
    const area = $("#quiz-area");
    area.classList.remove("hidden");

    function render() {
      const it = itens[i], q = it.q;
      area.innerHTML = `<div class="card">
        <div class="qhead"><span><b>${esc(titulo)}</b>${titulo === TEMAS[q.t] ? "" : " · " + esc(TEMAS[q.t])}</span><span id="q-score">Questão ${i + 1}/${itens.length} · ✓ ${acertos}</span></div>
        <div class="progressline"><div style="width:${(i + 1) * 100 / itens.length}%"></div></div>
        <div class="qtext">${esc(q.q)}</div>
        <div id="opts">${it.ord.map((oi, k) => `<button type="button" class="opt" data-k="${k}"><span class="l">${L[k]})</span><span>${esc(q.o[oi])}</span></button>`).join("")}</div>
        <div id="explic"></div>
        <div class="qnav"><button type="button" class="btn" id="q-prev" ${i === 0 ? "disabled" : ""}>← Anterior</button>
        <button type="button" class="btn" id="q-sair">Sair</button>
        <button type="button" class="btn btn-primary" id="q-next">${i === itens.length - 1 ? "Finalizar" : "Próxima →"}</button></div></div>`;
      if (resp[i] !== null) mostrar(resp[i]);
      $$("#opts .opt", area).forEach(b => b.addEventListener("click", () => {
        if (resp[i] !== null) return;
        const k = +b.dataset.k;
        resp[i] = k;
        const ok = k === it.correta;
        if (ok) acertos++;
        registrar(q, ok);
        mostrar(k);
        $("#q-score").textContent = `Questão ${i + 1}/${itens.length} · ✓ ${acertos}`;
      }));
      $("#q-prev").onclick = () => { i--; render(); };
      $("#q-next").onclick = () => { if (i < itens.length - 1) { i++; render(); window.scrollTo(0, 0); } else fim(); };
      $("#q-sair").onclick = () => go("quiz");
    }
    function mostrar(k) {
      const it = itens[i];
      $$("#opts .opt", area).forEach((b, j) => {
        b.disabled = true;
        if (j === it.correta) b.classList.add("correct");
        else if (j === k) b.classList.add("wrong");
      });
      const ok = k === it.correta;
      $("#explic").innerHTML = `<div class="explic ${ok ? "" : "bad"}"><b>${ok ? "✓ Correto!" : `✗ Resposta certa: ${L[it.correta]}`}</b><br>${esc(it.q.e)}</div>`;
    }
    function fim() {
      const n = resp.filter(r => r !== null).length;
      const pct = n ? Math.round(acertos * 100 / n) : 0;
      area.innerHTML = `<div class="card center"><h2>Fim: ${esc(titulo)}</h2>
        <div class="score-big" style="color:${pct >= 70 ? "var(--ok)" : pct >= 50 ? "var(--warn)" : "var(--bad)"}">${pct}%</div>
        <p>${acertos} acertos de ${n} respondidas (${itens.length} no total).</p>
        <p class="muted">${pct >= 70 ? "Mandou bem! Tente o simulado." : "Releia os resumos dos tópicos em que errou e use “Revisar erradas”."}</p>
        <button type="button" class="btn btn-primary" id="q-again">Escolher outro conjunto</button></div>`;
      $("#q-again").onclick = () => go("quiz");
      window.scrollTo(0, 0);
    }
    render();
    window.scrollTo(0, 0);
  }

  // ---------------- simulado ----------------
  let simTimer = null;
  $("#sim-tema").innerHTML += Object.entries(TEMAS).map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join("");
  $("#sim-start").addEventListener("click", () => {
    const tema = $("#sim-tema").value;
    const base = tema ? QUESTOES.filter(q => q.t === tema) : QUESTOES;
    const n = Math.min(+$("#sim-n").value, base.length);
    const itens = shuffle(base).slice(0, n).map(prep);
    const resp = new Array(itens.length).fill(null);
    let i = 0;
    const t0 = Date.now();
    $("#sim-setup").classList.add("hidden");
    const area = $("#sim-area");
    area.classList.remove("hidden");
    const tempo = () => { const s = Math.floor((Date.now() - t0) / 1000); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
    clearInterval(simTimer);
    simTimer = setInterval(() => { const el = $("#sim-time"); if (el) el.textContent = tempo(); }, 1000);

    function render() {
      const it = itens[i];
      const respondidas = resp.filter(r => r !== null).length;
      area.innerHTML = `<div class="card">
        <div class="qhead"><span>Simulado · Questão ${i + 1}/${itens.length} · respondidas ${respondidas}</span><span id="sim-time">${tempo()}</span></div>
        <div class="progressline"><div style="width:${respondidas * 100 / itens.length}%"></div></div>
        <div class="qtext">${esc(it.q.q)}</div>
        <div id="s-opts">${it.ord.map((oi, k) => `<button type="button" class="opt ${resp[i] === k ? "sel" : ""}" data-k="${k}"><span class="l">${L[k]})</span><span>${esc(it.q.o[oi])}</span></button>`).join("")}</div>
        <div class="qnav"><button type="button" class="btn" id="s-prev" ${i === 0 ? "disabled" : ""}>← Anterior</button>
        <button type="button" class="btn" id="s-next" ${i === itens.length - 1 ? "disabled" : ""}>Próxima →</button>
        <button type="button" class="btn btn-primary" id="s-end">Entregar prova</button></div></div>`;
      $$("#s-opts .opt", area).forEach(b => b.addEventListener("click", () => {
        resp[i] = +b.dataset.k;
        if (i < itens.length - 1) i++;
        render();
      }));
      $("#s-prev").onclick = () => { i--; render(); };
      $("#s-next").onclick = () => { i++; render(); };
      $("#s-end").onclick = () => {
        const falt = resp.filter(r => r === null).length;
        if (falt && !confirm(`Faltam ${falt} questões. Entregar mesmo assim?`)) return;
        fim();
      };
    }
    function fim() {
      clearInterval(simTimer);
      let acertos = 0;
      itens.forEach((it, k) => {
        if (resp[k] === null) return;
        const ok = resp[k] === it.correta;
        if (ok) acertos++;
        registrar(it.q, ok);
      });
      const nota = acertos * 10 / itens.length;
      const porTema = {};
      itens.forEach((it, k) => { const t = it.q.t; porTema[t] = porTema[t] || [0, 0]; porTema[t][1]++; if (resp[k] === it.correta) porTema[t][0]++; });
      area.innerHTML = `<div class="card center"><h2>Resultado do simulado</h2>
        <div class="score-big" style="color:${nota >= 7 ? "var(--ok)" : nota >= 5 ? "var(--warn)" : "var(--bad)"}">${num(nota, 1)}</div>
        <p>${acertos}/${itens.length} acertos · tempo ${tempo()}</p>
        <div style="max-width:600px;margin:0 auto 1rem;text-align:left">${Object.entries(porTema).map(([t, [a, n]]) => `<div class="prog-row"><span>${esc(TEMAS[t])}</span><div class="bar"><div style="width:${a * 100 / n}%"></div></div><span class="muted">${a}/${n}</span></div>`).join("")}</div>
        <button type="button" class="btn btn-primary" id="s-new">Novo simulado</button></div>
        <div class="card"><h3 style="margin-top:0">Correção</h3>${itens.map((it, k) => {
          const r = resp[k], ok = r === it.correta;
          return `<div class="review-item"><b class="${ok ? "ok" : "bad"}">${ok ? "✓" : "✗"} ${k + 1}.</b> ${esc(it.q.q)}<br>
            ${r === null ? `<span class="bad">Não respondida.</span><br>` : ok ? "" : `<span class="bad">Sua: ${esc(it.q.o[it.ord[r]])}</span><br>`}
            <span class="ok">Certa: ${esc(it.q.o[0])}</span><br><span class="muted">${esc(it.q.e)}</span></div>`;
        }).join("")}</div>`;
      $("#s-new").onclick = () => { area.classList.add("hidden"); $("#sim-setup").classList.remove("hidden"); window.scrollTo(0, 0); };
      window.scrollTo(0, 0);
    }
    render();
    window.scrollTo(0, 0);
  });

  // ---------------- flashcards ----------------
  let cards = [...FLASHCARDS], fi = 0;
  const fc = $("#flashcard");
  function setSide(flip) {
    fc.classList.toggle("flip", flip);
    $("#flash-side").textContent = flip ? "Resposta" : "Pergunta";
  }
  function renderCard() {
    setSide(false);
    $("#flash-front").textContent = cards[fi][0];
    $("#flash-back").innerHTML = cards[fi][1];
    $("#flash-count").textContent = `${fi + 1} / ${cards.length}`;
  }
  fc.addEventListener("click", () => setSide(!fc.classList.contains("flip")));
  fc.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); setSide(!fc.classList.contains("flip")); } });
  $("#flash-prev").onclick = () => { fi = (fi - 1 + cards.length) % cards.length; renderCard(); };
  $("#flash-next").onclick = () => { fi = (fi + 1) % cards.length; renderCard(); };
  $("#flash-shuffle").onclick = () => { cards = shuffle(cards); fi = 0; renderCard(); };
  document.addEventListener("keydown", e => {
    if (!$("#view-flash").classList.contains("active") || /TEXTAREA|INPUT|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === " ") { e.preventDefault(); setSide(!fc.classList.contains("flip")); }
    if (e.key === "ArrowRight") $("#flash-next").click();
    if (e.key === "ArrowLeft") $("#flash-prev").click();
  });
  renderCard();

  // ---------------- discursivas ----------------
  const grupo = d => d.f.split(" – ")[0];
  const grupos = [...new Set(DISCURSIVAS.map(grupo))];
  let discFiltro = "";
  $("#disc-filter").innerHTML = [`<button type="button" data-g="" class="active">Todas (${DISCURSIVAS.length})</button>`,
    ...grupos.map(g => `<button type="button" data-g="${esc(g)}">${esc(g)} (${DISCURSIVAS.filter(d => grupo(d) === g).length})</button>`)].join("");
  $("#disc-list").innerHTML = DISCURSIVAS.map((d, i) => `<div class="card disc" data-g="${esc(grupo(d))}">
    <div class="qhead"><span class="src">${esc(d.f)}</span><span>${esc(TEMAS[d.t] || "")}</span></div>
    <div class="qtext">${esc(d.q)}</div>
    <textarea placeholder="Escreva sua resposta aqui antes de ver o modelo..." data-i="${i}" aria-label="Sua resposta"></textarea>
    <button type="button" class="btn" data-show="${i}">Ver resposta-modelo</button>
    <div class="modelo hidden" id="disc-${i}">${d.r}
      <p><b>Confira se sua resposta tem os pontos-chave:</b></p>
      <div class="chk">${d.k.map(k => `<label><input type="checkbox"> <span>${esc(k)}</span></label>`).join("")}</div></div></div>`).join("");
  function aplicarFiltro() {
    $$("#disc-filter button").forEach(b => b.classList.toggle("active", b.dataset.g === discFiltro));
    $$("#disc-list .disc").forEach(c => c.classList.toggle("hidden", !!discFiltro && c.dataset.g !== discFiltro));
  }
  $$("#disc-filter button").forEach(b => b.addEventListener("click", () => { discFiltro = b.dataset.g; aplicarFiltro(); }));
  $$("#disc-list [data-show]").forEach(b => b.addEventListener("click", () => {
    const m = $("#disc-" + b.dataset.show);
    m.classList.toggle("hidden");
    b.textContent = m.classList.contains("hidden") ? "Ver resposta-modelo" : "Esconder resposta-modelo";
  }));
  $$("#disc-list textarea").forEach(t => {
    const k = "es-disc-" + t.dataset.i;
    t.value = store.get(k) || "";
    t.addEventListener("input", () => store.set(k, t.value));
  });


  // ---------------- início ----------------
  renderStats();
  const h = location.hash.slice(1);
  if (h && $("#view-" + h)) go(h);
})();
