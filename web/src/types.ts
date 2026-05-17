// 薪資計算相關型別定義

export interface SalaryPointEntry {
  point: number;
  monthly_salary: number;
}

export interface SalaryPointData {
  year: number;
  effective_date: string;
  points: SalaryPointEntry[];
}

export interface SalaryGradeEntry {
  rank: number;
  rank_name: string;
  grade_type: "本俸" | "年功俸";
  level: number;
  point: number;
}

export interface SalaryGradeData {
  year: number;
  effective_date: string;
  entries: SalaryGradeEntry[];
}

export interface ProfessionalAllowanceItem {
  rank: number;
  monthly_allowance: number;
}

export interface ExtraAllowance {
  code: string;
  name: string;
  amount: number;
}

export interface ProfessionalAllowanceTable {
  table_id: string;
  name: string;
  items: ProfessionalAllowanceItem[];
  extra_allowances: ExtraAllowance[];
}

export interface ProfessionalAllowanceData {
  effective_date: string;
  tables: ProfessionalAllowanceTable[];
}

export interface SupervisoryAllowanceItem {
  category_id: string;
  category_name: string;
  min_rank: number;
  max_rank: number;
  monthly_allowance: number;
  note: string;
}

export interface SupervisoryAllowanceData {
  effective_date: string;
  items: SupervisoryAllowanceItem[];
}

export interface HealthInsuranceSelfPayment {
  dependents_0: number;
  dependents_1: number;
  dependents_2: number;
  dependents_3: number;
  dependents_4: number;
  dependents_5: number;
  dependents_6: number;
}

export interface HealthInsuranceBracket {
  range_min: number;
  range_max: number;
  insured_salary: number;
  self_payment: HealthInsuranceSelfPayment;
}

export interface HealthInsuranceData {
  year: number;
  effective_date: string;
  items: HealthInsuranceBracket[];
}

export interface PensionEntry {
  point: number;
  base_salary: number;
  self_payment: number;
}

export interface PensionData {
  system: "old" | "new";
  effective_date: string;
  items: PensionEntry[];
}

export interface InsuranceEntry {
  base_salary: number;
  rate_basis_points: number;
  self_pay_ratio_basis_points: number;
  self_payment: number;
}

export interface InsuranceData {
  effective_date: string;
  items: InsuranceEntry[];
}

export interface MetadataDataset {
  dataset: string;
  version: string;
  effective_date: string;
  source_name: string;
  source_document: string;
  source_url: string;
  last_checked_at: string;
}

export interface MetadataData {
  generated_at: string;
  datasets: MetadataDataset[];
}

export type PensionSystem = "old" | "new" | "personal_account";

export interface SalaryScenario {
  rank: number;
  point: number;
  professionalAllowanceTable: string;
  engineeringExtra: boolean;
  pensionSystem: PensionSystem;
  healthInsuranceDependents: number;
  supervisoryAllowance: number;
}

export interface EarningItem {
  code: string;
  label: string;
  amount: number;
}

export interface DeductionItem {
  code: string;
  label: string;
  amount: number;
}

export interface SalaryResult {
  earnings: EarningItem[];
  deductions: DeductionItem[];
  grossTotal: number;
  deductionTotal: number;
  netTotal: number;
}

export interface PromotionComparison {
  before: SalaryResult;
  after: SalaryResult;
  monthlyDiff: number;
  annualDiff: number;
}

export interface AppData {
  salaryPoints: SalaryPointData;
  salaryGrades: SalaryGradeData;
  professionalAllowances: ProfessionalAllowanceData;
  supervisoryAllowances: SupervisoryAllowanceData;
  healthInsurance: HealthInsuranceData;
  pension: PensionData;
  insurance: InsuranceData;
  metadata: MetadataData;
}
