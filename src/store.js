"use strict";
/* ============================================================================
 * 数据层 —— 全局状态、本地存储、示例数据、合并导入、清空、导出/加密备份
 * 依赖：util（track/markFirstRecord/bumpAdded 等运行时调用）、ui（showBanner/showFatal）
 * ==========================================================================*/

var state = null;
var storageOk = true;
var fatalMode = false;

/* 默认空白状态 */
function defaultState() {
  return {
    todos: [], ledger: [], habits: [],
    wisdom: { favs: [] },
    breakDesk: [],
    events: [],
    meta: {
      addedSinceBackup: 0, lastBackupAt: null, budget: null, lastPingDate: null,
      firstRecordAt: null, enabledModules: {}, demoLoaded: false,
      sceneFilter: { todo: "all", ledger: "all" }
    }
  };
}

/* 读取本地存储；损坏则进入 fatal 模式并保留原数据 */
function loadState() {
  var raw = null;
  try { raw = localStorage.getItem(LS_KEY); } catch (e) { storageOk = false; raw = null; }
  if (raw === null) { state = defaultState(); seedDemo(); return; }
  try {
    var parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("格式异常");
    state = defaultState();
    state.todos = Array.isArray(parsed.todos) ? parsed.todos : [];
    state.ledger = Array.isArray(parsed.ledger) ? parsed.ledger : [];
    state.habits = Array.isArray(parsed.habits) ? parsed.habits : [];
    state.breakDesk = Array.isArray(parsed.breakDesk) ? parsed.breakDesk : [];
    state.events = Array.isArray(parsed.events) ? parsed.events : [];
    state.wisdom = Object.assign({ favs: [] }, parsed.wisdom || {});
    state.meta = Object.assign(defaultState().meta, parsed.meta || {});
    state.meta.sceneFilter = Object.assign({ todo: "all", ledger: "all" }, state.meta.sceneFilter || {});
    storageOk = true;
  } catch (e) {
    fatalMode = true;
    state = defaultState();
    storageOk = true;
    showFatal("本地数据读取失败，可能已损坏。你可以导入此前备份的 JSON 来恢复，或清空重置。原始数据已被保留，切勿关闭页面直至恢复。");
  }
}

function saveState() {
  if (!storageOk) return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    setSync("已本地保存", "");
  } catch (e) {
    storageOk = false;
    setSync("保存失败：存储不可用或已满，请尽快导出备份", "err");
    showBanner("⚠️ 保存失败：浏览器存储不可用或空间已满，请尽快导出备份。", true);
  }
}

function bumpAdded(n) {
  state.meta.addedSinceBackup = (state.meta.addedSinceBackup || 0) + (n || 1);
}

/* ---------- 首启示例数据 ---------- */
function seedDemo() {
  var t = todayStr();
  var y = new Date(); y.setDate(y.getDate() - 8); var overdue = fmtDate(y);
  var soon = new Date(); soon.setDate(soon.getDate() + 2); var soonS = fmtDate(soon);
  var soon5 = new Date(); soon5.setDate(soon5.getDate() + 5); var soon5S = fmtDate(soon5);
  state.todos = [
    { id: uid(), title: "缴本月水电燃气费", priority: "中", due: overdue, scene: "life", move: "", note: "逾期提醒", done: false, createdAt: Date.now() - 9 * 86400000 },
    { id: uid(), title: "预约周末体检", priority: "高", due: soonS, scene: "life", move: "", note: "三甲约号", done: false, createdAt: Date.now() - 2 * 86400000 },
    { id: uid(), title: "准备 Q4 述职材料", priority: "高", due: soon5S, scene: "work", move: "m007", note: "向上管理", done: false, createdAt: Date.now() - 1 * 86400000 },
    { id: uid(), title: "读完《庄子·养生主》", priority: "低", due: soonS, scene: "life", move: "m001", note: "庖丁解牛", done: false, createdAt: Date.now() - 1 * 86400000 }
  ];
  state.ledger = [
    { id: uid(), type: "收入", amount: 8200, category: "工资", date: fmtDate(new Date(Date.now() - 3 * 86400000)), scene: "work", note: "九月工资", createdAt: Date.now() - 3 * 86400000 },
    { id: uid(), type: "支出", amount: 200, category: "通勤", date: fmtDate(new Date(Date.now() - 3 * 86400000)), scene: "work", note: "月卡", createdAt: Date.now() - 3 * 86400000 },
    { id: uid(), type: "支出", amount: 38.5, category: "餐饮", date: fmtDate(new Date(Date.now() - 1 * 86400000)), scene: "life", note: "午饭", createdAt: Date.now() - 1 * 86400000 },
    { id: uid(), type: "支出", amount: 120, category: "交通", date: fmtDate(new Date(Date.now() - 2 * 86400000)), scene: "life", note: "地铁充值", createdAt: Date.now() - 2 * 86400000 }
  ];
  var hrec = {}; for (var i = 0; i < 6; i++) { var d = new Date(); d.setDate(d.getDate() - i); if (i !== 2) hrec[fmtDate(d)] = true; }
  state.habits = [
    { id: uid(), name: "晨间规划 5 分钟", move: "m001", records: hrec, createdAt: Date.now() - 6 * 86400000 },
    { id: uid(), name: "读书30分钟", move: "m009", records: {}, createdAt: Date.now() - 1 * 86400000 }
  ];
  state.breakDesk = [
    { id: uid(), situation: "项目评审会上，领导当众否定我的方案，还暗示我能力不行。", scene: "work", chosenMove: "m007", action: "不接掌力，会后用数据邮件复盘方案依据，把否定转化为一次专业认证请求。", result: "领导回邮件认可数据部分，方案进入二轮。", createdAt: Date.now() - 2 * 86400000, archivedTodoId: null },
    { id: uid(), situation: "亲戚又来借钱，之前借的还没还，不好意思拒绝，被缠着。", scene: "life", chosenMove: "m005", action: "明确边界：只接受分期还旧账，新借一律不批，当场声明并停止来回解释。", result: "对方不再纠缠，旧账开始分期。", createdAt: Date.now() - 1 * 86400000, archivedTodoId: null }
  ];
  state.meta.addedSinceBackup = 0;
}

/* 双场景示例包（可重复安全载入：仅在未载入时追加） */
function loadDemoPack() {
  if (state.meta.demoLoaded) { showBanner("示例内容包已载入过，未重复添加。", false); return; }
  var now = Date.now();
  state.todos.push(
    { id: uid(), title: "回邮件澄清方案数据", priority: "中", due: todayStr(), scene: "work", move: "m007", note: "破掌·借力", done: false, createdAt: now },
    { id: uid(), title: "把本周人情往来记一笔账", priority: "低", due: todayStr(), scene: "life", move: "m005", note: "破鞭·边界", done: false, createdAt: now }
  );
  state.ledger.push(
    { id: uid(), type: "支出", amount: 65, category: "人情", date: todayStr(), scene: "life", note: "同事喜面", createdAt: now },
    { id: uid(), type: "收入", amount: 1500, category: "副业", date: todayStr(), scene: "work", note: "稿费", createdAt: now }
  );
  state.breakDesk.push(
    { id: uid(), situation: "同事总在群里@我干本该他负责的活，还说是顺手。", scene: "work", chosenMove: "m005", action: "声明职责边界，非我职责的事请走正式流程，不再口头接。", result: "对方甩活频率明显下降。", createdAt: now, archivedTodoId: null }
  );
  state.habits.push({ id: uid(), name: "下班后不回工作消息", move: "m007", records: {}, createdAt: now });
  state.meta.demoLoaded = true;
  bumpAdded(6);
  markFirstRecord();
  saveState(); refreshAll();
  showBanner("已载入双场景示例（职场破招 / 生活破招）。", false);
}

/* ---------- 合并导入（按 id，不丢已有数据） ---------- */
function mergeById(existing, incoming) {
  var map = {}; existing.forEach(function (x) { if (x && x.id) map[x.id] = x; });
  incoming.forEach(function (x) { if (x && x.id) map[x.id] = x; });
  return Object.keys(map).map(function (k) { return map[k]; });
}
function mergeState(data) {
  state.todos = mergeById(state.todos, Array.isArray(data.todos) ? data.todos : []);
  state.ledger = mergeById(state.ledger, Array.isArray(data.ledger) ? data.ledger : []);
  var oldH = Array.isArray(data.habits) ? data.habits : [];
  var hmap = {}; state.habits.forEach(function (h) { hmap[h.id] = true; });
  oldH.forEach(function (h) { if (!hmap[h.id]) state.habits.push(h); });
  state.breakDesk = mergeById(state.breakDesk, Array.isArray(data.breakDesk) ? data.breakDesk : []);
  var oldE = Array.isArray(data.events) ? data.events : [];
  var emap = {}; (state.events || []).forEach(function (x) { if (x && x.t) emap[x.t + (x.event || "")] = true; });
  oldE.forEach(function (x) { if (x && x.t && !emap[x.t + (x.event || "")]) { state.events.push(x); emap[x.t + (x.event || "")] = true; } });
  state.wisdom = Object.assign({ favs: [] }, data.wisdom || {});
  state.meta = Object.assign(defaultState().meta, data.meta || {});
  state.meta.sceneFilter = Object.assign({ todo: "all", ledger: "all" }, state.meta.sceneFilter || {});
}

/* ---------- 清空全部数据 ---------- */
function clearAll() {
  if (confirm("将清空全部数据（含你已新增的内容）并重置为空白，确定继续？")) {
    state = defaultState(); saveState(); refreshAll();
    showBanner("已清空，工作台恢复空白。", false);
  }
}

/* ============================================================================
 * 导出 / 导入 / 加密备份
 * ==========================================================================*/
function exportJSON(encrypted) {
  if (encrypted) { exportEncrypted(); return; }
  var blob = JSON.stringify(state, null, 2);
  var ts = new Date();
  downloadText("破招台-备份-" + ts.getFullYear() + pad(ts.getMonth() + 1) + pad(ts.getDate()) + "-" + pad(ts.getHours()) + pad(ts.getMinutes()) + ".json", blob, "application/json");
  state.meta.lastBackupAt = Date.now(); state.meta.addedSinceBackup = 0; saveState();
  showBanner("已导出明文备份，新增计数已重置。", false);
}

function exportEvents() {
  var ev = state.events || [];
  var ts = new Date();
  var json = JSON.stringify(ev, null, 2);
  var csv = "timestamp,iso,event,module,scene,meta\n";
  ev.forEach(function (e) { csv += e.t + "," + new Date(e.t).toISOString() + "," + csvCell(e.event) + "," + csvCell(e.module) + "," + csvCell(e.scene) + "," + csvCell(JSON.stringify(e.meta || {})) + "\n"; });
  downloadText("破招台-埋点-" + ts.getFullYear() + pad(ts.getMonth() + 1) + pad(ts.getDate()) + ".json", json, "application/json");
  downloadText("破招台-埋点-" + ts.getFullYear() + pad(ts.getMonth() + 1) + pad(ts.getDate()) + ".csv", csv, "text/csv");
  showBanner("已导出埋点数据（JSON + CSV 两个文件）。", false);
}

function importJSON(file) {
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var data = JSON.parse(e.target.result);
      if (!data || typeof data !== "object") throw new Error("格式错误");
      if (data && data.alg === "AES-GCM" && data.ct) { importEncrypted(data); return; }
      mergeState(data);
      fatalMode = false;
      var f = document.querySelector(".fatal"); if (f) f.parentNode.removeChild(f);
      saveState(); refreshAll();
      showBanner("导入成功，已按 ID 合并数据。", false);
    } catch (err) { showBanner("⚠ 文件格式不正确，无法导入。", true); }
  };
  reader.readAsText(file);
}

/* AES-GCM 加密（Web Crypto，零依赖；非安全上下文自动降级为明文） */
function exportEncrypted() {
  if (!(window.crypto && window.crypto.subtle)) { showBanner("当前环境不支持加密（需 https/localhost），已改为导出明文备份。", false); exportJSON(false); return; }
  var pw = prompt("设置备份密码（忘记将无法还原）：", "");
  if (pw === null) return; if (!pw) { showBanner("密码不能为空。", false); return; }
  var text = JSON.stringify(state, null, 2);
  crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"])
    .then(function (km) {
      var salt = crypto.getRandomValues(new Uint8Array(16));
      return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" }, km, { name: "AES-GCM", length: 256 }, false, ["encrypt"])
        .then(function (key) {
          var iv = crypto.getRandomValues(new Uint8Array(12));
          return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, new TextEncoder().encode(text))
            .then(function (ct) {
              var payload = { v: 1, alg: "AES-GCM", kdf: "PBKDF2-SHA256-100000", salt: bufToB64(salt.buffer), iv: bufToB64(iv.buffer), ct: bufToB64(ct) };
              var ts = new Date();
              downloadText("破招台-加密备份-" + ts.getFullYear() + pad(ts.getMonth() + 1) + pad(ts.getDate()) + ".dg9j", JSON.stringify(payload), "application/json");
              state.meta.lastBackupAt = Date.now(); state.meta.addedSinceBackup = 0; saveState();
              showBanner("已导出加密备份（.dg9j），请牢记密码。", false);
            });
        });
    }).catch(function () { showBanner("加密失败，已改为明文导出。", false); exportJSON(false); });
}

function importEncrypted(payload) {
  if (!(window.crypto && window.crypto.subtle)) { showBanner("当前环境不支持解密（需 https/localhost）。", true); return; }
  var pw = prompt("输入备份密码：", "");
  if (pw === null) return;
  crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"])
    .then(function (km) {
      var salt = new Uint8Array(b64ToBuf(payload.salt));
      return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" }, km, { name: "AES-GCM", length: 256 }, false, ["decrypt"])
        .then(function (key) {
          var iv = new Uint8Array(b64ToBuf(payload.iv));
          var ct = b64ToBuf(payload.ct);
          return crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ct);
        })
        .then(function (pt) {
          var text = new TextDecoder().decode(pt);
          var data = JSON.parse(text);
          mergeState(data);
          fatalMode = false;
          var f = document.querySelector(".fatal"); if (f) f.parentNode.removeChild(f);
          saveState(); refreshAll();
          showBanner("加密备份解密并导入成功。", false);
        });
    }).catch(function () { showBanner("⚠ 密码错误或文件损坏，无法解密。", true); });
}
