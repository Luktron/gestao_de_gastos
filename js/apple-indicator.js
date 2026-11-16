/* =====================================================
   VELORA — Apple Financial Indicator v2
   Card "Sua saúde financeira" + Tutorial modal
===================================================== */

const VeloraApple = (() => {

  // ── SVG BUILDER ────────────────────────────────────
  // 5 visual states: 0 bites → 4 bites (progressive right-side bites)
  const BITE_DEFS = [
    { cx: 86, cy: 48, r: 22 },
    { cx: 88, cy: 70, r: 20 },
    { cx: 78, cy: 88, r: 18 },
    { cx: 60, cy: 97, r: 16 },
  ];

  function buildSVG(biteCount, bodyColor, size = 90) {
    const uid = 'va' + Math.random().toString(36).slice(2, 7);
    const activeBites = BITE_DEFS.slice(0, biteCount);

    // Perfect circle body: cx=50 cy=64 r=44 — truly spherical
    // Small top-indent arc gives the apple silhouette without losing roundness
    const appleShape =
      'M50,20 C50,20 43,14 34,16 C20,18 6,34 6,62 C6,90 24,108 50,108 C76,108 94,90 94,62 C94,34 80,18 66,16 C57,14 50,20 50,20 Z';

    const biteHoles = activeBites.map(b =>
      `M${b.cx - b.r},${b.cy} a${b.r},${b.r} 0 1,0 ${b.r * 2},0 a${b.r},${b.r} 0 1,0 -${b.r * 2},0`
    ).join(' ');

    const clipBody = `${appleShape} ${biteHoles}`;

    const fleshCircles = activeBites.map(b =>
      `<circle cx="${b.cx}" cy="${b.cy}" r="${b.r - 1}" fill="#f5deb3" opacity="0.75"/>`
    ).join('');

    const biteRings = activeBites.map(b =>
      `<circle cx="${b.cx}" cy="${b.cy}" r="${b.r}" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>`
    ).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="${size}" height="${Math.round(size * 1.2)}" aria-hidden="true">
  <defs>
    <clipPath id="${uid}">
      <path fill-rule="evenodd" d="${clipBody}"/>
    </clipPath>
    <!-- Main sphere gradient: bright top-left → dark bottom-right -->
    <radialGradient id="${uid}base" cx="35%" cy="30%" r="65%">
      <stop offset="0%"   stop-color="#ff6b6b"/>
      <stop offset="45%"  stop-color="${bodyColor}"/>
      <stop offset="100%" stop-color="#3a0a0a"/>
    </radialGradient>
    <!-- Specular highlight -->
    <radialGradient id="${uid}shine" cx="38%" cy="28%" r="30%">
      <stop offset="0%"   stop-color="rgba(255,255,255,0.55)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>

  <!-- Flesh behind bites -->
  ${fleshCircles}

  <!-- Apple body -->
  <g clip-path="url(#${uid})">
    <path d="${appleShape}" fill="url(#${uid}base)"/>
    <path d="${appleShape}" fill="url(#${uid}shine)"/>
  </g>

  <!-- Bite edge rings -->
  ${biteRings}

  <!-- Stem -->
  <path d="M50,20 C50,11 57,4 64,6" stroke="#5c3317" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <!-- Leaf -->
  <path d="M55,13 C63,4 75,8 69,18 C65,12 56,15 55,13 Z" fill="#16a34a" opacity="0.92"/>
  <path d="M55,13 C63,9 69,13 66,18" stroke="#15803d" stroke-width="1" fill="none" opacity="0.5"/>
</svg>`;
  }

  // ── STATE LOGIC ────────────────────────────────────
  function calcState(income, expense, budgetLimit) {
    // Use budget limit if available, otherwise income
    const reference = budgetLimit > 0 ? budgetLimit : income;
    const ratio     = reference > 0 ? expense / reference : (expense > 0 ? 1.6 : 0);
    const pct       = Math.round(ratio * 100);

    if (ratio <= 0.60) return { bites: 0, color: '#dc2626', statusColor: '#22c55e', label: 'Finanças equilibradas',    msg: 'Seus gastos estão dentro do planejamento e você ainda consegue economizar.', pct };
    if (ratio <= 0.75) return { bites: 1, color: '#c0392b', statusColor: '#f59e0b', label: 'Atenção aos gastos',       msg: 'Seus gastos estão aumentando e começando a comprometer sua capacidade de economizar.', pct };
    if (ratio <= 0.90) return { bites: 2, color: '#a93226', statusColor: '#f97316', label: 'Limite do orçamento',      msg: 'Você está próximo do limite. Revise seus gastos para não comprometer suas reservas.', pct };
    if (ratio <= 1.10) return { bites: 3, color: '#922b21', statusColor: '#ef4444', label: 'Orçamento comprometido',   msg: 'Seus gastos ultrapassaram o limite planejado e estão comprometendo suas finanças.', pct };
    return               { bites: 4, color: '#7b241c', statusColor: '#b91c1c', label: 'Situação crítica',         msg: 'Suas despesas superam suas receitas. É urgente revisar seus gastos.', pct };
  }

  // ── CARD RENDER ────────────────────────────────────
  function render(containerId, month, year) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const txs = VELORA.db.getTransactions();
    const now = new Date();
    const m   = month  !== undefined ? month  : now.getMonth();
    const y   = year   !== undefined ? year   : now.getFullYear();

    const filtered = txs.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getMonth() === m && d.getFullYear() === y;
    });

    const income  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;

    // Try to find a "Geral" budget for the period
    const budgets     = VELORA.db.getBudgets();
    const geralBudget = budgets.find(b => b.category === 'Geral');
    const budgetLimit = geralBudget ? geralBudget.limit : 0;

    const state    = calcState(income, expense, budgetLimit);
    const hasBudget = budgetLimit > 0;

    // Progress bar width capped at 100% visually
    const barPct   = Math.min(state.pct, 100);
    const barColor = state.statusColor;

    container.innerHTML = `
      <div class="apple-card-inner">
        <div class="apple-card-header">
          <h2>Sua saúde financeira</h2>
          <span class="apple-period-badge">${_monthName(m)} ${y}</span>
        </div>

        <div class="apple-card-body">
          <div class="apple-svg-col">
            <div class="apple-svg-wrap">
              ${buildSVG(state.bites, state.color, 88)}
            </div>
            <div class="apple-status-badge" style="color:${state.statusColor};border-color:${state.statusColor}22;background:${state.statusColor}11">
              ${state.label}
            </div>
          </div>

          <div class="apple-info-col">
            <div class="apple-msg">${state.msg}</div>

            <div class="apple-progress-wrap">
              <div class="apple-progress-labels">
                <span>Orçamento utilizado</span>
                <span style="color:${barColor};font-weight:700">${state.pct}%</span>
              </div>
              <div class="apple-progress-track">
                <div class="apple-progress-fill" style="width:${barPct}%;background:${barColor}"></div>
              </div>
              ${!hasBudget ? `<div class="apple-no-budget"><i class="fa fa-circle-info"></i> Sem orçamento cadastrado — usando receita como referência. <a href="planejamento.html">Configurar</a></div>` : ''}
            </div>

            <div class="apple-stats">
              <div class="apple-stat">
                <span class="apple-stat-label"><i class="fa fa-arrow-trend-up"></i> Receitas</span>
                <span class="apple-stat-value income">${VELORA.fmt(income)}</span>
              </div>
              <div class="apple-stat">
                <span class="apple-stat-label"><i class="fa fa-arrow-trend-down"></i> Despesas</span>
                <span class="apple-stat-value expense">${VELORA.fmt(expense)}</span>
              </div>
              <div class="apple-stat">
                <span class="apple-stat-label"><i class="fa fa-wallet"></i> Saldo</span>
                <span class="apple-stat-value ${balance < 0 ? 'expense' : 'income'}">${VELORA.fmt(balance)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ── TUTORIAL MODAL ─────────────────────────────────
  function showTutorial(onClose) {
    if (document.getElementById('apple-tutorial-modal')) return;

    const examples = [
      { bites: 0, color: '#dc2626', statusColor: '#22c55e', title: 'Maçã inteira — Finanças equilibradas',      desc: 'Seus gastos estão dentro do seu planejamento e você ainda consegue economizar.' },
      { bites: 2, color: '#a93226', statusColor: '#f59e0b', title: 'Parcialmente mordida — Atenção aos gastos', desc: 'Seus gastos estão aumentando e começando a comprometer sua capacidade de economizar.' },
      { bites: 4, color: '#7b241c', statusColor: '#ef4444', title: 'Várias mordidas — Desequilíbrio financeiro', desc: 'Seus gastos ultrapassaram o limite planejado e estão comprometendo suas finanças.' },
    ];

    const modal = document.createElement('div');
    modal.id = 'apple-tutorial-modal';
    modal.innerHTML = `
      <div class="atm-backdrop"></div>
      <div class="atm-box" role="dialog" aria-modal="true" aria-labelledby="atm-title">
        <div class="atm-logo">VEL<span>ORA</span></div>
        <h2 id="atm-title">🍎 Conheça sua maçã financeira!</h2>
        <p class="atm-intro">Na VELORA, sua maçã representa a saúde das suas finanças.<br>
        Ela acompanha a relação entre o dinheiro que você ganha e o que você gasta durante o mês.<br><br>
        Quanto mais equilibradas estiverem suas finanças, mais inteira sua maçã ficará. Quando seus gastos começarem a comprometer seu dinheiro disponível para economizar, ela apresentará mordidas.<br><br>
        <strong>Veja como funciona:</strong></p>

        <div class="atm-examples">
          ${examples.map(e => `
            <div class="atm-example">
              <div class="atm-apple-wrap">
                ${buildSVG(e.bites, e.color, 72)}
              </div>
              <div class="atm-example-info">
                <div class="atm-example-title" style="color:${e.statusColor}">${e.title}</div>
                <div class="atm-example-desc">${e.desc}</div>
              </div>
            </div>`).join('')}
        </div>

        <button class="atm-btn" id="atm-confirm">Entendi</button>
      </div>`;

    document.body.appendChild(modal);

    // Animate in
    requestAnimationFrame(() => modal.classList.add('atm-visible'));

    document.getElementById('atm-confirm').addEventListener('click', () => {
      VELORA.markTutorialSeen('maca');
      modal.classList.remove('atm-visible');
      setTimeout(() => { modal.remove(); if (onClose) onClose(); }, 320);
    });
  }

  function maybeShowTutorial(onClose) {
    if (!VELORA.hasSeenTutorial('maca')) {
      // Small delay so dashboard renders first
      setTimeout(() => showTutorial(onClose), 600);
    }
  }

  // ── HELPERS ────────────────────────────────────────
  function _monthName(m) {
    return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][m];
  }

  return { render, maybeShowTutorial, buildSVG, calcState };
})();
