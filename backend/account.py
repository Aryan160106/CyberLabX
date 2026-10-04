from datetime import datetime, timezone

from argon2.exceptions import VerifyMismatchError
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth import get_current_user, hasher
from db import FlagCapture, LabSession, QuizAnswer, User, get_db

router = APIRouter(prefix="/account", tags=["account"])


class ProfileIn(BaseModel):
    display_name: str = Field(min_length=2, max_length=80)


class PasswordIn(BaseModel):
    current_password: str = Field(max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class DeleteIn(BaseModel):
    password: str = Field(max_length=128)


def _check_password(user: User, password: str) -> None:
    # 400, not 401: the frontend logs the user out on any 401.
    try:
        hasher.verify(user.password_hash, password)
    except VerifyMismatchError:
        raise HTTPException(status_code=400, detail="Incorrect password")


@router.patch("/profile")
def update_profile(body: ProfileIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.display_name = body.display_name.strip()
    db.commit()
    return {"display_name": user.display_name}


@router.post("/password")
def change_password(body: PasswordIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _check_password(user, body.current_password)
    user.password_hash = hasher.hash(body.new_password)
    db.commit()
    return {"changed": True}


@router.post("/delete")
def delete_account(body: DeleteIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _check_password(user, body.password)
    now = datetime.now(timezone.utc)
    # Expire active labs now so the reaper tears them down, then detach all sessions.
    db.query(LabSession).filter(
        LabSession.user_id == user.id, LabSession.ended_at.is_(None)
    ).update({LabSession.expires_at: now})
    db.query(LabSession).filter(LabSession.user_id == user.id).update({LabSession.user_id: None})
    db.query(QuizAnswer).filter(QuizAnswer.user_id == user.id).delete()
    db.query(FlagCapture).filter(FlagCapture.user_id == user.id).delete()
    db.delete(user)
    db.commit()
    return {"deleted": True}