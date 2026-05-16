"""Load raw CSV data into pydantic models."""

from pathlib import Path

import pandas as pd

from salary_data.schemas import (
    CivilServiceInsurance,
    CivilServiceInsuranceTable,
    ExtraAllowance,
    HealthInsuranceBracket,
    HealthInsuranceSelfPayment,
    HealthInsuranceTable,
    PensionContribution,
    PensionTable,
    ProfessionalAllowanceItem,
    ProfessionalAllowanceTable,
    SalaryGradeEntry,
    SalaryGradeTable,
    SalaryPoint,
    SalaryPointTable,
    SupervisoryAllowanceItem,
    SupervisoryAllowanceTable,
)

RAW_DIR = Path(__file__).parent.parent.parent / "data" / "raw"
DEFAULT_EFFECTIVE_DATE = "2025-01-01"


def load_salary_points(year: int = 114) -> SalaryPointTable:
    path = RAW_DIR / f"salary_points_{year}.csv"
    df = pd.read_csv(path, comment="#")
    first = df.iloc[0]
    points = [
        SalaryPoint(
            year=int(row["year"]),
            effective_date=str(row["effective_date"]),
            point=int(row["point"]),
            monthly_salary=int(row["monthly_salary"]),
        )
        for _, row in df.iterrows()
    ]
    return SalaryPointTable(
        year=int(first["year"]),
        effective_date=str(first["effective_date"]),
        points=points,
    )


def load_salary_grades(year: int = 114) -> SalaryGradeTable:
    path = RAW_DIR / f"salary_grades_{year}.csv"
    df = pd.read_csv(path, comment="#")
    entries = [
        SalaryGradeEntry(
            rank=int(row["rank"]),
            rank_name=str(row["rank_name"]),
            grade_type=str(row["grade_type"]),
            level=int(row["level"]),
            point=int(row["point"]),
        )
        for _, row in df.iterrows()
    ]
    return SalaryGradeTable(year=year, effective_date=DEFAULT_EFFECTIVE_DATE, entries=entries)


def load_professional_allowances(
    table_id: str = "professional_allowance_table_7",
) -> ProfessionalAllowanceTable:
    path = RAW_DIR / f"{table_id}.csv"
    df = pd.read_csv(path, comment="#")
    first = df.iloc[0]
    items = [
        ProfessionalAllowanceItem(
            rank=int(row["rank"]),
            monthly_allowance=int(row["monthly_allowance"]),
        )
        for _, row in df.iterrows()
    ]
    return ProfessionalAllowanceTable(
        table_id=str(first["table_id"]),
        name=str(first["name"]),
        items=items,
        extra_allowances=[
            ExtraAllowance(
                code="engineering_extra",
                name="工程機關或工程單位實際從事工程業務另增支",
                amount=3000,
            )
        ],
    )


def load_supervisory_allowances() -> SupervisoryAllowanceTable:
    path = RAW_DIR / "supervisory_allowance.csv"
    df = pd.read_csv(path, comment="#")
    items = [
        SupervisoryAllowanceItem(
            category_id=str(row["category_id"]),
            category_name=str(row["category_name"]),
            min_rank=int(row["min_rank"]),
            max_rank=int(row["max_rank"]),
            monthly_allowance=int(row["monthly_allowance"]),
            note=str(row["note"]),
        )
        for _, row in df.iterrows()
    ]
    return SupervisoryAllowanceTable(effective_date=DEFAULT_EFFECTIVE_DATE, items=items)


def load_health_insurance(year: int = 115) -> HealthInsuranceTable:
    path = RAW_DIR / f"health_insurance_{year}.csv"
    df = pd.read_csv(path, comment="#")
    first = df.iloc[0]
    items = [
        HealthInsuranceBracket(
            range_min=int(row["range_min"]),
            range_max=int(row["range_max"]),
            insured_salary=int(row["insured_salary"]),
            self_payment=HealthInsuranceSelfPayment(
                dependents_0=int(row["self_payment_0"]),
                dependents_1=int(row["self_payment_1"]),
                dependents_2=int(row["self_payment_2"]),
                dependents_3=int(row["self_payment_3"]),
                dependents_4=int(row["self_payment_4"]),
                dependents_5=int(row["self_payment_5"]),
                dependents_6=int(row["self_payment_6"]),
            ),
        )
        for _, row in df.iterrows()
    ]
    return HealthInsuranceTable(
        year=int(first["year"]),
        effective_date=str(first["effective_date"]),
        items=items,
    )


def load_pension(system: str = "old") -> PensionTable:
    path = RAW_DIR / f"pension_{system}.csv"
    df = pd.read_csv(path, comment="#")
    first = df.iloc[0]
    items = [
        PensionContribution(
            system=str(row["system"]),  # type: ignore[arg-type]
            point=int(row["point"]),
            base_salary=int(row["base_salary"]),
            self_payment=int(row["self_payment"]),
        )
        for _, row in df.iterrows()
    ]
    return PensionTable(
        system=str(first["system"]),  # type: ignore[arg-type]
        effective_date=str(first["effective_date"]),
        items=items,
    )


def load_civil_service_insurance() -> CivilServiceInsuranceTable:
    path = RAW_DIR / "civil_service_insurance.csv"
    df = pd.read_csv(path, comment="#")
    first = df.iloc[0]
    items = [
        CivilServiceInsurance(
            base_salary=int(row["base_salary"]),
            rate_basis_points=int(row["rate_basis_points"]),
            self_pay_ratio_basis_points=int(row["self_pay_ratio_basis_points"]),
            self_payment=int(row["self_payment"]),
        )
        for _, row in df.iterrows()
    ]
    return CivilServiceInsuranceTable(
        effective_date=str(first["effective_date"]),
        items=items,
    )
