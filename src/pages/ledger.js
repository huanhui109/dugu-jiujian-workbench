"use strict";
/* ============================================================================
 * 收支 · 破剑式 —— 看清钱去了哪：本月收支、预算进度、分类环形图
 * 国内习惯：支出红、收入绿（颜色在渲染层设定）
 * ==========================================================================*/
function addLedger() {
  var type = document.getElementById("lgType").value;
  var amt = parseFloat(document.getElementById("lgAmount").value);
  if (isNaN(amt) || amt <= 0) { showBanner("请输入有效金额", false); return; }
  var cat = document.getElementById("lgCat").value.trim() || (type === "收入" ? "其他收入" : "其他支出");
  var date = document.getElementById("lgDate").value || todayStr();
  var sc = document.getElementById("lgScene").value;
  state.ledger.push({
    id: uid(), type: type, amount: amt, category: cat, date: date, scene: sc,
    note: document.getElementById("lgNote").value.trim(), createdAt: Date.now()
  });
  bumpAdded(1); markFirstRecord();
  track("record_created", "ledger", sc, {});
  document.getElementById("lgAmount").value = ""; document.getElementById("lgCat").value = ""; document.getElementById("lgNote").value = ""; document.getElementById("lgDate").value = "";
  saveState(); refreshAll();
}
function delLedger(id) { state.ledger = state.ledger.filter(function (x) { return x.id !== id; }); saveState(); refreshAll(); }

function renderLedger() {
  var list = document.getElementById("ledgerList");
  var sf = state.meta.sceneFilter.ledger || "all";
  var data = state.ledger.filter(function (x) { return sf === "all" || x.scene === sf; });
  var month = todayStr().slice(0, 7);
  var cur = data.filter(function (x) { return x.date && x.date.indexOf(month) === 0; });
  var inc = cur.filter(function (x) { return x.type === "收入"; }).reduce(function (s, x) { return s + x.amount; }, 0);
  var out = cur.filter(function (x) { return x.type === "支出"; }).reduce(function (s, x) { return s + x.amount; }, 0);
  document.getElementById("ledgerStats").innerHTML =
    stat("本月收入", "¥" + fmtMoney(inc), "in") + stat("本月支出", "¥" + fmtMoney(out), "out") + stat("本月结余", "¥" + fmtMoney(inc - out));
  var budget = state.meta.budget || Math.round(out * 1.2) || 1000;
  var pct = out > 0 ? Math.min(100, Math.round(out / budget * 100)) : 0;
  document.getElementById("budgetWrap").innerHTML =
    '<div class="stat" style="grid-column:1/-1"><div class="k">本月支出预算进度（<a href="javascript:void(0)" id="editBudget" style="color:var(--cinnabar)">编辑 ¥' + fmtMoney(budget) + '</a>）</div>'
    + '<div class="progress"><i style="width:' + pct + '%"></i></div>'
    + '<div class="m" style="font-size:12.5px;color:var(--ink-faint);margin-top:6px">已用 ' + pct + '% · 剩 ¥' + fmtMoney(Math.max(0, budget - out)) + '</div></div>';
  var eb = document.getElementById("editBudget");
  if (eb) eb.addEventListener("click", function () {
    var v = prompt("设置本月支出预算（¥）：", budget);
    if (v !== null) { var n = parseFloat(v); if (!isNaN(n) && n > 0) { state.meta.budget = n; saveState(); renderLedger(); } }
  });
  var byCat = {};
  cur.filter(function (x) { return x.type === "支出"; }).forEach(function (x) { byCat[x.category] = (byCat[x.category] || 0) + x.amount; });
  var cats = Object.keys(byCat);
  var palette = ["#a8412a", "#b08a3e", "#3f6b54", "#6b625a", "#c2694f", "#7a8b9c", "#9a7b4f", "#566b5a"];
  var d2 = cats.map(function (c, i) { return { label: c, value: byCat[c], color: palette[i % palette.length] }; });
  document.getElementById("ledgerChart").innerHTML = donutSVG(d2) + legendHTML(d2);
  if (data.length === 0) { list.innerHTML = '<div class="empty">尚无记账，破局从看清第一笔开始。</div>'; }
  else {
    var html = "";
    data.slice().sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); }).forEach(function (x) {
      html += '<div class="row"><div class="main"><div class="t">' + esc(x.category) + (x.note ? (" · " + esc(x.note)) : "") + '</div><div class="m">' + esc(x.date) + ' · ' + esc(x.type) + '</div></div>'
        + sceneChip(x.scene)
        + '<span class="chip" style="color:' + (x.type === "收入" ? "var(--jade)" : "var(--cinnabar)") + '">' + (x.type === "收入" ? "+" : "-") + '¥' + fmtMoney(x.amount) + '</span>'
        + '<button class="icon-btn" data-lg="' + x.id + '">' + trashSVG() + '</button></div>';
    });
    list.innerHTML = html;
    Array.prototype.forEach.call(list.querySelectorAll("[data-lg]"), function (b) {
      b.addEventListener("click", function () { delLedger(b.getAttribute("data-lg")); });
    });
  }
}
