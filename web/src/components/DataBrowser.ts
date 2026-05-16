import type { AppData } from "../types";
import { icon } from "../icons";

function fmt(n: number): string {
  return n.toLocaleString("zh-TW");
}

function renderTable(headers: string[], rows: string[][], rightAlignFrom = 1): string {
  return `
    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>${headers
            .map((h, i) => `<th class="${i >= rightAlignFrom ? "right" : ""}">${h}</th>`)
            .join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr>${row
                  .map((cell, i) => `<td class="${i >= rightAlignFrom ? "right" : ""}">${cell}</td>`)
                  .join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

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
    { id: "salary-points", label: "俸點表", ico: "currency-dollar" },
    { id: "salary-grades", label: "職等俸級", ico: "chart-bar" },
    { id: "professional", label: "專業加給", ico: "briefcase" },
    { id: "supervisory", label: "主管加給", ico: "user" },
    { id: "health", label: "健保級距", ico: "heart" },
    { id: "pension", label: "退撫表", ico: "shield-check" },
    { id: "insurance", label: "公保表", ico: "document-text" },
  ] as const;

  const gradeCards = groupedGrades
    .map(([key, entries]) => {
      const rankName = key.split("-").slice(1).join("-");
      const rankNum = parseInt(key.split("-")[0], 10);
      return `
        <div class="card" style="padding:16px;">
          <div style="margin-bottom:10px;">
            <div style="font-size:13px;font-weight:700;color:var(--c-text);">${rankName}</div>
            <div style="font-size:11px;color:var(--c-text-3);">第 ${rankNum} 職等</div>
          </div>
          ${renderTable(
            ["類型", "級", "俸點"],
            entries
              .sort((a, b) => (a.grade_type === b.grade_type ? a.level - b.level : a.grade_type === "本俸" ? -1 : 1))
              .map((entry) => [
                `<span class="badge ${entry.grade_type === "本俸" ? "badge-primary" : "badge-gray"}">${entry.grade_type}</span>`,
                String(entry.level),
                fmt(entry.point)
              ]),
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
        <div class="card" style="padding:16px;">
          <div style="margin-bottom:10px;">
            <div style="font-size:13px;font-weight:700;color:var(--c-text);">${table.name}</div>
            <div style="font-size:12px;color:var(--c-primary);margin-top:2px;">${desc}</div>
            <div style="font-size:11px;color:var(--c-text-4);margin-top:2px;">涵蓋範圍：${rankRange}</div>
          </div>
          ${renderTable(
            ["職等", "月支數額"],
            table.items.map((item) => [String(item.rank), fmt(item.monthly_allowance)]),
            1
          )}
          ${table.extra_allowances.length > 0 ? `
            <div class="notice notice-warning" style="margin-top:8px;font-size:12px;">
              ${table.extra_allowances.map(e => `${icon("plus-circle", "inline-icon")} ${e.name}：${fmt(e.amount)} 元`).join("　")}
            </div>
          ` : ""}
        </div>
      `;
    })
    .join("");

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
    <div style="display:flex;flex-direction:column;gap:1rem;">
      <!-- sub-tab pills -->
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${subTabs
          .map(
            (tab, index) =>
              `<button data-subtab="${tab.id}" class="tab-btn ${index === 0 ? "tab-active" : ""}" style="display:flex;align-items:center;gap:5px;">
                ${icon(tab.ico, "inline-icon")} ${tab.label}
              </button>`
          )
          .join("")}
      </div>

      <div data-subpanel="salary-points">
        <div class="card">
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:1rem;" class="search-header">
            <div class="section-heading">${icon("currency-dollar")} 俸點查詢</div>
            <input id="salary-points-search" type="search" placeholder="輸入俸點或俸額搜尋…"
              style="border:1.5px solid var(--c-border);border-radius:8px;padding:7px 11px;font-size:13px;color:var(--c-text);background:var(--c-surface);font-family:inherit;width:100%;max-width:280px;">
          </div>
          <div id="salary-points-table"></div>
        </div>
      </div>

      <div data-subpanel="salary-grades" class="hidden">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">${gradeCards}</div>
      </div>

      <div data-subpanel="professional" class="hidden">
        <div class="notice notice-warning" style="margin-bottom:10px;">
          目前收錄：表一（主計）、表二（人事）、表三（政風）、表四（一般行政）、表七（技術/工程）、表八（醫事）。
          其他加給表（如表五、表六）未收錄，以官方公告為準。
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;">${professionalCards}</div>
      </div>

      <div data-subpanel="supervisory" class="hidden">
        <div class="card">
          <div class="section-heading">${icon("user")} 主管職務加給</div>
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
      </div>

      <div data-subpanel="health" class="hidden">
        <div class="card">
          <div class="section-heading">${icon("heart")} 健保投保金額分級表</div>
          <p style="font-size:12px;color:var(--c-text-3);margin-bottom:1rem;">健保自付額依眷口數分欄顯示，單位：元。115 年費率 5.17%，受僱者自付比例 30%。</p>
          ${renderTable(healthHeaders, healthRows, 1)}
        </div>
      </div>

      <div data-subpanel="pension" class="hidden">
        <div class="card">
          <div class="section-heading">${icon("shield-check")} 退撫舊制自付額</div>
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
      </div>

      <div data-subpanel="insurance" class="hidden">
        <div class="card">
          <div class="section-heading">${icon("document-text")} 公保自付額</div>
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
    </div>
  `;

  const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>("[data-subtab]"));
  const panels = Array.from(container.querySelectorAll<HTMLElement>("[data-subpanel]"));

  const activate = (id: string) => {
    buttons.forEach((btn) => {
      const active = btn.dataset.subtab === id;
      btn.classList.toggle("tab-active", active);
    });
    panels.forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.subpanel !== id);
    });
  };

  buttons.forEach((btn) => btn.addEventListener("click", () => activate(btn.dataset.subtab!)));

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
