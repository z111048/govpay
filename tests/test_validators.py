"""Tests for data loaders and validators."""

from salary_data.loaders import (
    load_civil_service_insurance,
    load_health_insurance,
    load_pension,
    load_professional_allowances,
    load_salary_grades,
    load_salary_points,
    load_supervisory_allowances,
)


class TestSalaryPoints:
    def test_load(self) -> None:
        table = load_salary_points(114)
        assert table.year == 114
        assert len(table.points) > 0

    def test_point_475(self) -> None:
        table = load_salary_points(114)
        p = next(sp for sp in table.points if sp.point == 475)
        assert p.monthly_salary == 36160

    def test_point_ordering_is_consistent(self) -> None:
        table = load_salary_points(114)
        salaries = {sp.point: sp.monthly_salary for sp in table.points}
        assert salaries[460] < salaries[475]


class TestSalaryGrades:
    def test_load(self) -> None:
        table = load_salary_grades(114)
        assert table.year == 114
        assert len(table.entries) > 0

    def test_rank7_basic_level5(self) -> None:
        table = load_salary_grades(114)
        entry = next(
            e for e in table.entries if e.rank == 7 and e.grade_type == "本俸" and e.level == 5
        )
        assert entry.point == 475

    def test_rank8_basic_level3(self) -> None:
        table = load_salary_grades(114)
        entry = next(
            e for e in table.entries if e.rank == 8 and e.grade_type == "本俸" and e.level == 3
        )
        assert entry.point == 475

    def test_rank8_basic_level4(self) -> None:
        table = load_salary_grades(114)
        entry = next(
            e for e in table.entries if e.rank == 8 and e.grade_type == "本俸" and e.level == 4
        )
        assert entry.point == 490


class TestProfessionalAllowances:
    def test_load(self) -> None:
        table = load_professional_allowances()
        assert table.table_id == "professional_allowance_table_7"
        assert len(table.items) > 0

    def test_rank7(self) -> None:
        table = load_professional_allowances()
        item = next(i for i in table.items if i.rank == 7)
        assert item.monthly_allowance == 28730

    def test_rank8(self) -> None:
        table = load_professional_allowances()
        item = next(i for i in table.items if i.rank == 8)
        assert item.monthly_allowance == 31130

    def test_table4_rank8(self) -> None:
        table = load_professional_allowances("professional_allowance_table_4")
        item = next(i for i in table.items if i.rank == 8)
        assert item.monthly_allowance == 22400

    def test_engineering_extra(self) -> None:
        table = load_professional_allowances()
        ea = next(e for e in table.extra_allowances if e.code == "engineering_extra")
        assert ea.amount == 3000


class TestSupervisoryAllowances:
    def test_load(self) -> None:
        table = load_supervisory_allowances()
        assert len(table.items) == 5

    def test_rank8_category(self) -> None:
        table = load_supervisory_allowances()
        item = next(i for i in table.items if i.category_id == "supervisor_section_senior")
        assert item.monthly_allowance == 3600
        assert item.min_rank == 8
        assert item.max_rank == 9


class TestHealthInsurance:
    def test_load(self) -> None:
        table = load_health_insurance(115)
        assert table.year == 115
        assert len(table.items) > 0

    def test_no_overlapping_ranges(self) -> None:
        table = load_health_insurance(115)
        ranges = [(b.range_min, b.range_max) for b in table.items]
        for i, (lo1, hi1) in enumerate(ranges):
            for j, (lo2, hi2) in enumerate(ranges):
                if i != j:
                    assert hi1 < lo2 or hi2 < lo1, f"範圍重疊: {ranges[i]} vs {ranges[j]}"

    def test_bracket_for_67890(self) -> None:
        table = load_health_insurance(115)
        bracket = next(b for b in table.items if b.range_min <= 67890 <= b.range_max)
        assert bracket.insured_salary == 69800
        assert bracket.self_payment.dependents_0 == 1083

    def test_bracket_for_70290(self) -> None:
        table = load_health_insurance(115)
        bracket = next(b for b in table.items if b.range_min <= 70290 <= b.range_max)
        assert bracket.insured_salary == 72800
        assert bracket.self_payment.dependents_0 == 1129


class TestPension:
    def test_load(self) -> None:
        table = load_pension("old")
        assert table.system == "old"
        assert len(table.items) > 0

    def test_point_475_old(self) -> None:
        table = load_pension("old")
        item = next(i for i in table.items if i.point == 475)
        assert item.self_payment == 3797
        assert item.base_salary == 36160


class TestCivilServiceInsurance:
    def test_load(self) -> None:
        table = load_civil_service_insurance()
        assert len(table.items) > 0

    def test_base_36160(self) -> None:
        table = load_civil_service_insurance()
        item = next(i for i in table.items if i.base_salary == 36160)
        assert item.self_payment == 914
        assert item.rate_basis_points == 722
