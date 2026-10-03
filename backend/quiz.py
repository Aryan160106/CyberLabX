from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_user
from db import QuizAnswer, User, get_db

router = APIRouter()

XP_PER_CORRECT = 10

# Source of truth for quiz content. Answers never leave the server
# until a question has been answered.
QUIZZES = {
    "juice-shop": [
        {"id": "js-q1", "question": "What is Broken Access Control?",
         "options": ["A failure to properly restrict what users can access",
                     "A failure to encrypt network traffic",
                     "A database connection error",
                     "A problem with server hardware"],
         "answer": 0,
         "explanation": "Broken Access Control occurs when users can access resources or perform actions beyond their intended permissions."},
        {"id": "js-q2", "question": "Which vulnerability involves injecting malicious input into an application?",
         "options": ["Broken Access Control", "Injection", "Security Misconfiguration", "Cryptographic Failure"],
         "answer": 1,
         "explanation": "Injection vulnerabilities occur when untrusted input is interpreted as part of a command or query."},
        {"id": "js-q3", "question": "What is the main purpose of reconnaissance?",
         "options": ["Delete application data", "Identify useful information about the target",
                     "Change the application's source code", "Restart the Kubernetes cluster"],
         "answer": 1,
         "explanation": "Reconnaissance is the process of gathering information about a target before deeper investigation."},
        {"id": "js-q4", "question": "Why is Juice Shop useful for cybersecurity training?",
         "options": ["It is a production banking application", "It contains deliberately vulnerable functionality",
                     "It automatically fixes vulnerabilities", "It replaces Kubernetes"],
         "answer": 1,
         "explanation": "Juice Shop is intentionally vulnerable so students can safely practice identifying and understanding web security weaknesses."},
    ],
    "dvwa": [
        {"id": "dvwa-q1", "question": "What does SQL Injection target?",
         "options": ["Database queries", "Network cables", "Operating system hardware", "CSS styling"],
         "answer": 0,
         "explanation": "SQL Injection occurs when attacker-controlled input is improperly incorporated into database queries."},
        {"id": "dvwa-q2", "question": "What does XSS allow an attacker to inject?",
         "options": ["Network packets", "Malicious client-side script", "Operating system drivers", "Kubernetes nodes"],
         "answer": 1,
         "explanation": "Cross-Site Scripting allows malicious scripts to execute in a victim's browser."},
    ],
    "metasploitable": [
        {"id": "meta-q1", "question": "What is network reconnaissance used for?",
         "options": ["Discovering hosts and services", "Designing web pages", "Compressing files", "Creating database backups"],
         "answer": 0,
         "explanation": "Network reconnaissance helps identify reachable hosts, open ports, and exposed services."},
        {"id": "meta-q2", "question": "Why are unnecessary exposed services a security concern?",
         "options": ["They increase the attack surface", "They improve encryption",
                     "They reduce network traffic", "They automatically patch vulnerabilities"],
         "answer": 0,
         "explanation": "Every exposed service can potentially introduce additional vulnerabilities or attack paths."},
    ],
}


class AnswerIn(BaseModel):
    question_id: str
    selected: int


@router.get("/labs/{lab_id}/quiz")
def get_quiz(lab_id: str, user: User = Depends(get_current_user)):
    """Questions only. Correct answers are not included."""
    questions = QUIZZES.get(lab_id)
    if not questions:
        raise HTTPException(status_code=404, detail="No quiz for this lab")
    return {
        "lab_id": lab_id,
        "questions": [
            {"id": q["id"], "question": q["question"], "options": q["options"]}
            for q in questions
        ],
    }


@router.post("/labs/{lab_id}/quiz/answer")
def answer_question(
    lab_id: str,
    body: AnswerIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    questions = QUIZZES.get(lab_id)
    q = next((x for x in (questions or []) if x["id"] == body.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Unknown quiz question")
    if not 0 <= body.selected < len(q["options"]):
        raise HTTPException(status_code=400, detail="Invalid option")

    correct = body.selected == q["answer"]
    xp_awarded = 0

    already = db.query(QuizAnswer).filter(
        QuizAnswer.user_id == user.id,
        QuizAnswer.lab_id == lab_id,
        QuizAnswer.question_id == q["id"],
    ).first()

    if not already:  # only the first answer counts for XP
        db.add(QuizAnswer(user_id=user.id, lab_id=lab_id, question_id=q["id"], correct=correct))
        if correct:
            db.query(User).filter(User.id == user.id).update({User.xp: User.xp + XP_PER_CORRECT})
            xp_awarded = XP_PER_CORRECT
        try:
            db.commit()
        except IntegrityError:  # double-click / parallel request
            db.rollback()
            xp_awarded = 0

    xp = db.query(User.xp).filter(User.id == user.id).scalar()
    return {
        "correct": correct,
        "correct_answer": q["answer"],
        "explanation": q["explanation"],
        "xp_awarded": xp_awarded,
        "xp": xp,
    }