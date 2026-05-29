from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import Tournament, TournamentRegistration, PlayerGameProfile, Team, User
from app.schemas import (
    TournamentCreate, TournamentUpdate, TournamentOut,
    TournamentRegistrationCreate, TournamentRegistrationOut,
)
from app.core.security import get_current_user, require_admin

router = APIRouter(prefix="/api/tournaments", tags=["Tournaments"])


@router.get("/", response_model=List[TournamentOut])
def list_tournaments(db: Session = Depends(get_db)):
    return db.query(Tournament).order_by(Tournament.created_at.desc()).all()


@router.get("/{tournament_id}", response_model=TournamentOut)
def get_tournament(tournament_id: int, db: Session = Depends(get_db)):
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(404, "Tournament not found")
    return t


@router.post("/", response_model=TournamentOut, status_code=201)
def create_tournament(
    payload: TournamentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    t = Tournament(**payload.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.put("/{tournament_id}", response_model=TournamentOut)
def update_tournament(
    tournament_id: int,
    payload: TournamentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(404, "Tournament not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{tournament_id}", status_code=204)
def delete_tournament(
    tournament_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(404, "Tournament not found")
    db.delete(t)
    db.commit()


# ── Registration ───────────────────────────────────────────────────────────────
@router.post("/{tournament_id}/register", response_model=TournamentRegistrationOut, status_code=201)
def register(
    tournament_id: int,
    payload: TournamentRegistrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(404, "Tournament not found")
    if datetime.utcnow() > tournament.registration_deadline:
        raise HTTPException(400, "Registration deadline passed")
    if len(tournament.registrations) >= tournament.max_participants:
        raise HTTPException(400, "Tournament is full")

    # Check game profile
    profile = db.query(PlayerGameProfile).filter(
        PlayerGameProfile.player_id == current_user.id,
        PlayerGameProfile.game_id == tournament.game_id,
    ).first()
    if not profile:
        raise HTTPException(400, "You must have a game profile for this game to register")

    # Check duplicate
    dup = db.query(TournamentRegistration).filter(
        TournamentRegistration.tournament_id == tournament_id,
        TournamentRegistration.player_id == current_user.id,
    ).first()
    if dup:
        raise HTTPException(400, "Already registered")

    reg = TournamentRegistration(
        tournament_id=tournament_id,
        player_id=current_user.id,
        team_id=payload.team_id,
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return reg


@router.delete("/{tournament_id}/register", status_code=204)
def unregister(
    tournament_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reg = db.query(TournamentRegistration).filter(
        TournamentRegistration.tournament_id == tournament_id,
        TournamentRegistration.player_id == current_user.id,
    ).first()
    if not reg:
        raise HTTPException(404, "Not registered")
    db.delete(reg)
    db.commit()


@router.get("/{tournament_id}/registrations", response_model=List[TournamentRegistrationOut])
def list_registrations(tournament_id: int, db: Session = Depends(get_db)):
    return db.query(TournamentRegistration).filter(
        TournamentRegistration.tournament_id == tournament_id
    ).all()