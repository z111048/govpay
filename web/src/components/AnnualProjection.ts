// 年度薪資試算：考績獎金、年終獎金、全年合計，以及多年收入預測

import type { AppData, SalaryGradeEntry, SalaryScenario } from "../types";
import { calculateSalary } from "../salaryCalculator";
import { icon } from "../icons";

type PerformanceGrade = "A" | "B" | "C";

const GRADE_LABEL: Record<PerformanceGrade, string> = { A: "甲等", B: "乙等", C: "丙等" };
const GRADE_MONTHS: Record<PerformanceGrade, number> = { A: 1.0, B: 0.5, C: 0 };

function fmt(n: number): string {
  return n.toLocaleString("zh-TW");
}

/** 根據目前職等與俸點，找出下一個俸點 */
function advanceSalaryPoint(data: AppData, rank: number, currentPoint: number): number {
  const entries = data.salaryGrades.entries.filter((e) => e.rank === rank);
  if (entries.length === 0) return currentPoint;
  const sorted = [...entries].sort((a, b) => {
    const typeOrder = (e: SalaryGradeEntry) => (e.grade_type === "本俸" ? 0 : 1);
    return typeOrder(a) - typeOrder(b) || a.level - b.level;
  });
  const idx = sorted.findIndex((e) => e.point === currentPoint);
  if (idx === -1) return currentPoint;
  const next = sorted[idx + 1];
  return next ? next.point : currentPoint;
}

interface YearRecord {
  year: number;
  point: number;
  monthlyNet: number;
  monthlyTotal: number;
  performanceBonus: number;
  yearEndBonus: number;
  annualTotal: number;
  cumulative: number;
}

function calcYears(
  data: AppData,
  scenario: SalaryScenario,
  years: number,
  grade: PerformanceGrade,
  yearEndMonths: number,
  annualRaiseRate: number,
  advanceLevel: boolean
): YearRecord[] {
  const records: YearRecord[] = [];
  let point = scenario.point;
  let raiseFactor = 1.0;
  let cumulative = 0;

  for (let y = 1; y <= years; y++) {
    let result;
    try {
      result = calculateSalary(data, { ...scenario, point });
    } catch {
      // Should not happen with robust lookups, but skip gracefully
      continue;
    }

    const baseSalary = result.earnings.find((e) => e.code === "base_salary")?.amount ?? 0;
    const monthlyNet = Math.round(result.netTotal * raiseFactor);
    const grossTotal = Math.round(result.grossTotal * raiseFactor);
    const baseSalaryAdjusted = Math.round(baseSalary * raiseFactor);
    const monthlyTotal = monthlyNet * 12;
    const performanceBonus = Math.round(grossTotal * GRADE_MONTHS[grade]);
    const yearEndBonus = Math.round(baseSalaryAdjusted * yearEndMonths);
    const annualTotal = monthlyTotal + performanceBonus + yearEndBonus;
    cumulative += annualTotal;

    records.push({ year: y, point, monthlyNet, monthlyTotal, performanceBonus, yearEndBonus, annualTotal, cumulative });

    // 甲等、乙等均晉俸一級（公務人員考績法第 6 條）；丙等留原俸級
    if (advanceLevel && grade !== "C") {
      point = advanceSalaryPoint(data, scenario.rank, point);
    }
    raiseFactor *= 1 + annualRaiseRate / 100;
  }
  return records;
}

const SEL = "border:1.5px solid var(--c-border);border-radius:8px;padding:7px 11px;font-size:13px;color:var(--c-text);background:var(--c-surface);font-family:inherit;width:100%;";

export function renderAnnualProjection(
  container: HTMLElement,
  data: AppData,
  scenario: SalaryScenario
): void {
  let grade: PerformanceGrade = "A";
  let years = 5;
  let yearEndMonths = 1.5;
  let annualRaiseRate = 0;
  let advanceLevel = true;

  function render() {
    const result = calculateSalary(data, scenario);
    const baseSalary = result.earnings.find((e) => e.code === "base_salary")?.amount ?? 0;
    const performanceBonus = Math.round(result.grossTotal * GRADE_MONTHS[grade]);
    const yearEndBonus = Math.round(baseSalary * yearEndMonths);
    const annualNet = result.netTotal * 12;
    const annualTotal = annualNet + performanceBonus + yearEndBonus;

    const records = calcYears(data, scenario, years, grade, yearEndMonths, annualRaiseRate, advanceLevel);
    const maxAnnual = Math.max(...records.map(r => r.annualTotal));

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:1.25rem;">

        <!-- 本年度 -->
        <div class="card">
          <div class="section-heading">${icon("calendar")} 本年度薪資試算</div>

          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:1rem;">
            <div class="stat-chip stat-chip-neutral" style="text-align:center;">
              <div style="font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px;color:var(--c-text-3);">月薪 × 12</div>
              <div style="font-size:1.3rem;font-weight:700;font-variant-numeric:tabular-nums;">${fmt(annualNet)}</div>
            </div>
            <div class="stat-chip" style="background:var(--c-warning-bg);color:var(--c-warning);text-align:center;">
              <div style="font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px;">考績獎金（${GRADE_LABEL[grade]}）</div>
              <div style="font-size:1.3rem;font-weight:700;font-variant-numeric:tabular-nums;">+${fmt(performanceBonus)}</div>
            </div>
            <div class="stat-chip" style="background:#FFF3E0;color:#E65100;text-align:center;">
              <div style="font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px;">年終獎金（${yearEndMonths}月）</div>
              <div style="font-size:1.3rem;font-weight:700;font-variant-numeric:tabular-nums;">+${fmt(yearEndBonus)}</div>
            </div>
          </div>

          <div style="background:var(--c-primary);border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.85);">全年合計（稅前概算）</div>
            <div style="font-size:1.6rem;font-weight:700;color:#fff;font-variant-numeric:tabular-nums;">${fmt(annualTotal)}</div>
          </div>

          <div style="margin-top:1rem;">
            ${[
              ["月實領（稅前）", fmt(result.netTotal)],
              ["月應領（公保/健保/退撫計算基礎）", fmt(result.grossTotal)],
              ["本俸（年終獎金計算基礎）", fmt(baseSalary)],
            ].map(([label, val]) => `
              <div class="row-item">
                <span style="color:var(--c-text-3);">${label}</span>
                <span style="font-weight:600;font-variant-numeric:tabular-nums;">${val}</span>
              </div>`).join("")}
          </div>
        </div>

        <!-- 多年預測 -->
        <div class="card">
          <div class="section-heading">${icon("chart-bar")} 多年收入預測</div>
          <p style="font-size:12px;color:var(--c-text-3);margin-bottom:1rem;">以目前職等不升等為前提，預測未來收入。甲、乙等每年晉俸一級（考績法第 6 條）。</p>

          <!-- 參數列 -->
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:1rem;">
            <label>
              <span class="field-label">預測年數</span>
              <select id="proj-years" style="${SEL}">
                ${[1,2,3,4,5].map(n=>`<option value="${n}" ${n===years?"selected":""}>${n} 年</option>`).join("")}
              </select>
            </label>
            <label>
              <span class="field-label">考績等次</span>
              <select id="proj-grade" style="${SEL}">
                <option value="A" ${grade==="A"?"selected":""}>全部甲等</option>
                <option value="B" ${grade==="B"?"selected":""}>全部乙等</option>
                <option value="C" ${grade==="C"?"selected":""}>全部丙等</option>
              </select>
            </label>
            <label>
              <span class="field-label">年終月數</span>
              <input id="proj-yearend" type="number" min="0" max="3" step="0.5" value="${yearEndMonths}" style="${SEL}">
            </label>
            <label>
              <span class="field-label">年薪調整 (%)</span>
              <input id="proj-raise" type="number" min="-5" max="10" step="0.5" value="${annualRaiseRate}" style="${SEL}">
            </label>
          </div>

          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px 12px;background:var(--c-surface-2);border-radius:8px;margin-bottom:1rem;user-select:none;">
            <input id="proj-advance" type="checkbox" style="width:15px;height:15px;accent-color:var(--c-primary);" ${advanceLevel?"checked":""}>
            <span style="font-size:13px;color:var(--c-text-2);">甲、乙等每年晉俸一級（依考績法第 6 條，丙等留原俸級）</span>
          </label>

          <!-- 表格 -->
          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>年份</th><th>俸點</th>
                  <th class="right">月實領</th>
                  <th class="right">月薪×12</th>
                  <th class="right">考績獎金</th>
                  <th class="right">年終獎金</th>
                  <th class="right">全年合計</th>
                  <th class="right">累計</th>
                </tr>
              </thead>
              <tbody>
                ${records.map(r => {
                  const barW = Math.round((r.annualTotal / maxAnnual) * 100);
                  return `<tr>
                    <td style="font-weight:600;color:var(--c-primary);">第 ${r.year} 年</td>
                    <td><span class="badge badge-gray">${r.point}</span></td>
                    <td class="right">${fmt(r.monthlyNet)}</td>
                    <td class="right">${fmt(r.monthlyTotal)}</td>
                    <td class="right" style="color:var(--c-warning);">${fmt(r.performanceBonus)}</td>
                    <td class="right" style="color:#E65100;">${fmt(r.yearEndBonus)}</td>
                    <td class="right">
                      <div style="display:flex;align-items:center;gap:6px;justify-content:flex-end;">
                        <div style="width:${barW}px;max-width:60px;height:4px;background:var(--c-primary);border-radius:2px;opacity:0.35;"></div>
                        <span style="font-weight:700;color:var(--c-primary-text);">${fmt(r.annualTotal)}</span>
                      </div>
                    </td>
                    <td class="right" style="font-weight:700;color:var(--c-text);">${fmt(r.cumulative)}</td>
                  </tr>`;
                }).join("")}
              </tbody>
            </table>
          </div>
          <p style="font-size:11px;color:var(--c-text-4);margin-top:8px;">※ 試算結果僅供參考，實際金額以官方公告為準。考績獎金以月應領合計計算，年終獎金以本俸計算。</p>
        </div>
      </div>
    `;

    // Events
    container.querySelector("#proj-years")?.addEventListener("change", (e) => {
      years = parseInt((e.target as HTMLSelectElement).value, 10); render();
    });
    container.querySelector("#proj-grade")?.addEventListener("change", (e) => {
      grade = (e.target as HTMLSelectElement).value as PerformanceGrade; render();
    });
    container.querySelector("#proj-yearend")?.addEventListener("input", (e) => {
      const v = parseFloat((e.target as HTMLInputElement).value);
      if (!isNaN(v) && v >= 0) { yearEndMonths = v; render(); }
    });
    container.querySelector("#proj-raise")?.addEventListener("input", (e) => {
      const v = parseFloat((e.target as HTMLInputElement).value);
      if (!isNaN(v)) { annualRaiseRate = v; render(); }
    });
    container.querySelector("#proj-advance")?.addEventListener("change", (e) => {
      advanceLevel = (e.target as HTMLInputElement).checked; render();
    });
  }

  render();
}

/** 更新年度試算（當 scenario 變更時呼叫） */
export function updateAnnualProjection(
  container: HTMLElement,
  data: AppData,
  scenario: SalaryScenario
): void {
  renderAnnualProjection(container, data, scenario);
}

