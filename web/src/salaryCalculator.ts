// 薪資計算邏輯（純函式，讀取已載入的資料）

import type {
  AppData,
  DeductionItem,
  EarningItem,
  HealthInsuranceBracket,
  HealthInsuranceSelfPayment,
  ProfessionalAllowanceTable,
  PromotionComparison,
  SalaryResult,
  SalaryScenario,
} from "./types";

function findBaseSalary(data: AppData, point: number): number {
  const sp = data.salaryPoints.points.find((p) => p.point === point);
  if (!sp) throw new Error(`俸點 ${point} 找不到`);
  return sp.monthly_salary;
}

function findProfessionalTable(data: AppData, tableId: string): ProfessionalAllowanceTable {
  const table = data.professionalAllowances.tables.find((item) => item.table_id === tableId);
  if (!table) throw new Error(`專業加給表 ${tableId} 找不到`);
  return table;
}

function findProfessionalAllowance(data: AppData, rank: number, tableId: string): number {
  const table = findProfessionalTable(data, tableId);
  const item = table.items.find((entry) => entry.rank === rank);
  if (!item) throw new Error(`職等 ${rank} 的專業加給找不到`);
  return item.monthly_allowance;
}

function findHealthInsuranceBracket(data: AppData, grossSalary: number): HealthInsuranceBracket {
  const bracket = data.healthInsurance.items.find(
    (b) => b.range_min <= grossSalary && grossSalary <= b.range_max
  );
  return bracket ?? data.healthInsurance.items[data.healthInsurance.items.length - 1];
}

function getHealthInsuranceAmount(
  selfPayment: HealthInsuranceSelfPayment,
  dependents: number
): number {
  const key = `dependents_${dependents}` as keyof HealthInsuranceSelfPayment;
  return selfPayment[key] ?? selfPayment.dependents_6;
}

function findPensionPayment(data: AppData, point: number): number {
  const item = data.pension.items.find((entry) => entry.point === point);
  if (item) return item.self_payment;
  // Fallback: nearest point
  const nearest = data.pension.items.reduce((prev, curr) =>
    Math.abs(curr.point - point) < Math.abs(prev.point - point) ? curr : prev
  );
  return nearest.self_payment;
}

function calculatePersonalAccountPayment(baseSalary: number): number {
  return Math.round(baseSalary * 2 * 0.15 * 0.35);
}

function findInsurancePayment(data: AppData, baseSalary: number): number {
  const item = data.insurance.items.find((entry) => entry.base_salary === baseSalary);
  if (item) return item.self_payment;
  // Compute from uniform rate (7.22% × 35%)
  const ref = data.insurance.items[0];
  const rate = ref.rate_basis_points / 10000;
  const selfPayRatio = ref.self_pay_ratio_basis_points / 10000;
  return Math.round(baseSalary * rate * selfPayRatio);
}

export function calculateSalary(data: AppData, scenario: SalaryScenario): SalaryResult {
  const baseSalary = findBaseSalary(data, scenario.point);
  const profAllowance = findProfessionalAllowance(
    data,
    scenario.rank,
    scenario.professionalAllowanceTable
  );

  const earnings: EarningItem[] = [
    { code: "base_salary", label: "本俸", amount: baseSalary },
    { code: "professional_allowance", label: "專業加給", amount: profAllowance },
  ];

  if (scenario.engineeringExtra) {
    earnings.push({ code: "engineering_extra", label: "工程人員另增支", amount: 3000 });
  }

  if (scenario.supervisoryAllowance > 0) {
    earnings.push({
      code: "supervisory_allowance",
      label: "主管職務加給",
      amount: scenario.supervisoryAllowance,
    });
  }

  const grossTotal = earnings.reduce((sum, item) => sum + item.amount, 0);
  const hiBracket = findHealthInsuranceBracket(data, grossTotal);
  const hiAmount = getHealthInsuranceAmount(
    hiBracket.self_payment,
    scenario.healthInsuranceDependents
  );
  const pensionAmount =
    scenario.pensionSystem === "personal_account"
      ? calculatePersonalAccountPayment(baseSalary)
      : findPensionPayment(data, scenario.point);
  const insuranceAmount = findInsurancePayment(data, baseSalary);
  const pensionLabelMap = {
    old: "退撫基金制",
    new: "退撫基金制",
    personal_account: "個人專戶制",
  } satisfies Record<SalaryScenario["pensionSystem"], string>;

  const deductions: DeductionItem[] = [
    { code: "civil_service_insurance", label: "公保", amount: insuranceAmount },
    { code: "health_insurance", label: "健保", amount: hiAmount },
    {
      code: `pension_${scenario.pensionSystem}`,
      label: pensionLabelMap[scenario.pensionSystem],
      amount: pensionAmount,
    },
  ];

  const deductionTotal = deductions.reduce((sum, item) => sum + item.amount, 0);
  const netTotal = grossTotal - deductionTotal;

  return { earnings, deductions, grossTotal, deductionTotal, netTotal };
}

export function comparePromotion(
  data: AppData,
  before: SalaryScenario,
  after: SalaryScenario
): PromotionComparison {
  const beforeResult = calculateSalary(data, before);
  const afterResult = calculateSalary(data, after);
  const monthlyDiff = afterResult.netTotal - beforeResult.netTotal;
  return {
    before: beforeResult,
    after: afterResult,
    monthlyDiff,
    annualDiff: monthlyDiff * 12,
  };
}
