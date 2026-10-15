const views = document.querySelectorAll(".view");
const navButtons = document.querySelectorAll(".bottom-nav button");
const pageLabel = document.querySelector("#page-label");
const pageTitle = document.querySelector("#page-title");
const labels = { journal: "일기", routines: "루틴", payroll: "월급", settings: "마이페이지" };

navButtons.forEach((button) => button.addEventListener("click", () => {
  const target = button.dataset.target;
  views.forEach((view) => view.classList.toggle("active", view.dataset.view === target));
  navButtons.forEach((item) => item.classList.toggle("active", item === button));
  pageLabel.textContent = labels[target];
  pageTitle.textContent = target === "payroll" ? "2026년 10월" : target === "settings" ? "나의 설정" : "26년 10월 15일";
  window.scrollTo({ top: 0, behavior: "smooth" });
}));

const routines = [
  { name: "물 한 잔 마시기", time: "07:00", done: true },
  { name: "가벼운 스트레칭", time: "오전", done: false },
  { name: "하루 정리", time: "저녁", done: false },
];

function renderRoutines(sort = "time") {
  const order = { 오전: "24:01", 오후: "24:02", 저녁: "24:03" };
  const sorted = [...routines].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name, "ko");
    if (sort === "open" && a.done !== b.done) return Number(a.done) - Number(b.done);
    return (order[a.time] || a.time).localeCompare(order[b.time] || b.time) || a.name.localeCompare(b.name, "ko");
  });
  document.querySelector("#routine-list").innerHTML = sorted.map((routine) => `<label class="routine"><input type="checkbox" ${routine.done ? "checked" : ""}><b>${routine.name}</b><span>${routine.time}</span><button type="button">보관</button></label>`).join("");
}

document.querySelector("#routine-sort").addEventListener("change", (event) => renderRoutines(event.target.value));
renderRoutines();

const calendar = document.querySelector("#calendar");
calendar.innerHTML = Array.from({ length: 31 }, (_, index) => {
  const day = index + 1;
  const worked = [12, 19, 26].includes(day);
  return `<div class="day ${worked ? "work" : ""}">${day}${worked ? "<b>52,000원</b>" : ""}</div>`;
}).join("");

const toast = document.querySelector("#toast");
document.querySelectorAll("[data-toast]").forEach((button) => button.addEventListener("click", () => {
  toast.textContent = button.dataset.toast;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}));
