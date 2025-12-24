import pandas as pd

# =========================
# 1. Load the Skills data
# =========================

# IMPORTANT:
# Open the original Skills Excel from O*NET in Excel,
# Save As -> "CSV (Comma delimited) (*.csv)" as: Skills_clean.csv
# Place it in: data/raw/onet_skills/Skills_clean.csv

skills_path = "data/raw/onet_skills/Skills_clean.csv"

# This now reads a normal comma-separated CSV
skills = pd.read_csv(
    skills_path,
    encoding="utf-8",
    low_memory=False
)

# =========================
# 2. Select useful columns
# =========================

# We want the columns that contain:
# - Element Name (skill name)
# - Scale ID
# - Data Value (importance / level)
cols = [
    c
    for c in skills.columns
    if "Element Name" in c or "Scale ID" in c or "Data Value" in c
]

skills_small = skills[cols].dropna()

# Rename generic column names to simple ones
skills_small = skills_small.rename(
    columns={
        skills_small.columns[0]: "skill_name",
        skills_small.columns[1]: "scale_id",
        skills_small.columns[2]: "value",
    }
)

# =========================
# 3. Mock AI substitution model
# =========================

def mock_ai_sub_rate(row):
    """
    Very simple heuristic:
    If the skill name looks repetitive / clerical / reporting,
    give it higher AI substitution rate.
    """
    name = str(row["skill_name"]).lower()
    easy_keywords = [
        "data entry",
        "record",
        "typing",
        "copy",
        "routine",
        "excel",
        "report",
        "filing",
        "clerical",
        "documentation",
        "monitoring"
    ]
    if any(k in name for k in easy_keywords):
        return 0.8  # high risk
    return 0.4      # medium risk

skills_small["ai_substitution_rate"] = skills_small.apply(
    mock_ai_sub_rate, axis=1
)

# half-life: how fast the skill decays (years)
skills_small["half_life_years"] = (
    5 / skills_small["ai_substitution_rate"]
).clip(1, 10).round(1)

# extinction risk over 5 years (0–100)
skills_small["extinction_risk_5yr"] = (
    (skills_small["ai_substitution_rate"] * 0.6 + 0.4) * 100
).round(1)

# =========================
# 4. Save a small sample
# =========================

cleaned = skills_small.head(200)
cleaned.to_csv("data/cleaned_skills.csv", index=False)

print("Saved data/cleaned_skills.csv with", len(cleaned), "rows")
print(cleaned.head(10))
