/**
 * dashboard.js — Dashboard Executivo
 * Visão completa de produtividade com gráficos
 */
var Dashboard = (function() {
  var overlay = null;

  function createOverlay() {
    if (document.getElementById('dashboardOverlay')) {
      overlay = document.getElementById('dashboardOverlay');
      return;
    }
    overlay = document.createElement('div');
    overlay.id = 'dashboardOverlay';
    overlay.className = 'dashboard-overlay';
    overlay.innerHTML =
      '<div class="dashboard-window">' +
        '<div class="dashboard-header">' +
          '<span>📊 Dashboard Executivo</span>' +
          '<button class="stats-close-btn" id="dashboardCloseBtn">✕</button>' +
        '</div>' +
        '<div class="dashboard-body" id="dashboardBody"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    document.getElementById('dashboardCloseBtn').addEventListener('click', close);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
  }

  function open() {
    createOverlay();
    render();
    overlay.classList.add('visible');
  }

  function close() {
    if (overlay) overlay.classList.remove('visible');
  }

  function render() {
    var body = document.getElementById('dashboardBody');
    if (!body) return;

    var tasks = typeof TaskManager !== 'undefined' ? (TaskManager.getAllWithArchive ? TaskManager.getAllWithArchive() : TaskManager.getAll()) : [];
    var today = new Date();
    var todayStr = today.toISOString().slice(0, 10);

    var done = tasks.filter(function(t) { return t.done; });
    var pending = tasks.filter(function(t) { return !t.done; });
    var total = tasks.length;
    var pct = total > 0 ? Math.round((done.length / total) * 100) : 0;

    // Concluídas hoje
    var doneToday = done.filter(function(t) {
      if (t.completedAt && t.completedAt.startsWith(todayStr)) return true;
      if (t.createdAt && t.createdAt.startsWith(todayStr)) return true;
      return false;
    });

    // Atrasadas
    var overdue = pending.filter(function(t) {
      if (!t.dueDate) return false;
      if (t.dueDate < todayStr) return true;
      if (t.dueDate === todayStr && t.dueTime) {
        var p = t.dueTime.split(':');
        var d = new Date(); d.setHours(parseInt(p[0]), parseInt(p[1]), 0, 0);
        if (new Date() > d) return true;
      }
      return false;
    });

    // Concluídas com atraso
    var lateCompleted = done.filter(function(t) { return t.completedLate; }).length;
    var onTimeCompleted = done.length - lateCompleted;
    var onTimePct = done.length > 0 ? Math.round((onTimeCompleted / done.length) * 100) : 100;

    // Streak
    var streak = 0;
    var level = 1;
    var levelName = '';
    var xp = 0;
    if (typeof Gamification !== 'undefined') {
      var info = Gamification.getLevelInfo();
      streak = info.streak;
      level = info.level;
      levelName = info.name;
      xp = info.xp;
    }

    var html = '';

    // === CARDS PRINCIPAIS ===
    html += '<div class="db-cards">';
    html += '<div class="db-card"><div class="db-card-icon">✅</div><div class="db-card-val">' + doneToday.length + '</div><div class="db-card-lbl">Feitas Hoje</div></div>';
    html += '<div class="db-card"><div class="db-card-icon">📋</div><div class="db-card-val">' + pending.length + '</div><div class="db-card-lbl">Pendentes</div></div>';
    html += '<div class="db-card' + (overdue.length > 0 ? ' db-danger' : '') + '"><div class="db-card-icon">🚨</div><div class="db-card-val">' + overdue.length + '</div><div class="db-card-lbl">Atrasadas</div></div>';
    html += '<div class="db-card"><div class="db-card-icon">🔥</div><div class="db-card-val">' + streak + '</div><div class="db-card-lbl">Streak</div></div>';
    html += '</div>';

    // === PROGRESSO CIRCULAR + PONTUALIDADE ===
    html += '<div class="db-row">';

    // Progresso
    html += '<div class="db-panel">';
    html += '<div class="db-panel-title">📊 Progresso Geral</div>';
    html += '<div style="display:flex;justify-content:center;margin:8px 0">';
    html += buildCircle(pct, pct + '%', 'completo', 'var(--text-cyan)');
    html += '</div>';
    html += '<div style="text-align:center;font-size:11px;color:#006688">' + done.length + '/' + total + ' tarefas</div>';
    html += '</div>';

    // Pontualidade
    html += '<div class="db-panel">';
    html += '<div class="db-panel-title">⏰ Pontualidade</div>';
    html += '<div style="display:flex;justify-content:center;margin:8px 0">';
    html += buildCircle(onTimePct, onTimePct + '%', 'no prazo', onTimePct >= 80 ? '#00cc66' : onTimePct >= 50 ? '#ccaa00' : '#cc4444');
    html += '</div>';
    html += '<div style="text-align:center;font-size:11px;color:#006688">' + onTimeCompleted + ' no prazo · ' + lateCompleted + ' atrasadas</div>';
    html += '</div>';

    html += '</div>';

    // === TENDÊNCIA 30 DIAS ===
    html += '<div class="db-panel">';
    html += '<div class="db-panel-title">📈 Tendência — Últimos 30 dias</div>';
    html += '<div class="db-trend">';

    var trendData = [];
    var maxTrend = 1;
    for (var i = 29; i >= 0; i--) {
      var d = new Date(today);
      d.setDate(d.getDate() - i);
      var key = d.toISOString().slice(0, 10);
      var count = done.filter(function(t) {
        if (t.completedAt && t.completedAt.startsWith(key)) return true;
        if (t.createdAt && t.createdAt.startsWith(key)) return true;
        return false;
      }).length;
      trendData.push({ date: key, day: d.getDate(), count: count });
      if (count > maxTrend) maxTrend = count;
    }

    trendData.forEach(function(td, idx) {
      var h = td.count > 0 ? Math.max(4, Math.round((td.count / maxTrend) * 60)) : 2;
      var isToday = td.date === todayStr;
      html += '<div class="db-trend-bar' + (isToday ? ' today' : '') + '" title="' + td.date + ': ' + td.count + ' tarefas">';
      html += '<div class="db-trend-fill" style="height:' + h + 'px"></div>';
      if (idx % 5 === 0 || isToday) html += '<div class="db-trend-day">' + td.day + '</div>';
      html += '</div>';
    });

    html += '</div>';

    // Média
    var totalTrend = trendData.reduce(function(a, b) { return a + b.count; }, 0);
    var avgTrend = Math.round(totalTrend / 30 * 10) / 10;
    var bestTrend = trendData.reduce(function(a, b) { return b.count > a.count ? b : a; });
    html += '<div style="display:flex;justify-content:space-around;margin-top:8px;font-size:10px;color:#006688">';
    html += '<span>Média: <b style="color:var(--text-cyan)">' + avgTrend + '/dia</b></span>';
    html += '<span>Recorde: <b style="color:var(--text-cyan)">' + bestTrend.count + ' (' + bestTrend.day + ')</b></span>';
    html += '<span>Total 30d: <b style="color:var(--text-cyan)">' + totalTrend + '</b></span>';
    html += '</div>';
    html += '</div>';

    // === POR PRIORIDADE ===
    html += '<div class="db-row">';

    html += '<div class="db-panel">';
    html += '<div class="db-panel-title">⚡ Por Prioridade</div>';
    var alta = pending.filter(function(t) { return t.priority === 'alta'; }).length;
    var media = pending.filter(function(t) { return t.priority === 'media'; }).length;
    var baixa = pending.filter(function(t) { return t.priority === 'baixa'; }).length;
    var maxP = Math.max(alta, media, baixa, 1);
    html += buildHBar('Alta', alta, maxP, 'var(--pri-alta)');
    html += buildHBar('Média', media, maxP, 'var(--pri-media)');
    html += buildHBar('Baixa', baixa, maxP, 'var(--pri-baixa)');
    html += '</div>';

    // Por Categoria
    html += '<div class="db-panel">';
    html += '<div class="db-panel-title">📁 Por Categoria</div>';
    var cats = {};
    pending.forEach(function(t) {
      var cat = t.category || 'sem categoria';
      cats[cat] = (cats[cat] || 0) + 1;
    });
    var catKeys = Object.keys(cats).sort(function(a, b) { return cats[b] - cats[a]; });
    var maxC = catKeys.length > 0 ? cats[catKeys[0]] : 1;
    catKeys.slice(0, 6).forEach(function(cat) {
      html += buildHBar(cat, cats[cat], maxC, 'var(--text-blue)');
    });
    if (catKeys.length === 0) html += '<div style="color:#006688;font-size:11px;text-align:center;padding:12px">Nenhuma pendente</div>';
    html += '</div>';

    html += '</div>';

    // === PRODUTIVIDADE POR HORA ===
    html += '<div class="db-panel">';
    html += '<div class="db-panel-title">🕐 Produtividade por Hora</div>';
    html += '<div class="db-hours">';
    var hourCounts = {};
    done.forEach(function(t) {
      var ts = t.completedAt || t.createdAt;
      if (!ts) return;
      var h = parseInt(ts.substring(11, 13));
      if (!isNaN(h)) hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    var maxH = Math.max.apply(null, Object.values(hourCounts).concat([1]));
    var bestHour = 0;
    var bestHourCount = 0;
    for (var hr = 5; hr <= 22; hr++) {
      var hc = hourCounts[hr] || 0;
      if (hc > bestHourCount) { bestHour = hr; bestHourCount = hc; }
      var hh = hc > 0 ? Math.max(4, Math.round((hc / maxH) * 50)) : 2;
      html += '<div class="db-hour-col' + (hc === maxH && hc > 0 ? ' best' : '') + '">';
      html += '<div class="db-hour-val">' + (hc > 0 ? hc : '') + '</div>';
      html += '<div class="db-hour-fill" style="height:' + hh + 'px"></div>';
      html += '<div class="db-hour-lbl">' + hr + '</div>';
      html += '</div>';
    }
    html += '</div>';
    html += '<div style="text-align:center;font-size:10px;color:#006688;margin-top:4px">Melhor horário: <b style="color:var(--text-cyan)">' + bestHour + ':00</b></div>';
    html += '</div>';

    // === GAMIFICAÇÃO ===
    html += '<div class="db-panel">';
    html += '<div class="db-panel-title">🎮 Gamificação</div>';
    html += '<div class="db-cards" style="margin:0">';
    html += '<div class="db-card"><div class="db-card-icon">⭐</div><div class="db-card-val">Nv.' + level + '</div><div class="db-card-lbl">' + levelName + '</div></div>';
    html += '<div class="db-card"><div class="db-card-icon">✨</div><div class="db-card-val">' + xp + '</div><div class="db-card-lbl">XP Total</div></div>';
    html += '<div class="db-card"><div class="db-card-icon">🔥</div><div class="db-card-val">' + streak + '</div><div class="db-card-lbl">Streak</div></div>';
    html += '<div class="db-card"><div class="db-card-icon">📊</div><div class="db-card-val">' + done.length + '</div><div class="db-card-lbl">Total Feitas</div></div>';
    html += '</div>';
    html += '</div>';

    // Footer
    html += '<div style="text-align:center;padding:12px;font-size:10px;color:#004466">FCEUX Task Manager v3.0 — Dashboard gerado em ' + new Date().toLocaleString('pt-BR') + '</div>';

    body.innerHTML = html;
  }

  // === HELPERS ===
  function buildCircle(pct, label, sublabel, color) {
    var r = 40;
    var c = 2 * Math.PI * r;
    var offset = c - (pct / 100) * c;
    return '<svg width="100" height="100" viewBox="0 0 100 100">' +
      '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="rgba(100,100,100,0.2)" stroke-width="8"/>' +
      '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="8" stroke-dasharray="' + c + '" stroke-dashoffset="' + offset + '" transform="rotate(-90 50 50)" stroke-linecap="round"/>' +
      '<text x="50" y="46" text-anchor="middle" fill="' + color + '" font-size="18" font-family="var(--font-main)" font-weight="bold">' + label + '</text>' +
      '<text x="50" y="62" text-anchor="middle" fill="#006688" font-size="9" font-family="var(--font-main)">' + sublabel + '</text>' +
      '</svg>';
  }

  function buildHBar(label, val, max, color) {
    var w = Math.round((val / max) * 100);
    return '<div class="db-hbar">' +
      '<span class="db-hbar-lbl">' + label + '</span>' +
      '<div class="db-hbar-track"><div class="db-hbar-fill" style="width:' + w + '%;background:' + color + '"></div></div>' +
      '<span class="db-hbar-val" style="color:' + color + '">' + val + '</span>' +
      '</div>';
  }

  // Bind botão
  var btn = document.getElementById('btnDashboard');
  if (btn) btn.addEventListener('click', open);

  return { open: open, close: close };
})();
