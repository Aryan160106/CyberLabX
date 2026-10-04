from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_current_user
from db import FlagCapture, LabSession, QuizAnswer, User, get_db
from missions import MISSIONS
from quiz import QUIZZES, XP_PER_CORRECT

router = APIRouter()

# Flip "available" to True when a lab's chart is built (mirrors frontend labData.ts).
LABS = {
    "juice-shop": {"name": "OWASP Juice Shop", "category": "Web Security", "available": True},
    "dvwa": {"name": "DVWA", "category": "Web Security", "available": False},
    "metasploitable": {"name": "Metasploitable", "category": "Network Security", "available": False},
}


@router.get("/me/progress")
def my_progress(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    answers = db.query(QuizAnswer).filter(QuizAnswer.user_id == user.id).all()
    captures = db.query(FlagCapture).filter(FlagCapture.user_id == user.id).all()
    launched = {
        r[0] for r in db.query(LabSession.lab_type).filter(LabSession.user_id == user.id).distinct().all()
    }
    captured_ids = {c.mission_id for c in captures}

    labs_out = []
    skill_acc: dict[str, list[int]] = {}
    for lab_id, meta in LABS.items():
        if not meta["available"]:
            continue
        questions = QUIZZES.get(lab_id, [])
        mine = [a for a in answers if a.lab_id == lab_id]
        correct = sum(1 for a in mine if a.correct)
        mission = MISSIONS.get(lab_id)
        flag_done = bool(mission and mission["id"] in captured_ids)

        stages = [
            {"key": "quiz", "label": "Quiz", "done": bool(questions) and len(mine) >= len(questions)},
            {"key": "practice", "label": "Practice", "done": lab_id in launched},
        ]
        if mission:
            stages.append({"key": "evaluate", "label": "Evaluate", "done": flag_done})

        earned = correct * XP_PER_CORRECT + (mission["xp"] if flag_done else 0)
        max_xp = len(questions) * XP_PER_CORRECT + (mission["xp"] if mission else 0)
        acc = skill_acc.setdefault(meta["category"], [0, 0])
        acc[0] += earned
        acc[1] += max_xp

        done_count = sum(1 for s in stages if s["done"])
        labs_out.append({
            "lab_id": lab_id,
            "name": meta["name"],
            "category": meta["category"],
            "stages": stages,
            "progress": round(100 * done_count / len(stages)),
            "quiz": {"answered": len(mine), "total": len(questions), "correct": correct},
        })

    incomplete = [l for l in labs_out if l["progress"] < 100]
    current = max(incomplete, key=lambda l: l["progress"]) if incomplete else (labs_out[0] if labs_out else None)
    recommended = None
    if incomplete:
        low = min(incomplete, key=lambda l: l["progress"])
        recommended = {
            "lab_id": low["lab_id"],
            "name": low["name"],
            "reason": f"Lowest progress ({low['progress']}%) among your available labs",
        }

    skills = [
        {"category": c, "earned": v[0], "max": v[1], "percent": round(100 * v[0] / v[1]) if v[1] else 0}
        for c, v in skill_acc.items()
    ]

    mission_lab = {m["id"]: LABS[l]["name"] for l, m in MISSIONS.items()}
    events = [
        {
            "title": "Quiz answer correct" if a.correct else "Quiz answer incorrect",
            "detail": LABS.get(a.lab_id, {}).get("name", a.lab_id),
            "at": a.created_at.isoformat(),
        }
        for a in answers
    ] + [
        {"title": "Flag captured", "detail": mission_lab.get(c.mission_id, c.mission_id), "at": c.created_at.isoformat()}
        for c in captures
    ]
    events.sort(key=lambda e: e["at"], reverse=True)

    return {
        "xp": user.xp,
        "labs": labs_out,
        "current": current,
        "skills": skills,
        "activity": events[:8],
        "recommended": recommended,
    }