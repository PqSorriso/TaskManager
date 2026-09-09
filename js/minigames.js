/**
 * minigames.js — Mini-games extras
 * Memory + Snake — acessíveis pelo PIXEL
 */
var MiniGames = (function() {

  // ============================================
  // 1. MEMORY — Jogo da Memória
  // ============================================
  var memoryOverlay = null;
  var memoryCards = [];
  var memoryFlipped = [];
  var memoryMatched = 0;
  var memoryMoves = 0;
  var memoryLocked = false;

  var emojis = ['🎮', '🤖', '🔥', '⭐', '🏆', '💎', '🎯', '🚀'];

  function openMemory() {
    if (!memoryOverlay) createMemoryOverlay();
    memoryOverlay.classList.add('visible');
    initMemory();
  }

  function createMemoryOverlay() {
    memoryOverlay = document.createElement('div');
    memoryOverlay.className = 'dashboard-overlay';
    memoryOverlay.innerHTML =
      '<div class="dashboard-window" style="max-width:380px">' +
        '<div class="dashboard-header">' +
          '<span>🧠 Memory — Jogo da Memória</span>' +
          '<button class="stats-close-btn" id="memoryClose">✕</button>' +
        '</div>' +
        '<div style="padding:8px;text-align:center">' +
          '<div style="display:flex;justify-content:space-between;padding:4px 8px;font-size:11px;color:#006688">' +
            '<span>Moves: <b id="memMoves" style="color:var(--text-cyan)">0</b></span>' +
            '<span>Pares: <b id="memPairs" style="color:var(--text-cyan)">0</b>/8</span>' +
          '</div>' +
          '<div id="memoryGrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:8px"></div>' +
          '<div id="memResult" style="font-size:14px;color:var(--text-cyan);margin-top:8px;min-height:20px"></div>' +
          '<button id="memRestart" style="margin-top:8px;background:rgba(0,100,200,0.3);border:1px solid rgba(0,170,255,0.4);color:var(--text-cyan);font-family:var(--font-main);font-size:11px;padding:5px 16px;cursor:pointer;border-radius:3px">🔄 Jogar de novo</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(memoryOverlay);

    document.getElementById('memoryClose').addEventListener('click', function() { memoryOverlay.classList.remove('visible'); });
    memoryOverlay.addEventListener('click', function(e) { if (e.target === memoryOverlay) memoryOverlay.classList.remove('visible'); });
    document.getElementById('memRestart').addEventListener('click', initMemory);
  }

  function initMemory() {
    memoryFlipped = [];
    memoryMatched = 0;
    memoryMoves = 0;
    memoryLocked = false;
    document.getElementById('memMoves').textContent = '0';
    document.getElementById('memPairs').textContent = '0';
    document.getElementById('memResult').textContent = '';

    var pairs = emojis.concat(emojis);
    pairs.sort(function() { return Math.random() - 0.5; });

    var grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';

    memoryCards = [];
    pairs.forEach(function(emoji, i) {
      var card = document.createElement('div');
      card.style.cssText = 'width:60px;height:60px;background:rgba(0,40,80,0.8);border:1px solid rgba(0,100,200,0.3);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;transition:all 0.2s;user-select:none';
      card.textContent = '❓';
      card.dataset.idx = i;
      card.dataset.emoji = emoji;
      card.dataset.flipped = 'false';

      card.addEventListener('click', function() { flipCard(card); });
      grid.appendChild(card);
      memoryCards.push(card);
    });
  }

  function flipCard(card) {
    if (memoryLocked) return;
    if (card.dataset.flipped === 'true') return;
    if (memoryFlipped.length >= 2) return;

    card.textContent = card.dataset.emoji;
    card.dataset.flipped = 'true';
    card.style.background = 'rgba(0,100,200,0.4)';
    memoryFlipped.push(card);

    if (typeof Sounds !== 'undefined') Sounds.click();

    if (memoryFlipped.length === 2) {
      memoryMoves++;
      document.getElementById('memMoves').textContent = memoryMoves;
      memoryLocked = true;

      if (memoryFlipped[0].dataset.emoji === memoryFlipped[1].dataset.emoji) {
        // Match!
        memoryMatched++;
        document.getElementById('memPairs').textContent = memoryMatched;
        memoryFlipped[0].style.background = 'rgba(0,200,100,0.3)';
        memoryFlipped[0].style.borderColor = 'rgba(0,200,100,0.5)';
        memoryFlipped[1].style.background = 'rgba(0,200,100,0.3)';
        memoryFlipped[1].style.borderColor = 'rgba(0,200,100,0.5)';
        memoryFlipped = [];
        memoryLocked = false;

        if (memoryMatched === 8) {
          var msg = '';
          var xp = 0;
          if (memoryMoves <= 12) { msg = '🏆 PERFEITO! ' + memoryMoves + ' moves!'; xp = 30; }
          else if (memoryMoves <= 18) { msg = '⭐ ÓTIMO! ' + memoryMoves + ' moves!'; xp = 15; }
          else if (memoryMoves <= 25) { msg = '👍 BOM! ' + memoryMoves + ' moves!'; xp = 10; }
          else { msg = '✅ Completou em ' + memoryMoves + ' moves!'; xp = 5; }

          document.getElementById('memResult').textContent = msg + ' +' + xp + ' XP';
          if (typeof Gamification !== 'undefined') Gamification.addBonusXP(xp, 'Memory Game');
          if (typeof Sounds !== 'undefined') Sounds.complete();
        }
      } else {
        // No match
        setTimeout(function() {
          memoryFlipped[0].textContent = '❓';
          memoryFlipped[0].dataset.flipped = 'false';
          memoryFlipped[0].style.background = 'rgba(0,40,80,0.8)';
          memoryFlipped[1].textContent = '❓';
          memoryFlipped[1].dataset.flipped = 'false';
          memoryFlipped[1].style.background = 'rgba(0,40,80,0.8)';
          memoryFlipped = [];
          memoryLocked = false;
        }, 600);
      }
    }
  }

  // ============================================
  // 2. SNAKE — Cobrinha
  // ============================================
  var snakeOverlay = null;
  var snakeCanvas = null;
  var snakeCtx = null;
  var snakeInterval = null;
  var snake = [];
  var snakeDir = { x: 1, y: 0 };
  var snakeNextDir = { x: 1, y: 0 };
  var food = { x: 0, y: 0 };
  var snakeScore = 0;
  var snakeRunning = false;
  var GRID = 15;
  var CELL = 18;

  function openSnake() {
    if (!snakeOverlay) createSnakeOverlay();
    snakeOverlay.classList.add('visible');
    initSnake();
  }

  function createSnakeOverlay() {
    snakeOverlay = document.createElement('div');
    snakeOverlay.className = 'dashboard-overlay';
    snakeOverlay.innerHTML =
      '<div class="dashboard-window" style="max-width:320px">' +
        '<div class="dashboard-header">' +
          '<span>🐍 Snake</span>' +
          '<button class="stats-close-btn" id="snakeClose">✕</button>' +
        '</div>' +
        '<div style="padding:8px;text-align:center">' +
          '<div style="font-size:11px;color:#006688;margin-bottom:6px">Score: <b id="snakeScore" style="color:var(--text-cyan)">0</b></div>' +
          '<canvas id="snakeCanvas" width="' + (GRID * CELL) + '" height="' + (GRID * CELL) + '" style="background:#001a00;border:1px solid rgba(0,100,0,0.4);border-radius:4px;display:block;margin:0 auto"></canvas>' +
          '<div id="snakeResult" style="font-size:12px;color:var(--text-cyan);margin-top:6px;min-height:18px"></div>' +
          '<div style="margin-top:6px;display:flex;justify-content:center;gap:4px">' +
            '<button class="snk-btn" id="snkUp">⬆️</button>' +
          '</div>' +
          '<div style="display:flex;justify-content:center;gap:4px">' +
            '<button class="snk-btn" id="snkLeft">⬅️</button>' +
            '<button class="snk-btn" id="snkDown">⬇️</button>' +
            '<button class="snk-btn" id="snkRight">➡️</button>' +
          '</div>' +
          '<div style="font-size:9px;color:#006688;margin-top:4px">Use setas do teclado ou os botões</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(snakeOverlay);

    document.getElementById('snakeClose').addEventListener('click', function() {
      snakeOverlay.classList.remove('visible');
      clearInterval(snakeInterval);
      snakeRunning = false;
    });
    snakeOverlay.addEventListener('click', function(e) {
      if (e.target === snakeOverlay) {
        snakeOverlay.classList.remove('visible');
        clearInterval(snakeInterval);
        snakeRunning = false;
      }
    });

    // Mobile controls
    document.getElementById('snkUp').addEventListener('click', function() { if (snakeDir.y !== 1) snakeNextDir = { x: 0, y: -1 }; });
    document.getElementById('snkDown').addEventListener('click', function() { if (snakeDir.y !== -1) snakeNextDir = { x: 0, y: 1 }; });
    document.getElementById('snkLeft').addEventListener('click', function() { if (snakeDir.x !== 1) snakeNextDir = { x: -1, y: 0 }; });
    document.getElementById('snkRight').addEventListener('click', function() { if (snakeDir.x !== -1) snakeNextDir = { x: 1, y: 0 }; });

    // Keyboard
    document.addEventListener('keydown', function(e) {
      if (!snakeRunning) return;
      if (e.key === 'ArrowUp' && snakeDir.y !== 1) { snakeNextDir = { x: 0, y: -1 }; e.preventDefault(); }
      if (e.key === 'ArrowDown' && snakeDir.y !== -1) { snakeNextDir = { x: 0, y: 1 }; e.preventDefault(); }
      if (e.key === 'ArrowLeft' && snakeDir.x !== 1) { snakeNextDir = { x: -1, y: 0 }; e.preventDefault(); }
      if (e.key === 'ArrowRight' && snakeDir.x !== -1) { snakeNextDir = { x: 1, y: 0 }; e.preventDefault(); }
    });

    snakeCanvas = document.getElementById('snakeCanvas');
    snakeCtx = snakeCanvas.getContext('2d');
  }

  function initSnake() {
    if (snakeInterval) clearInterval(snakeInterval);
    snakeScore = 0;
    snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }];
    snakeDir = { x: 1, y: 0 };
    snakeNextDir = { x: 1, y: 0 };
    snakeRunning = true;
    document.getElementById('snakeScore').textContent = '0';
    document.getElementById('snakeResult').textContent = '';
    placeFood();
    snakeInterval = setInterval(snakeTick, 150);
  }

  function placeFood() {
    do {
      food = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (snake.some(function(s) { return s.x === food.x && s.y === food.y; }));
  }

  function snakeTick() {
    snakeDir = snakeNextDir;
    var head = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };

    // Wrap around
    if (head.x < 0) head.x = GRID - 1;
    if (head.x >= GRID) head.x = 0;
    if (head.y < 0) head.y = GRID - 1;
    if (head.y >= GRID) head.y = 0;

    // Self collision
    if (snake.some(function(s) { return s.x === head.x && s.y === head.y; })) {
      endSnake();
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      snakeScore++;
      document.getElementById('snakeScore').textContent = snakeScore;
      placeFood();
      if (typeof Sounds !== 'undefined') Sounds.click();
    } else {
      snake.pop();
    }

    drawSnake();
  }

  function drawSnake() {
    if (!snakeCtx) return;
    snakeCtx.fillStyle = '#001a00';
    snakeCtx.fillRect(0, 0, GRID * CELL, GRID * CELL);

    // Grid lines
    snakeCtx.strokeStyle = 'rgba(0,50,0,0.3)';
    for (var i = 0; i < GRID; i++) {
      snakeCtx.beginPath();
      snakeCtx.moveTo(i * CELL, 0);
      snakeCtx.lineTo(i * CELL, GRID * CELL);
      snakeCtx.stroke();
      snakeCtx.beginPath();
      snakeCtx.moveTo(0, i * CELL);
      snakeCtx.lineTo(GRID * CELL, i * CELL);
      snakeCtx.stroke();
    }

    // Snake
    snake.forEach(function(s, i) {
      snakeCtx.fillStyle = i === 0 ? '#00ff00' : '#00cc00';
      snakeCtx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
      if (i === 0) {
        // Eyes
        snakeCtx.fillStyle = '#000';
        var ex = snakeDir.x === 1 ? 12 : snakeDir.x === -1 ? 3 : 4;
        var ey = snakeDir.y === 1 ? 12 : snakeDir.y === -1 ? 3 : 4;
        snakeCtx.fillRect(s.x * CELL + ex, s.y * CELL + ey, 3, 3);
      }
    });

    // Food
    snakeCtx.fillStyle = '#ff4444';
    snakeCtx.beginPath();
    snakeCtx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 3, 0, Math.PI * 2);
    snakeCtx.fill();
  }

  function endSnake() {
    clearInterval(snakeInterval);
    snakeRunning = false;

    var msg = '';
    var xp = 0;
    if (snakeScore >= 30) { msg = '🏆 LENDÁRIO! Score: ' + snakeScore; xp = 40; }
    else if (snakeScore >= 20) { msg = '🔥 INSANO! Score: ' + snakeScore; xp = 25; }
    else if (snakeScore >= 10) { msg = '⭐ ÓTIMO! Score: ' + snakeScore; xp = 15; }
    else if (snakeScore >= 5) { msg = '👍 BOM! Score: ' + snakeScore; xp = 5; }
    else { msg = '🐍 Score: ' + snakeScore + '. Tente de novo!'; }

    document.getElementById('snakeResult').textContent = msg + (xp > 0 ? ' +' + xp + ' XP' : '');
    if (xp > 0 && typeof Gamification !== 'undefined') Gamification.addBonusXP(xp, 'Snake Game');
    if (typeof Sounds !== 'undefined') Sounds.complete();
  }

  return {
    openMemory: openMemory,
    openSnake: openSnake
  };
})();
