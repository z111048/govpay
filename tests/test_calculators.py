"""Tests for salary calculators."""

from salary_data.calculators import calculate_salary, compare_promotion
from salary_data.schemas import SalaryScenario


def _rank7_scenario() -> SalaryScenario:
    return SalaryScenario(
        scenario_id="civil_engineer_rank7_point475_old_pension",
        title="土木公務人員薦任七本五俸點475",
        rank=7,
        point=475,
        engineering_extra=True,
        pension_system="old",
        health_insurance_dependents=0,
    )


def _rank8_scenario() -> SalaryScenario:
    return SalaryScenario(
        scenario_id="civil_engineer_rank8_point475_old_pension",
        title="土木公務人員薦任八本三俸點475",
        rank=8,
        point=475,
        engineering_extra=True,
        pension_system="old",
        health_insurance_dependents=0,
    )


class TestRank7Salary:
    def test_gross_total(self) -> None:
        result = calculate_salary(_rank7_scenario())
        assert result.gross_total == 67890

    def test_net_total(self) -> None:
        result = calculate_salary(_rank7_scenario())
        assert result.net_total == 62096

    def test_deduction_total(self) -> None:
        result = calculate_salary(_rank7_scenario())
        assert result.deduction_total == 5794

    def test_earnings_breakdown(self) -> None:
        result = calculate_salary(_rank7_scenario())
        amounts = {e.code: e.amount for e in result.earnings}
        assert amounts["base_salary"] == 36160
        assert amounts["professional_allowance"] == 28730
        assert amounts["engineering_extra"] == 3000

    def test_deductions_breakdown(self) -> None:
        result = calculate_salary(_rank7_scenario())
        deductions = {d.code: d.amount for d in result.deductions}
        assert deductions["civil_service_insurance"] == 914
        assert deductions["health_insurance"] == 1083
        assert deductions["pension_old"] == 3797


class TestRank8Salary:
    def test_gross_total(self) -> None:
        result = calculate_salary(_rank8_scenario())
        assert result.gross_total == 70290

    def test_net_total(self) -> None:
        result = calculate_salary(_rank8_scenario())
        assert result.net_total == 64450

    def test_deduction_total(self) -> None:
        result = calculate_salary(_rank8_scenario())
        assert result.deduction_total == 5840

    def test_earnings_breakdown(self) -> None:
        result = calculate_salary(_rank8_scenario())
        amounts = {e.code: e.amount for e in result.earnings}
        assert amounts["base_salary"] == 36160
        assert amounts["professional_allowance"] == 31130
        assert amounts["engineering_extra"] == 3000

    def test_deductions_breakdown(self) -> None:
        result = calculate_salary(_rank8_scenario())
        deductions = {d.code: d.amount for d in result.deductions}
        assert deductions["civil_service_insurance"] == 914
        assert deductions["health_insurance"] == 1129
        assert deductions["pension_old"] == 3797


class TestPromotionComparison:
    def test_monthly_diff(self) -> None:
        cmp = compare_promotion(_rank7_scenario(), _rank8_scenario())
        assert cmp.monthly_diff == 2354

    def test_annual_diff(self) -> None:
        cmp = compare_promotion(_rank7_scenario(), _rank8_scenario())
        assert cmp.annual_diff == 28248

    def test_before_net(self) -> None:
        cmp = compare_promotion(_rank7_scenario(), _rank8_scenario())
        assert cmp.before.net_total == 62096

    def test_after_net(self) -> None:
        cmp = compare_promotion(_rank7_scenario(), _rank8_scenario())
        assert cmp.after.net_total == 64450


class TestHealthInsuranceDependents:
    def test_one_dependent(self) -> None:
        scenario = SalaryScenario(
            scenario_id="test",
            title="test",
            rank=7,
            point=475,
            engineering_extra=True,
            pension_system="old",
            health_insurance_dependents=1,
        )
        result = calculate_salary(scenario)
        hi = next(d for d in result.deductions if d.code == "health_insurance")
        assert hi.amount == 2166

    def test_no_engineering_extra(self) -> None:
        scenario = SalaryScenario(
            scenario_id="test",
            title="test",
            rank=7,
            point=475,
            engineering_extra=False,
            pension_system="old",
            health_insurance_dependents=0,
        )
        result = calculate_salary(scenario)
        assert result.gross_total == 64890
        codes = [e.code for e in result.earnings]
        assert "engineering_extra" not in codes

    def test_with_supervisory_allowance(self) -> None:
        scenario = SalaryScenario(
            scenario_id="test",
            title="test",
            rank=7,
            point=475,
            engineering_extra=True,
            pension_system="old",
            health_insurance_dependents=0,
            supervisory_allowance=2100,
        )
        result = calculate_salary(scenario)
        sv = next(e for e in result.earnings if e.code == "supervisory_allowance")
        hi = next(d for d in result.deductions if d.code == "health_insurance")
        assert result.gross_total == 69990
        assert sv.amount == 2100
        assert hi.amount == 1129

    def test_personal_account_pension(self) -> None:
        scenario = SalaryScenario(
            scenario_id="test",
            title="test",
            rank=7,
            point=475,
            engineering_extra=True,
            pension_system="personal_account",
            health_insurance_dependents=0,
        )
        result = calculate_salary(scenario)
        pension = next(d for d in result.deductions if d.code == "pension_personal_account")
        assert pension.label == "個人專戶制"
        assert pension.amount == 3797
