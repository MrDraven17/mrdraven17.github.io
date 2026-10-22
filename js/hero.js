/** 首屏轮播只订阅右上角动效开关，无独立计数和暂停按钮。 */
(function () {
  "use strict";
  const hero = document.querySelector(".signature-hero");
  const slides = Array.from(hero.querySelectorAll(".hero-background img"));
  let index = 0, timer = null, inView = true;
  function sync() {
    clearInterval(timer); timer = null;
    if (!window.PortfolioMotion || !window.PortfolioMotion.enabled ||
        document.hidden || !inView || document.body.classList.contains("dialog-open")) return;
    timer = setInterval(() => {
      // 跳过加载失败的图片，避免轮播永久卡在下一张。
      for (let step = 1; step < slides.length; step += 1) {
        const next = (index + step) % slides.length;
        if (slides[next].complete && slides[next].naturalWidth) {
          slides[index].classList.remove("is-visible");
          index = next; slides[index].classList.add("is-visible");
          break;
        }
      }
    },6500);
  }
  document.addEventListener("portfolio:motion",sync);
  document.addEventListener("visibilitychange",sync);
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:["class"]});
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries => {inView = entries[0].isIntersecting;sync();},{threshold:0}).observe(hero);
  }
  sync();
})();
