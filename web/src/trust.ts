import type { AppData, MetadataDataset, SalaryScenario } from "./types";
import { icon } from "./icons";

const DATASET_LABELS: Record<string, string> = {
  salary_points: "俸額表",
  salary_grades: "職等俸級",
  professional_allowances: "專業加給",
  supervisory_allowances: "主管加給",
  health_insurance: "健保級距",
  pension: "退撫制度",
  civil_service_insurance: "公保",
};

const DATASET_BY_TABLE: Record<string, string[]> = {
  "salary-points": ["salary_points"],
  "salary-grades": ["salary_grades", "salary_points"],
  professional: ["professional_allowances"],
  supervisory: ["supervisory_allowances"],
  health: ["health_insurance"],
  pension: ["pension", "salary_points"],
  insurance: ["civil_service_insurance"],
};

export function datasetMeta(data: AppData, dataset: string): MetadataDataset | undefined {
  return data.metadata.datasets.find((item) => item.dataset === dataset);
}

export function datasetLabel(dataset: string): string {
  return DATASET_LABELS[dataset] ?? dataset;
}

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function sourceLink(meta: MetadataDataset): string {
  return `<a href="${meta.source_url}" target="_blank" rel="noreferrer">${meta.source_name}</a>`;
}

export function renderDatasetMetaLine(data: AppData, dataset: string): string {
  const meta = datasetMeta(data, dataset);
  if (!meta) return "";
  return `
    <div class="dataset-meta-line">
      <span>${datasetLabel(meta.dataset)} ${meta.version}</span>
      <span>生效 ${meta.effective_date}</span>
      <span>整理 ${meta.last_checked_at}</span>
      <span>${sourceLink(meta)}</span>
    </div>
  `;
}

export function renderDatasetMetaPanel(data: AppData, datasetIds: string[]): string {
  const metas = datasetIds
    .map((id) => datasetMeta(data, id))
    .filter((meta): meta is MetadataDataset => Boolean(meta));
  if (metas.length === 0) return "";

  return `
    <div class="trust-source-panel">
      ${metas.map((meta) => `
        <div class="trust-source-row">
          <div>
            <strong>${datasetLabel(meta.dataset)}</strong>
            <span>${meta.source_document}</span>
          </div>
          <a href="${meta.source_url}" target="_blank" rel="noreferrer">來源</a>
        </div>
      `).join("")}
    </div>
  `;
}

export function renderTableTrustBar(data: AppData, tableId: string): string {
  const datasetIds = DATASET_BY_TABLE[tableId] ?? [];
  return renderDatasetMetaPanel(data, datasetIds);
}

export function renderHomeTrustSummary(data: AppData): string {
  const generatedDate = dateOnly(data.metadata.generated_at);
  const salaryMeta = datasetMeta(data, "salary_points");
  const healthMeta = datasetMeta(data, "health_insurance");
  const pensionMeta = datasetMeta(data, "pension");
  const checkedDates = data.metadata.datasets.map((item) => item.last_checked_at).sort();
  const lastChecked = checkedDates[checkedDates.length - 1] ?? generatedDate;

  return `
    <section class="card trust-summary" aria-label="資料可信度摘要">
      <div>
        <div class="section-heading">${icon("shield-check")} 資料可信度</div>
        <p>所有試算資料皆由本專案整理為靜態 JSON，頁面不連線送出個人條件。結果僅供估算，實際給與仍以主管機關公告與任職機關認定為準。</p>
      </div>
      <div class="trust-summary-grid">
        <div><span>產生日期</span><strong>${generatedDate}</strong></div>
        <div><span>最後整理</span><strong>${lastChecked}</strong></div>
        <div><span>俸額版本</span><strong>${salaryMeta?.version ?? "未標示"}</strong></div>
        <div><span>健保版本</span><strong>${healthMeta?.version ?? "未標示"}</strong></div>
      </div>
      <div class="trust-source-panel">
        ${[salaryMeta, healthMeta, pensionMeta]
          .filter((meta): meta is MetadataDataset => Boolean(meta))
          .map((meta) => `
            <div class="trust-source-row">
              <div>
                <strong>${datasetLabel(meta.dataset)}</strong>
                <span>${meta.source_document}</span>
              </div>
              <a href="${meta.source_url}" target="_blank" rel="noreferrer">來源</a>
            </div>
          `).join("")}
      </div>
    </section>
  `;
}

export function renderCalculationBasis(data: AppData, scenario: SalaryScenario): string {
  const table = data.professionalAllowances.tables.find((item) => item.table_id === scenario.professionalAllowanceTable);
  const base = data.salaryPoints.points.find((item) => item.point === scenario.point)?.monthly_salary ?? 0;
  const insurance = data.insurance.items[0];
  const insuranceRate = insurance ? `${(insurance.rate_basis_points / 100).toFixed(2)}% × ${(insurance.self_pay_ratio_basis_points / 100).toFixed(2)}%` : "公保表";
  const pensionFormula =
    scenario.pensionSystem === "personal_account"
      ? "本俸 × 2 × 15% × 35%"
      : "退撫自付額表，缺值時採鄰近俸點";

  return `
    <div class="card trust-card">
      <div class="section-heading">${icon("information-circle")} 計算依據</div>
      <div class="trust-formula-list">
        <div><span>本俸</span><strong>俸點 ${scenario.point} → ${base.toLocaleString("zh-TW")} 元</strong></div>
        <div><span>專業加給</span><strong>${table?.name ?? scenario.professionalAllowanceTable}，依第 ${scenario.rank} 職等</strong></div>
        <div><span>公保</span><strong>本俸 × ${insuranceRate}</strong></div>
        <div><span>健保</span><strong>應領合計套用 115 年健保級距，眷口 ${scenario.healthInsuranceDependents}</strong></div>
        <div><span>退撫</span><strong>${pensionFormula}</strong></div>
        ${scenario.engineeringExtra ? "<div><span>工程另增支</span><strong>固定 3,000 元，依是否適用手動切換</strong></div>" : ""}
      </div>
      ${renderDatasetMetaPanel(data, ["salary_points", "professional_allowances", "civil_service_insurance", "health_insurance", "pension"])}
      <p class="trust-note">試算未納入所得稅、地域加給、特殊職務加給、個別機關差異與實際任用審定結果。</p>
    </div>
  `;
}

export function renderEstimateNotice(label = "年度估算"): string {
  return `
    <div class="notice notice-blue trust-estimate-notice">
      ${icon("information-circle", "inline-icon")}
      ${label}會納入可調整的考績與年終假設；月薪實領依目前條件計算，年度數字不是官方核定金額。
    </div>
  `;
}
