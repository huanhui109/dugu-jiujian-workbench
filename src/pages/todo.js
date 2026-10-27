"use strict";
/* ============================================================================
 * 待办 · 总诀式 —— 辨招定式：按场景 / 招式过滤，优先级，完成态切换
 * ==========================================================================*/
function addTodo() {
  var t = document.getElementById("todoTitle").value.trim();
  if (!t) { showBanner("请先填写事项", false); return; }
  var due = document.getElementById("todoDue").value;
  state.todos.push({
    id: uid(), title: t, priority: document.getElementById("todoPriority").value, due: due || "",
    scene: document.getElementById("todoScene").value, move: document.getElementById("todoMove").value, note: "", done: false, createdAt: Date.now()
  });
  bumpAdded(1); markFirstRecord();
  track("record_created", "todo", document.getElementById("todoScene").value, { move: document.getElementById("todoMove").value });
  document.getElementById("todoTitle").value = ""; document.getElementById("todoDue").value = "";
  saveState(); refreshAll();
}
function toggleTodo(id) {
  var it = state.todos.find(function (x) { return x.id === id; }); if (!it) return;
  it.done = !it.done; if (it.done) it.doneAt = Date.now();
  saveState(); refreshAll();
}
function delTodo(id) { state.todos = state.todos.filter(function (x) { return x.id !== id; }); saveState(); refreshAll(); }

function renderTodos() {
  var list = document.getElementById("todoList");
  var sf = state.meta.sceneFilter.todo || "all";
  var mf = document.getElementById("todoMoveFilter").value || "all";
  var data = state.todos.filter(function (x) {
    if (sf !== "all" && x.scene !== sf) return false;
    if (mf !== "all" && x.move !== mf) return false;
    return true;
  });
  if (data.length === 0) { list.innerHTML = '<div class="empty">行囊空空，添一笔今日要务。</div>'; }
  else {
    var html = "";
    data.slice().sort(function (a, b) { return (a.done ? 1 : 0) - (b.done ? 1 : 0) || (a.due || "9999").localeCompare(b.due || "9999"); })
      .forEach(function (x) {
        var pcls = x.priority === "高" ? "high" : (x.priority === "中" ? "mid" : "");
        html += '<div class="row' + (x.done ? " done" : "") + '">'
          + '<div class="main"><div class="t">' + esc(x.title) + '</div><div class="m">' + (x.due ? ("截止 " + esc(x.due)) : "无截止") + (x.note ? (" · " + esc(x.note)) : "") + '</div></div>'
          + sceneChip(x.scene)
          + (x.move ? '<span class="chip move">' + esc(MOVE_MAP[x.move] ? MOVE_MAP[x.move].move : "") + '</span>' : '')
          + '<span class="chip ' + pcls + '">' + esc(x.priority) + '</span>'
          + '<div class="actions"><button class="icon-btn ' + (x.done ? "ok" : "") + '" data-tog="' + x.id + '">' + (x.done ? checkSVG() : circleSVG()) + '</button>'
          + '<button class="icon-btn" data-del="' + x.id + '">' + trashSVG() + '</button></div></div>';
      });
    list.innerHTML = html;
    bindRow(list);
  }
  var total = state.todos.length, done = state.todos.filter(function (x) { return x.done; }).length;
  var high = state.todos.filter(function (x) { return !x.done && x.priority === "高"; }).length;
  document.getElementById("todoStats").innerHTML =
    stat("总事项", total) + stat("已完成", done) + stat("未完成", total - done) + stat("高优先级未了", high, "out");
}

function bindRow(list) {
  Array.prototype.forEach.call(list.querySelectorAll("[data-tog]"), function (b) {
    b.addEventListener("click", function () { toggleTodo(b.getAttribute("data-tog")); });
  });
  Array.prototype.forEach.call(list.querySelectorAll("[data-del]"), function (b) {
    b.addEventListener("click", function () { delTodo(b.getAttribute("data-del")); });
  });
}
