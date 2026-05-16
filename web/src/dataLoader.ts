// 載入 public/data/*.json

import type {
  AppData,
  HealthInsuranceData,
  InsuranceData,
  MetadataData,
  PensionData,
  ProfessionalAllowanceData,
  SalaryGradeData,
  SalaryPointData,
  SupervisoryAllowanceData,
} from "./types";

const BASE = import.meta.env.BASE_URL;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}data/${path}`);
  if (!res.ok) throw new Error(`載入 ${path} 失敗：${res.status}`);
  return res.json() as Promise<T>;
}

export async function loadAllData(): Promise<AppData> {
  const [
    salaryPoints,
    salaryGrades,
    professionalAllowances,
    supervisoryAllowances,
    healthInsurance,
    pension,
    insurance,
    metadata,
  ] = await Promise.all([
    fetchJson<SalaryPointData>("salary_points.json"),
    fetchJson<SalaryGradeData>("salary_grades.json"),
    fetchJson<ProfessionalAllowanceData>("professional_allowances.json"),
    fetchJson<SupervisoryAllowanceData>("supervisory_allowances.json"),
    fetchJson<HealthInsuranceData>("health_insurance.json"),
    fetchJson<PensionData>("pension.json"),
    fetchJson<InsuranceData>("insurance.json"),
    fetchJson<MetadataData>("metadata.json"),
  ]);

  return {
    salaryPoints,
    salaryGrades,
    professionalAllowances,
    supervisoryAllowances,
    healthInsurance,
    pension,
    insurance,
    metadata,
  };
}
