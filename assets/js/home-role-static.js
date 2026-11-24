// 静态角色独立入口。启用时为 .motion-stage 添加 data-role-mode="static"，并用本文件替换首页默认的动画入口。
const stage = document.querySelector('.motion-stage[data-role-mode="static"]');
const image = stage.querySelector(".motion-fallback");
const hint = document.querySelector(".motion-hint");
const sleepSource = image.getAttribute("src");
const awakeSource = stage.dataset.awakeSrc || sleepSource;
const sleepAlt = image.alt;
const awakeAlt = stage.dataset.awakeAlt || sleepAlt;
let idleTimer;

function showState(state) {
  const awake = state === "awake";
  const source = awake ? awakeSource : sleepSource;
  stage.dataset.state = state;
  stage.setAttribute("aria-label", awake ? "玩家已上线" : "点击唤醒玩家");
  hint.textContent = awake ? "玩家已上线，来打个招呼吧。" : "休息中，点一下唤醒玩家。";
  image.alt = awake ? awakeAlt : sleepAlt;
  if (source && image.getAttribute("src") !== source) {
    image.hidden = false;
    image.src = source;
  }
}

function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => showState("sleep"), 12000);
}

function wake() {
  showState("awake");
  resetIdleTimer();
}

function handleImageError() {
  if (sleepSource && image.getAttribute("src") !== sleepSource) {
    image.alt = sleepAlt;
    image.src = sleepSource;
  } else {
    image.hidden = true;
  }
}

image.addEventListener("error", handleImageError);
if (!sleepSource || (image.complete && !image.naturalWidth)) handleImageError();
stage.addEventListener("click", wake);
stage.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    wake();
  }
});
window.addEventListener("pointermove", () => {
  if (stage.dataset.state === "awake") resetIdleTimer();
}, { passive: true });

const lookLabel = document.querySelector('[data-qt-row="look"] > span');
if (lookLabel) lookLabel.textContent = "移动指针和玩家打个招呼";
stage.dataset.mode = "fallback";
showState("sleep");
