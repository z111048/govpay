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
    <div class="space-y-6">

      <!-- 資料來源 -->
      <div class="bg-white rounded-2xl shadow p-6 space-y-4">
        <h2 class="text-lg font-bold text-gray-700">資料來源</h2>
        <p class="text-sm text-gray-500">資料產生時間：${data.metadata.generated_at.slice(0, 10)}</p>
        <div class="space-y-3">
          ${data.metadata.datasets
            .map(
              (dataset) => `
                <div class="border border-gray-100 rounded-xl p-4 space-y-1">
                  <div class="font-medium text-gray-800 text-sm">${dataset.source_name}</div>
                  ${dataset.source_document ? `<div class="text-xs text-gray-500">${dataset.source_document}</div>` : ""}
                  <div class="text-xs text-gray-400">版本 ${dataset.version}・生效 ${dataset.effective_date}・最後整理 ${dataset.last_checked_at}</div>
                  <a class="text-xs text-blue-600 hover:underline inline-block break-all" href="${dataset.source_url}" target="_blank" rel="noreferrer">${dataset.source_url}</a>
                </div>
              `
            )
            .join("")}
        </div>
      </div>

      <!-- 相關法規 -->
      <div class="bg-white rounded-2xl shadow p-6 space-y-4">
        <h2 class="text-lg font-bold text-gray-700">相關法規依據</h2>
        <div class="space-y-3 text-sm">
          <div class="border border-gray-100 rounded-xl p-4 space-y-1">
            <div class="font-semibold text-gray-800">公務人員俸給法</div>
            <div class="text-xs text-gray-500">規範公務員本俸、年功俸、各項加給之給與標準及支給方式。本俸依俸點換算月俸額。</div>
            <a class="text-xs text-blue-600 hover:underline inline-block" href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=S0030007" target="_blank" rel="noreferrer">全國法規資料庫 S0030007</a>
          </div>
          <div class="border border-gray-100 rounded-xl p-4 space-y-1">
            <div class="font-semibold text-gray-800">公務人員加給給與辦法</div>
            <div class="text-xs text-gray-500">規範專業加給、主管職務加給、地域加給之適用對象、職等範圍及月支數額。</div>
            <a class="text-xs text-blue-600 hover:underline inline-block" href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=S0030008" target="_blank" rel="noreferrer">全國法規資料庫 S0030008</a>
          </div>
          <div class="border border-gray-100 rounded-xl p-4 space-y-1">
            <div class="font-semibold text-gray-800">公務人員考績法（第 6 條）</div>
            <div class="text-xs text-gray-500">考績甲等：晉本俸一級，並給與一個月俸給總額之一次獎金；乙等：晉本俸一級；丙等：留原俸級；丁等：免職。年功俸最高級者，考績甲等改給一個半月俸給總額之一次獎金。</div>
            <a class="text-xs text-blue-600 hover:underline inline-block" href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=S0030005" target="_blank" rel="noreferrer">全國法規資料庫 S0030005</a>
          </div>
          <div class="border border-gray-100 rounded-xl p-4 space-y-1">
            <div class="font-semibold text-gray-800">公務人員退休資遣撫卹法</div>
            <div class="text-xs text-gray-500">規範退撫舊制（84 年 7 月前到職）及新制（84 年 7 月後到職）之費率、自付比例及基數計算方式。</div>
            <a class="text-xs text-blue-600 hover:underline inline-block" href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=S0030027" target="_blank" rel="noreferrer">全國法規資料庫 S0030027</a>
          </div>
          <div class="border border-gray-100 rounded-xl p-4 space-y-1">
            <div class="font-semibold text-gray-800">公務人員保險法</div>
            <div class="text-xs text-gray-500">規範公保費率（目前為 7.22%）、政府補助比例（65%）、被保險人自付比例（35%）及保險給付項目。</div>
            <a class="text-xs text-blue-600 hover:underline inline-block" href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=S0050013" target="_blank" rel="noreferrer">全國法規資料庫 S0050013</a>
          </div>
          <div class="border border-gray-100 rounded-xl p-4 space-y-1">
            <div class="font-semibold text-gray-800">全民健康保險法（第 18 條）</div>
            <div class="text-xs text-gray-500">規範健保費率（115 年為 5.17%）、受僱者自付比例（30%）及眷屬保費計算方式。投保金額依中央主管機關公告之分級表認定。</div>
            <a class="text-xs text-blue-600 hover:underline inline-block" href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=L0060001" target="_blank" rel="noreferrer">全國法規資料庫 L0060001</a>
          </div>
        </div>
      </div>

      <p class="text-xs text-gray-400 text-center">資料僅供試算參考，不代表任何人實際薪資，以官方公告及法規為準。</p>
    </div>
  `;
}

main();
