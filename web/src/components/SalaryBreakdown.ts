// 薪資明細顯示元件

import type { AppData, SalaryResult, SalaryScenario } from "../types";
import { icon } from "../icons";
import { renderCalculationBasis } from "../trust";

function fmt(n: number): string {
  return n.toLocaleString("zh-TW");
}

export function renderSalaryBreakdown(
  container: HTMLElement,
  result: SalaryResult,
  data: AppData,
  scenario: SalaryScenario
): void {
  container.innerHTML = `
    <div class="salary-breakdown-wrap" style="display:flex;flex-direction:column;gap:1rem;">
      <div class="card salary-result-card" style="padding:1.5rem;">

      <!-- 每月實領 hero -->
      <div class="salary-hero" style="background:var(--c-primary);border-radius:12px;padding:1.25rem 1.5rem;display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;">
        <div>
          <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.75);letter-spacing:0.06em;text-transform:uppercase;margin-bottom:4px;">每月實領</div>
          <div class="salary-hero-amount" style="font-size:2rem;font-weight:700;color:#fff;line-height:1;font-variant-numeric:tabular-nums;">${fmt(result.netTotal)}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:4px;">元 / 月</div>
        </div>
        <div style="opacity:0.3;">${icon("banknotes","w-12 h-12")}</div>
      </div>

      <div class="two-stat-grid">
        <div class="stat-chip stat-chip-success">
          <div style="font-size:10px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:4px;">應領合計</div>
          <div style="font-size:1.4rem;font-weight:700;font-variant-numeric:tabular-nums;">${fmt(result.grossTotal)}</div>
        </div>
        <div class="stat-chip stat-chip-error">
          <div style="font-size:10px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:4px;">扣款合計</div>
          <div style="font-size:1.4rem;font-weight:700;font-variant-numeric:tabular-nums;">−${fmt(result.deductionTotal)}</div>
        </div>
      </div>

      <!-- 應領明細 -->
      <div style="margin-bottom:1rem;">
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--c-success);margin-bottom:8px;">
          ${icon("plus-circle","w-4 h-4")} 應領項目
        </div>
        ${result.earnings.map(e => `
          <div class="row-item">
            <span style="color:var(--c-text-3);font-size:13.5px;">${e.label}</span>
            <span style="font-weight:600;color:var(--c-text);font-variant-numeric:tabular-nums;">${fmt(e.amount)}</span>
          </div>`).join("")}
      </div>

      <!-- 扣款明細 -->
      <div>
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--c-error);margin-bottom:8px;">
          ${icon("minus-circle","w-4 h-4")} 扣款項目
        </div>
        ${result.deductions.map(d => `
          <div class="row-item">
            <span style="color:var(--c-text-3);font-size:13.5px;">${d.label}</span>
            <span style="font-weight:600;color:var(--c-error);font-variant-numeric:tabular-nums;">−${fmt(d.amount)}</span>
          </div>`).join("")}
      </div>

      </div>
      ${renderCalculationBasis(data, scenario)}
    </div>
  `;
}
