"use strict";
/* ============================================================================
 * 今日要务 —— 逾期未完成标红、昨日未了自动顺延、双场景合并视图
 * ==========================================================================*/
function renderToday() {
  var box = document.getElementById("todayList");
  var t = todayStr();
  var items = state.todos.filter(function (x) { return !x.done && x.due; })
    .map(function (x) { return { it: x, diff: daysBetween(x.due, t) }; })
    .filter(function (o) { return o.diff <= 0; })
    .sort(function (a, b) { return a.diff - b.diff; });
  if (items.length === 0) { box.innerHTML = '<div class="today-empty">今日无待处理事项，且待破之招皆已了。</div>'; }
  else {
    var html = "";
    items.forEach(function (o) {
      var overdue = o.diff < 0;
      html += '<div class="today-item' + (overdue ? " overdue" : "") + '">'
        + '<span class="tag">' + (overdue ? "⚑ 逾期" : "● 今日") + '</span>'
        + '<div class="txt">' + esc(o.it.title) + '<small>' + (overdue ? ("逾期 " + (-o.diff) + " 天") : "今日") + ' · ' + esc(SCENE_LABEL[o.it.scene] || "") + (o.it.move ? (" · " + esc(MOVE_MAP[o.it.move] ? MOVE_MAP[o.it.move].move : "")) : "") + '</small></div>'
        + '<button class="btn sm primary" data-handle="' + o.it.id + '">处理</button></div>';
    });
    box.innerHTML = html;
    Array.prototype.forEach.call(box.querySelectorAll("[data-handle]"), function (b) {
      b.addEventListener("click", function () { toggleTodo(b.getAttribute("data-handle")); });
    });
  }
  /* 今日脚注：本周记录量（北极星）+ 最长连续 */
  var weekStart = new Date(); var dow = weekStart.getDay(); var diff = (dow === 0 ? -6 : (1 - dow));
  var ws = new Date(); ws.setDate(ws.getDate() + diff); ws.setHours(0, 0, 0, 0);
  var weekRecs = (state.events || []).filter(function (e) { return e.event === "record_created" && e.t >= ws.getTime(); }).length;
  var target = 21; var pct = Math.min(100, Math.round(weekRecs / target * 100));
  var best = 0; state.habits.forEach(function (h) { var s = calcStreak(h.records); if (s > best) best = s; });
  document.getElementById("todayFoot").innerHTML =
    '<div class="mini">本周记录量 <b>' + weekRecs + '</b><div class="bar"><i style="width:' + pct + '%"></i></div></div>'
    + '<div class="mini">最长连续 <b>' + best + '</b> 天</div>';
}
