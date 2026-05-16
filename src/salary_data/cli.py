"""CLI entry point for salary-data tool."""

import typer

app = typer.Typer(help="台灣公務人員薪資資料處理工具")


@app.command()
def validate() -> None:
    """驗證所有 raw data 可正確載入。"""
    from salary_data.loaders import (
        load_civil_service_insurance,
        load_health_insurance,
        load_pension,
        load_professional_allowances,
        load_salary_grades,
        load_salary_points,
        load_supervisory_allowances,
    )

    print("驗證 salary_points_114…")
    sp = load_salary_points(114)
    print(f"  ✓ {len(sp.points)} 個俸點")

    print("驗證 salary_grades_114…")
    sg = load_salary_grades(114)
    print(f"  ✓ {len(sg.entries)} 筆職等俸級")

    for table_id in (
        "professional_allowance_table_1",
        "professional_allowance_table_2",
        "professional_allowance_table_3",
        "professional_allowance_table_4",
        "professional_allowance_table_7",
        "professional_allowance_table_8",
    ):
        table = load_professional_allowances(table_id)
        print(f"驗證 {table_id}…")
        print(f"  ✓ {len(table.items)} 個職等")

    print("驗證 supervisory_allowance…")
    sa = load_supervisory_allowances()
    print(f"  ✓ {len(sa.items)} 個主管加給級別")

    print("驗證 health_insurance_115…")
    hi = load_health_insurance(115)
    print(f"  ✓ {len(hi.items)} 個級距")

    print("驗證 pension_old…")
    pen = load_pension("old")
    print(f"  ✓ {len(pen.items)} 個俸點")

    print("驗證 civil_service_insurance…")
    ins = load_civil_service_insurance()
    print(f"  ✓ {len(ins.items)} 筆")

    print("\n所有資料驗證通過。")


@app.command()
def build() -> None:
    """清理資料並輸出 JSON 到 data/processed/。"""
    from salary_data.exporters import export_processed_data

    export_processed_data()


@app.command(name="test-case")
def test_case(
    case_id: str = typer.Argument(help="案例代碼，例如 civil-engineer-475"),
) -> None:
    """執行特定案例的薪資試算並顯示結果。"""
    from salary_data.calculators import compare_promotion
    from salary_data.schemas import SalaryScenario

    if case_id == "civil-engineer-475":
        before = SalaryScenario(
            scenario_id="civil_engineer_rank7_point475_old_pension",
            title="土木公務人員薦任七本五俸點475",
            rank=7,
            point=475,
            engineering_extra=True,
            pension_system="old",
            health_insurance_dependents=0,
        )
        after = SalaryScenario(
            scenario_id="civil_engineer_rank8_point475_old_pension",
            title="土木公務人員薦任八本三俸點475",
            rank=8,
            point=475,
            engineering_extra=True,
            pension_system="old",
            health_insurance_dependents=0,
        )
        cmp = compare_promotion(before, after)
        print(f"\n{'=' * 50}")
        print(f"升等前 ({cmp.before.title})")
        print(f"  應領：{cmp.before.gross_total:,}")
        print(f"  扣款：{cmp.before.deduction_total:,}")
        print(f"  實領：{cmp.before.net_total:,}")
        print(f"\n升等後 ({cmp.after.title})")
        print(f"  應領：{cmp.after.gross_total:,}")
        print(f"  扣款：{cmp.after.deduction_total:,}")
        print(f"  實領：{cmp.after.net_total:,}")
        print(f"\n每月增加：{cmp.monthly_diff:,}")
        print(f"年增加：  {cmp.annual_diff:,}")
        print(f"{'=' * 50}\n")
    else:
        print(f"未知案例：{case_id}")
        raise typer.Exit(1)


@app.command(name="export-web")
def export_web() -> None:
    """將 processed JSON 複製到 web/public/data/。"""
    from salary_data.exporters import export_processed_data, export_web_public_data

    export_processed_data()
    export_web_public_data()
