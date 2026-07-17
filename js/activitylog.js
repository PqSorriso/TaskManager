/**
 * activitylog.js — Log de atividades
 * Registra criação, conclusão, edição e exclusão de tarefas
 */
var ActivityLog = (function() {
  var STORAGE_KEY = 'fceux_activity_log';
  var MAX_ENTRIES = 200;
  var log = [];

  function load() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) log = JSON.parse(saved);
    } catch(e) { log = []; }
  }

  function save() {
    if (log.length > MAX_ENTRIES) log = log.slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  }

  function add(action, taskText, details) {
    log.unshift({
      time: new Date().toISOString(),
      action: action,
      task: taskText || '',
      details: details || ''
    });
    save();
  }

  function getAll() { return log; }

  function getToday() {
    var today = new Date().toISOString().slice(0, 10);
    return log.filter(function(e) { return e.time.startsWith(today); });
  }

  function clear() { log = []; save(); }

  // === UI ===
  function open() {
    var existing = document.getElementById('actLogOverlay');
    if (existing) { existing.classList.add('visible'); renderLog(); return; }

    var overlay = document.createElement('div');
    overlay.id = 'actLogOverlay';
    overlay.className = 'dashboard-overlay visible';
    overlay.innerHTML =
      '<div class="dashboard-window">' +
        '<div class="dashboard-header">' +
          '<span>📜 Log de Atividades</span>' +
          '<button class="stats-close-btn" id="actLogCloseBtn">✕</button>' +
        '</div>' +
        '<div class="dashboard-body" id="actLogBody" style="max-height:70vh;overflow-y:auto"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    document.getElementById('actLogCloseBtn').addEventListener('click', function() {
      overlay.classList.remove('visible');
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.classList.remove('visible');
    });

    renderLog();
  }

  function renderLog() {
    var body = document.getElementById('actLogBody');
    if (!body) return;

    var html = '';
    var todayStr = new Date().toISOString().slice(0, 10);
    var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    var yesterdayStr = yesterday.toISOString().slice(0, 10);

    var icons = {
      'criar': '➕', 'concluir': '✅', 'reabrir': '🔄',
      'editar': '✏️', 'excluir': '🗑️', 'arquivar': '📦',
      'duplicar': '📋', 'escalar': '🔺', 'hábito': '🎯',
      'pomodoro': '🍅', 'foco': '🎯', 'badge': '🏆',
      'desafio': '🎯', 'backup': '💾'
    };

    if (log.length === 0) {
      html = '<div style="text-align:center;padding:40px;color:#006688">Nenhuma atividade registrada ainda.</div>';
      body.innerHTML = html;
      return;
    }

    var currentDate = '';
    log.forEach(function(entry) {
      var date = entry.time.substring(0, 10);
      var time = entry.time.substring(11, 16);

      // Separador de data
      if (date !== currentDate) {
        currentDate = date;
        var dateLabel = date === todayStr ? 'Hoje' : date === yesterdayStr ? 'Ontem' : formatDateBR(date);
        html += '<div style="padding:8px 0 4px;color:var(--text-cyan);font-size:12px;font-weight:bold;border-bottom:1px solid rgba(0,100,200,0.2);margin-top:8px">' + dateLabel + '</div>';
      }

      var icon = icons[entry.action] || '📝';
      html += '<div style="display:flex;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid rgba(0,40,80,0.15);font-size:11px">';
      html += '<span style="color:#006688;min-width:35px">' + time + '</span>';
      html += '<span style="font-size:14px">' + icon + '</span>';
      html += '<span style="color:var(--text-green);flex:1">' + entry.task + '</span>';
      if (entry.details) html += '<span style="color:#006688;font-size:10px">' + entry.details + '</span>';
      html += '</div>';
    });

    body.innerHTML = html;
  }

  function formatDateBR(d) {
    var dt = new Date(d + 'T00:00:00');
    return String(dt.getDate()).padStart(2, '0') + '/' + String(dt.getMonth() + 1).padStart(2, '0') + '/' + dt.getFullYear();
  }

  function init() { load(); }
  
  var btnLog = document.getElementById('btnActivityLog');
  if (btnLog) btnLog.addEventListener('click', open);

  return {
    init: init,
    add: add,
    getAll: getAll,
    getToday: getToday,
    open: open,
    clear: clear
  };
})();
