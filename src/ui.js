"use strict";
/* ============================================================================
 * UI 层 —— 同步状态 / 横幅提示 / 数据损坏兜底 / 抽屉 / 场景过滤分段控件
 * 依赖：store（saveState/renderTodos 等运行时调用）、pages（renderTodos/renderLedger）
 * ==========================================================================*/

function setSync(text, cls) {
  var b = document.getElementById("syncBadge"); var t = document.getElementById("syncText");
  b.className = "sync" + (cls ? (" " + cls) : ""); t.textContent = text;
}

function showBanner(text, err) {
  var b = document.getElementById("banner"); document.getElementById("bannerText").textContent = text;
  b.className = "banner show" + (err ? " err" : "");
  clearTimeout(window.__bTimer); window.__bTimer = setTimeout(function () { b.className = "banner" + (err ? " err" : ""); }, err ? 6000 : 4200);
}

/* 数据损坏时插入兜底提示，并提供导入/重置入口 */
function showFatal(text) {
  var wrap = document.createElement("div"); wrap.className = "fatal";
  wrap.innerHTML = '<h3>⚠ 数据异常</h3><p>' + esc(text) + '</p><button class="btn primary" id="fImport">导入备份恢复</button> <button class="btn danger" id="fReset">清空重置</button>';
  var c = document.querySelector(".wrap"); c.insertBefore(wrap, c.firstChild.nextSibling);
  document.getElementById("fImport").addEventListener("click", function () { document.getElementById("importFile").click(); });
  document.getElementById("fReset").addEventListener("click", function () {
    if (confirm("确认清空所有数据并重置？此操作不可恢复。")) {
      fatalMode = false; state = defaultState(); seedDemo(); saveState();
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap); refreshAll();
    }
  });
}

function openDrawer() { document.getElementById("drawer").classList.add("show"); document.getElementById("scrim").classList.add("show"); }
function closeDrawer() { document.getElementById("drawer").classList.remove("show"); document.getElementById("scrim").classList.remove("show"); }

/* 场景过滤分段控件（待办 / 收支 共用） */
function bindSceneSeg(segId, kind) {
  var seg = document.getElementById(segId);
  Array.prototype.forEach.call(seg.querySelectorAll("button"), function (b) {
    b.addEventListener("click", function () {
      var sc = b.getAttribute("data-scene");
      Array.prototype.forEach.call(seg.querySelectorAll("button"), function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      if (kind === "todo") {
        state.meta.sceneFilter.todo = sc;
        var mf = document.getElementById("todoMoveFilter");
        mf.value = mf.value || "all";
        renderTodos();
      } else {
        state.meta.sceneFilter.ledger = sc; renderLedger();
      }
      saveState();
    });
  });
}
