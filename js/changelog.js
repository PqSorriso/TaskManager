/**
 * changelog.js — O que há de novo
 * Mostra ao atualizar versão
 */
var Changelog = (function() {
  var KEY = 'fceux_last_version';
  var CURRENT = '3.0';

  var changes = [
    { ver: '3.0', date: '2026-08', items: [
      '📊 Dashboard Executivo com score, heatmap e previsões',
      '📆 Relatório Mensal com grid de atividade',
      '🎯 Metas semanais e mensais com progresso circular',
      '📜 Log de atividades automático',
      '🧠 PIXEL aprende padrões de produtividade',
      '💬 PIXEL humor proativo expandido',
      '🐱 Pet interativo com frases e truques',
      '✨ Animação sparkle ao completar tarefas',
      '🎨 8 temas (Dracula, Nord, Sunset, Light)',
      '📄 Export PDF profissional',
      '📊 Export CSV para planilha',
      '☀️ Tema automático dia/noite',
      '⏰ Overdue por horário em todo o sistema',
      '⏰ Horário de trabalho configurável',
      '🟢 Matrix configurável (toggle + tempo)',
      '🎯 Focus Mode com tempo livre + bloqueio',
      '🏆 Tela de conclusão Pomodoro + Foco',
      '📊 Stats preservam tarefas arquivadas',
      '📊 Dashbar conta só tarefas de hoje',
      '🔺 Auto-escala ignora recorrências diárias',
      '📅 Integração Outlook (ICS + email)',
      '📖 Help 100% documentado',
      '🏆 150+ features · 52 módulos · v3.0'
    ]}
  ];

  function check() {
    var lastVer = localStorage.getItem(KEY);
    if (lastVer === CURRENT) return;
    setTimeout(function() { show(); }, 4000);
  }

  function show() {
    var existing = document.getElementById('changelogOverlay');
    if (existing) { existing.classList.add('visible'); return; }

    var latest = changes[0];

    var overlay = document.createElement('div');
    overlay.id = 'changelogOverlay';
    overlay.className = 'dashboard-overlay visible';
    overlay.innerHTML =
      '<div class="dashboard-window" style="max-width:420px">' +
        '<div class="dashboard-header">' +
          '<span>🆕 O que há de novo — v' + latest.ver + '</span>' +
          '<button class="stats-close-btn" id="changelogCloseBtn">✕</button>' +
        '</div>' +
        '<div class="dashboard-body" id="changelogBody" style="max-height:60vh;overflow-y:auto;padding:12px"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var html = '<div style="font-size:11px;color:#006688;margin-bottom:12px">Atualizado em ' + latest.date + '</div>';
    latest.items.forEach(function(item) {
      html += '<div style="padding:4px 0;font-size:12px;color:var(--text-green);border-bottom:1px solid rgba(0,40,80,0.15)">' + item + '</div>';
    });
    html += '<div style="text-align:center;margin-top:16px">';
    html += '<button id="changelogDismiss" style="background:rgba(0,150,80,0.4);border:1px solid rgba(0,200,100,0.5);color:var(--pri-baixa);font-family:var(--font-main);font-size:12px;padding:8px 30px;cursor:pointer;border-radius:4px">✨ Entendi, vamos lá!</button>';
    html += '</div>';

    document.getElementById('changelogBody').innerHTML = html;

    document.getElementById('changelogCloseBtn').addEventListener('click', dismiss);
    document.getElementById('changelogDismiss').addEventListener('click', dismiss);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) dismiss(); });
  }

  function dismiss() {
    localStorage.setItem(KEY, CURRENT);
    var ov = document.getElementById('changelogOverlay');
    if (ov) ov.classList.remove('visible');
  }

  function init() { check(); }

  return { init: init, show: show };
})();
