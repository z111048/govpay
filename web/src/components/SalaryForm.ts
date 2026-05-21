// 薪資表單元件

import type {
  AppData,
  ProfessionalAllowanceTable,
  SalaryGradeEntry,
  SalaryScenario,
  SupervisoryAllowanceItem,
} from "../types";
import { icon } from "../icons";

export interface FormOptions {
  data: AppData;
  initialScenario: SalaryScenario;
  onChange: (scenario: SalaryScenario) => void;
}

function rankLabel(rank: number): string {
  const map: Record<number, string> = {
    1: "委任一等", 2: "委任二等", 3: "委任三等", 4: "委任四等", 5: "委任五等",
    6: "薦任六等", 7: "薦任七等", 8: "薦任八等", 9: "薦任九等",
    10: "簡任十等", 11: "簡任十一等", 12: "簡任十二等", 13: "簡任十三等", 14: "簡任十四等",
  };
  return map[rank] ?? `第 ${rank} 職等`;
}

function getRankEntries(data: AppData, rank: number): SalaryGradeEntry[] {
  return data.salaryGrades.entries.filter((e) => e.rank === rank).sort((a, b) => a.level - b.level);
}

function getAvailableTables(data: AppData, rank: number): ProfessionalAllowanceTable[] {
  return data.professionalAllowances.tables.filter((t) => t.items.some((i) => i.rank === rank));
}

function getApplicableSupervisors(data: AppData, rank: number): SupervisoryAllowanceItem[] {
  return data.supervisoryAllowances.items.filter(
    (item) => item.min_rank <= rank && rank <= item.max_rank
  );
}

function firstSupervisorForRank(data: AppData, rank: number): SupervisoryAllowanceItem | undefined {
  return getApplicableSupervisors(data, rank).at(0);
}

const SEL = "width:100%;border:1.5px solid var(--c-border);border-radius:8px;padding:8px 12px;font-size:13px;color:var(--c-text);background:var(--c-surface);font-family:inherit;";

export function renderSalaryForm(container: HTMLElement, opts: FormOptions): void {
  const { data, initialScenario, onChange } = opts;
  let scenario: SalaryScenario = { ...initialScenario };
  let supervisorySelection =
    scenario.supervisoryAllowance > 0 &&
    !getApplicableSupervisors(data, scenario.rank).some(
      (item) => item.monthly_allowance === scenario.supervisoryAllowance
    )
      ? "manual"
      : "auto";

  function render(): void {
    const rankEntries = getRankEntries(data, scenario.rank);
    const availableTables = getAvailableTables(data, scenario.rank);
    const applicableSupervisors = getApplicableSupervisors(data, scenario.rank);

    if (rankEntries.length > 0 && !rankEntries.some((e) => e.point === scenario.point))
      scenario.point = rankEntries[0].point;
    if (availableTables.length > 0 && !availableTables.some((t) => t.table_id === scenario.professionalAllowanceTable))
      scenario.professionalAllowanceTable = availableTables[0].table_id;

    const supervisoryEnabled = scenario.supervisoryAllowance > 0;
    if (
      supervisorySelection !== "manual" &&
      supervisorySelection !== "auto" &&
      !applicableSupervisors.some((item) => item.category_id === supervisorySelection)
    ) {
      supervisorySelection = "auto";
    }
    const autoSupervisor = firstSupervisorForRank(data, scenario.rank);
    const selectedSupervisorId =
      supervisorySelection === "manual"
        ? "manual"
        : supervisorySelection === "auto"
          ? "auto"
          : supervisorySelection;

    container.innerHTML = `
      <div class="card salary-form-card">
        <div class="section-heading" style="margin-bottom:1.25rem;">
          ${icon("cog")} 試算條件
        </div>

        <div class="salary-form-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;margin-bottom:1.25rem;">
          <label>
            <span class="field-label">職等</span>
            <select id="rank" class="salary-control" style="${SEL}">
              ${Array.from(new Set(data.salaryGrades.entries.map((e) => e.rank))).sort((a,b)=>a-b)
                .map((r) => `<option value="${r}" ${r===scenario.rank?"selected":""}>${rankLabel(r)}</option>`).join("")}
            </select>
          </label>

          <label>
            <span class="field-label">俸級 / 俸點</span>
            <select id="point" class="salary-control" style="${SEL}">
              ${rankEntries.map((e) =>
                `<option value="${e.point}" ${e.point===scenario.point?"selected":""}>${e.grade_type}${e.level}・${e.point} 點</option>`
              ).join("")}
            </select>
          </label>

          <label>
            <span class="field-label">專業加給表</span>
            <select id="professional-table" class="salary-control" style="${SEL}">
              ${availableTables.map((t) =>
                `<option value="${t.table_id}" ${t.table_id===scenario.professionalAllowanceTable?"selected":""}>${t.name}</option>`
              ).join("")}
            </select>
          </label>

          <label>
            <span class="field-label">退撫制度</span>
            <select id="pension" class="salary-control" style="${SEL}">
              <option value="old" ${scenario.pensionSystem==="old"?"selected":""}>退撫基金制（原舊制標示）</option>
              <option value="new" ${scenario.pensionSystem==="new"?"selected":""}>退撫基金制（84年7月至112年6月）</option>
              <option value="personal_account" ${scenario.pensionSystem==="personal_account"?"selected":""}>個人專戶制（112年7月1日後初任）</option>
            </select>
          </label>

          <label>
            <span class="field-label">健保眷口數</span>
            <select id="dependents" class="salary-control" style="${SEL}">
              ${[0,1,2,3,4,5,6].map((c) =>
                `<option value="${c}" ${c===scenario.healthInsuranceDependents?"selected":""}>${c===0?"本人（無眷口）":c+" 口眷屬"}</option>`
              ).join("")}
            </select>
          </label>
        </div>

        <!-- 工程加給 -->
        <label class="salary-toggle-row" style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 14px;border-radius:10px;background:var(--c-surface-2);margin-bottom:10px;user-select:none;">
          <input type="checkbox" id="engineering" style="width:16px;height:16px;accent-color:var(--c-primary);" ${scenario.engineeringExtra?"checked":""}>
          <span style="font-size:13.5px;color:var(--c-text-2);">工程人員另增支</span>
          <span class="badge badge-blue" style="margin-left:auto;">+3,000 元</span>
        </label>

        <!-- 主管加給 -->
        <div class="supervisor-panel" style="border:1.5px solid var(--c-border);border-radius:10px;padding:12px 14px;">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;margin-bottom:${supervisoryEnabled?"12px":"0"};">
            <input type="checkbox" id="supervisory-enabled" style="width:16px;height:16px;accent-color:var(--c-primary);" ${supervisoryEnabled?"checked":""}>
            <span style="font-size:13.5px;font-weight:500;color:var(--c-text-2);">主管職務加給</span>
            ${supervisoryEnabled?`<span class="badge badge-green" style="margin-left:auto;">+${scenario.supervisoryAllowance.toLocaleString("zh-TW")} 元</span>`:""}
          </label>

          ${supervisoryEnabled ? `
          <div class="supervisor-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <label>
              <span class="field-label">主管類別</span>
              <select id="supervisory-category" class="salary-control" style="${SEL}">
                <option value="auto" ${selectedSupervisorId==="auto"?"selected":""}>依職等自動判斷${autoSupervisor ? `（${autoSupervisor.monthly_allowance.toLocaleString("zh-TW")} 元）` : ""}</option>
                <option value="manual" ${selectedSupervisorId==="manual"?"selected":""}>手動輸入</option>
                ${applicableSupervisors.map((i) =>
                  `<option value="${i.category_id}" ${i.category_id===selectedSupervisorId?"selected":""}>${i.category_name}（${i.monthly_allowance.toLocaleString("zh-TW")} 元）</option>`
                ).join("")}
              </select>
            </label>
            <label>
              <span class="field-label">加給金額（元）</span>
              <input id="supervisory-allowance" class="salary-control" type="number" min="0" step="100" value="${scenario.supervisoryAllowance}" style="${SEL}">
            </label>
          </div>
          <p style="font-size:11px;color:var(--c-text-4);margin-top:6px;">依職等自動套用主管加給表；直接修改金額會切換為手動輸入。</p>
          ` : ""}
        </div>
      </div>
    `;

    attachListeners();
  }

  function read(source: string): void {
    const nextRank = parseInt((container.querySelector("#rank") as HTMLSelectElement).value, 10);
    const nextRankEntries = getRankEntries(data, nextRank);
    const nextTables = getAvailableTables(data, nextRank);
    const supervisoryEnabled = (container.querySelector("#supervisory-enabled") as HTMLInputElement).checked;
    const categoryId = (container.querySelector("#supervisory-category") as HTMLSelectElement)?.value ?? "manual";
    const manualAllowance = parseInt((container.querySelector("#supervisory-allowance") as HTMLInputElement)?.value || "0", 10);
    const applicableSupervisors = getApplicableSupervisors(data, nextRank);

    let nextPoint = parseInt((container.querySelector("#point") as HTMLSelectElement).value, 10);
    if (!nextRankEntries.some((e) => e.point === nextPoint) && nextRankEntries.length > 0)
      nextPoint = nextRankEntries[0].point;

    let nextTableId = (container.querySelector("#professional-table") as HTMLSelectElement).value;
    if (!nextTables.some((t) => t.table_id === nextTableId) && nextTables.length > 0)
      nextTableId = nextTables[0].table_id;

    let supervisoryAllowance = 0;
    if (supervisoryEnabled) {
      if (source === "supervisory-enabled") {
        supervisorySelection = "auto";
      } else if (source === "supervisory-allowance") {
        supervisorySelection = "manual";
      } else if (source === "supervisory-category") {
        supervisorySelection = categoryId;
      } else if (
        supervisorySelection !== "manual" &&
        supervisorySelection !== "auto" &&
        !applicableSupervisors.some((item) => item.category_id === supervisorySelection)
      ) {
        supervisorySelection = "auto";
      }

      if (supervisorySelection === "manual") {
        supervisoryAllowance = manualAllowance;
      } else if (supervisorySelection === "auto") {
        supervisoryAllowance = applicableSupervisors[0]?.monthly_allowance ?? 0;
      } else {
        const selectedSupervisor = applicableSupervisors.find(
          (item) => item.category_id === supervisorySelection
        );
        supervisoryAllowance = selectedSupervisor?.monthly_allowance ?? applicableSupervisors[0]?.monthly_allowance ?? 0;
      }
    } else {
      supervisorySelection = "auto";
    }

    scenario = {
      rank: nextRank, point: nextPoint,
      professionalAllowanceTable: nextTableId,
      pensionSystem: (container.querySelector("#pension") as HTMLSelectElement).value as SalaryScenario["pensionSystem"],
      healthInsuranceDependents: parseInt((container.querySelector("#dependents") as HTMLSelectElement).value, 10),
      engineeringExtra: (container.querySelector("#engineering") as HTMLInputElement).checked,
      supervisoryAllowance,
    };
    render();
    onChange(scenario);
  }

  function attachListeners(): void {
    const onChange = (sel: string, src: string) =>
      container.querySelector(sel)?.addEventListener("change", () => read(src));
    onChange("#rank", "rank");
    onChange("#point", "point");
    onChange("#professional-table", "professional-table");
    onChange("#pension", "pension");
    onChange("#dependents", "dependents");
    onChange("#engineering", "engineering");
    onChange("#supervisory-enabled", "supervisory-enabled");
    onChange("#supervisory-category", "supervisory-category");
    container.querySelector("#supervisory-allowance")?.addEventListener("input", () => read("supervisory-allowance"));
  }

  render();
}
