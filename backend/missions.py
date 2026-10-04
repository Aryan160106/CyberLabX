import hashlib
import hmac

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_user
from db import FlagCapture, LabSession, User, get_db

router = APIRouter()

# One mission per lab for now. "challenge" must match the challenge name in Juice Shop.
MISSIONS = {
    "juice-shop": {"id": "js-m1", "challenge": "Score Board", "xp": 50},
}


class FlagIn(BaseModel):
    flag: str = Field(max_length=200)


def expected_flag(ctf_key: str, challenge_name: str) -> str:
    """Juice Shop CTF flag: HMAC_SHA1(ctfKey, challenge.name), hex-encoded."""
    return hmac.new(ctf_key.encode(), challenge_name.encode(), hashlib.sha1).hexdigest()


@router.post("/labs/me/flag")
def submit_flag(
    body: FlagIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(LabSession).filter(
        LabSession.user_id == user.id,
        LabSession.ended_at.is_(None),
    ).first()
    if not session or not session.flag:
        raise HTTPException(status_code=404, detail="Launch a lab before submitting a flag")

    mission = MISSIONS.get(session.lab_type)
    if not mission:
        raise HTTPException(status_code=400, detail="This lab has no flag mission yet")

    expected = expected_flag(session.flag, mission["challenge"])
    correct = hmac.compare_digest(body.flag.strip().lower(), expected)
    xp_awarded = 0

    if correct:
        already = db.query(FlagCapture).filter(
            FlagCapture.user_id == user.id,
            FlagCapture.mission_id == mission["id"],
        ).first()
        if not already:
            db.add(FlagCapture(user_id=user.id, mission_id=mission["id"]))
            db.query(User).filter(User.id == user.id).update({User.xp: User.xp + mission["xp"]})
            try:
                db.commit()
                xp_awarded = mission["xp"]
            except IntegrityError:
                db.rollback()

    xp = db.query(User.xp).filter(User.id == user.id).scalar()
    return {"correct": correct, "xp_awarded": xp_awarded, "xp": xp}