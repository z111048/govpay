import "./style.css";
import { loadAllData } from "./dataLoader";
import { calculateSalary } from "./salaryCalculator";
import { renderSalaryForm } from "./components/SalaryForm";
import { renderSalaryBreakdown } from "./components/SalaryBreakdown";
import { renderPromotionCompare } from "./components/PromotionCompare";
import { renderDataBrowser } from "./components/DataBrowser";
import { renderAnnualProjection, updateAnnualProjection } from "./components/AnnualProjection";
import type { AppData, SalaryScenario } from "./types";
import { SCENARIOS } from "./scenarios";

type TabId = "calculator" | "promotion" | "annual" | "databrowser" | "about";

function setupTabs(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>("[data-tab]");
  const panels = document.querySelectorAll<HTMLElement>("[data-panel]");

  function activate(id: TabId): void {
    tabs.forEach((tab) => {
      tab.classList.toggle("tab-active", tab.dataset.tab === id);
    });
    panels.forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.panel !== id);
    });
  }

  tabs.forEach((tab) =>
    tab.addEventListener("click", () => activate(tab.dataset.tab as TabId))
  );
  activate("calculator");
}

async function main(): Promise<void> {
  setupTabs();

  const loading = document.getElementById("loading")!;
  const appContent = document.getElementById("app-content")!;

  let data: AppData;
  try {
    data = await loadAllData();
  } catch (error) {
    loading.innerHTML = `<p class="text-red-500 text-center py-8">資料載入失敗，請重新整理頁面。<br><small>${error}</small></p>`;
    return;
  }

  loading.classList.add("hidden");
  appContent.classList.remove("hidden");

  // 使用第一個範例情境作為初始薪資試算情境
  let scenario: SalaryScenario = { ...SCENARIOS[0].before };

  const formEl = document.getElementById("calc-form")!;
  const breakdownEl = document.getElementById("calc-breakdown")!;
  const promotionEl = document.getElementById("panel-promotion")!;
  const annualEl = document.getElementById("panel-annual")!;
  const dataBrowserEl = document.getElementById("panel-databrowser")!;
  const aboutEl = document.getElementById("panel-about")!;

  const updateBreakdown = (): void => {
    const result = calculateSalary(data, scenario);
    renderSalaryBreakdown(breakdownEl, result);
  };

  const renderCalculator = (): void => {
    renderSalaryForm(formEl, {
      data,
      initialScenario: scenario,
      onChange: (nextScenario) => {
        scenario = nextScenario;
        updateBreakdown();
        // 同步更新年度試算（如果已渲染）
        if (!annualEl.classList.contains("hidden")) {
          updateAnnualProjection(annualEl, data, scenario);
        }
      },
    });
    updateBreakdown();
  };

  // 年度試算分頁：點擊時才渲染/同步最新 scenario
  document.querySelector('[data-tab="annual"]')?.addEventListener("click", () => {
    renderAnnualProjection(annualEl, data, scenario);
  });

  renderCalculator();
  renderPromotionCompare(promotionEl, data);
  renderDataBrowser(dataBrowserEl, data);

  aboutEl.innerHTML = `
    <div class="bg-white rounded-2xl shadow p-6 space-y-4">
      <h2 class="text-lg font-bold text-gray-700">資料來源</h2>
      <p class="text-sm text-gray-500">資料產生時間：${data.metadata.generated_at.slice(0, 10)}</p>
      <div class="space-y-3">
        ${data.metadata.datasets
          .map(
            (dataset) => `
              <div class="border border-gray-100 rounded-xl p-4">
                <div class="font-medium text-gray-800 text-sm">${dataset.source_name}</div>
                <div class="text-xs text-gray-500 mt-1">版本 ${dataset.version}・生效 ${dataset.effective_date}・最後整理 ${dataset.last_checked_at}</div>
                <a class="text-xs text-blue-600 hover:underline mt-2 inline-block" href="${dataset.source_url}" target="_blank" rel="noreferrer">${dataset.source_url}</a>
              </div>
            `
          )
          .join("")}
      </div>
      <p class="text-xs text-gray-400">資料僅供試算參考，不代表任何人實際薪資，以官方公告為準</p>
    </div>
  `;
}

main();
