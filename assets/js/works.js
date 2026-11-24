import { bindEntryDetails, escapeHtml as esc, hasAttachments, usableUrl, watchMedia } from "./portfolio-details.js";

// 徽章可增减，unit 留空即可隐藏单位。icon 可使用你自己的相对路径。
const BADGES = [
  { icon: "legend", value: "", unit: "", name: "", description: "" },
  { icon: "epic", value: "", unit: "", name: "", description: "" },
  { icon: "rare", value: "", unit: "", name: "", description: "" },
  { icon: "growth", value: "", unit: "", name: "", description: "" },
  { icon: "milestone", value: "", unit: "", name: "", description: "" },
];

// 分类可增减。作品的 category 应匹配分类 id。
const CATEGORIES = [
  { id: "category-01", name: "作品分类 01", en: "CATEGORY 01" },
  { id: "category-02", name: "作品分类 02", en: "CATEGORY 02" },
  { id: "category-03", name: "作品分类 03", en: "CATEGORY 03" },
  { id: "category-04", name: "作品分类 04", en: "CATEGORY 04" },
  { id: "category-05", name: "作品分类 05", en: "CATEGORY 05" },
];

// 可增减作品。image、video、poster、document、outcome 和 url 都可以留空。
// 本地素材用相对路径。填写实际作品后移除 placeholder。
const placeholder = {
  placeholder: true,
  title: "填写你的作品名称",
  description: "填写你的作品介绍",
  tags: ["自定义标签"],
  image: "",
  video: "",
  poster: "",
  document: "",
  outcome: "",
  url: "",
};

const WORKS = [
  { ...placeholder, category: "category-01" },
  { ...placeholder, category: "category-02" },
  { ...placeholder, category: "category-03" },
  { ...placeholder, category: "category-04" },
  { ...placeholder, category: "category-05" },
];

const badgeWall = document.querySelector("[data-badge-wall]");
badgeWall.insertAdjacentHTML("afterbegin", BADGES.map(({ icon, value, unit, name, description }) => {
  const src = usableUrl(icon?.includes(".") ? icon : `assets/img/badges/${icon || "legend"}.png`);
  return `<article class="bw-badge">
    ${src ? `<img class="bw-emblem" src="${esc(src)}" alt="">` : ""}
    <p class="bw-value">${esc(value === "" || value == null ? "—" : value)}${unit ? `<small>${esc(unit)}</small>` : ""}</p>
    <p class="bw-label">${esc(name || "填写你的成就名称")}</p>
    <p class="bw-note">${esc(description || "填写你的成果或成就描述")}</p>
  </article>`;
}).join(""));

const nav = document.querySelector("[data-works-nav]");
const root = document.querySelector("[data-works-sections]");
const sections = CATEGORIES.map((category, index) => {
  const works = WORKS.map((work, sourceIndex) => ({ work, sourceIndex }))
    .filter(({ work }) => work.category === category.id);
  return { category, works, number: String(index + 1).padStart(2, "0") };
}).filter(({ works }) => works.length);
nav.hidden = !sections.length;
nav.innerHTML = sections.map(({ category, works }) => (
  `<a class="works-nav-item" href="#works-${esc(category.id)}">${esc(category.name)}<b>${works.filter(({ work }) => !work.placeholder).length}/${works.length}</b></a>`
)).join("");

function renderWork(work, index) {
  const thumbnail = usableUrl(work.poster) || usableUrl(work.image);
  const link = usableUrl(work.url);
  const canView = hasAttachments(work) || (!work.placeholder && (work.description || work.outcome));
  const mediaLabel = usableUrl(work.video) ? "视频" : usableUrl(work.document) ? "文档" : "可选添加作品素材";
  return `<article class="card work reveal is-in">
    <div class="work-cover${thumbnail ? "" : " is-missing"}">
      ${thumbnail ? `<img src="${esc(thumbnail)}" alt="${esc(work.title)}" loading="lazy">` : `<span>${mediaLabel}</span>`}
    </div>
    <div class="work-body">
      <h4 class="work-title">${esc(work.title || "填写你的作品名称")}</h4>
      <p class="work-description">${esc(work.description || "")}</p>
      <div class="work-tags">${(work.tags || []).map((tag) => `<span class="chip chip-mint">${esc(tag)}</span>`).join("")}</div>
      <p class="work-outcome">${esc(work.outcome || (work.placeholder ? "可选添加作品成果" : ""))}</p>
      ${canView || link ? `<div class="entry-actions">
        ${canView ? `<button class="entry-action" type="button" data-entry-details="${index}">查看作品</button>` : ""}
        ${link ? `<a class="entry-action" href="${esc(link)}" target="_blank" rel="noopener">作品链接 ↗</a>` : ""}
      </div>` : ""}
    </div>
  </article>`;
}

watchMedia(root);
root.innerHTML = sections.map(({ category, works, number }) => `
  <section class="works-group" id="works-${esc(category.id)}">
    <div class="works-group-head">
      <span class="works-group-no">${number}</span>
      <h3>${esc(category.name)}</h3>
      ${category.en ? `<span class="works-group-en">${esc(category.en)}</span>` : ""}
    </div>
    <div class="works-grid">${works.map(({ work, sourceIndex }) => renderWork(work, sourceIndex)).join("")}</div>
  </section>`).join("");
bindEntryDetails(root, WORKS);
