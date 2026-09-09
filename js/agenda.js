/**
 * agenda.js — Agenda do Dia (view por hora)
 */
var Agenda = (function() {
  var body = document.getElementById('agendaBody');
  var title = document.getElementById('agendaTitle');
  var currentDate = new Date();

  function render() {
    if (!body) return;
    var tasks = typeof TaskManager !== 'undefined' ? TaskManager.getAll() : [];
    var dateStr = currentDate.toISOString().slice(0, 10);
    var today = new Date().toISOString().slice(0, 10);
    var dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    // Título
    if (title) {
      var dStr = String(currentDate.getDate()).padStart(2, '0') + '/' + String(currentDate.getMonth() + 1).padStart(2, '0');
      var dayName = dayNames[currentDate.getDay()];
      title.textContent = (dateStr === today ? '📅 Hoje — ' : '📅 ') + dayName + ' ' + dStr;
    }

    // Tarefas do dia
    var dayTasks = tasks.filter(function(t) { return t.dueDate === dateStr; });
    var withTime = dayTasks.filter(function(t) { return t.dueTime; }).sort(function(a, b) { return a.dueTime.localeCompare(b.dueTime); });
    var noTime = dayTasks.filter(function(t) { return !t.dueTime; });

    // Gerar slots de hora
    var html = '';
    var now = new Date();
    var currentHour = now.getHours();

    for (var h = 6; h <= 22; h++) {
      var hourStr = String(h).padStart(2, '0') + ':00';
      var hourTasks = withTime.filter(function(t) {
        var tHour = parseInt(t.dueTime.split(':')[0]);
        return tHour === h;
      });

      var isPast = dateStr === today && h < currentHour;
      var isCurrent = dateStr === today && h === currentHour;
      var slotClass = 'agenda-slot' + (isCurrent ? ' current' : '') + (isPast ? ' past' : '');

      html += '<div class="' + slotClass + '">';
      html += '<div class="agenda-hour">' + hourStr + '</div>';
      html += '<div class="agenda-tasks">';

      if (hourTasks.length > 0) {
        hourTasks.forEach(function(t) {
          var priClass = 'p-' + t.priority;
          html += '<div class="agenda-task ' + priClass + (t.done ? ' done' : '') + '" data-id="' + t.id + '">';
          html += '<span class="agenda-task-time">' + t.dueTime + '</span>';
          html += '<span class="agenda-task-check" data-id="' + t.id + '">' + (t.done ? '[X]' : '[ ]') + '</span>';
          html += '<span class="agenda-task-text">' + escHtml(t.text) + '</span>';
          html += '<span class="agenda-task-pri">' + t.priority.toUpperCase() + '</span>';
          html += '</div>';
        });
      } else {
        html += '<div class="agenda-empty">—</div>';
      }

      html += '</div></div>';
    }

    // Sem horário
    if (noTime.length > 0) {
      html += '<div class="agenda-slot notime">';
      html += '<div class="agenda-hour">📌</div>';
      html += '<div class="agenda-tasks">';
      noTime.forEach(function(t) {
        html += '<div class="agenda-task p-' + t.priority + (t.done ? ' done' : '') + '" data-id="' + t.id + '">';
        html += '<span class="agenda-task-check" data-id="' + t.id + '">' + (t.done ? '[X]' : '[ ]') + '</span>';
        html += '<span class="agenda-task-text">' + escHtml(t.text) + '</span>';
        html += '<span class="agenda-task-pri">' + t.priority.toUpperCase() + '</span>';
        html += '</div>';
      });
      html += '</div></div>';
    }

    // Resumo
    var doneCount = dayTasks.filter(function(t) { return t.done; }).length;
    html += '<div class="agenda-summary">';
    html += '<span>Total: ' + dayTasks.length + '</span>';
    html += '<span>Feitas: ' + doneCount + '</span>';
    html += '<span>Pendentes: ' + (dayTasks.length - doneCount) + '</span>';
    html += '</div>';

    body.innerHTML = html;

    // Bind check
    body.querySelectorAll('.agenda-task-check').forEach(function(chk) {
      chk.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = Number(chk.dataset.id);
        if (typeof TaskManager !== 'undefined') TaskManager.toggleTask(id);
        setTimeout(render, 300);
      });
    });

    // Bind click pra editar
    body.querySelectorAll('.agenda-task').forEach(function(task) {
      task.addEventListener('dblclick', function() {
        var id = Number(task.dataset.id);
        if (typeof TaskUI !== 'undefined') TaskUI.openEdit(id);
      });
    });

    // Scroll pro horário atual
    if (dateStr === today) {
      var currentSlot = body.querySelector('.agenda-slot.current');
      if (currentSlot) currentSlot.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function escHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function prevDay() { currentDate.setDate(currentDate.getDate() - 1); render(); }
  function nextDay() { currentDate.setDate(currentDate.getDate() + 1); render(); }
  function goToday() { currentDate = new Date(); render(); }

  function init() {
    var prev = document.getElementById('agendaPrev');
    var next = document.getElementById('agendaNext');
    if (prev) prev.addEventListener('click', prevDay);
    if (next) next.addEventListener('click', nextDay);
    if (title) title.addEventListener('click', goToday);
  }

  return { init: init, render: render };
})();
