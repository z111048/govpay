"""Export processed data to JSON files for the frontend."""

import json
from datetime import datetime, timezone
from pathlib import Path

from salary_data.loaders import (
    load_civil_service_insurance,
    load_health_insurance,
    load_pension,
    load_professional_allowances,
    load_salary_grades,
    load_salary_points,
    load_supervisory_allowances,
)

PROCESSED_DIR = Path(__file__).parent.parent.parent / "data" / "processed"
WEB_PUBLIC_DIR = Path(__file__).parent.parent.parent / "web" / "public" / "data"
NOW = datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%S+00:00")
TODAY = datetime.now(tz=timezone.utc).strftime("%Y-%m-%d")
PROFESSIONAL_ALLOWANCE_TABLE_IDS = [
    "professional_allowance_table_1",
    "professional_allowance_table_2",
    "professional_allowance_table_3",
    "professional_allowance_table_4",
    "professional_allowance_table_7",
    "professional_allowance_table_8",
]
SOURCE_URLS = {
    "salary_points": "https://www.mocs.gov.tw/",
    "professional_allowances": "https://www.mocs.gov.tw/",
    "health_insurance": "https://www.nhi.gov.tw/",
    "pension": "https://www.fund.gov.tw/",
    "civil_service_insurance": "https://www.bankoftaiwan.com.tw/",
    "salary_grades": "https://www.mocs.gov.tw/",
    "supervisory_allowances": "https://www.mocs.gov.tw/",
}


def _write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  寫出 {path}")


def export_salary_points(year: int = 114) -> dict:  # type: ignore[type-arg]
    table = load_salary_points(year)
    data = {
        "dataset": "salary_points",
        "version": f"{year}.01",
        "effective_date": table.effective_date,
        "source_name": "銓敘部公務人員俸額表",
        "source_url": SOURCE_URLS["salary_points"],
        "last_checked_at": TODAY,
        "generated_at": NOW,
        "year": table.year,
        "points": [{"point": sp.point, "monthly_salary": sp.monthly_salary} for sp in table.points],
    }
    _write_json(PROCESSED_DIR / "salary_points.json", data)
    return data


def export_salary_grades(year: int = 114) -> dict:  # type: ignore[type-arg]
    table = load_salary_grades(year)
    data = {
        "dataset": "salary_grades",
        "version": f"{year}.01",
        "effective_date": table.effective_date,
        "source_name": "銓敘部公務人員職等俸級表",
        "source_url": SOURCE_URLS["salary_grades"],
        "last_checked_at": TODAY,
        "generated_at": NOW,
        "year": table.year,
        "entries": [
            {
                "rank": entry.rank,
                "rank_name": entry.rank_name,
                "grade_type": entry.grade_type,
                "level": entry.level,
                "point": entry.point,
            }
            for entry in table.entries
        ],
    }
    _write_json(PROCESSED_DIR / "salary_grades.json", data)
    return data


def export_professional_allowances() -> dict:  # type: ignore[type-arg]
    tables = [load_professional_allowances(table_id) for table_id in PROFESSIONAL_ALLOWANCE_TABLE_IDS]
    data = {
        "dataset": "professional_allowances",
        "version": "114.01",
        "effective_date": "2025-01-01",
        "source_name": "銓敘部公務人員專業加給表",
        "source_url": SOURCE_URLS["professional_allowances"],
        "last_checked_at": TODAY,
        "generated_at": NOW,
        "tables": [
            {
                "table_id": table.table_id,
                "name": table.name,
                "items": [
                    {"rank": item.rank, "monthly_allowance": item.monthly_allowance}
                    for item in table.items
                ],
                "extra_allowances": [
                    {"code": ea.code, "name": ea.name, "amount": ea.amount}
                    for ea in table.extra_allowances
                ],
            }
            for table in tables
        ],
    }
    _write_json(PROCESSED_DIR / "professional_allowances.json", data)
    return data


def export_supervisory_allowances() -> dict:  # type: ignore[type-arg]
    table = load_supervisory_allowances()
    data = {
        "dataset": "supervisory_allowances",
        "version": "114.01",
        "effective_date": table.effective_date,
        "source_name": "銓敘部主管職務加給表",
        "source_url": SOURCE_URLS["supervisory_allowances"],
        "last_checked_at": TODAY,
        "generated_at": NOW,
        "items": [
            {
                "category_id": item.category_id,
                "category_name": item.category_name,
                "min_rank": item.min_rank,
                "max_rank": item.max_rank,
                "monthly_allowance": item.monthly_allowance,
                "note": item.note,
            }
            for item in table.items
        ],
    }
    _write_json(PROCESSED_DIR / "supervisory_allowances.json", data)
    return data


def export_health_insurance(year: int = 115) -> dict:  # type: ignore[type-arg]
    table = load_health_insurance(year)
    data = {
        "dataset": "health_insurance",
        "version": f"{year}.01",
        "effective_date": table.effective_date,
        "source_name": "衛生福利部中央健康保險署投保金額分級表",
        "source_url": SOURCE_URLS["health_insurance"],
        "last_checked_at": TODAY,
        "generated_at": NOW,
        "year": table.year,
        "items": [
            {
                "range_min": b.range_min,
                "range_max": b.range_max,
                "insured_salary": b.insured_salary,
                "self_payment": {
                    "dependents_0": b.self_payment.dependents_0,
                    "dependents_1": b.self_payment.dependents_1,
                    "dependents_2": b.self_payment.dependents_2,
                    "dependents_3": b.self_payment.dependents_3,
                    "dependents_4": b.self_payment.dependents_4,
                    "dependents_5": b.self_payment.dependents_5,
                    "dependents_6": b.self_payment.dependents_6,
                },
            }
            for b in table.items
        ],
    }
    _write_json(PROCESSED_DIR / "health_insurance.json", data)
    return data


def export_pension(system: str = "old") -> dict:  # type: ignore[type-arg]
    table = load_pension(system)
    data = {
        "dataset": "pension",
        "version": "114.01",
        "effective_date": table.effective_date,
        "source_name": "公務人員退休撫卹基金管理委員會",
        "source_url": SOURCE_URLS["pension"],
        "last_checked_at": TODAY,
        "generated_at": NOW,
        "system": table.system,
        "items": [
            {"point": item.point, "base_salary": item.base_salary, "self_payment": item.self_payment}
            for item in table.items
        ],
    }
    _write_json(PROCESSED_DIR / "pension.json", data)
    return data


def export_civil_service_insurance() -> dict:  # type: ignore[type-arg]
    table = load_civil_service_insurance()
    data = {
        "dataset": "civil_service_insurance",
        "version": "114.01",
        "effective_date": table.effective_date,
        "source_name": "臺灣銀行公教保險部公保費率表",
        "source_url": SOURCE_URLS["civil_service_insurance"],
        "last_checked_at": TODAY,
        "generated_at": NOW,
        "items": [
            {
                "base_salary": item.base_salary,
                "rate_basis_points": item.rate_basis_points,
                "self_pay_ratio_basis_points": item.self_pay_ratio_basis_points,
                "self_payment": item.self_payment,
            }
            for item in table.items
        ],
    }
    _write_json(PROCESSED_DIR / "insurance.json", data)
    return data


def export_metadata(datasets: list[dict]) -> dict:  # type: ignore[type-arg]
    data = {
        "generated_at": NOW,
        "datasets": [
            {
                "dataset": d.get("dataset"),
                "version": d.get("version"),
                "effective_date": d.get("effective_date"),
                "source_name": d.get("source_name"),
                "source_url": d.get("source_url", ""),
                "last_checked_at": d.get("last_checked_at"),
            }
            for d in datasets
        ],
    }
    _write_json(PROCESSED_DIR / "metadata.json", data)
    return data


def export_processed_data() -> None:
    """匯出所有資料到 data/processed/。"""
    print("匯出處理後資料…")
    datasets = [
        export_salary_points(),
        export_salary_grades(),
        export_professional_allowances(),
        export_supervisory_allowances(),
        export_health_insurance(),
        export_pension("old"),
        export_civil_service_insurance(),
    ]
    export_metadata(datasets)
    print("完成。")


def export_web_public_data() -> None:
    """將 data/processed/ 複製到 web/public/data/。"""
    import shutil

    WEB_PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    for file_path in PROCESSED_DIR.glob("*.json"):
        dest = WEB_PUBLIC_DIR / file_path.name
        shutil.copy2(file_path, dest)
        print(f"  複製 {file_path.name} → web/public/data/")
    print("完成。")
