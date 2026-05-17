"""Pydantic schemas for all salary data models."""

from typing import Literal

from pydantic import BaseModel, Field


class SalaryPoint(BaseModel):
    """一個俸點對應的本俸金額。"""

    year: int
    effective_date: str
    point: int
    monthly_salary: int


class SalaryPointTable(BaseModel):
    year: int
    effective_date: str
    points: list[SalaryPoint]


class SalaryGradeEntry(BaseModel):
    rank: int
    rank_name: str
    grade_type: Literal["本俸", "年功俸"]
    level: int
    point: int


class SalaryGradeTable(BaseModel):
    year: int
    effective_date: str
    entries: list[SalaryGradeEntry]


class ProfessionalAllowanceItem(BaseModel):
    """單一職等的專業加給金額。"""

    rank: int
    monthly_allowance: int


class ExtraAllowance(BaseModel):
    """另增支（如工程人員另增支）。"""

    code: str
    name: str
    amount: int


class ProfessionalAllowanceTable(BaseModel):
    table_id: str
    name: str
    items: list[ProfessionalAllowanceItem]
    extra_allowances: list[ExtraAllowance]


class SupervisoryAllowanceItem(BaseModel):
    category_id: str
    category_name: str
    min_rank: int
    max_rank: int
    monthly_allowance: int
    note: str


class SupervisoryAllowanceTable(BaseModel):
    effective_date: str
    items: list[SupervisoryAllowanceItem]


class HealthInsuranceSelfPayment(BaseModel):
    """健保自付額，依眷口數。"""

    dependents_0: int
    dependents_1: int
    dependents_2: int
    dependents_3: int
    dependents_4: int
    dependents_5: int
    dependents_6: int


class HealthInsuranceBracket(BaseModel):
    """一個健保投保金額級距。"""

    range_min: int
    range_max: int
    insured_salary: int
    self_payment: HealthInsuranceSelfPayment


class HealthInsuranceTable(BaseModel):
    year: int
    effective_date: str
    items: list[HealthInsuranceBracket]


class PensionContribution(BaseModel):
    """一個俸點的退撫自付額。"""

    system: Literal["old", "new", "personal_account"]
    point: int
    base_salary: int
    self_payment: int


class PensionTable(BaseModel):
    system: Literal["old", "new", "personal_account"]
    effective_date: str
    items: list[PensionContribution]


class CivilServiceInsurance(BaseModel):
    """公保自付額（依本俸計算）。"""

    base_salary: int
    rate_basis_points: int
    self_pay_ratio_basis_points: int
    self_payment: int


class CivilServiceInsuranceTable(BaseModel):
    effective_date: str
    items: list[CivilServiceInsurance]


class SalaryScenario(BaseModel):
    """試算情境：描述一個職位的所有薪資條件。"""

    scenario_id: str
    title: str
    rank: int = Field(..., description="薦任職等（1-14）")
    point: int = Field(..., description="俸點")
    professional_allowance_table: str = Field(
        default="professional_allowance_table_7", description="專業加給表代碼"
    )
    engineering_extra: bool = Field(default=False, description="是否適用工程人員另增支 3,000 元")
    pension_system: Literal["old", "new", "personal_account"] = Field(default="old", description="退撫制度")
    health_insurance_dependents: int = Field(
        default=0, ge=0, le=6, description="健保眷口數（0=本人無眷口）"
    )
    supervisory_allowance: int = Field(default=0, ge=0, description="主管職務加給（元/月）")


class EarningItem(BaseModel):
    code: str
    label: str
    amount: int


class DeductionItem(BaseModel):
    code: str
    label: str
    amount: int


class SalaryResult(BaseModel):
    scenario_id: str
    title: str
    earnings: list[EarningItem]
    deductions: list[DeductionItem]
    gross_total: int
    deduction_total: int
    net_total: int


class PromotionComparison(BaseModel):
    """升等前後比較結果。"""

    before: SalaryResult
    after: SalaryResult
    monthly_diff: int
    annual_diff: int
