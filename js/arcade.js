/**
 * arcade.js — Arcade — Central de mini-games
 */
var Arcade = (function() {
  function open() {
    var existing = document.getElementById('arcadeOverlay');
    if (existing) { existing.classList.add('visible'); render(); return; }

    var overlay = document.createElement('div');
    overlay.id = 'arcadeOverlay';
    overlay.className = 'dashboard-overlay visible';
    overlay.innerHTML =
      '<div class="dashboard-window" style="max-width:400px">' +
        '<div class="dashboard-header">' +
          '<span>🎮 FCEUX Arcade</span>' +
          '<button class="stats-close-btn" id="arcadeClose">✕</button>' +
        '</div>' +
        '<div class="dashboard-body" id="arcadeBody"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    document.getElementById('arcadeClose').addEventListener('click', function() { overlay.classList.remove('visible'); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.classList.remove('visible'); });

    render();
  }

  function render() {
    var body = document.getElementById('arcadeBody');
    if (!body) return;

    var smashRecord = parseInt(localStorage.getItem('fceux_smash_record') || '0');
    var snakeRecord = parseInt(localStorage.getItem('fceux_snake_record') || '0');
    var memoryRecord = parseInt(localStorage.getItem('fceux_memory_record') || '0');
    var totalGames = parseInt(localStorage.getItem('fceux_games_played') || '0');
    var totalGameXP = parseInt(localStorage.getItem('fceux_game_xp') || '0');

    var html = '';

    html += '<div style="text-align:center;padding:8px;font-size:10px;color:#006688">🎮 ' + totalGames + ' partidas · ✨ ' + totalGameXP + ' XP ganho em jogos</div>';

    // PIXEL SMASH
    html += '<div class="arcade-card">';
    html += '<div class="arcade-icon">🎯</div>';
    html += '<div class="arcade-info">';
    html += '<div class="arcade-name">PIXEL SMASH</div>';
    html += '<div class="arcade-desc">Clique no alvo o máximo em 10s!</div>';
    html += '<div class="arcade-record">Recorde: <b>' + (smashRecord || '—') + '</b></div>';
    html += '</div>';
    html += '<button class="arcade-play" id="arcPlaySmash">▶ JOGAR</button>';
    html += '</div>';

    // MEMORY
    html += '<div class="arcade-card">';
    html += '<div class="arcade-icon">🧠</div>';
    html += '<div class="arcade-info">';
    html += '<div class="arcade-name">MEMORY</div>';
    html += '<div class="arcade-desc">Encontre os 8 pares de emojis!</div>';
    html += '<div class="arcade-record">Recorde: <b>' + (memoryRecord > 0 ? memoryRecord + ' moves' : '—') + '</b></div>';
    html += '</div>';
    html += '<button class="arcade-play" id="arcPlayMemory">▶ JOGAR</button>';
    html += '</div>';

    // SNAKE
    html += '<div class="arcade-card">';
    html += '<div class="arcade-icon">🐍</div>';
    html += '<div class="arcade-info">';
    html += '<div class="arcade-name">SNAKE</div>';
    html += '<div class="arcade-desc">Cobrinha clássica! Use as setas.</div>';
    html += '<div class="arcade-record">Recorde: <b>' + (snakeRecord || '—') + '</b></div>';
    html += '</div>';
    html += '<button class="arcade-play" id="arcPlaySnake">▶ JOGAR</button>';
    html += '</div>';

    html += '<div style="text-align:center;padding:8px;font-size:9px;color:#006688">Todos os jogos dão XP!</div>';

    body.innerHTML = html;

    // Binds
    document.getElementById('arcPlaySmash').addEventListener('click', function() {
      document.getElementById('arcadeOverlay').classList.remove('visible');
      if (typeof Mascot !== 'undefined') Mascot.startGame();
    });
    document.getElementById('arcPlayMemory').addEventListener('click', function() {
      document.getElementById('arcadeOverlay').classList.remove('visible');
      if (typeof MiniGames !== 'undefined') MiniGames.openMemory();
    });
    document.getElementById('arcPlaySnake').addEventListener('click', function() {
      document.getElementById('arcadeOverlay').classList.remove('visible');
      if (typeof MiniGames !== 'undefined') MiniGames.openSnake();
    });
  }

  return { open: open };
})();
