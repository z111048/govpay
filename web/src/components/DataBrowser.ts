import type { AppData } from "../types";

function fmt(n: number): string {
  return n.toLocaleString("zh-TW");
}

function renderTable(headers: string[], rows: string[][], rightAlignFrom = 1): string {
  return `
    <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 text-gray-600">
          <tr>${headers
            .map((header, i) => `<th class="px-3 py-2 ${i >= rightAlignFrom ? "text-right" : "text-left"} font-semibold whitespace-nowrap">${header}</th>`)
            .join("")}</tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          ${rows
            .map(
              (row) =>
                `<tr class="odd:bg-white even:bg-gray-50/50">${row
                  .map((cell, i) => `<td class="px-3 py-2 whitespace-nowrap ${i >= rightAlignFrom ? "text-right" : ""}">${cell}</td>`)
                  .join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

// 加給表說明
const TABLE_DESCRIPTIONS: Record<string, string> = {
  professional_allowance_table_1: "適用主計人員（主計機關及主計人員）",
  professional_allowance_table_2: "適用人事人員（人事機關及人事人員）",
  professional_allowance_table_3: "適用政風人員（政風機構人員）",
  professional_allowance_table_4: "適用一般行政人員（未列入其他專業加給表者）",
  professional_allowance_table_7: "適用技術及工程人員（技術機關、工程機關或工程單位）",
  professional_allowance_table_8: "適用醫事人員（衛生醫療機構醫事職系，僅含六至十四等）",
};

export function renderDataBrowser(container: HTMLElement, data: AppData): void {
  const groupedGrades = Array.from(
    data.salaryGrades.entries.reduce((map, entry) => {
      const key = `${String(entry.rank).padStart(2, "0")}-${entry.rank_name}`;
      const bucket = map.get(key) ?? [];
      bucket.push(entry);
      map.set(key, bucket);
      return map;
    }, new Map<string, typeof data.salaryGrades.entries>())
  ).sort((a, b) => a[0].localeCompare(b[0]));

  const subTabs = [
    { id: "salary-points", label: "俸點表" },
    { id: "salary-grades", label: "職等俸級表" },
    { id: "professional", label: "專業加給表" },
    { id: "supervisory", label: "主管加給" },
    { id: "health", label: "健保級距" },
    { id: "pension", label: "退撫表" },
    { id: "insurance", label: "公保表" },
  ] as const;

  const gradeCards = groupedGrades
    .map(([key, entries]) => {
      const rankName = key.split("-").slice(1).join("-");
      const rankNum = parseInt(key.split("-")[0], 10);
      return `
        <div class="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
          <div>
            <div class="text-sm font-bold text-gray-800">${rankName}</div>
            <div class="text-xs text-gray-500">第 ${rankNum} 職等</div>
          </div>
          ${renderTable(
            ["類型", "級", "俸點"],
            entries
              .sort((a, b) => (a.grade_type === b.grade_type ? a.level - b.level : a.grade_type === "本俸" ? -1 : 1))
              .map((entry) => [entry.grade_type, String(entry.level), fmt(entry.point)]),
            2
          )}
        </div>
      `;
    })
    .join("");

  const professionalCards = data.professionalAllowances.tables
    .map((table) => {
      const desc = TABLE_DESCRIPTIONS[table.table_id] ?? "";
      const minRank = Math.min(...table.items.map((i) => i.rank));
      const maxRank = Math.max(...table.items.map((i) => i.rank));
      const rankRange = minRank === maxRank ? `第 ${minRank} 職等` : `第 ${minRank}–${maxRank} 職等`;
      return `
        <div class="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
          <div>
            <div class="text-sm font-bold text-gray-800">${table.name}</div>
            <div class="text-xs text-blue-600 mt-0.5">${desc}</div>
            <div class="text-xs text-gray-400 mt-0.5">涵蓋範圍：${rankRange}</div>
          </div>
          ${renderTable(
            ["職等", "月支數額"],
            table.items.map((item) => [String(item.rank), fmt(item.monthly_allowance)]),
            1
          )}
          ${table.extra_allowances.length > 0 ? `
            <div class="text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-2">
              ${table.extra_allowances.map(e => `+ ${e.name}：${fmt(e.amount)} 元`).join("　")}
            </div>
          ` : ""}
        </div>
      `;
    })
    .join("");

  // 健保表：每口眷屬獨立欄位
  const healthHeaders = ["薪資區間", "投保金額", "0 口", "1 口", "2 口", "3 口"];
  const healthRows = data.healthInsurance.items.map((item) => [
    `${fmt(item.range_min)} – ${fmt(item.range_max)}`,
    fmt(item.insured_salary),
    fmt(item.self_payment.dependents_0),
    fmt(item.self_payment.dependents_1),
    fmt(item.self_payment.dependents_2),
    fmt(item.self_payment.dependents_3),
  ]);

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex flex-wrap gap-2">
        ${subTabs
          .map(
            (tab, index) =>
              `<button data-subtab="${tab.id}" class="rounded-full px-4 py-2 text-sm font-medium ${index === 0 ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200"}">${tab.label}</button>`
          )
          .join("")}
      </div>

      <div data-subpanel="salary-points" class="space-y-4">
        <div class="bg-white rounded-2xl shadow p-4 space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 class="text-lg font-bold text-gray-700">俸點查詢</h2>
            <input id="salary-points-search" type="search" placeholder="輸入俸點或俸額搜尋" class="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          </div>
          <div id="salary-points-table"></div>
        </div>
      </div>

      <div data-subpanel="salary-grades" class="hidden space-y-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">${gradeCards}</div>
      </div>

      <div data-subpanel="professional" class="hidden space-y-4">
        <p class="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
          目前收錄：表一（主計）、表二（人事）、表三（政風）、表四（一般行政）、表七（技術/工程）、表八（醫事）。
          其他加給表（如表五、表六）未收錄，以官方公告為準。
        </p>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">${professionalCards}</div>
      </div>

      <div data-subpanel="supervisory" class="hidden space-y-4">
        ${renderTable(
          ["類別", "適用職等", "月支數額", "備註"],
          data.supervisoryAllowances.items.map((item) => [
            item.category_name,
            `${item.min_rank} – ${item.max_rank}`,
            fmt(item.monthly_allowance),
            item.note,
          ]),
          2
        )}
      </div>

      <div data-subpanel="health" class="hidden space-y-4">
        <p class="text-xs text-gray-500">健保自付額依眷口數分欄顯示，單位：元。115年費率 5.17%，受僱者自付比例 30%。</p>
        ${renderTable(healthHeaders, healthRows, 1)}
      </div>

      <div data-subpanel="pension" class="hidden space-y-4">
        ${renderTable(
          ["俸點", "本俸", "退撫自付額"],
          data.pension.items.map((item) => [
            fmt(item.point),
            fmt(item.base_salary),
            fmt(item.self_payment),
          ]),
          1
        )}
      </div>

      <div data-subpanel="insurance" class="hidden space-y-4">
        ${renderTable(
          ["本俸", "費率", "自付比例", "自付額"],
          data.insurance.items.map((item) => [
            fmt(item.base_salary),
            `${(item.rate_basis_points / 100).toFixed(2)}%`,
            `${(item.self_pay_ratio_basis_points / 100).toFixed(2)}%`,
            fmt(item.self_payment),
          ]),
          1
        )}
      </div>
    </div>
  `;

  const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>("[data-subtab]"));
  const panels = Array.from(container.querySelectorAll<HTMLElement>("[data-subpanel]"));

  const activate = (id: string) => {
    buttons.forEach((button) => {
      const active = button.dataset.subtab === id;
      button.className = `rounded-full px-4 py-2 text-sm font-medium ${
        active ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200"
      }`;
    });
    panels.forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.subpanel !== id);
    });
  };

  buttons.forEach((button) => button.addEventListener("click", () => activate(button.dataset.subtab!)));

  const salaryPointsTable = container.querySelector("#salary-points-table") as HTMLElement;
  const salaryPointsSearch = container.querySelector("#salary-points-search") as HTMLInputElement;

  const renderSalaryPoints = (keyword = "") => {
    const query = keyword.trim();
    const rows = data.salaryPoints.points
      .filter((item) => {
        if (!query) return true;
        return String(item.point).includes(query) || String(item.monthly_salary).includes(query);
      })
      .map((item) => [fmt(item.point), fmt(item.monthly_salary)]);
    salaryPointsTable.innerHTML = renderTable(["俸點", "月俸額"], rows, 1);
  };

  salaryPointsSearch.addEventListener("input", () => renderSalaryPoints(salaryPointsSearch.value));
  renderSalaryPoints();
}
