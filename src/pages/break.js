"use strict";
/* ============================================================================
 * 破招台 —— 核心模块：录入困局 → 依九式方法论辨招 → 选招 → 落记录 → 复盘
 * 匹配逻辑为本地规则（非云端 AI），无匹配时回退总诀式并提示手动选招。
 * ==========================================================================*/
function matchMoves(text) {
  var t = (text || "").toLowerCase();
  var scored = MOVES.map(function (m) {
    var hits = 0; var matched = [];
    (m.signals || []).forEach(function (k) {
      if (t.indexOf(k.toLowerCase()) >= 0) { hits++; if (matched.indexOf(k) < 0) matched.push(k); }
    });
    return { m: m, hits: hits, matched: matched };
  });
  scored = scored.filter(function (s) { return s.hits > 0; });
  scored.sort(function (a, b) { return b.hits - a.hits; });
  if (scored.length === 0) { scored = [{ m: MOVE_MAP["m001"], hits: 0, matched: [] }]; } /* 回退总诀式 */
  return scored;
}

function analyzeBreak() {
  var sit = document.getElementById("breakSituation").value.trim();
  if (!sit) { showBanner("请先描述你当下的困局", false); return; }
  var sc = document.getElementById("breakScene").value;
  var scored = matchMoves(sit);
  var box = document.getElementById("suggestBox");
  var html = '<div class="suggest-head"><span>系统依九式方法论辨招，建议如下（按匹配度排序）：</span>'
    + '<span class="pick"><select id="manualMove" style="width:auto;min-width:140px;font-size:13px;padding:6px 10px"><option value="">或手动选招…</option>'
    + MOVES.map(function (m) { return '<option value="' + m.id + '">' + esc(m.name) + '</option>'; }).join("")
    + '</select></span></div><div class="suggest">';
  scored.forEach(function (s, idx) {
    var m = s.m;
    html += '<div class="move-suggest' + (idx === 0 ? " top" : "") + '">'
      + (idx === 0 ? '<div class="rank">1</div>' : '')
      + '<div class="ms-head"><span class="mv-move" style="font-size:12px;color:var(--cinnabar);border:1px solid rgba(168,65,42,0.35);padding:2px 9px;border-radius:999px">' + esc(m.move) + '</span>'
      + '<span class="ms-name serif">' + esc(m.name) + '</span>'
      + (s.hits > 0 ? '<span class="ms-sig">命中信号：' + esc(s.matched.join("、")) + '</span>' : '<span class="ms-sig">未命中关键词，建议先辨招</span>')
      + '</div>'
      + '<div class="ms-baihua"><span class="bl">白话：</span>' + esc(m.baihua) + '</div>'
      + '<div class="ms-tpl"><span class="tpl-l">行动模板：</span>' + esc(m.template) + '</div>'
      + '<div class="ms-act"><button class="btn sm primary" data-pick="' + m.id + '">用此招落记录</button></div>'
      + '</div>';
  });
  html += '</div>';
  box.innerHTML = html;
  Array.prototype.forEach.call(box.querySelectorAll("[data-pick]"), function (b) {
    b.addEventListener("click", function () { openRecordForm(b.getAttribute("data-pick"), sit, sc); });
  });
  var manual = document.getElementById("manualMove");
  if (manual) manual.addEventListener("change", function () {
    if (manual.value) { openRecordForm(manual.value, sit, sc); }
  });
}

function openRecordForm(mid, sit, sc) {
  var m = MOVE_MAP[mid]; if (!m) return;
  var f = document.getElementById("recordForm");
  f.style.display = "block";
  f.innerHTML = '<h4 class="serif"><span class="mv-move" style="font-size:12px;color:var(--cinnabar);border:1px solid rgba(168,65,42,0.35);padding:2px 9px;border-radius:999px">' + esc(m.move) + '</span> 落招记录 · ' + esc(m.name) + '</h4>'
    + '<div class="field"><label>困局（可修改）</label><textarea id="rfSit" rows="2">' + esc(sit) + '</textarea></div>'
    + '<div class="field"><label>我用的招 / 行动</label><textarea id="rfAction" rows="2" placeholder="参照上方行动模板，写下你实际怎么应对…">' + esc(m.template.split("→")[0]) + '</textarea></div>'
    + '<div class="field"><label>结果如何</label><textarea id="rfResult" rows="2" placeholder="事后的结果与复盘…"></textarea></div>'
    + '<div class="field"><label>归档为待办跟进？</label>'
    + '<select id="rfArchive"><option value="yes">是，生成一条待办</option><option value="no" selected>否，仅留档</option></select></div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" id="rfSave">落 招 存 档</button><button class="btn ghost" id="rfCancel">收起</button></div>';
  document.getElementById("rfSave").addEventListener("click", function () {
    var action = document.getElementById("rfAction").value.trim();
    var result = document.getElementById("rfResult").value.trim();
    var sit2 = document.getElementById("rfSit").value.trim();
    if (!action) { showBanner("请填写你的行动", false); return; }
    var rec = { id: uid(), situation: sit2, scene: sc, chosenMove: mid, action: action, result: result, createdAt: Date.now(), archivedTodoId: null };
    if (document.getElementById("rfArchive").value === "yes") {
      var td = { id: uid(), title: "落招跟进：" + m.name + "（" + SCENE_LABEL[sc] + "）", priority: "中", due: "", scene: sc === "both" ? "life" : sc, move: mid, note: "来自破招台", done: false, createdAt: Date.now() };
      state.todos.push(td); rec.archivedTodoId = td.id; bumpAdded(1);
      track("record_created", "todo", td.scene, { move: mid, from: "break" });
    }
    state.breakDesk.unshift(rec);
    bumpAdded(1); markFirstRecord();
    track("record_created", "break", sc, { move: mid });
    f.style.display = "none"; f.innerHTML = "";
    document.getElementById("breakSituation").value = "";
    saveState(); refreshAll();
    showBanner("已落招存档。", false);
  });
  document.getElementById("rfCancel").addEventListener("click", function () { f.style.display = "none"; f.innerHTML = ""; });
  f.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function delBreak(id) {
  state.breakDesk = state.breakDesk.filter(function (x) { return x.id !== id; });
  saveState(); refreshAll();
}

function renderBreak() {
  var box = document.getElementById("breakList");
  var count = state.breakDesk.length;
  document.getElementById("breakCount").textContent = count ? ("共 " + count + " 条") : "";
  if (count === 0) { box.innerHTML = '<div class="empty">尚无落招记录。先在上方描述困局，辨招后落记录。</div>'; return; }
  var html = "";
  state.breakDesk.forEach(function (r) {
    var m = MOVE_MAP[r.chosenMove];
    html += '<div class="bk"><div class="bk-head">'
      + (m ? '<span class="mv-move" style="font-size:12px;color:var(--cinnabar);border:1px solid rgba(168,65,42,0.35);padding:2px 9px;border-radius:999px">' + esc(m.move) + '</span>' : '')
      + sceneChip(r.scene)
      + '<span class="chip">' + esc(fmtDate(new Date(r.createdAt))) + '</span></div>'
      + '<div class="bk-sit">' + esc(r.situation) + '</div>'
      + '<div class="bk-grid">'
      + '<div class="bk-cell"><span class="lab">行动</span>' + esc(r.action || "—") + '</div>'
      + '<div class="bk-cell"><span class="lab">结果 / 复盘</span>' + esc(r.result || "—") + '</div>'
      + '</div>'
      + '<div class="bk-actions"><button class="btn sm danger" data-bk="' + r.id + '">删除</button></div></div>';
  });
  box.innerHTML = html;
  Array.prototype.forEach.call(box.querySelectorAll("[data-bk]"), function (b) {
    b.addEventListener("click", function () { delBreak(b.getAttribute("data-bk")); });
  });
}
