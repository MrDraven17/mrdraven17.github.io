/** 单一动效状态，首屏和 Works 订阅同一事件；优先遵循系统减少动态效果。 */
(function () {
  "use strict";
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const button = document.getElementById("motion-toggle");
  let paused = false;
  try { paused = localStorage.getItem("draven-motion") === "reduced"; } catch (_) {}
  const state = { enabled: false };
  window.PortfolioMotion = state;
  function sync() {
    state.enabled = !paused && !preference.matches;
    document.body.classList.toggle("reduced", !state.enabled);
    button.textContent = preference.matches ? "动效：关（系统）" : state.enabled ? "动效：开" : "动效：关";
    button.setAttribute("aria-pressed",String(state.enabled));
    button.setAttribute("aria-label",state.enabled ? "关闭全部自动动效" : "开启动效");
    button.disabled = preference.matches;
    button.title = preference.matches ? "遵循系统的减少动态效果设置" : "控制摄影背景与作品预览";
    document.dispatchEvent(new CustomEvent("portfolio:motion", {detail:{enabled:state.enabled}}));
  }
  button.addEventListener("click", () => {
    paused = !paused;
    try { localStorage.setItem("draven-motion",paused ? "reduced" : "full"); } catch (_) {}
    sync();
  });
  if (preference.addEventListener) preference.addEventListener("change",sync);
  else preference.addListener(sync);
  sync();
})();
