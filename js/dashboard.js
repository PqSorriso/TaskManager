/**
 * dashboard.js — Dashboard Executivo
 * Análise completa de produtividade com dados exclusivos
 * Diferente do Stats: foca em tendências, comparativos e previsões
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

  function open() { createOverlay(); render(); overlay.classList.add('visible'); }
  function close() { if (overlay) overlay.classList.remove('visible'); }

  function getAllTasks() {
    return typeof TaskManager !== 'undefined' ? (TaskManager.getAllWithArchive ? TaskManager.getAllWithArchive() : TaskManager.getAll()) : [];
  }

  function getDateStr(d) { return d.toISOString().slice(0, 10); }

  function countDoneOnDate(tasks, dateStr) {
    return tasks.filter(function(t) {
      if (!t.done) return false;
      if (t.completedAt && t.completedAt.startsWith(dateStr)) return true;
      if (t.createdAt && t.createdAt.startsWith(dateStr)) return true;
      return false;
    }).length;
  }

  function render() {
    var body = document.getElementById('dashboardBody');
    if (!body) return;

    var tasks = getAllTasks();
    var today = new Date();
    var todayStr = getDateStr(today);
    var done = tasks.filter(function(t) { return t.done; });
    var pending = tasks.filter(function(t) { return !t.done; });
    var dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    var html = '';

    // ============================================
    // 1. SCORE DE PRODUTIVIDADE
    // ============================================
    var doneToday = countDoneOnDate(tasks, todayStr);
    var lateCount = done.filter(function(t) { return t.completedLate; }).length;
    var onTimePct = done.length > 0 ? Math.round(((done.length - lateCount) / done.length) * 100) : 100;

    // Calcular score baseado em múltiplos fatores
    var streak = 0;
    if (typeof Gamification !== 'undefined') streak = Gamification.getLevelInfo().streak;

    var overdue = pending.filter(function(t) {
      if (!t.dueDate) return false;
      if (t.dueDate < todayStr) return true;
      if (t.dueDate === todayStr && t.dueTime) {
        var p = t.dueTime.split(':');
        var d = new Date(); d.setHours(parseInt(p[0]), parseInt(p[1]), 0, 0);
        if (new Date() > d) return true;
      }
      return false;
    }).length;

    var score = 50;
    score += Math.min(20, doneToday * 5);
    score += Math.min(15, streak * 3);
    score += Math.min(10, onTimePct / 10);
    score -= Math.min(20, overdue * 5);
    score = Math.max(0, Math.min(100, Math.round(score)));

    var scoreGrade = score >= 90 ? 'S' : score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : score >= 30 ? 'D' : 'F';
    var scoreColor = score >= 80 ? '#00cc66' : score >= 50 ? '#ccaa00' : '#cc4444';
    var scoreEmoji = score >= 90 ? '🏆' : score >= 80 ? '🔥' : score >= 65 ? '⭐' : score >= 50 ? '👍' : score >= 30 ? '💪' : '😴';

    html += '<div class="db-panel" style="text-align:center;padding:16px">';
    html += '<div class="db-panel-title">' + scoreEmoji + ' Score de Produtividade</div>';
    html += '<div style="display:flex;justify-content:center;gap:20px;align-items:center;margin:8px 0">';
    html += buildCircle(score, scoreGrade, score + '/100', scoreColor);
    html += '<div style="text-align:left;font-size:11px;color:#006688;line-height:1.8">';
    html += '✅ Feitas hoje: <b style="color:var(--text-cyan)">' + doneToday + '</b><br>';
    html += '🔥 Streak: <b style="color:var(--text-cyan)">' + streak + ' dias</b><br>';
    html += '⏰ Pontualidade: <b style="color:' + (onTimePct >= 80 ? '#00cc66' : '#ccaa00') + '">' + onTimePct + '%</b><br>';
    html += '🚨 Atrasadas: <b style="color:' + (overdue > 0 ? 'var(--pri-alta)' : '#00cc66') + '">' + overdue + '</b>';
    html += '</div></div></div>';

    // ============================================
    // 2. COMPARATIVO SEMANAL
    // ============================================
    html += '<div class="db-panel">';
    html += '<div class="db-panel-title">📈 Esta Semana vs Semana Passada</div>';

    var thisWeek = 0;
    var lastWeek = 0;
    for (var i = 0; i < 7; i++) {
      var d1 = new Date(today); d1.setDate(d1.getDate() - i);
      thisWeek += countDoneOnDate(tasks, getDateStr(d1));
      var d2 = new Date(today); d2.setDate(d2.getDate() - i - 7);
      lastWeek += countDoneOnDate(tasks, getDateStr(d2));
    }

    var weekDiff = thisWeek - lastWeek;
    var weekPct = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : (thisWeek > 0 ? 100 : 0);

    html += '<div class="db-cards" style="margin:0">';
    html += '<div class="db-card"><div class="db-card-val" style="color:var(--text-cyan)">' + thisWeek + '</div><div class="db-card-lbl">Esta semana</div></div>';
    html += '<div class="db-card"><div class="db-card-val" style="color:#006688">' + lastWeek + '</div><div class="db-card-lbl">Semana passada</div></div>';
    html += '<div class="db-card"><div class="db-card-val" style="color:' + (weekDiff >= 0 ? '#00cc66' : '#cc4444') + '">' + (weekDiff >= 0 ? '↑' : '↓') + Math.abs(weekDiff) + '</div><div class="db-card-lbl">Diferença</div></div>';
    html += '<div class="db-card"><div class="db-card-val" style="color:' + (weekPct >= 0 ? '#00cc66' : '#cc4444') + '">' + (weekPct >= 0 ? '+' : '') + weekPct + '%</div><div class="db-card-lbl">Variação</div></div>';
    html += '</div></div>';

    // ============================================
    // 3. MAPA DE CALOR (dia x hora)
    // ============================================
    html += '<div class="db-panel">';
    html += '<div class="db-panel-title">🗓️ Mapa de Calor — Quando você produz mais</div>';

    var heatmap = {};
    var maxHeat = 1;
    done.forEach(function(t) {
      var ts = t.completedAt || t.createdAt;
      if (!ts) return;
      var d = new Date(ts);
      var day = d.getDay();
      var hour = d.getHours();
      var period = hour < 9 ? '6-9' : hour < 12 ? '9-12' : hour < 15 ? '12-15' : hour < 18 ? '15-18' : '18+';
      var key = day + '-' + period;
      heatmap[key] = (heatmap[key] || 0) + 1;
      if (heatmap[key] > maxHeat) maxHeat = heatmap[key];
    });

    var periods = ['6-9', '9-12', '12-15', '15-18', '18+'];
    html += '<table style="width:100%;border-collapse:collapse;font-size:10px">';
    html += '<tr><td style="width:40px"></td>';
    for (var di = 1; di <= 6; di++) { html += '<td style="text-align:center;color:#006688;padding:2px">' + dayNames[di % 7] + '</td>'; }
    html += '<td style="text-align:center;color:#006688;padding:2px">' + dayNames[0] + '</td></tr>';

    periods.forEach(function(period) {
      html += '<tr><td style="color:#006688;font-size:9px;text-align:right;padding-right:4px">' + period + '</td>';
      for (var di = 1; di <= 6; di++) {
        var dayIdx = di % 7;
        var val = heatmap[dayIdx + '-' + period] || 0;
        var intensity = val > 0 ? Math.max(0.2, val / maxHeat) : 0;
        var bg = val > 0 ? 'rgba(0,170,255,' + intensity + ')' : 'rgba(0,0,40,0.5)';
        html += '<td style="text-align:center;padding:6px 2px;background:' + bg + ';border:1px solid rgba(0,40,80,0.3);border-radius:2px;color:' + (intensity > 0.5 ? '#fff' : '#006688') + '">' + (val > 0 ? val : '·') + '</td>';
      }
      var val0 = heatmap['0-' + period] || 0;
      var intensity0 = val0 > 0 ? Math.max(0.2, val0 / maxHeat) : 0;
      var bg0 = val0 > 0 ? 'rgba(0,170,255,' + intensity0 + ')' : 'rgba(0,0,40,0.5)';
      html += '<td style="text-align:center;padding:6px 2px;background:' + bg0 + ';border:1px solid rgba(0,40,80,0.3);border-radius:2px;color:' + (intensity0 > 0.5 ? '#fff' : '#006688') + '">' + (val0 > 0 ? val0 : '·') + '</td>';
      html += '</tr>';
    });
    html += '</table>';
    html += '</div>';

    // ============================================
    // 4. PREVISÃO
    // ============================================
    html += '<div class="db-panel">';
    html += '<div class="db-panel-title">🔮 Previsões</div>';

    var last7 = 0;
    for (var i = 0; i < 7; i++) {
      var d = new Date(today); d.setDate(d.getDate() - i);
      last7 += countDoneOnDate(tasks, getDateStr(d));
    }
    var avgPerDay = last7 / 7;
    var daysToZero = avgPerDay > 0 ? Math.ceil(pending.length / avgPerDay) : '∞';

    var altaPending = pending.filter(function(t) { return t.priority === 'alta'; }).length;
    var daysToZeroAlta = avgPerDay > 0 ? Math.ceil(altaPending / avgPerDay) : '∞';

    html += '<div class="db-cards" style="margin:0">';
    html += '<div class="db-card"><div class="db-card-icon">📏</div><div class="db-card-val">' + (Math.round(avgPerDay * 10) / 10) + '</div><div class="db-card-lbl">Média/dia (7d)</div></div>';
    html += '<div class="db-card"><div class="db-card-icon">🏁</div><div class="db-card-val">' + daysToZero + '</div><div class="db-card-lbl">Dias pra zerar</div></div>';
    html += '<div class="db-card"><div class="db-card-icon">🔴</div><div class="db-card-val">' + altaPending + '</div><div class="db-card-lbl">Alta pendentes</div></div>';
    html += '<div class="db-card"><div class="db-card-icon">⚡</div><div class="db-card-val">' + daysToZeroAlta + '</div><div class="db-card-lbl">Dias p/ zerar alta</div></div>';
    html += '</div></div>';

    // ============================================
    // 5. TENDÊNCIA 30 DIAS
    // ============================================
    html += '<div class="db-panel">';
    html += '<div class="db-panel-title">📉 Tendência — 30 dias</div>';
    html += '<div class="db-trend">';

    var trendData = [];
    var maxTrend = 1;
    for (var i = 29; i >= 0; i--) {
      var d = new Date(today); d.setDate(d.getDate() - i);
      var key = getDateStr(d);
      var count = countDoneOnDate(tasks, key);
      trendData.push({ date: key, day: d.getDate(), count: count, isToday: key === todayStr });
      if (count > maxTrend) maxTrend = count;
    }

    trendData.forEach(function(td, idx) {
      var h = td.count > 0 ? Math.max(4, Math.round((td.count / maxTrend) * 60)) : 2;
      html += '<div class="db-trend-bar' + (td.isToday ? ' today' : '') + '" title="' + td.date + ': ' + td.count + '">';
      html += '<div class="db-trend-fill" style="height:' + h + 'px"></div>';
      if (idx % 5 === 0 || td.isToday) html += '<div class="db-trend-day">' + td.day + '</div>';
      html += '</div>';
    });
    html += '</div></div>';

    // ============================================
    // 6. PROJETOS — PROGRESSO
    // ============================================
    var projects = {};
    tasks.forEach(function(t) {
      var proj = t.project || 'Geral';
      if (!projects[proj]) projects[proj] = { total: 0, done: 0 };
      projects[proj].total++;
      if (t.done) projects[proj].done++;
    });

    var projKeys = Object.keys(projects).filter(function(k) { return projects[k].total > 1; });
    if (projKeys.length > 0) {
      html += '<div class="db-panel">';
      html += '<div class="db-panel-title">📁 Progresso por Projeto</div>';
      projKeys.sort(function(a, b) { return projects[b].total - projects[a].total; });
      projKeys.slice(0, 8).forEach(function(proj) {
        var p = projects[proj];
        var pct = Math.round((p.done / p.total) * 100);
        var color = pct >= 80 ? '#00cc66' : pct >= 50 ? '#ccaa00' : 'var(--text-cyan)';
        html += '<div class="db-hbar">';
        html += '<span class="db-hbar-lbl">' + proj + '</span>';
        html += '<div class="db-hbar-track"><div class="db-hbar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>';
        html += '<span class="db-hbar-val" style="color:' + color + '">' + pct + '%</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    // ============================================
    // 7. RANKING — TAREFAS MAIS LONGAS
    // ============================================
    var withTime = done.filter(function(t) { return t.timeSpent && t.timeSpent > 0; });
    if (withTime.length > 0) {
      withTime.sort(function(a, b) { return b.timeSpent - a.timeSpent; });
      html += '<div class="db-panel">';
      html += '<div class="db-panel-title">⏱️ Top 5 — Tarefas Mais Demoradas</div>';
      withTime.slice(0, 5).forEach(function(t, i) {
        var mins = Math.round(t.timeSpent / 60);
        html += '<div style="display:flex;gap:8px;align-items:center;padding:4px 0;border-bottom:1px solid rgba(0,40,80,0.2);font-size:11px">';
        html += '<span style="color:var(--text-cyan);font-weight:bold;min-width:18px">#' + (i + 1) + '</span>';
        html += '<span style="flex:1;color:var(--text-green);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + t.text + '</span>';
        html += '<span style="color:#006688;min-width:50px;text-align:right">' + mins + ' min</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    // ============================================
    // 8. HÁBITOS
    // ============================================
    var habits = [];
    try { habits = JSON.parse(localStorage.getItem('fceux_habits') || '[]'); } catch(e) {}
    if (habits.length > 0) {
      html += '<div class="db-panel">';
      html += '<div class="db-panel-title">🎯 Performance de Hábitos</div>';
      habits.forEach(function(h) {
        var streak = h.streak || 0;
        var bestStreak = h.bestStreak || 0;
        var totalDays = h.history ? Object.keys(h.history).length : 0;
        var successDays = h.history ? Object.values(h.history).filter(function(v) { return v >= (h.target || 1); }).length : 0;
        var rate = totalDays > 0 ? Math.round((successDays / totalDays) * 100) : 0;
        var color = rate >= 80 ? '#00cc66' : rate >= 50 ? '#ccaa00' : '#cc4444';

        html += '<div style="display:flex;gap:8px;align-items:center;padding:4px 0;border-bottom:1px solid rgba(0,40,80,0.2);font-size:11px">';
        html += '<span style="font-size:16px">' + (h.icon || '🎯') + '</span>';
        html += '<span style="flex:1;color:var(--text-green)">' + h.name + '</span>';
        html += '<span style="color:#006688">🔥' + streak + '</span>';
        html += '<span style="color:#006688">🏆' + bestStreak + '</span>';
        html += '<span style="color:' + color + ';min-width:35px;text-align:right">' + rate + '%</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    // Footer
    html += '<div style="text-align:center;padding:12px;font-size:10px;color:#004466">FCEUX Task Manager v3.0 — ' + new Date().toLocaleString('pt-BR') + '</div>';

    body.innerHTML = html;
  }

  function buildCircle(pct, label, sublabel, color) {
    var r = 40;
    var c = 2 * Math.PI * r;
    var offset = c - (pct / 100) * c;
    return '<svg width="100" height="100" viewBox="0 0 100 100">' +
      '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="rgba(100,100,100,0.2)" stroke-width="8"/>' +
      '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="8" stroke-dasharray="' + c + '" stroke-dashoffset="' + offset + '" transform="rotate(-90 50 50)" stroke-linecap="round"/>' +
      '<text x="50" y="46" text-anchor="middle" fill="' + color + '" font-size="22" font-family="var(--font-main)" font-weight="bold">' + label + '</text>' +
      '<text x="50" y="62" text-anchor="middle" fill="#006688" font-size="9" font-family="var(--font-main)">' + sublabel + '</text>' +
      '</svg>';
  }

  var btn = document.getElementById('btnDashboard');
  if (btn) btn.addEventListener('click', open);

  return { open: open, close: close };
})();
