"use strict";
/* ============================================================================
 * 图表与图标层 —— 全部内联 SVG，零图表库依赖
 * donutSVG：支出分类环形图；legendHTML：图例；heatHTML：习惯打卡热力格；
 * checkSVG / circleSVG / trashSVG / heartSVG：行内图标。
 * ==========================================================================*/

function donutSVG(data) {
  var size = 150, cx = size / 2, cy = size / 2, r = size / 2 - 8, inner = r * 0.58;
  var total = data.reduce(function (s, d) { return s + d.value; }, 0);
  if (total <= 0) return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="150" height="150"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="var(--paper-2)" stroke-width="' + (r - inner) + '"/></svg>';
  var angle = -90, paths = "";
  data.forEach(function (d) {
    var frac = d.value / total, a2 = angle + frac * 360, large = (a2 - angle) > 180 ? 1 : 0;
    var x1 = cx + r * Math.cos(angle * Math.PI / 180), y1 = cy + r * Math.sin(angle * Math.PI / 180);
    var x2 = cx + r * Math.cos(a2 * Math.PI / 180), y2 = cy + r * Math.sin(a2 * Math.PI / 180);
    var xi2 = cx + inner * Math.cos(a2 * Math.PI / 180), yi2 = cy + inner * Math.sin(a2 * Math.PI / 180);
    var xi1 = cx + inner * Math.cos(angle * Math.PI / 180), yi1 = cy + inner * Math.sin(angle * Math.PI / 180);
    paths += '<path d="M' + x1 + ' ' + y1 + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2 + ' ' + y2 + ' L' + xi2 + ' ' + yi2 + ' A' + inner + ' ' + inner + ' 0 ' + large + ' 0 ' + xi1 + ' ' + yi1 + ' Z" fill="' + d.color + '"/>';
    angle = a2;
  });
  return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="150" height="150">' + paths + '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="var(--ink-soft)"/></svg>';
}

function legendHTML(data) {
  if (!data.length) return '<div class="legend"><div class="li" style="color:var(--ink-faint)">本月暂无支出</div></div>';
  var total = data.reduce(function (s, d) { return s + d.value; }, 0);
  return '<div class="legend">' + data.map(function (d) {
    return '<div class="li"><span class="sw" style="background:' + d.color + '"></span>' + esc(d.label) + '<span class="amt">¥' + fmtMoney(d.value) + ' · ' + Math.round(d.value / total * 100) + '%</span></div>';
  }).join("") + '</div>';
}

function heatHTML(records) {
  var today = new Date(), cells = "";
  for (var i = 34; i >= 0; i--) {
    var d = new Date(today); d.setDate(d.getDate() - i);
    var k = fmtDate(d), on = !!records[k];
    cells += '<div class="' + "cell" + (on ? " on" : "") + '" title="' + k + '"></div>';
  }
  return cells;
}

function calcStreak(records) {
  var n = 0, d = new Date();
  if (!records[fmtDate(d)]) { d.setDate(d.getDate() - 1); }
  while (records[fmtDate(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ---------- 行内图标 ---------- */
function checkSVG() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>'; }
function circleSVG() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/></svg>'; }
function trashSVG() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>'; }
function heartSVG(on) { return '<svg viewBox="0 0 24 24" fill="' + (on ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z"/></svg>'; }
