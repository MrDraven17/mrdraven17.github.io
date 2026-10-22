/**
 * Works 的筛选与悬停增强；静态卡片和详情链接不依赖本脚本。
 * 只根据真实鼠标进入事件启动预览，兼容带触摸屏的桌面设备。
 */
(function () {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const projects = window.PORTFOLIO && window.PORTFOLIO.projects;
  if (!projects) return;
  const dialog = $("#project-dialog");
  let playbackCleanup = function () {};
  let lastTouch = 0;
  let preview = {enter:function(){},leave:function(){},stop:function(){}};
  function element(tag,className,text) {
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=text;
    return node;
  }
  function playPreview(item) {
    const { card, project } = item;
    const picture = card.querySelector(".project-picture");
    const windowNode = element("div", "preview-window");
    windowNode.setAttribute("aria-hidden", "true");
    const layers = [element("img"), element("img")];
    layers.forEach(img => { img.alt = ""; windowNode.append(img); });
    picture.append(windowNode);
    let cancelled = false;
    let interval = null;
    let animation = null;
    let visibleLayer = 0;
    let current = 0;
    let loading = false;
    const pages = project.preview && project.preview.length ? project.preview : project.images.slice(1, 5);
    const longPage = project.id === "tides";
    const sources = pages.length ? pages : [project.images[0]];

    function display(source, initial) {
      if (loading) return;
      loading = true;
      const slot = initial ? 0 : 1 - visibleLayer;
      const img = layers[slot];
      img.onload = function () {
        loading = false;
        if (cancelled) return;
        layers.forEach((layer, i) => layer.classList.toggle("active", i === slot));
        visibleLayer = slot;
        card.classList.add("is-playing");
        if (longPage) {
          windowNode.classList.add("long-page");
          const distance = Math.max(0, picture.clientWidth * img.naturalHeight / img.naturalWidth - picture.clientHeight);
          if (distance > 0 && typeof img.animate === "function") {
            animation = img.animate([
              { transform: "translateY(0)", offset: 0 },
              { transform: "translateY(0)", offset: 0.08 },
              { transform: "translateY(-" + distance + "px)", offset: 0.92 },
              { transform: "translateY(-" + distance + "px)", offset: 1 }
            ], { duration: 16000, iterations: Infinity, direction: "alternate", easing: "ease-in-out" });
          }
        }
      };
      img.onerror = function () { loading = false; };
      img.src = source;
    }
    display(sources[0], true);
    if (!longPage && sources.length > 1) {
      interval = setInterval(function () {
        if (loading || cancelled) return;
        current = (current + 1) % sources.length;
        display(sources[current], false);
      }, 3200);
    }
    playbackCleanup = function () {
      cancelled = true;
      clearInterval(interval);
      if (animation) animation.cancel();
      layers.forEach(img => { img.onload = img.onerror = null; });
      card.classList.remove("is-playing");
      windowNode.remove();
    };
  }


  if (typeof window.createHoverPreview === "function") {
    preview = window.createHoverPreview({
      eligible: () => !!(window.PortfolioMotion && window.PortfolioMotion.enabled) &&
                      !document.hidden && !dialog.open,
      dwell: 520, settle: 700,
      focus: function (item) {
        document.body.classList.add("previewing");
        item.card.classList.add("is-focused");
      },
      play: playPreview,
      reset: function (item) {
        playbackCleanup(); playbackCleanup = function () {};
        item.card.classList.remove("is-focused","is-playing");
        document.body.classList.remove("previewing");
      }
    });
  }
  $$(".project-card").forEach(card => {
    const project = projects.find(p => p.id === card.dataset.project);
    if (!project) return;
    const item = {card:card, project:project};
    card.addEventListener("pointerenter", event => {
      if (event.pointerType === "touch") {lastTouch = Date.now();return;}
      if (event.pointerType === "mouse") preview.enter(item);
    });
    card.addEventListener("pointerleave", () => preview.leave(item));
    // 补足只发 MouseEvent 的环境；触摸合成事件不触发自动预览。
    card.addEventListener("mouseenter", () => {if (Date.now()-lastTouch > 1000) preview.enter(item);});
    card.addEventListener("mouseleave", () => preview.leave(item));
    card.addEventListener("touchstart", () => {lastTouch=Date.now();preview.stop();},{passive:true});
    // 不在 focus 时还原卡片，鼠标按下获得焦点不能移动或删除点击目标。
  });
  function stop() {preview.stop();}
  document.addEventListener("portfolio:motion",stop);
  document.addEventListener("portfolio:stop-preview",stop);
  document.addEventListener("visibilitychange",stop);
  document.addEventListener("keydown",event => {if(event.key==="Escape"||event.key==="Tab")stop();});
  window.addEventListener("blur",stop);
  window.addEventListener("resize",stop);
  // 分类数量按当前目录自动计算；以后增删项目或调整分类只需改数据，不必手改按钮数字。
  function refreshCounts() {
    const cards = $$(".project-card");
    const counts = { all: cards.length };
    cards.forEach(card => {
      const key = card.dataset.category;
      counts[key] = (counts[key] || 0) + 1;
    });
    $$("[data-filter]").forEach(button => {
      const span = button.querySelector(".filter-count");
      if (span) span.textContent = String(counts[button.dataset.filter] || 0);
    });
  }
  function filter(value) {
    stop();
    $$("[data-filter]").forEach(button => button.setAttribute("aria-pressed",String(button.dataset.filter===value)));
    let count=0;
    $$(".project-card").forEach(card => {
      card.hidden=value!=="all"&&card.dataset.category!==value;
      if(!card.hidden)count++;
    });
    $("#filter-status").textContent="共 "+count+" 个项目";
  }
  // 先绑定事件，再执行首次筛选：初始化异常也不会留下无响应的按钮。
  $$("[data-filter]").forEach(button => button.addEventListener("click",()=>filter(button.dataset.filter)));
  refreshCounts();
  filter("all");
})();
