import "./style.css";
import { loadAllData } from "./dataLoader";
import { calculateSalary } from "./salaryCalculator";
import { renderSalaryForm } from "./components/SalaryForm";
import { renderSalaryBreakdown } from "./components/SalaryBreakdown";
import { renderPromotionCompare } from "./components/PromotionCompare";
import { renderDataBrowser } from "./components/DataBrowser";
import { renderAnnualProjection, updateAnnualProjection } from "./components/AnnualProjection";
import { renderHome } from "./components/Home";
import type { AppData, SalaryScenario } from "./types";
import { SCENARIOS } from "./scenarios";

type TabId = "home" | "calculator" | "promotion" | "annual" | "databrowser" | "about";

function setupTheme(): void {
  const root = document.documentElement;
  const button = document.getElementById("theme-toggle") as HTMLButtonElement | null;
  const saved = localStorage.getItem("theme");
  const initialTheme = saved === "light" ? "light" : "dark";

  function apply(theme: "dark" | "light"): void {
    root.dataset.theme = theme;
    localStorage.setItem("theme", theme);
    if (button) {
      button.innerHTML = `<span aria-hidden="true">${theme === "dark" ? "☾" : "☀"}</span>`;
      button.setAttribute("aria-pressed", String(theme === "dark"));
    }
  }

  button?.addEventListener("click", () => {
    apply(root.dataset.theme === "dark" ? "light" : "dark");
  });

  apply(initialTheme);
}

function setupTabs(): (id: TabId) => void {
  const tabs = document.querySelectorAll<HTMLButtonElement>("[data-tab]");
  const panels = document.querySelectorAll<HTMLElement>("[data-panel]");

  function activate(id: TabId): void {
    tabs.forEach((tab) => {
      tab.classList.toggle("tab-active", tab.dataset.tab === id);
      tab.setAttribute("aria-selected", String(tab.dataset.tab === id));
    });
    panels.forEach((panel) => {
      const active = panel.dataset.panel === id;
      panel.classList.toggle("hidden", !active);
      panel.toggleAttribute("hidden", !active);
    });
    document.querySelector(`[data-tab="${id}"]`)?.scrollIntoView({ block: "nearest", inline: "center" });
  }

  tabs.forEach((tab) =>
    tab.addEventListener("click", () => activate(tab.dataset.tab as TabId))
  );
  activate("home");
  return activate;
}

async function main(): Promise<void> {
  setupTheme();
  const activateTab = setupTabs();

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
  const homeEl = document.getElementById("panel-home")!;
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
        if (!annualEl.hidden) {
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

  renderHome(homeEl, data, activateTab);
  renderCalculator();
  renderPromotionCompare(promotionEl, data);
  renderDataBrowser(dataBrowserEl, data);

  const LEGAL_REFS = [
    { title: "公務人員俸給法", desc: "規範本俸、年功俸及各項加給之給與標準，本俸依俸點換算月俸額。", url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=S0030001", code: "S0030001" },
    { title: "公務人員加給給與辦法", desc: "規範專業加給、主管職務加給、地域加給之適用對象、職等範圍及月支數額。", url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=S0030007", code: "S0030007" },
    { title: "公務人員考績法（第 7 條）", desc: "甲等：晉本俸一級，給與一個月俸給總額獎金；乙等：晉本俸一級，給與半個月俸給總額獎金；丙等：留原俸級；丁等：免職。", url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=S0040001", code: "S0040001" },
    { title: "公務人員退休資遣撫卹法", desc: "規範退撫舊制（84 年 7 月前到職）及新制（84 年 7 月後到職）之費率、自付比例及基數計算方式。", url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=S0080034", code: "S0080034" },
    { title: "公務人員個人專戶制退休資遣撫卹法", desc: "112 年 7 月 1 日以後初任公務人員適用，採確定提撥制，按本（年功）俸加一倍 15% 提撥，個人負擔 35%。", url: "https://law.exam.gov.tw/LawContent.aspx?id=GL000095", code: "GL000095" },
    { title: "公教人員保險法", desc: "公保費率目前為 7.22%，政府補助 65%，被保險人自付 35%。", url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=S0070001", code: "S0070001" },
    { title: "全民健康保險法（第 18 條）", desc: "健保費率 115 年為 5.17%，受僱者自付比例 30%，眷屬以每口計算。投保金額依主管機關公告之分級表認定。", url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=L0060001", code: "L0060001" },
  ];

  aboutEl.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:1.25rem;">

      <!-- 資料來源 -->
      <div class="card">
        <div class="section-heading">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style="display:inline;vertical-align:-2px;margin-right:6px;"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z"/><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z"/></svg>
          資料來源
        </div>
        <p style="font-size:12px;color:var(--c-text-3);margin-bottom:1rem;">資料產生時間：${data.metadata.generated_at.slice(0, 10)}</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${data.metadata.datasets
            .map(
              (dataset) => `
                <div style="border:1px solid var(--c-border);border-radius:10px;padding:14px;">
                  <div style="font-size:13px;font-weight:700;color:var(--c-text);margin-bottom:4px;">${dataset.source_name}</div>
                  ${dataset.source_document ? `<div style="font-size:11px;color:var(--c-text-3);margin-bottom:4px;">${dataset.source_document}</div>` : ""}
                  <div style="font-size:11px;color:var(--c-text-4);margin-bottom:6px;">版本 ${dataset.version}・生效 ${dataset.effective_date}・最後整理 ${dataset.last_checked_at}</div>
                  <a style="font-size:11px;color:var(--c-primary);word-break:break-all;" href="${dataset.source_url}" target="_blank" rel="noreferrer">${dataset.source_url}</a>
                </div>
              `
            )
            .join("")}
        </div>
      </div>

      <!-- 相關法規 -->
      <div class="card">
        <div class="section-heading">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style="display:inline;vertical-align:-2px;margin-right:6px;"><path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clip-rule="evenodd"/></svg>
          相關法規依據
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${LEGAL_REFS.map(ref => `
            <div style="border:1px solid var(--c-border);border-radius:10px;padding:14px;">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px;">
                <div style="font-size:13px;font-weight:700;color:var(--c-text);">${ref.title}</div>
                <span class="badge badge-primary">${ref.code}</span>
              </div>
              <div style="font-size:11px;color:var(--c-text-3);margin-bottom:6px;">${ref.desc}</div>
              <a style="font-size:11px;color:var(--c-primary);" href="${ref.url}" target="_blank" rel="noreferrer">全國法規資料庫 ${ref.code} →</a>
            </div>
          `).join("")}
        </div>
      </div>

      <p style="font-size:11px;color:var(--c-text-4);text-align:center;">資料僅供試算參考，不代表任何人實際薪資，以官方公告及法規為準。</p>
    </div>
  `;
}

main();
