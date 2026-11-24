export const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (char) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]
));

export function usableUrl(value) {
  if (typeof value !== "string" || !value.trim() || value.trim().startsWith("#")) return "";
  try {
    const url = new URL(value, document.baseURI);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

export function hasAttachments(entry) {
  return [entry.image, entry.video, entry.document].some(usableUrl);
}

export function watchMedia(root) {
  root.addEventListener("error", (event) => {
    if (!(event.target instanceof HTMLImageElement || event.target instanceof HTMLVideoElement)) return;
    const message = document.createElement("span");
    message.className = "entry-media-missing";
    message.textContent = "素材暂不可用";
    event.target.replaceWith(message);
  }, true);
}

export function bindEntryDetails(root, entries) {
  const dialog = document.createElement("dialog");
  dialog.className = "entry-dialog card";
  dialog.setAttribute("aria-labelledby", "entry-dialog-title");
  dialog.innerHTML = `
    <form method="dialog"><button type="submit" class="entry-action" autofocus>关闭</button></form>
    <h2 id="entry-dialog-title"></h2>
    <div class="entry-dialog-content"></div>`;
  document.body.append(dialog);

  const content = dialog.querySelector(".entry-dialog-content");
  watchMedia(content);
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-entry-details]");
    if (!button) return;
    const entry = entries[Number(button.dataset.entryDetails)];
    const image = usableUrl(entry.image);
    const video = usableUrl(entry.video);
    const poster = usableUrl(entry.poster);
    const file = usableUrl(entry.document);
    const link = usableUrl(entry.url);
    dialog.querySelector("h2").textContent = entry.title || "详情";
    content.querySelector("video")?.pause();
    content.innerHTML = `
      ${entry.description ? `<p>${escapeHtml(entry.description)}</p>` : ""}
      ${entry.outcome ? `<p><strong>成果</strong> ${escapeHtml(entry.outcome)}</p>` : ""}
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(entry.title)}">` : ""}
      ${video ? `<video src="${escapeHtml(video)}"${poster ? ` poster="${escapeHtml(poster)}"` : ""} controls playsinline preload="none"></video>` : ""}
      ${file ? `<a class="entry-action" href="${escapeHtml(file)}" target="_blank" rel="noopener">打开文档 ↗</a>` : ""}
      ${link ? `<a class="entry-action" href="${escapeHtml(link)}" target="_blank" rel="noopener">访问链接 ↗</a>` : ""}`;
    dialog.showModal();
  });

  dialog.addEventListener("close", () => {
    if (dialog.open) return;
    content.querySelector("video")?.pause();
    content.replaceChildren();
  });
}
