// 薪資明細顯示元件

import type { SalaryResult } from "../types";

function fmt(n: number): string {
  return n.toLocaleString("zh-TW");
}

export function renderSalaryBreakdown(container: HTMLElement, result: SalaryResult): void {
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow p-6 space-y-4">
      <h2 class="text-lg font-bold text-gray-700">薪資明細</h2>

      <div class="space-y-2">
        <div class="text-sm font-semibold text-green-700 uppercase tracking-wide">應領</div>
        ${result.earnings
          .map(
            (e) => `
          <div class="flex justify-between text-sm py-1 border-b border-gray-100">
            <span class="text-gray-600">${e.label}</span>
            <span class="font-medium text-gray-900">${fmt(e.amount)}</span>
          </div>`
          )
          .join("")}
        <div class="flex justify-between text-sm font-bold pt-1">
          <span class="text-green-700">應領合計</span>
          <span class="text-green-700">${fmt(result.grossTotal)}</span>
        </div>
      </div>

      <div class="space-y-2 mt-4">
        <div class="text-sm font-semibold text-red-600 uppercase tracking-wide">扣款</div>
        ${result.deductions
          .map(
            (d) => `
          <div class="flex justify-between text-sm py-1 border-b border-gray-100">
            <span class="text-gray-600">${d.label}</span>
            <span class="font-medium text-red-500">−${fmt(d.amount)}</span>
          </div>`
          )
          .join("")}
        <div class="flex justify-between text-sm font-bold pt-1">
          <span class="text-red-600">扣款合計</span>
          <span class="text-red-600">−${fmt(result.deductionTotal)}</span>
        </div>
      </div>

      <div class="mt-4 rounded-xl bg-blue-50 px-5 py-4 flex justify-between items-center">
        <span class="text-base font-bold text-blue-700">每月實領</span>
        <span class="text-2xl font-extrabold text-blue-700">${fmt(result.netTotal)}</span>
      </div>
    </div>
  `;
}
