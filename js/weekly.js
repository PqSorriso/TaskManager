/**
 * weekly.js — Relatório semanal + mensal
 */
var Weekly = (function() {
  var overlay = document.getElementById('weeklyOverlay');
  var dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  var monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  var currentTab = 'weekly';

  function open() {
    render();
    if (overlay) overlay.classList.add('visible');
  }

  function close() { if (overlay) overlay.classList.remove('visible'); }

  function getTasks() {
    return typeof TaskManager !== 'undefined' ? (TaskManager.getAllWithArchive ? TaskManager.getAllWithArchive() : TaskManager.getAll()) : [];
  }

  function countDone(tasks, dateStr) {
    return tasks.filter(function(t) {
      if (!t.done) return false;
      if (t.completedAt && t.completedAt.startsWith(dateStr)) return true;
      if (t.createdAt && t.createdAt.startsWith(dateStr)) return true;
      return false;
    }).length;
  }

  function render() {
    var body = document.getElementById('weeklyBody');
    if (!body) return;

    var html = '';

    // Abas
    html += '<div style="display:flex;gap:0;margin-bottom:12px">';
    html += '<button class="view-btn' + (currentTab === 'weekly' ? ' active' : '') + '" id="tabWeekly" style="flex:1">📅 Semanal</button>';
    html += '<button class="view-btn' + (currentTab === 'monthly' ? ' active' : '') + '" id="tabMonthly" style="flex:1">📆 Mensal</button>';
    html += '</div>';

    if (currentTab === 'weekly') {
      html += renderWeekly();
    } else {
      html += renderMonthly();
    }

    body.innerHTML = html;

    // Bind abas
    var tabW = document.getElementById('tabWeekly');
    var tabM = document.getElementById('tabMonthly');
    if (tabW) tabW.addEventListener('click', function() { currentTab = 'weekly'; render(); });
    if (tabM) tabM.addEventListener('click', function() { currentTab = 'monthly'; render(); });
  }

  function renderWeekly() {
    var tasks = getTasks();
    var today = new Date();
    var todayStr = today.toISOString().slice(0, 10);

    var days = [];
    var maxDone = 0;
    for (var i = 6; i >= 0; i--) {
      var d = new Date(today);
      d.setDate(d.getDate() - i);
      var key = d.toISOString().slice(0, 10);
      var done = countDone(tasks, key);
      if (done > maxDone) maxDone = done;
      days.push({ date: key, day: dayNames[d.getDay()], done: done, isToday: key === todayStr });
    }

    var weekDone = days.reduce(function(a, b) { return a + b.done; }, 0);
    var weekCreated = tasks.filter(function(t) {
      var d = new Date(today); d.setDate(d.getDate() - 7);
      return t.createdAt && t.createdAt >= d.toISOString();
    }).length;
    var avgDay = Math.round(weekDone / 7 * 10) / 10;
    var bestDay = days.reduce(function(a, b) { return b.done > a.done ? b : a; });

    var cats = {};
    tasks.forEach(function(t) {
      if (!t.done) return;
      var ts = t.completedAt || t.createdAt || '';
      var d = new Date(today); d.setDate(d.getDate() - 7);
      if (ts < d.toISOString()) return;
      var cat = t.category || 'sem categoria';
      cats[cat] = (cats[cat] || 0) + 1;
    });

    var streak = 0;
    if (typeof Gamification !== 'undefined') streak = Gamification.getLevelInfo().streak;

    var html = '';

    html += '<div style="color:var(--text-cyan);font-size:12px;margin-bottom:8px">📊 Tarefas concluídas por dia</div>';
    html += '<div class="weekly-chart">';
    days.forEach(function(day) {
      var height = maxDone > 0 ? Math.max(4, (day.done / maxDone) * 100) : 4;
      html += '<div class="weekly-bar' + (day.isToday ? ' today' : '') + '">' +
        '<div class="wb-val">' + day.done + '</div>' +
        '<div class="wb-fill" style="height:' + height + 'px"></div>' +
        '<div class="wb-day">' + day.day + '</div>' +
        '</div>';
    });
    html += '</div>';

    html += '<div class="weekly-stats">';
    html += '<div class="weekly-stat"><div class="ws-val">' + weekDone + '</div><div class="ws-lbl">FEITAS</div></div>';
    html += '<div class="weekly-stat"><div class="ws-val">' + weekCreated + '</div><div class="ws-lbl">CRIADAS</div></div>';
    html += '<div class="weekly-stat"><div class="ws-val">' + avgDay + '</div><div class="ws-lbl">MÉDIA/DIA</div></div>';
    html += '<div class="weekly-stat"><div class="ws-val">🏆 ' + bestDay.day + '</div><div class="ws-lbl">MELHOR (' + bestDay.done + ')</div></div>';
    html += '<div class="weekly-stat"><div class="ws-val">🔥 ' + streak + '</div><div class="ws-lbl">STREAK</div></div>';
    html += '</div>';

    var catKeys = Object.keys(cats).sort(function(a, b) { return cats[b] - cats[a]; });
    if (catKeys.length > 0) {
      var maxCat = cats[catKeys[0]];
      html += '<div style="color:var(--text-cyan);font-size:12px;margin:12px 0 8px">📁 Por categoria</div>';
      catKeys.forEach(function(cat) {
        var pct = Math.round((cats[cat] / maxCat) * 100);
        html += '<div class="weekly-cat-row"><span class="wc-name">' + cat + '</span><div class="wc-bar"><div class="wc-fill" style="width:' + pct + '%"></div></div><span class="wc-val">' + cats[cat] + '</span></div>';
      });
    }

    var grade = weekDone >= 35 ? 'S' : weekDone >= 25 ? 'A' : weekDone >= 15 ? 'B' : weekDone >= 8 ? 'C' : weekDone >= 3 ? 'D' : 'F';
    html += '<div style="text-align:center;margin-top:16px;padding-top:12px;border-top:1px solid rgba(0,100,200,0.3)">';
    html += '<div style="font-size:28px;font-weight:bold;color:var(--text-cyan)">NOTA: ' + grade + '</div>';
    html += '<div style="font-size:11px;color:#006688;margin-top:4px">' + weekDone + ' tarefas em 7 dias</div>';
    html += '</div>';

    return html;
  }

  function renderMonthly() {
    var tasks = getTasks();
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth();
    var monthStr = year + '-' + String(month + 1).padStart(2, '0');
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    // Dados por dia do mês
    var days = [];
    var maxDone = 0;
    var totalDone = 0;
    for (var i = 1; i <= daysInMonth; i++) {
      var key = monthStr + '-' + String(i).padStart(2, '0');
      var done = countDone(tasks, key);
      if (done > maxDone) maxDone = done;
      totalDone += done;
      var isFuture = i > today.getDate();
      days.push({ day: i, done: done, isFuture: isFuture, isToday: i === today.getDate() });
    }

    // Comparativo com mês anterior
    var prevMonth = month === 0 ? 11 : month - 1;
    var prevYear = month === 0 ? year - 1 : year;
    var prevMonthStr = prevYear + '-' + String(prevMonth + 1).padStart(2, '0');
    var prevDays = new Date(prevYear, prevMonth + 1, 0).getDate();
    var prevTotal = 0;
    for (var i = 1; i <= prevDays; i++) {
      prevTotal += countDone(tasks, prevMonthStr + '-' + String(i).padStart(2, '0'));
    }

    var diff = totalDone - prevTotal;
    var diffPct = prevTotal > 0 ? Math.round(((totalDone - prevTotal) / prevTotal) * 100) : (totalDone > 0 ? 100 : 0);

    // Categorias do mês
    var cats = {};
    var priCounts = { alta: 0, media: 0, baixa: 0 };
    var lateCount = 0;
    tasks.forEach(function(t) {
      if (!t.done) return;
      var ts = t.completedAt || t.createdAt || '';
      if (!ts.startsWith(monthStr)) return;
      var cat = t.category || 'sem categoria';
      cats[cat] = (cats[cat] || 0) + 1;
      priCounts[t.priority || 'media']++;
      if (t.completedLate) lateCount++;
    });

    var avgDay = Math.round(totalDone / today.getDate() * 10) / 10;
    var bestDay = days.reduce(function(a, b) { return b.done > a.done ? b : a; });
    var activeDays = days.filter(function(d) { return d.done > 0; }).length;
    var onTimePct = totalDone > 0 ? Math.round(((totalDone - lateCount) / totalDone) * 100) : 100;

    var html = '';

    // Título
    html += '<div style="text-align:center;color:var(--text-cyan);font-size:14px;font-weight:bold;margin-bottom:12px">' + monthNames[month] + ' ' + year + '</div>';

    // Mini gráfico mensal (grid)
    html += '<div style="color:var(--text-cyan);font-size:12px;margin-bottom:6px">📊 Atividade diária</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:12px">';
    days.forEach(function(d) {
      var intensity = maxDone > 0 && d.done > 0 ? Math.max(0.2, d.done / maxDone) : 0;
      var bg = d.isFuture ? 'rgba(0,0,40,0.3)' : d.done > 0 ? 'rgba(0,170,255,' + intensity + ')' : 'rgba(0,0,40,0.6)';
      var border = d.isToday ? '2px solid var(--text-cyan)' : '1px solid rgba(0,40,80,0.3)';
      html += '<div title="Dia ' + d.day + ': ' + d.done + ' tarefas" style="width:22px;height:22px;background:' + bg + ';border:' + border + ';border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:8px;color:' + (intensity > 0.5 ? '#fff' : '#006688') + '">' + (d.done > 0 ? d.done : d.isFuture ? '' : '·') + '</div>';
    });
    html += '</div>';

    // Stats grid
    html += '<div class="weekly-stats">';
    html += '<div class="weekly-stat"><div class="ws-val">' + totalDone + '</div><div class="ws-lbl">FEITAS</div></div>';
    html += '<div class="weekly-stat"><div class="ws-val">' + avgDay + '</div><div class="ws-lbl">MÉDIA/DIA</div></div>';
    html += '<div class="weekly-stat"><div class="ws-val">' + activeDays + '/' + today.getDate() + '</div><div class="ws-lbl">DIAS ATIVOS</div></div>';
    html += '<div class="weekly-stat"><div class="ws-val">🏆 ' + bestDay.day + '</div><div class="ws-lbl">MELHOR (' + bestDay.done + ')</div></div>';
    html += '<div class="weekly-stat"><div class="ws-val">' + onTimePct + '%</div><div class="ws-lbl">PONTUALIDADE</div></div>';
    html += '<div class="weekly-stat"><div class="ws-val" style="color:' + (diff >= 0 ? '#00cc66' : '#cc4444') + '">' + (diff >= 0 ? '↑' : '↓') + Math.abs(diff) + '</div><div class="ws-lbl">vs ' + monthNames[prevMonth].substring(0, 3) + '</div></div>';
    html += '</div>';

    // Prioridades
    html += '<div style="color:var(--text-cyan);font-size:12px;margin:12px 0 6px">⚡ Por prioridade</div>';
    var maxP = Math.max(priCounts.alta, priCounts.media, priCounts.baixa, 1);
    html += buildBar('Alta', priCounts.alta, maxP, 'var(--pri-alta)');
    html += buildBar('Média', priCounts.media, maxP, 'var(--pri-media)');
    html += buildBar('Baixa', priCounts.baixa, maxP, 'var(--pri-baixa)');

    // Categorias
    var catKeys = Object.keys(cats).sort(function(a, b) { return cats[b] - cats[a]; });
    if (catKeys.length > 0) {
      var maxCat = cats[catKeys[0]];
      html += '<div style="color:var(--text-cyan);font-size:12px;margin:12px 0 6px">📁 Por categoria</div>';
      catKeys.slice(0, 6).forEach(function(cat) {
        html += buildBar(cat, cats[cat], maxCat, 'var(--text-blue)');
      });
    }

    // Metas
    if (typeof Goals !== 'undefined') {
      var monthlyDone = Goals.getMonthlyDone();
      var monthlyGoal = Goals.getGoals().monthlyTarget;
      var monthlyPct = Math.min(100, Math.round((monthlyDone / monthlyGoal) * 100));
      html += '<div style="color:var(--text-cyan);font-size:12px;margin:12px 0 6px">🎯 Meta mensal</div>';
      html += buildBar(monthlyDone + '/' + monthlyGoal, monthlyPct, 100, monthlyPct >= 100 ? '#00cc66' : 'var(--text-cyan)');
    }

    // Nota
    var grade = totalDone >= 120 ? 'S' : totalDone >= 80 ? 'A' : totalDone >= 50 ? 'B' : totalDone >= 25 ? 'C' : totalDone >= 10 ? 'D' : 'F';
    html += '<div style="text-align:center;margin-top:16px;padding-top:12px;border-top:1px solid rgba(0,100,200,0.3)">';
    html += '<div style="font-size:28px;font-weight:bold;color:var(--text-cyan)">NOTA: ' + grade + '</div>';
    html += '<div style="font-size:11px;color:#006688;margin-top:4px">' + totalDone + ' tarefas em ' + monthNames[month] + '</div>';
    html += '</div>';

    return html;
  }

  function buildBar(label, val, max, color) {
    var pct = Math.round((val / max) * 100);
    return '<div class="weekly-cat-row"><span class="wc-name">' + label + '</span><div class="wc-bar"><div class="wc-fill" style="width:' + pct + '%;background:' + color + '"></div></div><span class="wc-val">' + val + '</span></div>';
  }

  // Binds
  var closeBtn = document.getElementById('weeklyCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (overlay) overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
  var btnWeekly = document.getElementById('btnWeekly');
  if (btnWeekly) btnWeekly.addEventListener('click', open);

  return { open: open, close: close };
})();
