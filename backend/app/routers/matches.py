from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Match, MatchResult, PlayerStats, User
from app.schemas import (
    MatchCreate, MatchUpdate, MatchOut,
    MatchResultCreate, MatchResultOut,
    PlayerStatsCreate, PlayerStatsOut,
)
from app.core.security import get_current_user, require_admin

router = APIRouter(prefix="/api/matches", tags=["Matches"])


@router.get("/", response_model=List[MatchOut])
def list_matches(
    tournament_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Match)
    if tournament_id:
        q = q.filter(Match.tournament_id == tournament_id)
    if status:
        q = q.filter(Match.status == status)
    return q.order_by(Match.match_date).all()


@router.get("/{match_id}", response_model=MatchOut)
def get_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(404, "Match not found")
    return match


@router.post("/", response_model=MatchOut, status_code=201)
def create_match(
    payload: MatchCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    match = Match(**payload.model_dump())
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


@router.put("/{match_id}", response_model=MatchOut)
def update_match(
    match_id: int,
    payload: MatchUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(404, "Match not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(match, k, v)
    db.commit()
    db.refresh(match)
    return match


@router.delete("/{match_id}", status_code=204)
def delete_match(
    match_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(404, "Match not found")
    db.delete(match)
    db.commit()


# ── Results ────────────────────────────────────────────────────────────────────
@router.post("/{match_id}/result", response_model=MatchResultOut, status_code=201)
def set_result(
    match_id: int,
    payload: MatchResultCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(404, "Match not found")
    if match.result:
        raise HTTPException(400, "Result already set. Use PUT to update.")
    result = MatchResult(match_id=match_id, **payload.model_dump())
    match.status = "completed"
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


@router.put("/{match_id}/result", response_model=MatchResultOut)
def update_result(
    match_id: int,
    payload: MatchResultCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match or not match.result:
        raise HTTPException(404, "Result not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(match.result, k, v)
    db.commit()
    db.refresh(match.result)
    return match.result


# ── Player Stats ───────────────────────────────────────────────────────────────
@router.post("/{match_id}/stats", response_model=PlayerStatsOut, status_code=201)
def add_player_stats(
    match_id: int,
    payload: PlayerStatsCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(404, "Match not found")
    stats = PlayerStats(match_id=match_id, **payload.model_dump())
    db.add(stats)
    db.commit()
    db.refresh(stats)
    return stats


@router.get("/{match_id}/stats", response_model=List[PlayerStatsOut])
def get_stats(match_id: int, db: Session = Depends(get_db)):
    return db.query(PlayerStats).filter(PlayerStats.match_id == match_id).all()