// 升等比較元件（含範例情境選擇、分享圖卡）

import type { AppData, SalaryScenario } from "../types";
import { comparePromotion } from "../salaryCalculator";
import { renderSalaryForm } from "./SalaryForm";
import { SCENARIOS } from "../scenarios";
import { toPng } from "html-to-image";
import { icon } from "../icons";
import { renderDatasetMetaPanel, renderEstimateNotice } from "../trust";

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

type PerformanceGrade = "A" | "B" | "C";

const GRADE_LABEL: Record<PerformanceGrade, string> = { A: "甲等", B: "乙等", C: "丙等" };
const GRADE_MONTHS: Record<PerformanceGrade, number> = { A: 1, B: 0.5, C: 0 };
const GRADE_OPTION_LABEL: Record<PerformanceGrade, string> = {
  A: "甲等：應領差額 × 1 個月",
  B: "乙等：應領差額 × 0.5 個月",
  C: "丙等：不列入考績獎金",
};

function pensionLabel(system: SalaryScenario["pensionSystem"]): string {
  const labels = {
    old: "退撫基金制",
    new: "退撫基金制",
    personal_account: "個人專戶制",
  } satisfies Record<SalaryScenario["pensionSystem"], string>;
  return labels[system];
}

function earningAmount(result: ReturnType<typeof comparePromotion>["before"], code: string): number {
  return result.earnings.find((item) => item.code === code)?.amount ?? 0;
}

function signedAmount(n: number): string {
  return `${n >= 0 ? "+" : ""}${fmt(n)}`;
}

function bonusDiffLabel(value: number, zeroLabel: string): string {
  return value === 0 ? zeroLabel : signedAmount(value);
}

export function renderPromotionCompare(
  container: HTMLElement,
  data: AppData,
  initialBefore: SalaryScenario = SCENARIOS[0].before,
  initialAfter: SalaryScenario = SCENARIOS[0].after
): void {
  let beforeScenario: SalaryScenario = { ...initialBefore };
  let afterScenario: SalaryScenario = { ...initialAfter };
  let shareGrade: PerformanceGrade = "A";
  let shareYearEndMonths = 1.5;

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:1.25rem;">

      <!-- 範例情境選擇 -->
      <div class="card">
        <div class="section-heading">${icon("list-bullet")} 範例情境</div>
        <label>
          <span class="field-label">選擇情境</span>
          <select id="scenario-select" style="border:1.5px solid var(--c-border);border-radius:8px;padding:7px 11px;font-size:13px;color:var(--c-text);background:var(--c-surface);font-family:inherit;width:100%;">
            ${SCENARIOS.map((s, i) => `<option value="${i}">${s.label}</option>`).join("")}
            <option value="-1">自訂（手動填寫）</option>
          </select>
        </label>
      </div>

      <!-- 升等前後表單 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;" class="compare-forms-grid">
        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--c-text-3);margin-bottom:8px;padding-left:2px;">升等前</div>
          <div id="before-form"></div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--c-primary);margin-bottom:8px;padding-left:2px;">升等後</div>
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
    const diffColor = cmp.monthlyDiff >= 0 ? "var(--c-success)" : "var(--c-error)";
    const diffBg = cmp.monthlyDiff >= 0 ? "var(--c-success-bg)" : "var(--c-error-bg)";
    const annualBonusDiff = getAnnualBonusDiff(cmp, shareGrade, shareYearEndMonths);
    const annualTotalDiff = cmp.annualDiff + annualBonusDiff;
    const annualSign = annualTotalDiff >= 0 ? "+" : "";

    resultEl.innerHTML = `
      <div class="card">
        <div class="section-heading">${icon("arrow-trending-up")} 升等比較結果</div>
        ${renderEstimateNotice("升等年度差額")}
        ${renderDatasetMetaPanel(data, ["salary_points", "salary_grades", "professional_allowances", "health_insurance", "pension"])}

        <!-- 四格摘要 -->
        <div class="compare-summary-grid">
          <div style="background:var(--c-surface-2);border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--c-text-3);margin-bottom:6px;">升等前實領</div>
            <div style="font-size:1.25rem;font-weight:700;font-variant-numeric:tabular-nums;color:var(--c-text);">${fmt(cmp.before.netTotal)}</div>
          </div>
          <div style="background:var(--c-primary-bg);border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--c-primary);margin-bottom:6px;">升等後實領</div>
            <div style="font-size:1.25rem;font-weight:700;font-variant-numeric:tabular-nums;color:var(--c-primary);">${fmt(cmp.after.netTotal)}</div>
          </div>
          <div style="background:${diffBg};border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${diffColor};margin-bottom:6px;">每月增加</div>
            <div style="font-size:1.25rem;font-weight:700;font-variant-numeric:tabular-nums;color:${diffColor};">${sign}${fmt(cmp.monthlyDiff)}</div>
          </div>
          <div style="background:${diffBg};border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${diffColor};margin-bottom:6px;">年度估算差額</div>
            <div style="font-size:1.25rem;font-weight:700;font-variant-numeric:tabular-nums;color:${diffColor};">${annualSign}${fmt(annualTotalDiff)}</div>
          </div>
        </div>

        <!-- 明細對照 -->
        <div class="compare-details-grid">
          ${(["before", "after"] as const).map((side) => {
            const result = side === "before" ? cmp.before : cmp.after;
            const label = side === "before" ? "升等前明細" : "升等後明細";
            const accentColor = side === "before" ? "var(--c-text-2)" : "var(--c-primary)";
            return `
              <div>
                <div style="font-size:12px;font-weight:700;color:${accentColor};margin-bottom:8px;letter-spacing:0.04em;">${label}</div>
                ${result.earnings.map((item) => `
                  <div class="row-item">
                    <span style="color:var(--c-text-3);">${item.label}</span>
                    <span style="font-variant-numeric:tabular-nums;">${fmt(item.amount)}</span>
                  </div>`).join("")}
                <div class="row-item" style="border-top:1.5px solid var(--c-border);margin-top:4px;padding-top:6px;font-weight:700;color:var(--c-success);">
                  <span>應領合計</span><span>${fmt(result.grossTotal)}</span>
                </div>
                ${result.deductions.map((item) => `
                  <div class="row-item">
                    <span style="color:var(--c-text-3);">${item.label}</span>
                    <span style="color:var(--c-error);font-variant-numeric:tabular-nums;">−${fmt(item.amount)}</span>
                  </div>`).join("")}
                <div class="row-item" style="border-top:1.5px solid var(--c-border);margin-top:4px;padding-top:6px;font-weight:700;color:var(--c-error);">
                  <span>扣款合計</span><span>−${fmt(result.deductionTotal)}</span>
                </div>
                <div class="row-item" style="background:var(--c-primary-bg);border-radius:8px;padding:8px 12px;margin-top:6px;font-weight:700;color:var(--c-primary);border-bottom:0;">
                  <span>實領</span><span style="font-size:1.1rem;">${fmt(result.netTotal)}</span>
                </div>
              </div>`;
          }).join("")}
        </div>
      </div>
    `;

    renderShareCard(cmp);
  }

  function getAnnualBonusDiff(
    cmp: ReturnType<typeof comparePromotion>,
    grade: PerformanceGrade,
    yearEndMonths: number
  ): number {
    const performanceDiff = Math.round((cmp.after.grossTotal - cmp.before.grossTotal) * GRADE_MONTHS[grade]);
    const beforeBase = earningAmount(cmp.before, "base_salary");
    const afterBase = earningAmount(cmp.after, "base_salary");
    const yearEndDiff = Math.round((afterBase - beforeBase) * yearEndMonths);
    return performanceDiff + yearEndDiff;
  }

  function renderShareCard(cmp: ReturnType<typeof comparePromotion>): void {
    const cardEl = container.querySelector("#share-card-section") as HTMLElement;
    const sign = cmp.monthlyDiff >= 0 ? "+" : "";
    const diffTextColor = cmp.monthlyDiff >= 0 ? "#10B981" : "#EF4444";
    const performanceDiff = Math.round((cmp.after.grossTotal - cmp.before.grossTotal) * GRADE_MONTHS[shareGrade]);
    const monthlyGrossDiff = cmp.after.grossTotal - cmp.before.grossTotal;
    const baseSalaryDiff = earningAmount(cmp.after, "base_salary") - earningAmount(cmp.before, "base_salary");
    const yearEndDiff = Math.round(
      baseSalaryDiff * shareYearEndMonths
    );
    const annualTotalDiff = cmp.annualDiff + performanceDiff + yearEndDiff;
    const annualSign = annualTotalDiff >= 0 ? "+" : "";
    const performanceText = bonusDiffLabel(performanceDiff, "不列入");
    const yearEndText = bonusDiffLabel(yearEndDiff, "同本俸，無差額");

    cardEl.innerHTML = `
      <div class="card">
        <div class="section-heading">${icon("share")} 分享圖卡</div>

        <div class="share-controls">
          <label>
            <span class="field-label">考績獎金假設</span>
            <select id="share-grade" class="field-input">
              <option value="A" ${shareGrade === "A" ? "selected" : ""}>${GRADE_OPTION_LABEL.A}</option>
              <option value="B" ${shareGrade === "B" ? "selected" : ""}>${GRADE_OPTION_LABEL.B}</option>
              <option value="C" ${shareGrade === "C" ? "selected" : ""}>${GRADE_OPTION_LABEL.C}</option>
            </select>
          </label>
          <label>
            <span class="field-label">年終獎金假設</span>
            <input id="share-yearend" class="field-input" type="number" min="0" max="3" step="0.5" value="${shareYearEndMonths}">
          </label>
        </div>
        <p style="font-size:12px;color:var(--c-text-3);margin:-4px 0 1rem;">年度估算 = 月實領差額 × 12 + 考績獎金差額 + 年終獎金差額。考績以「月應領合計差」計算，年終以「本俸差」計算。</p>

        <div id="share-card-export" class="share-card-export">
          <div id="share-card-preview" style="width:320px;max-width:100%;aspect-ratio:1/1;background:linear-gradient(135deg,#1A73E8 0%,#0B4FA8 100%);border-radius:20px;padding:22px;display:flex;flex-direction:column;justify-content:space-between;color:#fff;user-select:none;">
            <div>
              <div style="font-size:10px;font-weight:600;opacity:0.7;margin-bottom:4px;">公務人員薪資試算</div>
              <div style="font-size:14px;font-weight:700;">${rankLabel(beforeScenario.rank)} → ${rankLabel(afterScenario.rank)}</div>
              <div style="font-size:10px;opacity:0.6;margin-top:3px;">俸點 ${beforeScenario.point}・${pensionLabel(beforeScenario.pensionSystem)}・健保${beforeScenario.healthInsuranceDependents === 0 ? "本人" : beforeScenario.healthInsuranceDependents + "口眷"}${beforeScenario.engineeringExtra ? "・工程加給" : ""}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0;">
              <div style="background:rgba(255,255,255,0.12);border-radius:12px;padding:12px;text-align:center;">
                <div style="font-size:10px;opacity:0.7;margin-bottom:4px;">升等前實領</div>
                <div style="font-size:1.1rem;font-weight:800;font-variant-numeric:tabular-nums;">${fmt(cmp.before.netTotal)}</div>
              </div>
              <div style="background:rgba(255,255,255,0.12);border-radius:12px;padding:12px;text-align:center;">
                <div style="font-size:10px;opacity:0.7;margin-bottom:4px;">升等後實領</div>
                <div style="font-size:1.1rem;font-weight:800;font-variant-numeric:tabular-nums;">${fmt(cmp.after.netTotal)}</div>
              </div>
            </div>
            <div style="background:#fff;border-radius:14px;padding:16px;text-align:center;">
              <div style="font-size:11px;font-weight:600;color:#174EA6;margin-bottom:4px;">每月增加</div>
              <div style="font-size:2rem;font-weight:900;color:${diffTextColor};font-variant-numeric:tabular-nums;">${sign}${fmt(cmp.monthlyDiff)}</div>
              <div style="font-size:11px;color:#666;margin-top:4px;">年度估算差額 ${annualSign}${fmt(annualTotalDiff)} 元</div>
              <div style="display:grid;gap:4px;margin-top:9px;text-align:left;font-size:9.5px;line-height:1.35;color:#666;">
                <div style="display:flex;justify-content:space-between;gap:8px;"><span>月實領差額 × 12</span><strong style="color:#333;">${signedAmount(cmp.annualDiff)}</strong></div>
                <div style="display:flex;justify-content:space-between;gap:8px;"><span>${GRADE_LABEL[shareGrade]}考績獎金差</span><strong style="color:#333;">${performanceText}</strong></div>
                <div style="display:flex;justify-content:space-between;gap:8px;"><span>年終獎金差（本俸 × ${shareYearEndMonths}）</span><strong style="color:#333;">${yearEndText}</strong></div>
              </div>
              <div style="font-size:8.5px;color:#999;margin-top:6px;text-align:left;">考績基礎：月應領差 ${signedAmount(monthlyGrossDiff)}；年終基礎：本俸差 ${signedAmount(baseSalaryDiff)}</div>
            </div>
            <div style="font-size:10px;opacity:0.4;text-align:right;">govpay・資料僅供參考</div>
          </div>
        </div>

        <button id="download-png" class="btn btn-primary" style="width:100%;margin-top:1rem;">
          ${icon("arrow-down-tray", "inline-icon")} 下載圖卡 PNG
        </button>
      </div>
    `;

    const btn = cardEl.querySelector("#download-png") as HTMLButtonElement;
    const card = cardEl.querySelector("#share-card-preview") as HTMLElement;
    const gradeSelect = cardEl.querySelector("#share-grade") as HTMLSelectElement;
    const yearEndInput = cardEl.querySelector("#share-yearend") as HTMLInputElement;

    gradeSelect.addEventListener("change", () => {
      shareGrade = gradeSelect.value as PerformanceGrade;
      renderResult();
    });
    yearEndInput.addEventListener("input", () => {
      const next = parseFloat(yearEndInput.value);
      if (!Number.isNaN(next) && next >= 0) {
        shareYearEndMonths = next;
        renderResult();
      }
    });

    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "產生中…";
      try {
        const dataUrl = await toPng(card, { pixelRatio: 2, backgroundColor: "transparent" });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `govpay_${beforeScenario.rank}→${afterScenario.rank}_${beforeScenario.point}.png`;
        a.click();
      } catch (e) {
        alert("圖卡產生失敗，請再試一次。");
        console.error(e);
      } finally {
        btn.disabled = false;
        btn.innerHTML = `${icon("arrow-down-tray", "inline-icon")} 下載圖卡 PNG`;
      }
    });
  }

  container.querySelector("#scenario-select")?.addEventListener("change", (e) => {
    const idx = parseInt((e.target as HTMLSelectElement).value, 10);
    if (idx >= 0) {
      beforeScenario = { ...SCENARIOS[idx].before };
      afterScenario = { ...SCENARIOS[idx].after };
      renderForms();
    }
  });

  function renderForms(): void {
    renderSalaryForm(container.querySelector("#before-form") as HTMLElement, {
      data,
      initialScenario: beforeScenario,
      onChange: (nextScenario) => {
        beforeScenario = nextScenario;
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
