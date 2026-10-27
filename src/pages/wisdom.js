"use strict";
/* ============================================================================
 * 心法 · 九剑 —— 每日心法轮播 + 九式全量卡片 + 收藏
 * 内容提取自「剑史智库」知识库（L1 破招方法论），含白话转译与识别信号。
 * ==========================================================================*/
function toggleFav(mid) {
  var f = state.wisdom.favs || []; var i = f.indexOf(mid);
  if (i >= 0) f.splice(i, 1); else f.push(mid);
  state.wisdom.favs = f; saveState(); renderWisdom();
}

function renderWisdom() {
  var d = new Date();
  var idx = dayOfYear(d) % MOVES.length;
  var todays = MOVES[idx];
  document.getElementById("todayXin").innerHTML =
    '<div class="lbl">今日心法 · 第 ' + (idx + 1) + ' / ' + MOVES.length + ' 式</div>'
    + '<div class="nm serif">' + esc(todays.name) + '</div>'
    + '<div class="tx"><span class="q">心法 · </span>' + esc(todays.xin) + '</div>';
  var favs = state.wisdom.favs || [];
  var html = "";
  MOVES.forEach(function (m) {
    var on = favs.indexOf(m.id) >= 0;
    html += '<div class="move-card"><div class="mv-head"><span class="mv-move">' + esc(m.move) + '</span><span class="mv-name serif">' + esc(m.name) + '</span>'
      + '<button class="icon-btn fav' + (on ? " on" : "") + '" data-fav="' + m.id + '" title="收藏">' + (on ? heartSVG(true) : heartSVG(false)) + '</button></div>'
      + '<div class="mv-xin"><span class="q">心法 · </span>' + esc(m.xin) + '</div>'
      + '<div class="mv-baihua"><span class="bl">白话转译：</span>' + esc(m.baihua) + '</div>'
      + '<ul>' + m.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + '</ul>'
      + '<div class="tags">' + m.tags.map(function (t) { return '<span class="tg">' + esc(t) + '</span>'; }).join("") + '</div>'
      + '<div class="mv-modern">现代迁移：<b>' + esc(m.modern) + '</b> · 识别信号：' + esc((m.signals || []).slice(0, 6).join("、")) + '</div></div>';
  });
  document.getElementById("moveList").innerHTML = html;
  Array.prototype.forEach.call(document.querySelectorAll("[data-fav]"), function (b) {
    b.addEventListener("click", function () { toggleFav(b.getAttribute("data-fav")); });
  });
}
