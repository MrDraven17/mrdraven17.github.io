/**
 * 作品详情独立初始化，不依赖悬停预览。
 * 卡片始终是原 PDF 链接：只有成功打开详情后才取消默认导航。
 */
(function () {
  "use strict";
  const dialog = document.getElementById("project-dialog");
  const projects = window.PORTFOLIO && window.PORTFOLIO.projects;
  if (!dialog || !projects) return;
  const $ = id => document.getElementById(id);
  let project = null;
  let page = 0;
  let source = null;
  const thumbnails = $("thumbnails");
  const selector = $("page-select");

  function render() {
    $("gallery-image").src = project.images[page];
    $("gallery-image").alt = project.title + " — 第 " + (page + 1) + " 页";
    selector.value = String(page);
    $("page-status").textContent = "Page " + (page + 1) + " of " + project.count;
    ["prev","stage-prev"].forEach(id => {
      $(id).disabled = page === 0;
      $(id).hidden = project.count === 1;
    });
    ["next","stage-next"].forEach(id => {
      $(id).disabled = page === project.count - 1;
      $(id).hidden = project.count === 1;
    });
    Array.from(thumbnails.children).forEach((button,index) => {
      button.setAttribute("aria-pressed", String(index === page));
    });
    const active = thumbnails.children[page];
    if (active) {
      const delta = active.getBoundingClientRect().left - thumbnails.getBoundingClientRect().left;
      thumbnails.scrollLeft += delta - thumbnails.clientWidth / 2 + active.clientWidth / 2;
    }
    $("image-stage").scrollTop = 0;
  }
  function change(delta) {
    if (!project) return;
    page = Math.max(0, Math.min(project.count - 1, page + delta));
    render();
  }
  function open(item, link) {
    if (typeof dialog.showModal !== "function") return false;
    document.dispatchEvent(new CustomEvent("portfolio:stop-preview"));
    project = item; page = 0; source = link;
    $("dialog-label").textContent = item.label;
    $("dialog-title").textContent = item.title;
    $("dialog-subtitle").textContent = item.subtitle;
    $("dialog-description").textContent = item.description;
    $("project-note").textContent = item.note;
    $("pdf-link").href = item.pdf;
    $("page-total").textContent = "/ " + item.count;
    selector.replaceChildren();
    thumbnails.replaceChildren();
    item.images.forEach((path,index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = String(index + 1);
      selector.append(option);
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.page = String(index);
      button.setAttribute("aria-label", "第 " + (index + 1) + " 页");
      const image = document.createElement("img");
      image.src = path; image.alt = ""; image.loading = "lazy";
      button.append(image,document.createTextNode(String(index + 1)));
      thumbnails.append(button);
    });
    $("image-stage").classList.remove("zoomed");
    $("zoom").textContent = "放大";
    $("zoom").setAttribute("aria-pressed","false");
    if (!dialog.open) dialog.showModal();
    render();
    document.body.classList.add("dialog-open");
    // 玻璃查看器中滚动发生在 dialog-body；打开时回到顶部，保证从第一页开始。
    const body = $("dialog-body");
    if (body) body.scrollTop = 0;
    $("dialog-close").focus();
    return true;
  }

  // 委托绑定到 document；点击图片、标题或文字都使用同一项目入口。
  document.addEventListener("click", function (event) {
    const link = event.target.closest("a[data-open]");
    if (!link || event.defaultPrevented || event.button > 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const item = projects.find(p => p.id === link.dataset.open);
    if (!item) return;
    try {
      if (open(item,link)) event.preventDefault();
    } catch (error) {
      // 弹窗异常时继续执行 a.href，用户仍能打开原 PDF。
      if (dialog.open) dialog.close();
      document.body.classList.remove("dialog-open");
      console.error("Project detail fallback:",error);
    }
  });
  ["prev","stage-prev"].forEach(id => $(id).addEventListener("click", () => change(-1)));
  ["next","stage-next"].forEach(id => $(id).addEventListener("click", () => change(1)));
  selector.addEventListener("change", () => {
    const next = Number(selector.value);
    if (project && Number.isInteger(next) && next >= 0 && next < project.count) { page = next; render(); }
  });
  thumbnails.addEventListener("click", event => {
    const button = event.target.closest("button[data-page]");
    if (!button) return;
    page = Number(button.dataset.page); render();
  });
  $("zoom").addEventListener("click", function () {
    const on = $("image-stage").classList.toggle("zoomed");
    $("zoom").textContent = on ? "适应窗口" : "放大";
    $("zoom").setAttribute("aria-pressed",String(on));
  });
  $("dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    if (source) source.focus({preventScroll:true});
  });
  dialog.addEventListener("keydown", event => {
    if (event.target.tagName === "SELECT") return;
    if (event.key === "ArrowLeft") { event.preventDefault(); change(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); change(1); }
  });
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
})();
