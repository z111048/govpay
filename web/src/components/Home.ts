import type { AppData } from "../types";
import { icon } from "../icons";

type HomeAction = "calculator" | "promotion" | "databrowser";
const homeHeroUrl = `${import.meta.env.BASE_URL}images/home-hero.png`;

function fmt(n: number): string {
  return n.toLocaleString("zh-TW");
}

export function renderHome(
  container: HTMLElement,
  data: AppData,
  onAction: (action: HomeAction) => void
): void {
  const datasetCount = data.metadata.datasets.length;
  const gradeCount = new Set(data.salaryGrades.entries.map((entry) => entry.rank)).size;
  const professionalCount = data.professionalAllowances.tables.length;
  const generatedDate = data.metadata.generated_at.slice(0, 10);

  container.innerHTML = `
    <section class="home-hero">
      <div class="home-hero-copy">
        <div class="eyebrow">Civil Service Salary Calculator</div>
        <h1>公務人員薪資試算</h1>
        <p>用同一套資料快速試算月實領、升等差額、年度收入與官方資料來源，適合在手機和桌面反覆查表比對。</p>
        <div class="home-actions">
          <button class="btn btn-primary" data-home-action="calculator">${icon("calculator", "inline-icon")} 開始試算</button>
          <button class="btn btn-ghost" data-home-action="promotion">${icon("arrow-trending-up", "inline-icon")} 比較升等</button>
          <button class="btn btn-ghost" data-home-action="databrowser">${icon("table-cells", "inline-icon")} 查詢資料表</button>
        </div>
      </div>
      <div class="home-hero-visual" aria-hidden="true">
        <img src="${homeHeroUrl}" alt="" loading="eager" />
      </div>
    </section>

    <section class="home-stats" aria-label="資料收錄概況">
      <div class="stat-chip stat-chip-primary">
        <div>資料集</div>
        <strong>${fmt(datasetCount)}</strong>
      </div>
      <div class="stat-chip stat-chip-neutral">
        <div>職等</div>
        <strong>${fmt(gradeCount)}</strong>
      </div>
      <div class="stat-chip stat-chip-warning">
        <div>專業加給表</div>
        <strong>${fmt(professionalCount)}</strong>
      </div>
      <div class="stat-chip stat-chip-success">
        <div>資料日期</div>
        <strong>${generatedDate}</strong>
      </div>
    </section>

    <section class="home-feature-grid" aria-label="主要功能">
      ${[
        ["calculator", "薪資試算", "職等、俸點、加給、健保眷口與退撫制度即時換算。", "calculator"],
        ["promotion", "升等比較", "同畫面比較升等前後實領、扣款與年度差額。", "arrow-trending-up"],
        ["databrowser", "資料查詢", "俸點、職等、加給、健保、公保與退撫資料表快速切換。", "table-cells"],
      ].map(([action, title, desc, ico]) => `
        <button class="home-feature-card" data-home-action="${action}">
          ${icon(ico, "w-5 h-5")}
          <span>${title}</span>
          <small>${desc}</small>
        </button>
      `).join("")}
    </section>
  `;

  container.querySelectorAll<HTMLButtonElement>("[data-home-action]").forEach((button) => {
    button.addEventListener("click", () => onAction(button.dataset.homeAction as HomeAction));
  });
}
