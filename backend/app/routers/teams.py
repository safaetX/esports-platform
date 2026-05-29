from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Team, TeamMember, TeamInvite, PlayerGameProfile, User
from app.schemas import TeamCreate, TeamOut, TeamInviteCreate, TeamInviteOut, InviteResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/api/teams", tags=["Teams"])


@router.get("/", response_model=List[TeamOut])
def list_teams(db: Session = Depends(get_db)):
    return db.query(Team).all()


@router.get("/{team_id}", response_model=TeamOut)
def get_team(team_id: int, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(404, "Team not found")
    return team


@router.post("/", response_model=TeamOut, status_code=201)
def create_team(
    payload: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "player":
        raise HTTPException(403, "Only players can create teams")
    # Check player has game profile
    profile = db.query(PlayerGameProfile).filter(
        PlayerGameProfile.player_id == current_user.id,
        PlayerGameProfile.game_id == payload.game_id,
    ).first()
    if not profile:
        raise HTTPException(400, "You must have a game profile for this game before creating a team")
    if db.query(Team).filter(Team.name == payload.name).first():
        raise HTTPException(400, "Team name already taken")
    team = Team(name=payload.name, game_id=payload.game_id, captain_id=current_user.id, logo_url=payload.logo_url)
    db.add(team)
    db.flush()
    member = TeamMember(team_id=team.id, player_id=current_user.id, role="captain")
    db.add(member)
    db.commit()
    db.refresh(team)
    return team


@router.delete("/{team_id}", status_code=204)
def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(404, "Team not found")
    if team.captain_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not authorized")
    db.delete(team)
    db.commit()


# ── Invites ────────────────────────────────────────────────────────────────────
@router.post("/{team_id}/invites", response_model=TeamInviteOut, status_code=201)
def send_invite(
    team_id: int,
    payload: TeamInviteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(404, "Team not found")
    if team.captain_id != current_user.id:
        raise HTTPException(403, "Only captain can invite players")

    # Check team size
    from app.models import Game
    game = db.query(Game).filter(Game.id == team.game_id).first()
    current_count = db.query(TeamMember).filter(TeamMember.team_id == team_id).count()
    if current_count >= game.team_size:
        raise HTTPException(400, "Team is full")

    invitee = db.query(User).filter(User.id == payload.invitee_id).first()
    if not invitee:
        raise HTTPException(404, "Player not found")

    # Check game profile
    profile = db.query(PlayerGameProfile).filter(
        PlayerGameProfile.player_id == payload.invitee_id,
        PlayerGameProfile.game_id == team.game_id,
    ).first()
    if not profile:
        raise HTTPException(400, "Player has no game profile for this game")

    # Check already member
    existing_member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.player_id == payload.invitee_id,
    ).first()
    if existing_member:
        raise HTTPException(400, "Player is already in the team")

    # Check pending invite
    existing_invite = db.query(TeamInvite).filter(
        TeamInvite.team_id == team_id,
        TeamInvite.invitee_id == payload.invitee_id,
        TeamInvite.status == "pending",
    ).first()
    if existing_invite:
        raise HTTPException(400, "Invite already pending")

    invite = TeamInvite(team_id=team_id, invitee_id=payload.invitee_id)
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


@router.get("/invites/me", response_model=List[TeamInviteOut])
def my_invites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(TeamInvite).filter(
        TeamInvite.invitee_id == current_user.id,
        TeamInvite.status == "pending",
    ).all()


@router.post("/invites/{invite_id}/respond", response_model=TeamInviteOut)
def respond_invite(
    invite_id: int,
    payload: InviteResponse,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invite = db.query(TeamInvite).filter(TeamInvite.id == invite_id).first()
    if not invite:
        raise HTTPException(404, "Invite not found")
    if invite.invitee_id != current_user.id:
        raise HTTPException(403, "Not your invite")
    if invite.status != "pending":
        raise HTTPException(400, "Invite already responded")

    if payload.action == "accept":
        invite.status = "accepted"
        member = TeamMember(team_id=invite.team_id, player_id=current_user.id, role="member")
        db.add(member)
    elif payload.action == "reject":
        invite.status = "rejected"
    else:
        raise HTTPException(400, "Action must be 'accept' or 'reject'")

    db.commit()
    db.refresh(invite)
    return invite


@router.delete("/{team_id}/members/{player_id}", status_code=204)
def remove_member(
    team_id: int,
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(404, "Team not found")
    if team.captain_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not authorized")
    member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.player_id == player_id,
    ).first()
    if not member:
        raise HTTPException(404, "Member not found")
    if player_id == team.captain_id:
        raise HTTPException(400, "Cannot remove captain")
    db.delete(member)
    db.commit()