/**
 * 悬停时序控制器：停留 → 聚焦 → 播放。
 * 每次离开或切换都会取消两个待执行计时器，防止旧卡片晚到的预览。
 * DOM 行为由 main.js 提供；时序独立，便于调整与验证。
 */
(function (root) {
  "use strict";
  function createHoverPreview(options) {
    // 原生 setTimeout/clearTimeout 必须以 window 为 this 调用；
    // 直接解引用到普通对象上会在 Chrome/Edge 中抛 Illegal invocation，
    // 导致筛选用途的 stop() 与悬停 enter() 全部静默失败。
    const clock = options.clock || {
      setTimeout: function (fn, ms) { return window.setTimeout(fn, ms); },
      clearTimeout: function (id) { window.clearTimeout(id); }
    };
    let target = null;
    let dwellTimer = null;
    let focusTimer = null;
    function stop() {
      clock.clearTimeout(dwellTimer);
      clock.clearTimeout(focusTimer);
      dwellTimer = focusTimer = null;
      if (target) options.reset(target);
      target = null;
    }
    function enter(item) {
      if (item === target) return;
      stop();
      if (!options.eligible()) return;
      target = item;
      dwellTimer = clock.setTimeout(function () {
        if (target !== item || !options.eligible()) { stop(); return; }
        options.focus(item);
        focusTimer = clock.setTimeout(function () {
          if (target !== item || !options.eligible()) { stop(); return; }
          options.play(item);
        }, options.settle || 700);
      }, options.dwell || 520);
    }
    function leave(item) { if (target === item) stop(); }
    return { enter: enter, leave: leave, stop: stop };
  }
  root.createHoverPreview = createHoverPreview;
  if (typeof module !== "undefined" && module.exports) module.exports = createHoverPreview;
})(typeof window !== "undefined" ? window : globalThis);
