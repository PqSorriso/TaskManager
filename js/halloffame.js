/**
 * halloffame.js — Hall da Fama — Recordes pessoais
 */
var HallOfFame = (function() {
  function open() {
    var existing = document.getElementById('hofOverlay');
    if (existing) { existing.classList.add('visible'); render(); return; }

    var overlay = document.createElement('div');
    overlay.id = 'hofOverlay';
    overlay.className = 'dashboard-overlay visible';
    overlay.innerHTML =
      '<div class="dashboard-window" style="max-width:420px">' +
        '<div class="dashboard-header">' +
          '<span>🏆 Hall da Fama</span>' +
          '<button class="stats-close-btn" id="hofClose">✕</button>' +
        '</div>' +
        '<div class="dashboard-body" id="hofBody"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    document.getElementById('hofClose').addEventListener('click', function() { overlay.classList.remove('visible'); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.classList.remove('visible'); });

    render();
  }

  function render() {
    var body = document.getElementById('hofBody');
    if (!body) return;

    var tasks = typeof TaskManager !== 'undefined' ? (TaskManager.getAllWithArchive ? TaskManager.getAllWithArchive() : TaskManager.getAll()) : [];
    var done = tasks.filter(function(t) { return t.done; });

    // Recordes
    var streak = 0;
    var maxStreak = parseInt(localStorage.getItem('fceux_max_streak') || '0');
    var level = 1;
    var xp = 0;
    if (typeof Gamification !== 'undefined') {
      var info = Gamification.getLevelInfo();
      streak = info.streak;
      level = info.level;
      xp = info.xp;
      if (streak > maxStreak) { maxStreak = streak; localStorage.setItem('fceux_max_streak', String(maxStreak)); }
    }

    // Melhor dia
    var dayCounts = {};
    done.forEach(function(t) {
      var ts = t.completedAt || t.createdAt || '';
      var day = ts.substring(0, 10);
      if (day) dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    var bestDay = { date: '—', count: 0 };
    Object.keys(dayCounts).forEach(function(d) {
      if (dayCounts[d] > bestDay.count) bestDay = { date: d, count: dayCounts[d] };
    });

    // Melhor semana
    var weekCounts = {};
    done.forEach(function(t) {
      var ts = t.completedAt || t.createdAt || '';
      if (!ts) return;
      var d = new Date(ts);
      var weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      var key = weekStart.toISOString().slice(0, 10);
      weekCounts[key] = (weekCounts[key] || 0) + 1;
    });
    var bestWeek = { date: '—', count: 0 };
    Object.keys(weekCounts).forEach(function(w) {
      if (weekCounts[w] > bestWeek.count) bestWeek = { date: w, count: weekCounts[w] };
    });

    // Mais rápida
    var fastest = null;
    done.forEach(function(t) {
      if (t.timeSpent && t.timeSpent > 0) {
        if (!fastest || t.timeSpent < fastest.time) fastest = { text: t.text, time: t.timeSpent };
      }
    });

    // Hora mais produtiva
    var hourCounts = {};
    done.forEach(function(t) {
      var ts = t.completedAt || t.createdAt || '';
      if (!ts) return;
      var h = parseInt(ts.substring(11, 13));
      if (!isNaN(h)) hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    var bestHour = 0; var bestHourCount = 0;
    Object.keys(hourCounts).forEach(function(h) {
      if (hourCounts[h] > bestHourCount) { bestHour = h; bestHourCount = hourCounts[h]; }
    });

    // Dia da semana mais produtivo
    var dowCounts = [0, 0, 0, 0, 0, 0, 0];
    var dowNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    done.forEach(function(t) {
      var ts = t.completedAt || t.createdAt || '';
      if (!ts) return;
      var d = new Date(ts);
      dowCounts[d.getDay()]++;
    });
    var bestDow = 0;
    dowCounts.forEach(function(c, i) { if (c > dowCounts[bestDow]) bestDow = i; });

    // Conquistas
    var totalBadges = 0;
    var unlockedBadges = 0;
    try {
      var ul = JSON.parse(localStorage.getItem('fceux_badges_unlocked') || '{}');
      unlockedBadges = Object.keys(ul).length;
    } catch(e) {}

    // Pomos
    var totalPomos = parseInt(localStorage.getItem('fceux_pomos_total') || '0');

    // Game scores
    var smashRecord = parseInt(localStorage.getItem('fceux_smash_record') || '0');
    var snakeRecord = parseInt(localStorage.getItem('fceux_snake_record') || '0');
    var memoryRecord = parseInt(localStorage.getItem('fceux_memory_record') || '999');
    if (memoryRecord === 999) memoryRecord = 0;

    var html = '';

    html += '<div style="text-align:center;padding:8px;font-size:12px;color:var(--text-cyan)">Seus melhores momentos! 🏆</div>';

    var records = [
      { icon: '🔥', label: 'Maior Streak', value: maxStreak + ' dias' },
      { icon: '📅', label: 'Melhor Dia', value: bestDay.count + ' tarefas' + (bestDay.date !== '—' ? ' (' + formatDate(bestDay.date) + ')' : '') },
      { icon: '📊', label: 'Melhor Semana', value: bestWeek.count + ' tarefas' },
      { icon: '⚡', label: 'Mais Rápida', value: fastest ? Math.round(fastest.time / 60) + ' min — "' + fastest.text.substring(0, 25) + '"' : 'Nenhuma com timer' },
      { icon: '🍅', label: 'Pomodoros', value: totalPomos + ' total' },
      { icon: '⭐', label: 'Nível', value: 'Lv.' + level + ' (' + xp + ' XP)' },
      { icon: '✅', label: 'Total Concluídas', value: done.length },
      { icon: '📆', label: 'Dia mais produtivo', value: dowNames[bestDow] + ' (' + dowCounts[bestDow] + ')' },
      { icon: '⏰', label: 'Hora mais produtiva', value: bestHour + ':00 (' + bestHourCount + ' tarefas)' },
      { icon: '🏆', label: 'Conquistas', value: unlockedBadges + ' desbloqueadas' },
    ];

    records.forEach(function(r) {
      html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid rgba(0,40,80,0.15)">';
      html += '<span style="font-size:20px">' + r.icon + '</span>';
      html += '<span style="flex:1;font-size:12px;color:var(--text-green)">' + r.label + '</span>';
      html += '<span style="font-size:12px;font-weight:bold;color:var(--text-cyan)">' + r.value + '</span>';
      html += '</div>';
    });

    // Game records
    if (smashRecord > 0 || snakeRecord > 0 || memoryRecord > 0) {
      html += '<div style="padding:8px 12px;font-size:11px;color:var(--text-cyan);border-top:2px solid rgba(0,100,200,0.3);margin-top:4px">🎮 Recordes de Jogos</div>';
      if (smashRecord > 0) html += buildRecord('🎯', 'PIXEL SMASH', smashRecord + ' cliques');
      if (snakeRecord > 0) html += buildRecord('🐍', 'Snake', snakeRecord + ' pontos');
      if (memoryRecord > 0 && memoryRecord < 999) html += buildRecord('🧠', 'Memory', memoryRecord + ' moves');
    }

    body.innerHTML = html;
  }

  function buildRecord(icon, label, value) {
    return '<div style="display:flex;align-items:center;gap:10px;padding:6px 12px;border-bottom:1px solid rgba(0,40,80,0.1)">' +
      '<span style="font-size:16px">' + icon + '</span>' +
      '<span style="flex:1;font-size:11px;color:#006688">' + label + '</span>' +
      '<span style="font-size:11px;font-weight:bold;color:var(--text-cyan)">' + value + '</span></div>';
  }

  function formatDate(d) {
    return d.substring(8) + '/' + d.substring(5, 7);
  }

  return { open: open };
})();
