/* =====================================================
   VELORA — Core Module
   Shared across all authenticated pages
===================================================== */

// ── AUTH GUARD ──────────────────────────────────────
const VELORA = (() => {

  // Public pages that don't need auth
  const PUBLIC = ['login.html', 'cadastro.html', 'index.html'];

  function currentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  function getSession() {
    return JSON.parse(localStorage.getItem('velora_session') || 'null');
  }

  function requireAuth() {
    const page = currentPage();
    if (PUBLIC.some(p => page.endsWith(p))) return;
    const session = getSession();
    if (!session || (!session.id && !session.name)) {
      window.location.href = 'login.html';
    }
  }

  function logout() {
    localStorage.removeItem('velora_session');
    window.location.href = 'login.html';
  }

  // ── STORAGE HELPERS ─────────────────────────────
  const KEYS = {
    users:        'velora_users',
    session:      'velora_session',
    transactions: 'velora_transactions',
    bills:        'velora_bills',
    billsFull:    'velora_bills_full',
    categories:   'velora_categories',
    budgets:      'velora_budgets',
    goals:        'velora_goals',
    prefs:        'velora_prefs',
    profile:      'velora_profile',
    tutorials:    'velora_tutorials',
  };

  function get(key)      { return JSON.parse(localStorage.getItem(key) || 'null'); }
  function set(key, val) { localStorage.setItem(key, JSON.stringify(val)); broadcast(); }

  function broadcast() {
    window.dispatchEvent(new Event('velora:update'));
  }

  // Typed getters/setters
  const db = {
    getTransactions: ()    => get(KEYS.transactions) || [],
    setTransactions: (arr) => set(KEYS.transactions, arr),

    getBills: ()    => get(KEYS.billsFull) || [],
    setBills: (arr) => set(KEYS.billsFull, arr),

    getSimpleBills: ()    => get(KEYS.bills) || [],
    setSimpleBills: (arr) => set(KEYS.bills, arr),

    getCategories: ()    => get(KEYS.categories) || [],
    setCategories: (arr) => set(KEYS.categories, arr),

    getBudgets: ()    => get(KEYS.budgets) || [],
    setBudgets: (arr) => set(KEYS.budgets, arr),

    getGoals: ()    => get(KEYS.goals) || [],
    setGoals: (arr) => set(KEYS.goals, arr),

    getPrefs: ()    => get(KEYS.prefs) || {},
    setPrefs: (obj) => set(KEYS.prefs, obj),

    getProfile: ()    => get(KEYS.profile) || { name: 'Hillary Nicoli', email: 'hillary@velora.app' },
    setProfile: (obj) => set(KEYS.profile, obj),

    getTutorials: ()    => get(KEYS.tutorials) || {},
    setTutorials: (obj) => { localStorage.setItem(KEYS.tutorials, JSON.stringify(obj)); },
  };

  // ── TUTORIAL HELPERS ─────────────────────────────
  // Per-user tutorial flags stored as { [userId]: { maca: true, ... } }
  function _userId() {
    const s = getSession();
    return (s && (s.id || s.email || s.name)) || 'guest';
  }

  function hasSeenTutorial(key) {
    const all = db.getTutorials();
    return !!(all[_userId()] && all[_userId()][key]);
  }

  function markTutorialSeen(key) {
    const all = db.getTutorials();
    if (!all[_userId()]) all[_userId()] = {};
    all[_userId()][key] = true;
    db.setTutorials(all);
  }

  // ── SEED DATA ────────────────────────────────────
  function seedAll() {
    const now = new Date();
    const y   = now.getFullYear();
    const m   = String(now.getMonth() + 1).padStart(2, '0');

    // Categories
    if (!db.getCategories().length) {
      db.setCategories([
        { id:1, name:'Mercado',    type:'expense', icon:'fa-cart-shopping', color:'#22c55e', desc:'Compras de supermercado', locked:true },
        { id:2, name:'Transporte', type:'expense', icon:'fa-car',           color:'#3b82f6', desc:'Combustível e transporte', locked:true },
        { id:3, name:'Lazer',      type:'expense', icon:'fa-gamepad',       color:'#a855f7', desc:'Entretenimento e lazer', locked:true },
        { id:4, name:'Contas',     type:'expense', icon:'fa-file-invoice',  color:'#f59e0b', desc:'Contas fixas mensais', locked:true },
        { id:5, name:'Saúde',      type:'expense', icon:'fa-heart-pulse',   color:'#ef4444', desc:'Saúde e farmácia', locked:true },
        { id:6, name:'Salário',    type:'income',  icon:'fa-briefcase',     color:'#22c55e', desc:'Renda mensal', locked:true },
        { id:7, name:'Outros',     type:'expense', icon:'fa-ellipsis',      color:'#64748b', desc:'Outros gastos', locked:true },
      ]);
    }

    // Transactions
    if (!get(KEYS.transactions)) {
      db.setTransactions([
        { id:1,  type:'income',  description:'Salário',       amount:5800,  category:'Salário',    date:`${y}-${m}-01`, account:'Conta corrente', payment:'PIX',     status:'paid',    notes:'' },
        { id:2,  type:'expense', description:'Supermercado',  amount:215.8, category:'Mercado',    date:`${y}-${m}-03`, account:'Débito',         payment:'Débito',  status:'paid',    notes:'' },
        { id:3,  type:'expense', description:'Uber',          amount:45.9,  category:'Transporte', date:`${y}-${m}-05`, account:'Conta corrente', payment:'PIX',     status:'paid',    notes:'' },
        { id:4,  type:'expense', description:'Netflix',       amount:55,    category:'Lazer',      date:`${y}-${m}-07`, account:'Crédito',        payment:'Crédito', status:'paid',    notes:'' },
        { id:5,  type:'expense', description:'Energia',       amount:120,   category:'Contas',     date:`${y}-${m}-08`, account:'Conta corrente', payment:'Boleto',  status:'paid',    notes:'' },
        { id:6,  type:'expense', description:'Farmácia',      amount:89,    category:'Saúde',      date:`${y}-${m}-10`, account:'Dinheiro',       payment:'Dinheiro',status:'paid',    notes:'' },
        { id:7,  type:'expense', description:'Mercado Extra', amount:345,   category:'Mercado',    date:`${y}-${m}-12`, account:'Crédito',        payment:'Crédito', status:'paid',    notes:'' },
        { id:8,  type:'expense', description:'Gasolina',      amount:195,   category:'Transporte', date:`${y}-${m}-14`, account:'Débito',         payment:'Débito',  status:'paid',    notes:'' },
        { id:9,  type:'expense', description:'Cinema',        amount:85,    category:'Lazer',      date:`${y}-${m}-16`, account:'Crédito',        payment:'Crédito', status:'paid',    notes:'' },
        { id:10, type:'expense', description:'Internet',      amount:99.9,  category:'Contas',     date:`${y}-${m}-18`, account:'Conta corrente', payment:'Débito',  status:'pending', notes:'' },
        { id:11, type:'expense', description:'Hortifruti',    amount:172,   category:'Mercado',    date:`${y}-${m}-20`, account:'Dinheiro',       payment:'Dinheiro',status:'paid',    notes:'' },
        { id:12, type:'expense', description:'Academia',      amount:89.9,  category:'Lazer',      date:`${y}-${m}-22`, account:'Débito',         payment:'Débito',  status:'pending', notes:'' },
        { id:13, type:'expense', description:'Ônibus',        amount:98,    category:'Transporte', date:`${y}-${m}-24`, account:'Conta corrente', payment:'PIX',     status:'paid',    notes:'' },
        { id:14, type:'expense', description:'Outros gastos', amount:115,   category:'Outros',     date:`${y}-${m}-26`, account:'Dinheiro',       payment:'Dinheiro',status:'paid',    notes:'' },
      ]);
    }

    // Bills (simple — for dashboard widget)
    if (!get(KEYS.bills)) {
      db.setSimpleBills([
        { id:1, name:'Conta de luz', icon:'fa-bolt',     amount:120,  dueDay:18 },
        { id:2, name:'Internet',     icon:'fa-wifi',     amount:99.9, dueDay:20 },
        { id:3, name:'Academia',     icon:'fa-dumbbell', amount:89.9, dueDay:25 },
      ]);
    }

    // Bills full
    if (!get(KEYS.billsFull)) {
      db.setBills([
        { id:1, name:'Conta de luz', category:'Contas',  amount:120,  issue:`${y}-${m}-01`, due:`${y}-${m}-18`, paidDate:'', account:'Conta corrente', recurrence:'monthly', desc:'', status:'pending' },
        { id:2, name:'Internet',     category:'Contas',  amount:99.9, issue:`${y}-${m}-01`, due:`${y}-${m}-20`, paidDate:'', account:'Conta corrente', recurrence:'monthly', desc:'', status:'pending' },
        { id:3, name:'Academia',     category:'Saúde',   amount:89.9, issue:`${y}-${m}-01`, due:`${y}-${m}-25`, paidDate:'', account:'Débito',         recurrence:'monthly', desc:'', status:'pending' },
        { id:4, name:'Aluguel',      category:'Moradia', amount:1200, issue:`${y}-${m}-01`, due:`${y}-${m}-10`, paidDate:'', account:'Conta corrente', recurrence:'monthly', desc:'', status:'pending' },
      ]);
    }

    // Budgets
    if (!db.getBudgets().length) {
      db.setBudgets([
        { id:1, name:'Gastos gerais', category:'Geral',      limit:2500, start:`${y}-${m}-01`, end:`${y}-${m}-30`, period:'monthly' },
        { id:2, name:'Alimentação',   category:'Mercado',    limit:800,  start:`${y}-${m}-01`, end:`${y}-${m}-30`, period:'monthly' },
        { id:3, name:'Transporte',    category:'Transporte', limit:400,  start:`${y}-${m}-01`, end:`${y}-${m}-30`, period:'monthly' },
      ]);
    }

    // Goals
    if (!db.getGoals().length) {
      db.setGoals([
        { id:1, name:'Viagem dos sonhos',      desc:'Férias internacionais',  target:5000,  current:3000, deadline:'2025-12-31', emoji:'🏖️' },
        { id:2, name:'Reserva de emergência',  desc:'6 meses de despesas',    target:15000, current:4500, deadline:'2026-06-30', emoji:'🛡️' },
      ]);
    }
  }

  // ── FORMATTING ───────────────────────────────────
  function fmt(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function fmtDate(s) {
    if (!s) return '—';
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }

  function todayISO() {
    return new Date().toISOString().split('T')[0];
  }

  function genId() {
    return Date.now() + Math.random();
  }

  // ── NOTIFICATIONS ────────────────────────────────
  function checkNotifications() {
    const prefs = db.getPrefs();
    if (prefs.notifMaster === false) return;

    const bills   = db.getBills();
    const budgets = db.getBudgets();
    const txs     = db.getTransactions();
    const today   = new Date(); today.setHours(0, 0, 0, 0);
    const alerts  = [];

    // Overdue / upcoming bills
    if (prefs.notifBills !== false) {
      bills.forEach(b => {
        if (b.status === 'paid') return;
        const due  = new Date(b.due + 'T00:00:00');
        const diff = Math.ceil((due - today) / 86400000);
        if (diff < 0)      alerts.push({ type: 'error', msg: `Conta "${b.name}" está atrasada!` });
        else if (diff <= 3) alerts.push({ type: 'warn',  msg: `Conta "${b.name}" vence em ${diff}d.` });
      });
    }

    // Budget exceeded
    if (prefs.notifBudget !== false) {
      const now = new Date();
      budgets.forEach(b => {
        const used = txs
          .filter(t => {
            if (t.type !== 'expense') return false;
            if (b.category !== 'Geral' && t.category !== b.category) return false;
            const d = new Date(t.date + 'T00:00:00');
            return d >= new Date(b.start + 'T00:00:00') && d <= new Date(b.end + 'T00:00:00');
          })
          .reduce((s, t) => s + t.amount, 0);
        if (used > b.limit) {
          alerts.push({ type: 'warn', msg: `Orçamento "${b.name}" ultrapassado!` });
        }
      });
    }

    // Show first alert as toast (non-intrusive)
    if (alerts.length) {
      setTimeout(() => showToast(alerts[0].type, alerts[0].msg), 1500);
    }
  }

  // ── TOAST ────────────────────────────────────────
  function showToast(type, msg) {
    let t = document.getElementById('velora-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'velora-toast';
      t.style.cssText = `
        position:fixed;bottom:26px;right:26px;z-index:9999;
        background:#1a1a1a;border-radius:12px;padding:13px 18px;
        font-size:13px;font-weight:500;display:flex;align-items:center;gap:10px;
        transform:translateY(80px);opacity:0;transition:all .3s ease;pointer-events:none;
        font-family:'Inter','Segoe UI',sans-serif;color:#fff;
        box-shadow:0 8px 32px rgba(0,0,0,.5);
      `;
      document.body.appendChild(t);
    }
    const colors = { success:'rgba(34,197,94,.3)', error:'rgba(229,9,37,.3)', warn:'rgba(246,201,14,.3)' };
    const icons  = { success:'fa-circle-check', error:'fa-circle-xmark', warn:'fa-triangle-exclamation' };
    const text   = { success:'#4ade80', error:'#ff354f', warn:'#f6c90e' };
    t.style.border = `1px solid ${colors[type] || colors.success}`;
    t.style.color  = text[type] || text.success;
    t.innerHTML    = `<i class="fa ${icons[type] || icons.success}"></i> ${msg}`;
    t.style.transform = 'translateY(0)';
    t.style.opacity   = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.transform = 'translateY(80px)'; t.style.opacity = '0'; }, 3500);
  }

  // ── SIDEBAR INIT ─────────────────────────────────
  function initSidebar() {
    const hamburger = document.getElementById('hamburger');
    const sidebar   = document.getElementById('sidebar');
    const overlay   = document.getElementById('overlay');
    if (!hamburger || !sidebar) return;
    hamburger.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay && overlay.classList.toggle('open'); });
    overlay && overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('open'); });
  }

  // ── USER CHIP ────────────────────────────────────
  function initUserChip() {
    const session = getSession();
    const profile = db.getProfile();
    const name    = (session && session.name) || profile.name || 'Usuário';
    const el      = document.getElementById('userName');
    const av      = document.getElementById('userAvatar');
    if (el) el.textContent = name.split(' ')[0];
    if (av) av.textContent = name[0].toUpperCase();
  }

  // ── INIT ─────────────────────────────────────────
  function init() {
    requireAuth();
    seedAll();
    initSidebar();
    initUserChip();
    checkNotifications();
  }

  return { init, db, fmt, fmtDate, todayISO, genId, showToast, logout, getSession, broadcast, checkNotifications, hasSeenTutorial, markTutorialSeen };
})();

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', () => VELORA.init());
