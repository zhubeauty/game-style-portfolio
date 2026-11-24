import { bindEntryDetails, escapeHtml as esc, hasAttachments, usableUrl } from "./portfolio-details.js";

// 可添加或移除实验。status 可自由填写，tone 可选 done、wip、locked 或 neutral。
// outcome、image、video、poster、document、url 都可留空。
const placeholder = {
  title: "填写你的实验名称",
  description: "介绍你的想法、尝试或实验发现",
  tags: ["自定义标签"],
  status: "实验状态",
};

const EXPERIMENTS = [
  { ...placeholder },
  { ...placeholder },
  { ...placeholder },
  { ...placeholder },
  { ...placeholder },
];

const root = document.querySelector("[data-experiments]");
root.innerHTML = EXPERIMENTS.map((entry, index) => {
  const tone = ["done", "wip", "locked"].includes(entry.tone) ? entry.tone : "neutral";
  const canView = entry.outcome || hasAttachments(entry) || usableUrl(entry.url) || entry.description?.length > 55;
  return `<article class="card lab-card reveal is-in">
    <span class="lab-no">EXP-${String(index + 1).padStart(2, "0")}</span>
    <h3>${esc(entry.title || "填写你的实验名称")}</h3>
    <p class="lab-description">${esc(entry.description || "")}</p>
    <p class="lab-dir">${(entry.tags || []).map((tag) => `<i>${esc(tag)}</i>`).join("")}</p>
    <div class="lab-card-foot">
      <span class="status status-${tone}">${esc(entry.status || "实验状态")}</span>
      ${canView ? `<button class="entry-action" type="button" data-entry-details="${index}">查看成果</button>` : ""}
      <span class="flask" aria-hidden="true">✦</span>
    </div>
  </article>`;
}).join("");
bindEntryDetails(root, EXPERIMENTS);
