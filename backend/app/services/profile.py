"""Profile aggregation helpers for player dashboard."""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional

from app.models import (
    User,
    Team,
    TeamMember,
    Tournament,
    TournamentRegistration,
    Match,
)


def get_player_team_ids(db: Session, user_id: int) -> List[int]:
    return [
        m.team_id
        for m in db.query(TeamMember).filter(TeamMember.player_id == user_id).all()
    ]


def get_current_team(db: Session, user: User) -> Optional[Team]:
    membership = (
        db.query(TeamMember)
        .options(
            joinedload(TeamMember.team).joinedload(Team.game),
            joinedload(TeamMember.team).joinedload(Team.captain),
            joinedload(TeamMember.team).joinedload(Team.members).joinedload(TeamMember.player),
        )
        .filter(TeamMember.player_id == user.id)
        .order_by(TeamMember.joined_at.desc())
        .first()
    )
    return membership.team if membership else None


def is_team_captain(team: Team, user_id: int) -> bool:
    return team.captain_id == user_id


def compute_player_stats(db: Session, user: User) -> dict:
    team_ids = get_player_team_ids(db, user.id)

    reg_q = db.query(TournamentRegistration)
    if team_ids:
        reg_q = reg_q.filter(
            or_(
                TournamentRegistration.player_id == user.id,
                TournamentRegistration.team_id.in_(team_ids),
            )
        )
    else:
        reg_q = reg_q.filter(TournamentRegistration.player_id == user.id)
    tournaments_joined = reg_q.count()

    teams_joined = db.query(TeamMember).filter(TeamMember.player_id == user.id).count()

    wins = 0
    losses = 0
    matches_played = 0

    if team_ids:
        completed = (
            db.query(Match)
            .options(joinedload(Match.result))
            .filter(
                Match.status == "completed",
                or_(Match.team_a_id.in_(team_ids), Match.team_b_id.in_(team_ids)),
            )
            .all()
        )
        matches_played = len(completed)
        for match in completed:
            if not match.result:
                continue
            player_team = None
            if match.team_a_id in team_ids:
                player_team = "a"
            elif match.team_b_id in team_ids:
                player_team = "b"
            if not player_team:
                continue
            score_a = match.result.score_team_a
            score_b = match.result.score_team_b
            if score_a == score_b:
                continue
            won = (player_team == "a" and score_a > score_b) or (
                player_team == "b" and score_b > score_a
            )
            if won:
                wins += 1
            else:
                losses += 1

    total_decided = wins + losses
    win_rate = round((wins / total_decided) * 100, 1) if total_decided > 0 else 0.0

    return {
        "tournaments_joined": tournaments_joined,
        "matches_played": matches_played,
        "teams_joined": teams_joined,
        "wins": wins,
        "losses": losses,
        "win_rate": win_rate,
    }


def build_match_history_item(match: Match, team_ids: List[int], user_id: int) -> dict:
    player_team = None
    if match.team_a_id in team_ids:
        player_team = "a"
    elif match.team_b_id in team_ids:
        player_team = "b"

    opponent = None
    result_label = None
    score = None
    is_mvp = False

    if player_team == "a":
        opponent = match.team_b.name if match.team_b else "TBD"
    elif player_team == "b":
        opponent = match.team_a.name if match.team_a else "TBD"

    if match.result and player_team:
        score_a = match.result.score_team_a
        score_b = match.result.score_team_b
        if player_team == "a":
            score = f"{score_a} - {score_b}"
        else:
            score = f"{score_b} - {score_a}"
        if score_a == score_b:
            result_label = "Draw"
        elif (player_team == "a" and score_a > score_b) or (player_team == "b" and score_b > score_a):
            result_label = "Win"
        else:
            result_label = "Loss"
        is_mvp = match.result.mvp_player_id == user_id

    return {
        "id": match.id,
        "match_date": match.match_date,
        "opponent": opponent or "Unknown",
        "result": result_label,
        "is_mvp": is_mvp,
        "score": score,
        "round_name": match.round_name,
        "tournament_name": match.tournament.name if match.tournament else None,
        "game_name": match.tournament.game.name if match.tournament and match.tournament.game else None,
    }


def get_match_history(db: Session, user: User, limit: Optional[int] = None) -> List[dict]:
    team_ids = get_player_team_ids(db, user.id)
    if not team_ids:
        return []

    q = (
        db.query(Match)
        .options(
            joinedload(Match.team_a),
            joinedload(Match.team_b),
            joinedload(Match.result),
            joinedload(Match.tournament).joinedload(Tournament.game),
        )
        .filter(
            Match.status == "completed",
            or_(Match.team_a_id.in_(team_ids), Match.team_b_id.in_(team_ids)),
        )
        .order_by(Match.match_date.desc())
    )
    if limit:
        q = q.limit(limit)
    matches = q.all()
    return [build_match_history_item(m, team_ids, user.id) for m in matches]


def get_tournament_history(db: Session, user: User) -> List[dict]:
    team_ids = get_player_team_ids(db, user.id)
    q = db.query(TournamentRegistration).options(
        joinedload(TournamentRegistration.tournament).joinedload(Tournament.game),
        joinedload(TournamentRegistration.team),
    )
    if team_ids:
        q = q.filter(
            or_(
                TournamentRegistration.player_id == user.id,
                TournamentRegistration.team_id.in_(team_ids),
            )
        )
    else:
        q = q.filter(TournamentRegistration.player_id == user.id)

    regs = q.order_by(TournamentRegistration.registered_at.desc()).all()
    items = []
    for reg in regs:
        t = reg.tournament
        items.append({
            "id": reg.id,
            "tournament_id": reg.tournament_id,
            "tournament_name": t.name if t else "Unknown",
            "game_name": t.game.name if t and t.game else None,
            "registration_status": reg.registration_status.value if reg.registration_status else "registered",
            "placement": reg.placement,
            "registered_at": reg.registered_at,
            "team_name": reg.team.name if reg.team else None,
        })
    return items
