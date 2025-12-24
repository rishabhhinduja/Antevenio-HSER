from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np

app = FastAPI(title="Antevenio HSER API")

# CORS so the Next.js frontend can call this API from localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Load data once at startup
# =========================

DATA_PATH = "data/cleaned_skills.csv"
df = pd.read_csv(DATA_PATH)

# -------------------------
# Categorize skills (simple heuristic)
# -------------------------

def categorize_skill(name: str) -> str:
    n = str(name).lower()
    if any(k in n for k in ["writing", "reading", "mathematics", "reasoning", "analysis"]):
        return "Cognitive"
    if any(k in n for k in ["speaking", "listening", "negotiation", "social"]):
        return "Social"
    if any(k in n for k in ["programming", "technology", "systems", "operations"]):
        return "Technical"
    if any(k in n for k in ["clerical", "record", "typing", "data", "copy", "routine"]):
        return "Routine / Clerical"
    return "Other"

df["category"] = df["skill_name"].apply(categorize_skill)

# =========================
# Core endpoints
# =========================

@app.get("/skills")
def list_skills(limit: int = 20):
    """
    Simple list endpoint for testing.
    """
    return df.head(limit).to_dict(orient="records")


@app.get("/skill")
def get_skill(name: str):
    """
    Example: /skill?name=Writing
    Returns extinction info for matching skills.
    """
    mask = df["skill_name"].str.contains(name, case=False, na=False)
    results = df[mask]

    if results.empty:
        raise HTTPException(status_code=404, detail="Skill not found")

    return {
        "query": name,
        "count": int(len(results)),
        "skills": results.head(5).to_dict(orient="records"),
    }


@app.get("/high-risk")
def high_risk(limit: int = 10):
    """
    Top skills by extinction risk (5-year).
    """
    top = df.sort_values("extinction_risk_5yr", ascending=False).head(limit)
    return top.to_dict(orient="records")


@app.get("/low-risk")
def low_risk(limit: int = 10):
    """
    Lowest-risk (most resilient) skills.
    """
    bottom = df.sort_values("extinction_risk_5yr", ascending=True).head(limit)
    return bottom.to_dict(orient="records")


@app.get("/category-stats")
def category_stats():
    """
    Average extinction risk by skill category.
    """
    grp = (
        df.groupby("category")["extinction_risk_5yr"]
        .agg(["mean", "count"])
        .reset_index()
        .sort_values("mean", ascending=False)
    )
    # Rename columns for nicer JSON keys
    grp = grp.rename(columns={"mean": "mean", "count": "count"})
    return grp.to_dict(orient="records")
