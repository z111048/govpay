"""Core salary calculators."""

from salary_data.loaders import (
    load_civil_service_insurance,
    load_health_insurance,
    load_pension,
    load_professional_allowances,
    load_salary_points,
)
from salary_data.schemas import (
    DeductionItem,
    EarningItem,
    HealthInsuranceBracket,
    PromotionComparison,
    SalaryResult,
    SalaryScenario,
)


def find_salary_point(point: int, year: int = 114) -> int:
    """查找俸點對應的本俸金額。"""
    table = load_salary_points(year)
    for sp in table.points:
        if sp.point == point:
            return sp.monthly_salary
    raise ValueError(f"俸點 {point} 在 {year} 年俸點表中找不到")


def find_professional_allowance(rank: int, table_id: str = "professional_allowance_table_7") -> int:
    """查找職等對應的專業加給金額。"""
    table = load_professional_allowances(table_id)
    for item in table.items:
        if item.rank == rank:
            return item.monthly_allowance
    raise ValueError(f"職等 {rank} 在加給表 {table_id} 中找不到")


def find_health_insurance_bracket(gross_salary: int, year: int = 115) -> HealthInsuranceBracket:
    """依總薪資查找健保投保金額級距。"""
    table = load_health_insurance(year)
    for bracket in table.items:
        if bracket.range_min <= gross_salary <= bracket.range_max:
            return bracket
    return table.items[-1]


def find_pension_payment(point: int, system: str = "old") -> int:
    """查找俸點對應的退撫自付額。"""
    table = load_pension(system)
    for item in table.items:
        if item.point == point:
            return item.self_payment
    raise ValueError(f"俸點 {point} 在退撫{system}制表中找不到")


def find_civil_insurance_payment(base_salary: int) -> int:
    """查找本俸對應的公保自付額。"""
    table = load_civil_service_insurance()
    for item in table.items:
        if item.base_salary == base_salary:
            return item.self_payment
    raise ValueError(f"本俸 {base_salary} 在公保表中找不到")


def get_health_insurance_payment(bracket: HealthInsuranceBracket, dependents: int) -> int:
    """取得指定眷口數的健保自付額。"""
    sp = bracket.self_payment
    mapping = {
        0: sp.dependents_0,
        1: sp.dependents_1,
        2: sp.dependents_2,
        3: sp.dependents_3,
        4: sp.dependents_4,
        5: sp.dependents_5,
        6: sp.dependents_6,
    }
    return mapping[dependents]


def calculate_salary(scenario: SalaryScenario) -> SalaryResult:
    """依試算情境計算薪資明細。"""
    base_salary = find_salary_point(scenario.point)
    prof_allowance = find_professional_allowance(
        scenario.rank,
        scenario.professional_allowance_table,
    )

    earnings: list[EarningItem] = [
        EarningItem(code="base_salary", label="本俸", amount=base_salary),
        EarningItem(code="professional_allowance", label="專業加給", amount=prof_allowance),
    ]

    if scenario.engineering_extra:
        earnings.append(EarningItem(code="engineering_extra", label="工程人員另增支", amount=3000))

    if scenario.supervisory_allowance > 0:
        earnings.append(
            EarningItem(
                code="supervisory_allowance",
                label="主管職務加給",
                amount=scenario.supervisory_allowance,
            )
        )

    gross_total = sum(e.amount for e in earnings)

    hi_bracket = find_health_insurance_bracket(gross_total)
    hi_payment = get_health_insurance_payment(hi_bracket, scenario.health_insurance_dependents)
    pension_payment = find_pension_payment(scenario.point, scenario.pension_system)
    insurance_payment = find_civil_insurance_payment(base_salary)

    pension_label = "退撫舊制" if scenario.pension_system == "old" else "退撫新制"
    deductions: list[DeductionItem] = [
        DeductionItem(code="civil_service_insurance", label="公保", amount=insurance_payment),
        DeductionItem(code="health_insurance", label="健保", amount=hi_payment),
        DeductionItem(code=f"pension_{scenario.pension_system}", label=pension_label, amount=pension_payment),
    ]

    deduction_total = sum(d.amount for d in deductions)
    net_total = gross_total - deduction_total

    return SalaryResult(
        scenario_id=scenario.scenario_id,
        title=scenario.title,
        earnings=earnings,
        deductions=deductions,
        gross_total=gross_total,
        deduction_total=deduction_total,
        net_total=net_total,
    )


def compare_promotion(
    before_scenario: SalaryScenario,
    after_scenario: SalaryScenario,
) -> PromotionComparison:
    """計算升等前後薪資比較。"""
    before = calculate_salary(before_scenario)
    after = calculate_salary(after_scenario)
    monthly_diff = after.net_total - before.net_total
    return PromotionComparison(
        before=before,
        after=after,
        monthly_diff=monthly_diff,
        annual_diff=monthly_diff * 12,
    )
