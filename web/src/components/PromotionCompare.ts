// 升等比較元件（含範例情境選擇、分享圖卡）

import type { AppData, SalaryScenario } from "../types";
import { comparePromotion } from "../salaryCalculator";
import { renderSalaryForm } from "./SalaryForm";
import { SCENARIOS } from "../scenarios";
import { toPng } from "html-to-image";

function fmt(n: number): string {
  return n.toLocaleString("zh-TW");
}

function rankLabel(rank: number): string {
  const map: Record<number, string> = {
    1: "委任一等", 2: "委任二等", 3: "委任三等", 4: "委任四等", 5: "委任五等",
    6: "薦任六等", 7: "薦任七等", 8: "薦任八等", 9: "薦任九等",
    10: "簡任十等", 11: "簡任十一等", 12: "簡任十二等", 13: "簡任十三等", 14: "簡任十四等",
  };
  return map[rank] ?? `第 ${rank} 職等`;
}

export function renderPromotionCompare(
  container: HTMLElement,
  data: AppData,
  initialBefore: SalaryScenario = SCENARIOS[0].before,
  initialAfter: SalaryScenario = SCENARIOS[0].after
): void {
  let beforeScenario: SalaryScenario = { ...initialBefore };
  let afterScenario: SalaryScenario = { ...initialAfter };
  container.innerHTML = `
    <div class="space-y-6">

      <!-- 範例情境選擇 -->
      <div class="bg-white rounded-2xl shadow p-4">
        <label class="block">
          <span class="text-sm text-gray-600 font-medium">範例情境</span>
          <select id="scenario-select" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            ${SCENARIOS.map((s, i) => `<option value="${i}">${s.label}</option>`).join("")}
            <option value="-1">自訂（手動填寫）</option>
          </select>
        </label>
      </div>

      <!-- 升等前後表單 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div class="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">升等前</div>
          <div id="before-form"></div>
        </div>
        <div>
          <div class="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">升等後</div>
          <div id="after-form"></div>
        </div>
      </div>

      <!-- 比較結果 -->
      <div id="compare-result"></div>

      <!-- 分享圖卡 -->
      <div id="share-card-section"></div>
    </div>
  `;

  function renderResult(): void {
    const cmp = comparePromotion(data, beforeScenario, afterScenario);
    const resultEl = container.querySelector("#compare-result") as HTMLElement;
    const sign = cmp.monthlyDiff >= 0 ? "+" : "";
    resultEl.innerHTML = `
      <div class="bg-white rounded-2xl shadow p-6">
        <h3 class="text-lg font-bold text-gray-700 mb-4">升等比較結果</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center rounded-xl bg-gray-50 p-4">
            <div class="text-xs text-gray-500 mb-1">升等前實領</div>
            <div class="text-xl font-bold text-gray-800">${fmt(cmp.before.netTotal)}</div>
          </div>
          <div class="text-center rounded-xl bg-gray-50 p-4">
            <div class="text-xs text-gray-500 mb-1">升等後實領</div>
            <div class="text-xl font-bold text-gray-800">${fmt(cmp.after.netTotal)}</div>
          </div>
          <div class="text-center rounded-xl ${cmp.monthlyDiff >= 0 ? "bg-green-50" : "bg-red-50"} p-4">
            <div class="text-xs text-gray-500 mb-1">每月增加</div>
            <div class="text-xl font-bold ${cmp.monthlyDiff >= 0 ? "text-green-600" : "text-red-600"}">${sign}${fmt(cmp.monthlyDiff)}</div>
          </div>
          <div class="text-center rounded-xl ${cmp.annualDiff >= 0 ? "bg-green-50" : "bg-red-50"} p-4">
            <div class="text-xs text-gray-500 mb-1">年增加</div>
            <div class="text-xl font-bold ${cmp.annualDiff >= 0 ? "text-green-600" : "text-red-600"}">${sign}${fmt(cmp.annualDiff)}</div>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          ${(["before", "after"] as const)
            .map((side) => {
              const result = side === "before" ? cmp.before : cmp.after;
              const label = side === "before" ? "升等前" : "升等後";
              return `
                <div>
                  <div class="text-sm font-semibold text-gray-600 mb-2">${label}明細</div>
                  <div class="space-y-1">
                    ${result.earnings
                      .map((item) => `<div class="flex justify-between text-sm"><span class="text-gray-500">${item.label}</span><span>${fmt(item.amount)}</span></div>`)
                      .join("")}
                    <div class="border-t pt-1 mt-1 flex justify-between text-sm font-semibold text-green-700"><span>應領</span><span>${fmt(result.grossTotal)}</span></div>
                    ${result.deductions
                      .map((item) => `<div class="flex justify-between text-sm"><span class="text-gray-500">${item.label}</span><span class="text-red-500">−${fmt(item.amount)}</span></div>`)
                      .join("")}
                    <div class="border-t pt-1 mt-1 flex justify-between text-sm font-semibold text-red-600"><span>扣款</span><span>−${fmt(result.deductionTotal)}</span></div>
                    <div class="flex justify-between text-sm font-bold text-blue-700 pt-1"><span>實領</span><span>${fmt(result.netTotal)}</span></div>
                  </div>
                </div>`;
            })
            .join("")}
        </div>
      </div>
    `;

    renderShareCard(cmp);
  }

  function renderShareCard(cmp: ReturnType<typeof comparePromotion>): void {
    const cardEl = container.querySelector("#share-card-section") as HTMLElement;
    const sign = cmp.monthlyDiff >= 0 ? "+" : "";
    const colorClass = cmp.monthlyDiff >= 0 ? "text-green-600" : "text-red-600";

    cardEl.innerHTML = `
      <div class="bg-white rounded-2xl shadow p-6 space-y-4">
        <h3 class="text-lg font-bold text-gray-700">分享圖卡</h3>
        <div id="share-card-preview" class="mx-auto w-80 aspect-square bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 flex flex-col justify-between text-white select-none">
          <div>
            <div class="text-xs font-medium opacity-70 mb-1">公務人員薪資試算</div>
            <div class="text-sm font-bold">${rankLabel(beforeScenario.rank)} → ${rankLabel(afterScenario.rank)}</div>
            <div class="text-xs opacity-70 mt-0.5">俸點 ${beforeScenario.point}・${beforeScenario.pensionSystem === "old" ? "退撫舊制" : "退撫新制"}・健保${beforeScenario.healthInsuranceDependents === 0 ? "本人" : beforeScenario.healthInsuranceDependents + "口眷"}${beforeScenario.engineeringExtra ? "・工程加給" : ""}</div>
          </div>
          <div class="grid grid-cols-2 gap-3 my-4">
            <div class="bg-white/10 rounded-xl p-3 text-center">
              <div class="text-xs opacity-70 mb-1">升等前實領</div>
              <div class="text-lg font-extrabold">${fmt(cmp.before.netTotal)}</div>
            </div>
            <div class="bg-white/10 rounded-xl p-3 text-center">
              <div class="text-xs opacity-70 mb-1">升等後實領</div>
              <div class="text-lg font-extrabold">${fmt(cmp.after.netTotal)}</div>
            </div>
          </div>
          <div class="bg-white rounded-xl p-4 text-center">
            <div class="text-xs text-blue-600 font-medium mb-1">每月增加</div>
            <div class="text-3xl font-black ${colorClass}">${sign}${fmt(cmp.monthlyDiff)}</div>
            <div class="text-xs text-gray-500 mt-1">年增 ${sign}${fmt(cmp.annualDiff)} 元</div>
          </div>
          <div class="text-xs opacity-50 text-right">govpay・資料僅供參考</div>
        </div>
        <button id="download-png" class="w-full rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold py-2.5 transition-colors">
          下載圖卡 PNG
        </button>
      </div>
    `;

    const btn = cardEl.querySelector("#download-png") as HTMLButtonElement;
    const card = cardEl.querySelector("#share-card-preview") as HTMLElement;

    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "產生中…";
      try {
        const dataUrl = await toPng(card, { pixelRatio: 2 });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `govpay_${beforeScenario.rank}→${afterScenario.rank}_${beforeScenario.point}.png`;
        a.click();
      } catch (e) {
        alert("圖卡產生失敗，請再試一次。");
        console.error(e);
      } finally {
        btn.disabled = false;
        btn.textContent = "下載圖卡 PNG";
      }
    });
  }

  // 範例情境選擇
  container.querySelector("#scenario-select")?.addEventListener("change", (e) => {
    const idx = parseInt((e.target as HTMLSelectElement).value, 10);
    if (idx >= 0) {
      beforeScenario = { ...SCENARIOS[idx].before };
      afterScenario = { ...SCENARIOS[idx].after };
      // 重繪表單
      renderForms();
    }
  });

  function renderForms(): void {
    renderSalaryForm(container.querySelector("#before-form") as HTMLElement, {
      data,
      initialScenario: beforeScenario,
      onChange: (nextScenario) => {
        beforeScenario = nextScenario;
        // 切換到自訂模式
        const sel = container.querySelector("#scenario-select") as HTMLSelectElement;
        if (sel) sel.value = "-1";
        renderResult();
      },
    });

    renderSalaryForm(container.querySelector("#after-form") as HTMLElement, {
      data,
      initialScenario: afterScenario,
      onChange: (nextScenario) => {
        afterScenario = nextScenario;
        const sel = container.querySelector("#scenario-select") as HTMLSelectElement;
        if (sel) sel.value = "-1";
        renderResult();
      },
    });

    renderResult();
  }

  renderForms();
}
