"use strict";
/* ============================================================================
 * 应用主控 —— 统一刷新入口 + 初始化 + 事件绑定
 * 各页面与数据/UI 模块均为全局函数（classic script 共享全局作用域），
 * 本文件最后加载，确保 refreshAll / init 调用时所有函数已定义。
 * ==========================================================================*/

/* 统一刷新入口：固定顺序调用各渲染函数，避免渲染函数互调形成环（铁律：单向调用） */
function refreshAll() {
  renderToday(); renderTodos(); renderLedger(); renderHabits(); renderWisdom(); renderBreak();
  checkBackupReminder();
}

function init() {
  loadState();
  if (!storageOk) setSync("存储不可用", "err");
  markDauPing();
  /* 默认日期填充 */
  var now = todayStr();
  document.getElementById("todoDue").value = now;
  document.getElementById("lgDate").value = now;
  /* 填充招式下拉 */
  var todoMove = document.getElementById("todoMove"), habitMove = document.getElementById("habitMove"), todoMoveFilter = document.getElementById("todoMoveFilter");
  MOVES.forEach(function (m) {
    todoMove.insertAdjacentHTML("beforeend", '<option value="' + m.id + '">' + esc(m.move) + ' · ' + esc(m.name) + '</option>');
    habitMove.insertAdjacentHTML("beforeend", '<option value="' + m.id + '">' + esc(m.move) + ' · ' + esc(m.name) + '</option>');
    todoMoveFilter.insertAdjacentHTML("beforeend", '<option value="' + m.id + '">' + esc(m.move) + ' · ' + esc(m.name) + '</option>');
  });
  todoMoveFilter.value = "all";
  /* 绑定按钮 */
  document.getElementById("addTodo").addEventListener("click", addTodo);
  document.getElementById("addLedger").addEventListener("click", addLedger);
  document.getElementById("addHabit").addEventListener("click", addHabit);
  document.getElementById("breakAnalyze").addEventListener("click", analyzeBreak);
  document.getElementById("exportBtn").addEventListener("click", function () { exportJSON(false); });
  document.getElementById("exportEncBtn").addEventListener("click", function () { exportJSON(true); });
  document.getElementById("exportEventsBtn").addEventListener("click", exportEvents);
  document.getElementById("importBtn").addEventListener("click", function () { document.getElementById("importFile").click(); });
  document.getElementById("importFile").addEventListener("change", function (e) { if (e.target.files[0]) importJSON(e.target.files[0]); e.target.value = ""; });
  document.getElementById("clearDemoBtn").addEventListener("click", clearAll);
  document.getElementById("loadDemoBtn").addEventListener("click", loadDemoPack);
  document.getElementById("openDrawer").addEventListener("click", openDrawer);
  document.getElementById("closeDrawer").addEventListener("click", closeDrawer);
  document.getElementById("scrim").addEventListener("click", closeDrawer);
  document.getElementById("bannerClose").addEventListener("click", function () { document.getElementById("banner").className = "banner"; });
  /* 场景过滤分段控件 */
  bindSceneSeg("todoSceneSeg", "todo");
  bindSceneSeg("ledgerSceneSeg", "ledger");
  /* Tab 切换 */
  Array.prototype.forEach.call(document.querySelectorAll("#tabs button"), function (b) {
    b.addEventListener("click", function () {
      var tab = b.getAttribute("data-tab");
      Array.prototype.forEach.call(document.querySelectorAll("#tabs button"), function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      Array.prototype.forEach.call(document.querySelectorAll("section.panel"), function (p) { p.classList.remove("active"); });
      document.getElementById("panel-" + tab).classList.add("active");
      markModuleEnabled(tab);
    });
  });
  markModuleEnabled("break");
  refreshAll();
}

/* 启动：DOM 就绪后初始化（与单文件版本行为一致） */
if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); }
else { init(); }
