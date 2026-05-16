// 年度薪資試算：考績獎金、年終獎金、全年合計，以及多年收入預測

import type { AppData, SalaryGradeEntry, SalaryScenario } from "../types";
import { calculateSalary } from "../salaryCalculator";

type PerformanceGrade = "A" | "B" | "C";

const GRADE_LABEL: Record<PerformanceGrade, string> = { A: "甲等", B: "乙等", C: "丙等" };
const GRADE_MONTHS: Record<PerformanceGrade, number> = { A: 1.0, B: 0.5, C: 0 };

function fmt(n: number): string {
  return n.toLocaleString("zh-TW");
}

/** 根據目前職等與俸點，找出下一個俸點（甲等考績晉一級） */
function advanceSalaryPoint(data: AppData, rank: number, currentPoint: number): number {
  const entries = data.salaryGrades.entries.filter((e) => e.rank === rank);
  if (entries.length === 0) return currentPoint;

  // 先排序：本俸在前，年功俸在後，各自依 level 排序
  const sorted = [...entries].sort((a, b) => {
    const typeOrder = (e: SalaryGradeEntry) => (e.grade_type === "本俸" ? 0 : 1);
    return typeOrder(a) - typeOrder(b) || a.level - b.level;
  });

  const currentIdx = sorted.findIndex((e) => e.point === currentPoint);
  if (currentIdx === -1) return currentPoint;
  const next = sorted[currentIdx + 1];
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
    const adjustedScenario = { ...scenario, point };
    let result;
    try {
      result = calculateSalary(data, adjustedScenario);
    } catch {
      break;
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

    // 下一年的薪資調整
    if (advanceLevel && grade === "A") {
      point = advanceSalaryPoint(data, scenario.rank, point);
    }
    raiseFactor *= 1 + annualRaiseRate / 100;
  }
  return records;
}

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

    container.innerHTML = `
      <div class="space-y-6">

        <!-- 本年度試算 -->
        <div class="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 class="text-lg font-bold text-gray-700">本年度薪資試算</h2>
          <p class="text-xs text-gray-500">以目前試算情境計算，考績獎金以應領合計為基礎，年終獎金以本俸為基礎。</p>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div class="rounded-xl bg-gray-50 p-4 text-center">
              <div class="text-xs text-gray-500 mb-1">月薪 × 12</div>
              <div class="text-xl font-bold text-gray-800">${fmt(annualNet)}</div>
            </div>
            <div class="rounded-xl bg-yellow-50 p-4 text-center">
              <div class="text-xs text-gray-500 mb-1">考績獎金（${GRADE_LABEL[grade]}）</div>
              <div class="text-xl font-bold text-yellow-700">${fmt(performanceBonus)}</div>
            </div>
            <div class="rounded-xl bg-orange-50 p-4 text-center">
              <div class="text-xs text-gray-500 mb-1">年終獎金（${yearEndMonths} 個月）</div>
              <div class="text-xl font-bold text-orange-600">${fmt(yearEndBonus)}</div>
            </div>
          </div>

          <div class="rounded-xl bg-blue-50 px-5 py-4 flex justify-between items-center">
            <span class="text-base font-bold text-blue-700">全年合計（稅前概算）</span>
            <span class="text-2xl font-extrabold text-blue-700">${fmt(annualTotal)}</span>
          </div>

          <!-- 說明細項 -->
          <div class="space-y-1 text-sm">
            <div class="flex justify-between text-gray-600 py-1 border-b border-gray-100">
              <span>月實領</span><span>${fmt(result.netTotal)}</span>
            </div>
            <div class="flex justify-between text-gray-600 py-1 border-b border-gray-100">
              <span>月應領（公保/健保/退撫計算基礎）</span><span>${fmt(result.grossTotal)}</span>
            </div>
            <div class="flex justify-between text-gray-600 py-1 border-b border-gray-100">
              <span>本俸（年終獎金計算基礎）</span><span>${fmt(baseSalary)}</span>
            </div>
          </div>
        </div>

        <!-- 參數設定 -->
        <div class="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 class="text-lg font-bold text-gray-700">多年收入預測</h2>
          <p class="text-xs text-gray-500">以目前職等不升等為前提，預測未來 1–5 年總收入。</p>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <label class="block">
              <span class="text-sm text-gray-600 font-medium">預測年數</span>
              <select id="proj-years" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                ${[1,2,3,4,5].map(n => `<option value="${n}" ${n===years?'selected':''}>${n} 年</option>`).join('')}
              </select>
            </label>
            <label class="block">
              <span class="text-sm text-gray-600 font-medium">考績等次假設</span>
              <select id="proj-grade" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="A" ${grade==='A'?'selected':''}>全部甲等</option>
                <option value="B" ${grade==='B'?'selected':''}>全部乙等</option>
                <option value="C" ${grade==='C'?'selected':''}>全部丙等</option>
              </select>
            </label>
            <label class="block">
              <span class="text-sm text-gray-600 font-medium">年終月數</span>
              <input id="proj-yearend" type="number" min="0" max="3" step="0.5" value="${yearEndMonths}"
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            </label>
            <label class="block">
              <span class="text-sm text-gray-600 font-medium">每年薪資調整 (%)</span>
              <input id="proj-raise" type="number" min="-5" max="10" step="0.5" value="${annualRaiseRate}"
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            </label>
          </div>
          <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input id="proj-advance" type="checkbox" class="w-4 h-4 rounded accent-blue-500" ${advanceLevel?'checked':''}>
            <span>甲等考績每年晉俸一級（依職等俸級表自動計算）</span>
          </label>

          <!-- 預測表格 -->
          <div class="overflow-x-auto rounded-xl border border-gray-200">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50 text-gray-600">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold whitespace-nowrap">年</th>
                  <th class="px-3 py-2 text-left font-semibold whitespace-nowrap">俸點</th>
                  <th class="px-3 py-2 text-right font-semibold whitespace-nowrap">月實領</th>
                  <th class="px-3 py-2 text-right font-semibold whitespace-nowrap">月薪×12</th>
                  <th class="px-3 py-2 text-right font-semibold whitespace-nowrap">考績獎金</th>
                  <th class="px-3 py-2 text-right font-semibold whitespace-nowrap">年終獎金</th>
                  <th class="px-3 py-2 text-right font-semibold whitespace-nowrap">全年合計</th>
                  <th class="px-3 py-2 text-right font-semibold whitespace-nowrap">累計合計</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${records.map(r => `
                  <tr class="odd:bg-white even:bg-gray-50/50">
                    <td class="px-3 py-2 font-medium text-gray-700">第 ${r.year} 年</td>
                    <td class="px-3 py-2 text-gray-600">${r.point}</td>
                    <td class="px-3 py-2 text-right">${fmt(r.monthlyNet)}</td>
                    <td class="px-3 py-2 text-right">${fmt(r.monthlyTotal)}</td>
                    <td class="px-3 py-2 text-right text-yellow-700">${fmt(r.performanceBonus)}</td>
                    <td class="px-3 py-2 text-right text-orange-600">${fmt(r.yearEndBonus)}</td>
                    <td class="px-3 py-2 text-right font-semibold text-blue-700">${fmt(r.annualTotal)}</td>
                    <td class="px-3 py-2 text-right font-bold text-blue-900">${fmt(r.cumulative)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <p class="text-xs text-amber-700">※ 試算結果僅供參考，實際金額以官方公告為準。考績獎金以月應領合計計算，年終獎金以本俸計算。</p>
        </div>

      </div>
    `;

    // 綁定事件
    container.querySelector("#proj-years")?.addEventListener("change", (e) => {
      years = parseInt((e.target as HTMLSelectElement).value, 10);
      render();
    });
    container.querySelector("#proj-grade")?.addEventListener("change", (e) => {
      grade = (e.target as HTMLSelectElement).value as PerformanceGrade;
      render();
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
      advanceLevel = (e.target as HTMLInputElement).checked;
      render();
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
