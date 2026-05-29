from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app.models import User, Game, PlayerGameProfile
from app.schemas import (
    GameProfileCreate,
    GameProfileOut,
    GameProfileUpdate,
    UserOut,
    UserUpdate,
    PlayerStatsSummary,
    TournamentHistoryItem,
    MatchHistoryItem,
    TeamMembershipOut,
)
from app.core.security import get_current_user
from app.services.profile import (
    compute_player_stats,
    get_current_team,
    is_team_captain,
    get_match_history,
    get_tournament_history,
)

router = APIRouter(prefix="/api/players", tags=["Players"])


# ── Current user (must be before /{player_id}) ───────────────────────────────
@router.get("/me", response_model=UserOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.put("/me", response_model=UserOut)
def update_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude_none=True)
    if "username" in data:
        existing = db.query(User).filter(
            User.username == data["username"],
            User.id != current_user.id,
        ).first()
        if existing:
            raise HTTPException(400, "Username already taken")
    for key, val in data.items():
        setattr(current_user, key, val)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/me/stats", response_model=PlayerStatsSummary)
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return compute_player_stats(db, current_user)


@router.get("/me/tournament-history", response_model=List[TournamentHistoryItem])
def get_my_tournament_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_tournament_history(db, current_user)


@router.get("/me/match-history", response_model=List[MatchHistoryItem])
def get_my_match_history(
    limit: Optional[int] = Query(None, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_match_history(db, current_user, limit=limit)


@router.get("/me/team", response_model=Optional[TeamMembershipOut])
def get_my_team(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = get_current_team(db, current_user)
    if not team:
        return None
    captain_name = team.captain.username if team.captain else None
    return TeamMembershipOut(
        team_id=team.id,
        team_name=team.name,
        logo_url=team.logo_url,
        game_name=team.game.name if team.game else None,
        captain_name=captain_name,
        is_captain=is_team_captain(team, current_user.id),
    )


# ── Game Profiles ──────────────────────────────────────────────────────────────
@router.get("/me/game-profiles", response_model=List[GameProfileOut])
def get_my_profiles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(PlayerGameProfile)
        .options(joinedload(PlayerGameProfile.game))
        .filter(PlayerGameProfile.player_id == current_user.id)
        .all()
    )


@router.post("/me/game-profiles", response_model=GameProfileOut, status_code=201)
def add_game_profile(
    payload: GameProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    game = db.query(Game).filter(Game.id == payload.game_id).first()
    if not game:
        raise HTTPException(404, "Game not found")
    if game.requires_tag and not payload.tag:
        raise HTTPException(400, f"{game.name} requires a tag")
    if not payload.in_game_name or len(payload.in_game_name.strip()) < 2:
        raise HTTPException(400, "In-game name must be at least 2 characters")
    existing = db.query(PlayerGameProfile).filter(
        PlayerGameProfile.player_id == current_user.id,
        PlayerGameProfile.game_id == payload.game_id,
    ).first()
    if existing:
        raise HTTPException(400, "Profile for this game already exists")
    profile = PlayerGameProfile(
        player_id=current_user.id,
        game_id=payload.game_id,
        in_game_name=payload.in_game_name.strip(),
        tag=payload.tag,
        rank=payload.rank,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    profile = (
        db.query(PlayerGameProfile)
        .options(joinedload(PlayerGameProfile.game))
        .filter(PlayerGameProfile.id == profile.id)
        .first()
    )
    return profile


@router.put("/me/game-profiles/{profile_id}", response_model=GameProfileOut)
def update_game_profile(
    profile_id: int,
    payload: GameProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(PlayerGameProfile).filter(
        PlayerGameProfile.id == profile_id,
        PlayerGameProfile.player_id == current_user.id,
    ).first()
    if not profile:
        raise HTTPException(404, "Profile not found")
    data = payload.model_dump(exclude_none=True)
    if "in_game_name" in data and len(data["in_game_name"].strip()) < 2:
        raise HTTPException(400, "In-game name must be at least 2 characters")
    for key, val in data.items():
        setattr(profile, key, val.strip() if isinstance(val, str) else val)
    db.commit()
    profile = (
        db.query(PlayerGameProfile)
        .options(joinedload(PlayerGameProfile.game))
        .filter(PlayerGameProfile.id == profile_id)
        .first()
    )
    return profile


@router.delete("/me/game-profiles/{profile_id}", status_code=204)
def delete_game_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(PlayerGameProfile).filter(
        PlayerGameProfile.id == profile_id,
        PlayerGameProfile.player_id == current_user.id,
    ).first()
    if not profile:
        raise HTTPException(404, "Profile not found")
    db.delete(profile)
    db.commit()


# ── Public player routes ───────────────────────────────────────────────────────
@router.get("/", response_model=List[UserOut])
def list_players(db: Session = Depends(get_db)):
    return db.query(User).filter(User.role == "player").all()


@router.get("/{player_id}", response_model=UserOut)
def get_player(player_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == player_id).first()
    if not user:
        raise HTTPException(404, "Player not found")
    return user


@router.get("/{player_id}/game-profiles", response_model=List[GameProfileOut])
def get_player_profiles(player_id: int, db: Session = Depends(get_db)):
    return (
        db.query(PlayerGameProfile)
        .options(joinedload(PlayerGameProfile.game))
        .filter(PlayerGameProfile.player_id == player_id)
        .all()
    )
