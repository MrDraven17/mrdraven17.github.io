/** 导航、滚动状态与邮箱复制；与作品打开和预览分别初始化。 */
(function () {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  function closeMenu() {
    $("#navigation").classList.remove("open");
    $("#menu-toggle").setAttribute("aria-expanded", "false");
  }
  $("#menu-toggle").addEventListener("click", function () {
    const on = $("#navigation").classList.toggle("open");
    $("#menu-toggle").setAttribute("aria-expanded", String(on));
  });
  $$("#navigation a").forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeMenu(); document.dispatchEvent(new CustomEvent("portfolio:stop-preview")); } });
  document.addEventListener("click", e => { if (!e.target.closest("header")) closeMenu(); });
  let scheduled = false;
  function updateScroll() {
    const height = document.documentElement.scrollHeight - innerHeight;
    $("#progress").style.transform = "scaleX(" + (height > 0 ? Math.min(1,Math.max(0,scrollY / height)) : 0) + ")";
    let active = "home";
    ["home", "selected", "works", "about", "contact"].forEach(id => {
      if (document.getElementById(id).getBoundingClientRect().top < innerHeight * .4) active = id;
    });
    $$("#navigation a").forEach(link => {
      const yes = link.hash === "#" + active;
      link.classList.toggle("active", yes);
      if (yes) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current");
    });
    // 根据导航下方的实际展区选择深浅文字，不给照片加白色硬边。
    const probe = 32;
    const dark = ["#home",".exhibit-current"].some(selector => {
      const bounds = $(selector).getBoundingClientRect();
      return bounds.top <= probe && bounds.bottom > probe;
    });
    document.body.classList.toggle("over-dark",dark);
    scheduled = false;
  }
  addEventListener("scroll", function () {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  addEventListener("resize", () => { if (innerWidth > 600) closeMenu(); updateScroll(); });
  $("#year").textContent = new Date().getFullYear();
  updateScroll();

  // file:// 下 Clipboard API 可能不可用，回退到选中本地文本复制。
  $("#copy-email").addEventListener("click", async function () {
    const email = "dingyiw674@gmail.com";
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(email);
        copied = true;
      }
    } catch (_) {}
    if (!copied) {
      const input = document.createElement("textarea");
      input.value = email;
      input.setAttribute("readonly", "");
      input.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.append(input);
      input.select();
      try { copied = document.execCommand("copy"); } catch (_) {}
      input.remove();
      $("#copy-email").focus();
    }
    $("#copy-status").textContent = copied ? "邮箱已复制" : "请选中上方邮箱地址手动复制";
  });
})();
