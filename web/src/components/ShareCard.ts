// 分享圖卡元件

import type { PromotionComparison, SalaryScenario } from "../types";
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

export function renderShareCard(
  container: HTMLElement,
  cmp: PromotionComparison,
  before: SalaryScenario,
  after: SalaryScenario
): void {
  const sign = cmp.monthlyDiff >= 0 ? "+" : "";
  const colorClass = cmp.monthlyDiff >= 0 ? "text-green-600" : "text-red-600";

  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow p-6 space-y-4">
      <h2 class="text-lg font-bold text-gray-700">分享圖卡</h2>
      <div id="share-card-preview" class="mx-auto w-80 aspect-square bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 flex flex-col justify-between text-white select-none">
        <div>
          <div class="text-xs font-medium opacity-70 mb-1">公務人員薪資試算</div>
          <div class="text-sm font-bold">${rankLabel(before.rank)} → ${rankLabel(after.rank)}</div>
          <div class="text-xs opacity-70 mt-0.5">俸點 ${before.point}・${before.pensionSystem === "old" ? "退撫舊制" : "退撫新制"}・健保${before.healthInsuranceDependents === 0 ? "本人" : before.healthInsuranceDependents + "口眷"}${before.engineeringExtra ? "・工程加給" : ""}</div>
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

        <div class="text-xs opacity-50 text-right">govpay</div>
      </div>

      <button id="download-png" class="w-full rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold py-2.5 transition-colors">
        下載圖卡 PNG
      </button>
    </div>
  `;

  const btn = container.querySelector("#download-png") as HTMLButtonElement;
  const card = container.querySelector("#share-card-preview") as HTMLElement;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "產生中…";
    try {
      const dataUrl = await toPng(card, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `govpay_${before.rank}→${after.rank}_${before.point}.png`;
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
