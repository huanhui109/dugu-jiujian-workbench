"use strict";
/* ============================================================================
 * 习练 · 破气式 —— 把自律变成节奏：习惯打卡、连续天数、热力图
 * 气者势也：识势、顺势、借势，把坚持交给时间。
 * ==========================================================================*/
function addHabit() {
  var n = document.getElementById("habitName").value.trim();
  if (!n) { showBanner("请填写习惯名称", false); return; }
  state.habits.push({
    id: uid(), name: n, move: document.getElementById("habitMove").value, records: {}, createdAt: Date.now()
  });
  bumpAdded(1); markFirstRecord();
  track("record_created", "habit", "", { move: document.getElementById("habitMove").value });
  document.getElementById("habitName").value = ""; document.getElementById("habitMove").value = "";
  saveState(); refreshAll();
}
function toggleHabit(id) {
  var h = state.habits.find(function (x) { return x.id === id; }); if (!h) return;
  var k = todayStr();
  if (h.records[k]) { delete h.records[k]; }
  else {
    h.records[k] = true; bumpAdded(1); markFirstRecord();
    track("record_created", "habit", "", { move: h.move });
    var st = calcStreak(h.records);
    var milestones = [7, 21, 30,50, 100, 200];
    if (milestones.indexOf(st) >= 0) { track("streak_milestone", "habit", "", { streak: st, name: h.name }); showBanner("🗡 连续 " + st + " 天！「" + h.name + "」已成势。", false); }
  }
  saveState(); refreshAll();
}
function delHabit(id) { state.habits = state.habits.filter(function (x) { return x.id !== id; }); saveState(); refreshAll(); }

function renderHabits() {
  var list = document.getElementById("habitList");
  if (state.habits.length === 0) { list.innerHTML = '<div class="empty">立一念，让节奏代替意志。</div>'; return; }
  var html = "";
  state.habits.forEach(function (h) {
    var done = !!h.records[todayStr()];
    var streak = calcStreak(h.records);
    html += '<div class="row"><div class="main"><div class="t">' + esc(h.name) + '</div>'
      + (h.move ? '<div class="m">关联：' + esc(MOVE_MAP[h.move] ? MOVE_MAP[h.move].name : "") + '</div>' : '')
      + '<div class="heat">' + heatHTML(h.records) + '</div>'
      + '<div class="streak">连续 ' + streak + ' 天 · 累计 ' + Object.keys(h.records).length + ' 次</div></div>'
      + '<div class="actions"><button class="icon-btn ' + (done ? "ok" : "") + '" data-hb="' + h.id + '">' + (done ? checkSVG() : circleSVG()) + '</button>'
      + '<button class="icon-btn" data-hd="' + h.id + '">' + trashSVG() + '</button></div></div>';
  });
  list.innerHTML = html;
  Array.prototype.forEach.call(list.querySelectorAll("[data-hb]"), function (b) {
    b.addEventListener("click", function () { toggleHabit(b.getAttribute("data-hb")); });
  });
  Array.prototype.forEach.call(list.querySelectorAll("[data-hd]"), function (b) {
    b.addEventListener("click", function () { delHabit(b.getAttribute("data-hd")); });
  });
}
