// 薪資表單元件

import type {
  AppData,
  ProfessionalAllowanceTable,
  SalaryGradeEntry,
  SalaryScenario,
  SupervisoryAllowanceItem,
} from "../types";

export interface FormOptions {
  data: AppData;
  initialScenario: SalaryScenario;
  onChange: (scenario: SalaryScenario) => void;
}

function rankLabel(rank: number): string {
  const map: Record<number, string> = {
    1: "委任一等",
    2: "委任二等",
    3: "委任三等",
    4: "委任四等",
    5: "委任五等",
    6: "薦任六等",
    7: "薦任七等",
    8: "薦任八等",
    9: "薦任九等",
    10: "簡任十等",
    11: "簡任十一等",
    12: "簡任十二等",
    13: "簡任十三等",
    14: "簡任十四等",
  };
  return map[rank] ?? `第 ${rank} 職等`;
}

function getRankEntries(data: AppData, rank: number): SalaryGradeEntry[] {
  return data.salaryGrades.entries
    .filter((entry) => entry.rank === rank)
    .sort((a, b) => a.level - b.level);
}

function getAvailableTables(data: AppData, rank: number): ProfessionalAllowanceTable[] {
  return data.professionalAllowances.tables.filter((table) =>
    table.items.some((item) => item.rank === rank)
  );
}

function getApplicableSupervisors(data: AppData, rank: number): SupervisoryAllowanceItem[] {
  const matched = data.supervisoryAllowances.items.filter(
    (item) => item.min_rank <= rank && rank <= item.max_rank
  );
  return matched.length > 0 ? matched : data.supervisoryAllowances.items;
}

export function renderSalaryForm(container: HTMLElement, opts: FormOptions): void {
  const { data, initialScenario, onChange } = opts;
  let scenario: SalaryScenario = { ...initialScenario };

  function render(): void {
    const rankEntries = getRankEntries(data, scenario.rank);
    const availableTables = getAvailableTables(data, scenario.rank);
    const applicableSupervisors = getApplicableSupervisors(data, scenario.rank);

    if (rankEntries.length > 0 && !rankEntries.some((entry) => entry.point === scenario.point)) {
      scenario.point = rankEntries[0].point;
    }

    if (
      availableTables.length > 0 &&
      !availableTables.some((table) => table.table_id === scenario.professionalAllowanceTable)
    ) {
      scenario.professionalAllowanceTable = availableTables[0].table_id;
    }

    const supervisoryEnabled = scenario.supervisoryAllowance > 0;
    const selectedSupervisorId =
      applicableSupervisors.find(
        (item) => item.monthly_allowance === scenario.supervisoryAllowance
      )?.category_id ?? "manual";

    container.innerHTML = `
      <div class="bg-white rounded-2xl shadow p-6 space-y-4">
        <h2 class="text-lg font-bold text-gray-700">試算條件</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm text-gray-600 font-medium">職等</span>
            <select id="rank" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              ${Array.from(new Set(data.salaryGrades.entries.map((entry) => entry.rank)))
                .sort((a, b) => a - b)
                .map(
                  (rank) =>
                    `<option value="${rank}" ${rank === scenario.rank ? "selected" : ""}>${rankLabel(rank)}</option>`
                )
                .join("")}
            </select>
          </label>

          <label class="block">
            <span class="text-sm text-gray-600 font-medium">俸級 / 俸點</span>
            <select id="point" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              ${rankEntries
                .map(
                  (entry) =>
                    `<option value="${entry.point}" ${entry.point === scenario.point ? "selected" : ""}>${entry.grade_type}${entry.level}・俸點 ${entry.point}</option>`
                )
                .join("")}
            </select>
          </label>

          <label class="block">
            <span class="text-sm text-gray-600 font-medium">專業加給表</span>
            <select id="professional-table" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              ${availableTables
                .map(
                  (table) =>
                    `<option value="${table.table_id}" ${table.table_id === scenario.professionalAllowanceTable ? "selected" : ""}>${table.name}</option>`
                )
                .join("")}
            </select>
          </label>

          <label class="block">
            <span class="text-sm text-gray-600 font-medium">退撫制度</span>
            <select id="pension" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="old" ${scenario.pensionSystem === "old" ? "selected" : ""}>舊制</option>
              <option value="new" ${scenario.pensionSystem === "new" ? "selected" : ""}>新制</option>
            </select>
          </label>

          <label class="block">
            <span class="text-sm text-gray-600 font-medium">健保眷口數</span>
            <select id="dependents" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              ${[0, 1, 2, 3, 4, 5, 6]
                .map(
                  (count) =>
                    `<option value="${count}" ${count === scenario.healthInsuranceDependents ? "selected" : ""}>${count === 0 ? "本人（無眷口）" : `${count} 口眷屬`}</option>`
                )
                .join("")}
            </select>
          </label>
        </div>

        <label class="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox" id="engineering" class="w-4 h-4 rounded accent-blue-500" ${scenario.engineeringExtra ? "checked" : ""}>
          <span class="text-sm text-gray-700">工程人員另增支 <span class="font-semibold text-blue-600">+3,000 元</span></span>
        </label>

        <div class="rounded-xl border border-gray-200 p-4 space-y-3">
          <label class="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" id="supervisory-enabled" class="w-4 h-4 rounded accent-blue-500" ${supervisoryEnabled ? "checked" : ""}>
            <span class="text-sm text-gray-700">主管加給</span>
          </label>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 ${supervisoryEnabled ? "" : "opacity-60"}">
            <label class="block">
              <span class="text-sm text-gray-600 font-medium">主管類別預設</span>
              <select id="supervisory-category" ${supervisoryEnabled ? "" : "disabled"} class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-400">
                <option value="manual" ${selectedSupervisorId === "manual" ? "selected" : ""}>手動輸入</option>
                ${applicableSupervisors
                  .map(
                    (item) =>
                      `<option value="${item.category_id}" ${item.category_id === selectedSupervisorId ? "selected" : ""}>${item.category_name}（${item.monthly_allowance.toLocaleString("zh-TW")} 元）</option>`
                  )
                  .join("")}
              </select>
            </label>

            <label class="block">
              <span class="text-sm text-gray-600 font-medium">主管加給金額</span>
              <input id="supervisory-allowance" type="number" min="0" step="100" value="${scenario.supervisoryAllowance}" ${supervisoryEnabled ? "" : "disabled"} class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-400">
            </label>
          </div>

          <p class="text-xs text-gray-500">可依職等套用預設主管加給，也可改為手動輸入。</p>
        </div>
      </div>
    `;

    attachListeners();
  }

  function read(source: string): void {
    const nextRank = parseInt((container.querySelector("#rank") as HTMLSelectElement).value, 10);
    const nextRankEntries = getRankEntries(data, nextRank);
    const nextTables = getAvailableTables(data, nextRank);
    const supervisoryEnabled = (container.querySelector("#supervisory-enabled") as HTMLInputElement)
      .checked;
    const categoryId = (container.querySelector("#supervisory-category") as HTMLSelectElement).value;
    const manualAllowance = parseInt(
      (container.querySelector("#supervisory-allowance") as HTMLInputElement).value || "0",
      10
    );
    const applicableSupervisors = getApplicableSupervisors(data, nextRank);
    const selectedSupervisor = applicableSupervisors.find((item) => item.category_id === categoryId);

    let nextPoint = parseInt((container.querySelector("#point") as HTMLSelectElement).value, 10);
    if (!nextRankEntries.some((entry) => entry.point === nextPoint) && nextRankEntries.length > 0) {
      nextPoint = nextRankEntries[0].point;
    }

    let nextTableId = (container.querySelector("#professional-table") as HTMLSelectElement).value;
    if (!nextTables.some((table) => table.table_id === nextTableId) && nextTables.length > 0) {
      nextTableId = nextTables[0].table_id;
    }

    let supervisoryAllowance = 0;
    if (supervisoryEnabled) {
      if (source === "supervisory-category" && selectedSupervisor) {
        supervisoryAllowance = selectedSupervisor.monthly_allowance;
      } else if (categoryId !== "manual" && selectedSupervisor && manualAllowance === 0) {
        supervisoryAllowance = selectedSupervisor.monthly_allowance;
      } else {
        supervisoryAllowance = manualAllowance;
      }
      if (source === "supervisory-enabled" && supervisoryAllowance === 0 && applicableSupervisors.length > 0) {
        supervisoryAllowance = applicableSupervisors[0].monthly_allowance;
      }
    }

    scenario = {
      rank: nextRank,
      point: nextPoint,
      professionalAllowanceTable: nextTableId,
      pensionSystem: (container.querySelector("#pension") as HTMLSelectElement).value as
        | "old"
        | "new",
      healthInsuranceDependents: parseInt(
        (container.querySelector("#dependents") as HTMLSelectElement).value,
        10
      ),
      engineeringExtra: (container.querySelector("#engineering") as HTMLInputElement).checked,
      supervisoryAllowance,
    };

    render();
    onChange(scenario);
  }

  function attachListeners(): void {
    const register = (selector: string, source: string) => {
      container.querySelector(selector)?.addEventListener("change", () => read(source));
    };

    register("#rank", "rank");
    register("#point", "point");
    register("#professional-table", "professional-table");
    register("#pension", "pension");
    register("#dependents", "dependents");
    register("#engineering", "engineering");
    register("#supervisory-enabled", "supervisory-enabled");
    register("#supervisory-category", "supervisory-category");
    container
      .querySelector("#supervisory-allowance")
      ?.addEventListener("input", () => read("supervisory-allowance"));
  }

  render();
}
