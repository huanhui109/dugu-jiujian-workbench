"use strict";
/* ============================================================================
 * 工具函数层 —— 日期 / 格式化 / 埋点 / 导出辅助
 * 这些函数被各页面与 store 调用，自身不依赖页面渲染，只依赖全局 state（运行时）。
 * ==========================================================================*/

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function todayStr() { var d = new Date(); return fmtDate(d); }
function fmtDate(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}
function dayOfYear(d) { var start = new Date(d.getFullYear(), 0, 0); return Math.floor((d - start) / 86400000); }
function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
function sceneChip(sc) {
  return sc === "work" ? '<span class="chip work">工作</span>'
    : (sc === "life" ? '<span class="chip life">生活</span>' : '<span class="chip">交织</span>');
}

/* ---------- 埋点（轻量本地事件，用于本周记录量 / 模块启用统计） ---------- */
function track(event, module, scene, meta) {
  state.events = state.events || [];
  state.events.push({ t: Date.now(), event: event, module: module || "", scene: scene || "", meta: meta || {} });
  if (state.events.length > 2000) { state.events = state.events.slice(-2000); } /* 控制体积 */
}
function markFirstRecord() {
  if (!state.meta.firstRecordAt) { state.meta.firstRecordAt = Date.now(); track("first_record", "", "", {}); }
}
function markModuleEnabled(module) {
  state.meta.enabledModules = state.meta.enabledModules || {};
  if (!state.meta.enabledModules[module]) { state.meta.enabledModules[module] = true; track("module_enabled", module, "", {}); }
}
function markDauPing() {
  var t = todayStr();
  if (state.meta.lastPingDate !== t) { state.meta.lastPingDate = t; track("dau_ping", "", "", {}); }
}

/* ---------- 统计卡小工具 ---------- */
function stat(k, v, cls) {
  return '<div class="stat"><div class="k">' + k + '</div><div class="v ' + (cls || "") + '">' + v + '</div></div>';
}

/* ---------- 金额格式化（国内习惯：千分位，红支出绿收入在渲染层处理） ---------- */
function fmtMoney(n) {
  return (Math.round(n * 100) / 100).toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/* ---------- 备份提醒（新增满 20 条温和提示导出） ---------- */
function checkBackupReminder() {
  var n = state.meta.addedSinceBackup || 0;
  if (n >= 20) { showBanner("你已新增 " + n + " 条记录，建议导出 JSON 备份，避免数据丢失。", false); }
}

/* ---------- CSV 单元格转义 ---------- */
function csvCell(v) { v = String(v == null ? "" : v); return '"' + v.replace(/"/g, '""') + '"'; }

/* ---------- 通用下载（导出 JSON / CSV / 加密备份） ---------- */
function downloadText(filename, text, mime) {
  var blob = new Blob([text], { type: mime || "application/octet-stream" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a"); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------- AES-GCM 加密辅助（Base64 <-> ArrayBuffer） ---------- */
function bufToB64(buf) {
  var b = new Uint8Array(buf); var s = "";
  for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}
function b64ToBuf(b64) {
  var s = atob(b64); var u = new Uint8Array(s.length);
  for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u.buffer;
}
