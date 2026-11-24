// 关于玩家：换装 / 视角切换 / 六维图。
// OUTFITS 可增减。只有一张图时，填写任意一个视角即可。替换参考装扮后可移除 reference。

const VIEWS = [
  { id: "front", name: "正面" },
  { id: "side", name: "侧面" },
  { id: "back", name: "背面" },
  { id: "desk", name: "工作", scene: true }, // 带场景的整幅插画，用相框样式显示
];

const OUTFITS = [
  {
    id: "daily",
    name: "日常玩家",
    desc: "灰色针织衫 · 黑色阔腿裤",
    tag: "默认",
    reference: true,
    views: {
      front: "assets/img/outfits/daily-front.webp",
      side: "assets/img/outfits/daily-side.webp",
      back: "assets/img/outfits/daily-back.webp",
      desk: "assets/img/outfits/daily-desk.webp",
    },
  },

];

// 六维图：顺序即绘制顺序（从正上方顺时针），分值只用来画形状，页面不显示数字
const STATS = [
  { name: "维度 01", value: 6 },
  { name: "维度 02", value: 5 },
  { name: "维度 03", value: 7 },
  { name: "维度 04", value: 4 },
  { name: "维度 05", value: 6 },
  { name: "维度 06", value: 5 },
];
const STAT_MAX = 10;

const root = document.querySelector("[data-profile]");
const $ = (sel) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const outfitViews = (outfit) => VIEWS.filter((view) => outfit.views[view.id]);
const firstOutfit = OUTFITS[0] ?? { name: "填写装扮名称", views: {} };
const state = { outfit: firstOutfit, view: outfitViews(firstOutfit)[0]?.id };
const prevView = $("[data-view-prev]");
const nextView = $("[data-view-next]");

// ---- 换装列表 ----
const outfitList = $("[data-outfit-list]");
outfitList.innerHTML = OUTFITS.map((o) => {
  const firstImage = o.views[outfitViews(o)[0]?.id];
  const thumb = firstImage
    ? `<img src="${esc(firstImage)}" alt="" loading="lazy">`
    : `<span class="pf-outfit-missing">?</span>`;
  return `<button class="pf-outfit" type="button" role="radio" data-outfit="${esc(o.id)}">
      <span class="pf-outfit-thumb">${thumb}</span>
      <span class="pf-outfit-text">
        <strong>${esc(o.name)}</strong>
        <small>${esc(o.desc)}</small>
      </span>
      ${o.tag ? `<span class="pf-outfit-tag">${esc(o.tag)}</span>` : ""}
    </button>`;
}).join("");

// ---- 视角缩略图 ----
const viewList = $("[data-view-list]");
const renderViews = () => {
  const canSwitch = outfitViews(state.outfit).length > 1;
  prevView.disabled = !canSwitch;
  nextView.disabled = !canSwitch;
  $(".pf-hint").hidden = !canSwitch;
  viewList.innerHTML = outfitViews(state.outfit).map((v) => {
    const src = state.outfit.views[v.id];
    return `<button class="pf-view${v.scene ? " is-scene" : ""}" type="button" role="tab" data-view="${v.id}">
        <span class="pf-view-thumb"><img src="${esc(src)}" alt="" loading="lazy"></span>
        <span class="pf-view-name">${v.name}</span>
      </button>`;
  }).join("");
};

// ---- 主图：淡出 → 换图（等图片解码）→ 淡入 ----
const stageImg = $("[data-stage-img]");
const stageMissing = $("[data-stage-missing]");
let swapToken = 0;

const showMissingImage = () => {
  stageImg.hidden = true;
  stageMissing.hidden = false;
};

stageImg.addEventListener("error", () => {
  if (stageImg.complete && !stageImg.naturalWidth) showMissingImage();
});

// 缩略图也要在已配置的图片加载失败时显示占位。
const handleThumbnailError = (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement)) return;
  const isView = !!image.closest("[data-view]");
  const message = document.createElement("span");
  message.className = isView ? "pf-view-missing" : "pf-outfit-missing";
  message.textContent = isView ? "暂未解锁" : "?";
  image.replaceWith(message);
};
outfitList.addEventListener("error", handleThumbnailError, true);
viewList.addEventListener("error", handleThumbnailError, true);

const showStage = () => {
  const { outfit, view } = state;
  const viewDef = VIEWS.find((v) => v.id === view);
  const viewName = viewDef?.name || "";
  const src = outfit.views[view];
  $("[data-stage-outfit]").textContent = outfit.name;
  $("[data-stage-view]").textContent = viewName;
  $("[data-stage-view]").hidden = !viewName;
  $("[data-stage-reference]").hidden = !outfit.reference;

  const token = ++swapToken;
  stageImg.classList.add("is-fading");
  setTimeout(async () => {
    if (token !== swapToken) return;
    let hasImage = !!src;
    if (src) {
      const next = new Image();
      next.src = src;
      // 最多等待 400ms。慢图继续加载，明确解码失败则显示占位。
      hasImage = await Promise.race([
        next.decode().then(() => true, () => false),
        new Promise((resolve) => setTimeout(() => resolve(true), 400)),
      ]);
      if (token !== swapToken) return;
    }
    if (hasImage) {
      stageImg.src = src;
      stageImg.alt = `${outfit.name} · ${viewName}`;
    }
    stageImg.closest(".pf-figure").classList.toggle("is-scene", !!viewDef?.scene);
    stageImg.hidden = !hasImage;
    stageMissing.hidden = hasImage;
    stageImg.classList.remove("is-fading");
  }, 160);

  outfitList.querySelectorAll("[data-outfit]").forEach((b) => {
    const on = b.dataset.outfit === outfit.id;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-checked", on);
  });
  viewList.querySelectorAll("[data-view]").forEach((b) => {
    const on = b.dataset.view === view;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", on);
  });
};

// 可用视角（有图的），左右按钮在其中循环
const availableViews = () => outfitViews(state.outfit).map((view) => view.id);

const stepView = (dir) => {
  const list = availableViews();
  if (list.length < 2) return;
  const i = list.indexOf(state.view);
  state.view = list[(i + dir + list.length) % list.length];
  showStage();
};

outfitList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-outfit]");
  if (!btn || btn.dataset.outfit === state.outfit.id) return;
  state.outfit = OUTFITS.find((o) => o.id === btn.dataset.outfit);
  // 换装后保持当前视角；新装扮没有这个视角时回到它第一个有图的视角
  if (!state.outfit.views[state.view]) state.view = availableViews()[0];
  renderViews();
  showStage();
});

viewList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-view]");
  if (!btn || btn.disabled || btn.dataset.view === state.view) return;
  state.view = btn.dataset.view;
  showStage();
});

prevView.addEventListener("click", () => stepView(-1));
nextView.addEventListener("click", () => stepView(1));
$(".pf-stage-main").addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") stepView(-1);
  if (e.key === "ArrowRight") stepView(1);
});

renderViews();
showStage();

// 预加载所有视角图，切换时不闪
OUTFITS.forEach((o) => Object.values(o.views).forEach((src) => { if (src) new Image().src = src; }));

// 字段名称、内容和数量都可以修改。
const PLAYER_FIELDS = [
  { label: "填写字段名称", value: "填写字段内容" },
  { label: "填写字段名称", value: "填写字段内容" },
  { label: "填写字段名称", value: "填写字段内容" },
  { label: "填写字段名称", value: "填写字段内容" },
  { label: "填写字段名称", value: "填写字段内容" },
];

$("[data-player-fields]").innerHTML = PLAYER_FIELDS.map(({ label, value }) => (
  `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`
)).join("");

// 存档可增减。icon、year、title、description、note 都能独立填写。
// 最后一个存档默认使用 CURRENT 样式。
const SAVEPOINTS = [{}, {}, {}, {}, {}, {}, {}, {}];
document.querySelector("[data-savepoints]").innerHTML = SAVEPOINTS.map((entry, index) => {
  const row = Math.floor(index / 4);
  const offset = index % 4;
  const reversed = row % 2 === 1;
  const last = index === SAVEPOINTS.length - 1;
  const connection = last ? "" : offset === 3 ? " connects-down" : " connects-across";
  const column = reversed ? 4 - offset : offset + 1;
  const code = last ? "CURRENT" : `SAVE ${String(index + 1).padStart(2, "0")}`;
  return `<div class="savepoint reveal is-in${last ? " savepoint-current" : ""}${reversed ? " is-reversed" : ""}${connection}"
      style="--save-row:${row + 1};--save-column:${column}">
    <span class="savepoint-flag" aria-hidden="true">${esc(entry.icon || "✦")}</span>
    <div class="card savepoint-card">
      <span class="savepoint-code">${code}</span>
      <b class="savepoint-year">${esc(entry.year || "填写年份")}</b>
      <h3>${esc(entry.title || "人生关键事项")}</h3>
      <p>${esc(entry.description || "记录这一阶段对你有意义的经历或事件")}</p>
      <p class="savepoint-quote">${esc(entry.note || "填写一句存档备注")}</p>
    </div>
  </div>`;
}).join("");

// ---- 六维图 ----
const radar = $("[data-radar]");
const CX = 160, CY = 142, R = 92;
const point = (i, r) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / STATS.length;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};
const poly = (r) => STATS.map((_, i) => point(i, r).map((n) => n.toFixed(1)).join(",")).join(" ");

const rings = [0.25, 0.5, 0.75, 1]
  .map((k, n) => `<polygon points="${poly(R * k)}" class="pf-radar-ring${n === 3 ? " is-outer" : ""}"/>`)
  .join("");
const axes = STATS.map((_, i) => {
  const [x, y] = point(i, R);
  return `<line x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="pf-radar-axis"/>`;
}).join("");
const shape = STATS.map((s, i) => point(i, (R * s.value) / STAT_MAX).map((n) => n.toFixed(1)).join(",")).join(" ");
const dots = STATS.map((s, i) => {
  const [x, y] = point(i, (R * s.value) / STAT_MAX);
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" class="pf-radar-dot"/>`;
}).join("");
const labels = STATS.map((s, i) => {
  const [x, y] = point(i, R + 22);
  const anchor = Math.abs(x - CX) < 4 ? "middle" : x > CX ? "start" : "end";
  return `<text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="${anchor}" class="pf-radar-label">${esc(s.name)}</text>`;
}).join("");

radar.innerHTML = `${rings}${axes}<polygon points="${shape}" class="pf-radar-shape"/>${dots}${labels}`;

// ---- 技能图鉴：属性面板 ----
// 加技能或改等级只改这里；lv 最高 5
const SKILL_MAX = 5;
const skillPlaceholder = { icon: "✦", name: "填写技能名称", status: "填写熟练程度或描述" };
const SKILL_BOOK = [
  { name: "技能分类 01", skills: [{ ...skillPlaceholder, lv: 3 }, { ...skillPlaceholder, lv: 2 }, { ...skillPlaceholder, lv: 4 }] },
  { name: "技能分类 02", skills: [{ ...skillPlaceholder, lv: 2 }, { ...skillPlaceholder, lv: 4 }, { ...skillPlaceholder, lv: 3 }] },
  { name: "技能分类 03", skills: [{ ...skillPlaceholder, lv: 4 }, { ...skillPlaceholder, lv: 3 }, { ...skillPlaceholder, lv: 2 }] },
];

const attrTabs = document.querySelector("[data-attr-tabs]");
const attrList = document.querySelector("[data-attr-list]");

attrTabs.innerHTML = SKILL_BOOK.map(
  (c, i) => `<button class="attr-tab" type="button" role="tab" data-attr-tab="${i}">
      <span>${esc(c.name)}</span><b>${c.skills.length}</b>
    </button>`
).join("");

const showSkills = (i) => {
  attrList.innerHTML = SKILL_BOOK[i].skills
    .map((s) => {
      const pips = Array.from({ length: SKILL_MAX }, (_, n) => `<i${n < s.lv ? ' class="is-on"' : ""}></i>`).join("");
      return `<li class="attr-row${s.lv >= SKILL_MAX ? " is-max" : ""}">
          <span class="attr-icon">${esc(s.icon || "✦")}</span>
          <strong class="attr-name">${esc(s.name)}</strong>
          <span class="attr-lv">Lv.${s.lv}</span>
          <span class="attr-pips" aria-label="等级 ${s.lv} / ${SKILL_MAX}">${pips}</span>
          <span class="attr-status">${esc(s.status)}</span>
        </li>`;
    })
    .join("");
  attrTabs.querySelectorAll("[data-attr-tab]").forEach((b) => {
    const on = Number(b.dataset.attrTab) === i;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", on);
  });
};

attrTabs.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-attr-tab]");
  if (btn) showSkills(Number(btn.dataset.attrTab));
});

if (SKILL_BOOK.length) showSkills(0);

// ---- 多人联机：组队大厅 → 扫码发送好友申请 → 申请已送达 ----
// 按钮上的 data-lobby-go 写要切到哪一步
const lobby = document.querySelector("[data-lobby]");
const qr = lobby.querySelector("[data-lobby-qr]");
const qrFrame = lobby.querySelector("[data-lobby-qr-frame]");
const qrNotice = lobby.querySelector(".lobby-qr-missing");
const link = lobby.querySelector("[data-lobby-contact-link]");
const contactTitle = lobby.querySelector("[data-lobby-contact-title]");
const contactNote = lobby.querySelector("[data-lobby-contact-note]");
const sentButton = lobby.querySelector('[data-lobby-go="sent"]');
const qrSource = lobby.dataset.qrSrc.trim();
const contactHref = lobby.dataset.contactHref.trim();
const hasLink = /^(?:https?:\/\/|mailto:)[^\s]+$/i.test(contactHref);

if (hasLink) {
  link.href = contactHref;
  link.textContent = lobby.dataset.contactLabel.trim() || "联系队长 ↗";
  link.hidden = false;
  contactNote.textContent = "可通过下方链接发起联系。";
  sentButton.hidden = false;
}

if (qrSource) {
  qr.addEventListener("load", () => {
    qr.hidden = false;
    sentButton.hidden = false;
    contactTitle.textContent = "扫码添加队长，发送组队申请";
    contactNote.textContent = "扫码添加好友，申请时可备注「组队」。";
  });
  qr.addEventListener("error", () => {
    qr.hidden = true;
    qrNotice.hidden = false;
    if (!hasLink) contactNote.textContent = "联系信息暂时无法使用。";
  });
}

lobby.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-lobby-go]");
  if (!btn) return;
  if (btn.dataset.lobbyGo === "qr" && qrSource && !qr.hasAttribute("src")) {
    qrFrame.hidden = false;
    qr.src = qrSource;
  }
  lobby.querySelectorAll("[data-lobby-step]").forEach((el) => { el.hidden = el.dataset.lobbyStep !== btn.dataset.lobbyGo; });
});
