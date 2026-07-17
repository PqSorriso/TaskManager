/**
 * goals.js — Metas semanais e mensais
 * Define metas de tarefas e acompanha progresso
 */
var Goals = (function() {
  var STORAGE_KEY = 'fceux_goals';
  var goals = { weeklyTarget: 25, monthlyTarget: 100 };

  function load() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) goals = JSON.parse(saved);
    } catch(e) {}
  }

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(goals)); }

  function getWeeklyDone() {
    var tasks = typeof TaskManager !== 'undefined' ? (TaskManager.getAllWithArchive ? TaskManager.getAllWithArchive() : TaskManager.getAll()) : [];
    var now = new Date();
    var dayOfWeek = now.getDay();
    var monday = new Date(now); monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    var mondayStr = monday.toISOString().slice(0, 10);

    return tasks.filter(function(t) {
      if (!t.done) return false;
      var ts = t.completedAt || t.createdAt || '';
      return ts >= mondayStr;
    }).length;
  }

  function getMonthlyDone() {
    var tasks = typeof TaskManager !== 'undefined' ? (TaskManager.getAllWithArchive ? TaskManager.getAllWithArchive() : TaskManager.getAll()) : [];
    var now = new Date();
    var monthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

    return tasks.filter(function(t) {
      if (!t.done) return false;
      var ts = t.completedAt || t.createdAt || '';
      return ts.startsWith(monthStr);
    }).length;
  }

  function open() {
    var existing = document.getElementById('goalsOverlay');
    if (existing) { existing.classList.add('visible'); renderGoals(); return; }

    var overlay = document.createElement('div');
    overlay.id = 'goalsOverlay';
    overlay.className = 'dashboard-overlay visible';
    overlay.innerHTML =
      '<div class="dashboard-window" style="max-width:450px">' +
        '<div class="dashboard-header">' +
          '<span>🎯 Metas</span>' +
          '<button class="stats-close-btn" id="goalsCloseBtn">✕</button>' +
        '</div>' +
        '<div class="dashboard-body" id="goalsBody"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    document.getElementById('goalsCloseBtn').addEventListener('click', function() {
      overlay.classList.remove('visible');
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.classList.remove('visible');
    });

    renderGoals();
  }

  function renderGoals() {
    var body = document.getElementById('goalsBody');
    if (!body) return;

    var weeklyDone = getWeeklyDone();
    var monthlyDone = getMonthlyDone();
    var weeklyPct = Math.min(100, Math.round((weeklyDone / goals.weeklyTarget) * 100));
    var monthlyPct = Math.min(100, Math.round((monthlyDone / goals.monthlyTarget) * 100));

    var now = new Date();
    var dayOfWeek = now.getDay() || 7;
    var daysLeftWeek = 7 - dayOfWeek;
    var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var daysLeftMonth = daysInMonth - now.getDate();
    var monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    var weeklyColor = weeklyPct >= 100 ? '#00cc66' : weeklyPct >= 60 ? 'var(--text-cyan)' : weeklyPct >= 30 ? '#ccaa00' : '#cc4444';
    var monthlyColor = monthlyPct >= 100 ? '#00cc66' : monthlyPct >= 60 ? 'var(--text-cyan)' : monthlyPct >= 30 ? '#ccaa00' : '#cc4444';

    var html = '';

    // Meta Semanal
    html += '<div class="db-panel">';
    html += '<div class="db-panel-title">📅 Meta Semanal</div>';
    html += '<div style="display:flex;align-items:center;gap:16px;margin:8px 0">';
    html += buildCircle(weeklyPct, weeklyDone + '/' + goals.weeklyTarget, weeklyPct >= 100 ? '🏆 META!' : daysLeftWeek + 'd restantes', weeklyColor);
    html += '<div style="flex:1">';
    html += '<div style="font-size:12px;color:var(--text-green);margin-bottom:8px">' + (weeklyPct >= 100 ? '🏆 META ATINGIDA!' : '📋 Faltam ' + (goals.weeklyTarget - weeklyDone) + ' tarefas') + '</div>';
    if (weeklyPct < 100 && daysLeftWeek > 0) {
      var perDay = Math.ceil((goals.weeklyTarget - weeklyDone) / daysLeftWeek);
      html += '<div style="font-size:10px;color:#006688">Precisa de ~' + perDay + '/dia pra atingir</div>';
    }
    html += '<div style="margin-top:8px;display:flex;gap:4px;align-items:center">';
    html += '<label style="font-size:10px;color:#006688">Meta:</label>';
    html += '<input type="number" id="goalWeeklyInput" value="' + goals.weeklyTarget + '" min="1" max="200" style="width:45px;background:var(--bg-input);border:1px solid var(--border-light);padding:3px;font-family:var(--font-main);font-size:11px;color:var(--text-cyan);outline:none;border-radius:3px" />';
    html += '<span style="font-size:10px;color:#006688">tarefas/semana</span>';
    html += '</div>';
    html += '</div></div></div>';

    // Meta Mensal
    html += '<div class="db-panel">';
    html += '<div class="db-panel-title">📆 Meta Mensal — ' + monthNames[now.getMonth()] + '</div>';
    html += '<div style="display:flex;align-items:center;gap:16px;margin:8px 0">';
    html += buildCircle(monthlyPct, monthlyDone + '/' + goals.monthlyTarget, monthlyPct >= 100 ? '🏆 META!' : daysLeftMonth + 'd restantes', monthlyColor);
    html += '<div style="flex:1">';
    html += '<div style="font-size:12px;color:var(--text-green);margin-bottom:8px">' + (monthlyPct >= 100 ? '🏆 META ATINGIDA!' : '📋 Faltam ' + (goals.monthlyTarget - monthlyDone) + ' tarefas') + '</div>';
    if (monthlyPct < 100 && daysLeftMonth > 0) {
      var perDayM = Math.ceil((goals.monthlyTarget - monthlyDone) / daysLeftMonth);
      html += '<div style="font-size:10px;color:#006688">Precisa de ~' + perDayM + '/dia pra atingir</div>';
    }
    html += '<div style="margin-top:8px;display:flex;gap:4px;align-items:center">';
    html += '<label style="font-size:10px;color:#006688">Meta:</label>';
    html += '<input type="number" id="goalMonthlyInput" value="' + goals.monthlyTarget + '" min="1" max="999" style="width:45px;background:var(--bg-input);border:1px solid var(--border-light);padding:3px;font-family:var(--font-main);font-size:11px;color:var(--text-cyan);outline:none;border-radius:3px" />';
    html += '<span style="font-size:10px;color:#006688">tarefas/mês</span>';
    html += '</div>';
    html += '</div></div></div>';

    // Salvar
    html += '<div style="text-align:center;margin:8px 0">';
    html += '<button id="goalsSaveBtn" style="background:rgba(0,150,80,0.4);border:1px solid rgba(0,200,100,0.5);color:var(--pri-baixa);font-family:var(--font-main);font-size:12px;padding:6px 24px;cursor:pointer;border-radius:4px">💾 Salvar Metas</button>';
    html += '</div>';

    body.innerHTML = html;

    // Bind salvar
    document.getElementById('goalsSaveBtn').addEventListener('click', function() {
      goals.weeklyTarget = Number(document.getElementById('goalWeeklyInput').value) || 25;
      goals.monthlyTarget = Number(document.getElementById('goalMonthlyInput').value) || 100;
      save();
      renderGoals();
      if (typeof Notifications !== 'undefined') {
        Notifications.showToast('🎯 METAS', 'Salvas! Semanal: ' + goals.weeklyTarget + ' | Mensal: ' + goals.monthlyTarget, 'success', 3000);
      }
    });
  }

  function buildCircle(pct, label, sublabel, color) {
    var r = 35;
    var c = 2 * Math.PI * r;
    var offset = c - (Math.min(100, pct) / 100) * c;
    return '<svg width="90" height="90" viewBox="0 0 90 90">' +
      '<circle cx="45" cy="45" r="' + r + '" fill="none" stroke="rgba(100,100,100,0.2)" stroke-width="7"/>' +
      '<circle cx="45" cy="45" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="7" stroke-dasharray="' + c + '" stroke-dashoffset="' + offset + '" transform="rotate(-90 45 45)" stroke-linecap="round"/>' +
      '<text x="45" y="42" text-anchor="middle" fill="' + color + '" font-size="14" font-family="var(--font-main)" font-weight="bold">' + label + '</text>' +
      '<text x="45" y="56" text-anchor="middle" fill="#006688" font-size="8" font-family="var(--font-main)">' + sublabel + '</text>' +
      '</svg>';
  }

  function getGoals() { return goals; }
  function getWeeklyPct() { return Math.min(100, Math.round((getWeeklyDone() / goals.weeklyTarget) * 100)); }
  function getMonthlyPct() { return Math.min(100, Math.round((getMonthlyDone() / goals.monthlyTarget) * 100)); }

  function init() { load(); }

  return {
    init: init,
    open: open,
    getGoals: getGoals,
    getWeeklyDone: getWeeklyDone,
    getMonthlyDone: getMonthlyDone,
    getWeeklyPct: getWeeklyPct,
    getMonthlyPct: getMonthlyPct
  };
})();
