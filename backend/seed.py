"""
Seed script: creates games, admin, players, teams, tournaments, matches.
Run: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, create_tables
from app.models import (
    User, Game, PlayerGameProfile, Team, TeamMember,
    Tournament, TournamentRegistration, Match, MatchResult, PlayerStats
)
from app.core.security import get_password_hash
from datetime import datetime, timedelta


def seed():
    create_tables()
    db = SessionLocal()
    try:
        # ── Games ──────────────────────────────────────────────────────────────
        games_data = [
            {"name": "Valorant",          "team_size": 5,  "is_solo": False, "requires_tag": True,  "icon": "🎯"},
            {"name": "PUBG Mobile",        "team_size": 4,  "is_solo": False, "requires_tag": False, "icon": "🔫"},
            {"name": "League of Legends",  "team_size": 5,  "is_solo": False, "requires_tag": False, "icon": "⚔️"},
            {"name": "eFootball",          "team_size": 1,  "is_solo": True,  "requires_tag": False, "icon": "⚽"},
            {"name": "FIFA",               "team_size": 1,  "is_solo": True,  "requires_tag": False, "icon": "🏆"},
        ]
        existing_games = db.query(Game).count()
        games = []
        if existing_games == 0:
            for g in games_data:
                game = Game(**g)
                db.add(game)
            db.flush()
            games = db.query(Game).all()
            print(f"✅ Seeded {len(games)} games")
        else:
            games = db.query(Game).all()
            print("ℹ️  Games already seeded")

        valorant = next(g for g in games if g.name == "Valorant")
        pubg     = next(g for g in games if g.name == "PUBG Mobile")
        lol      = next(g for g in games if g.name == "League of Legends")

        # ── Admin ──────────────────────────────────────────────────────────────
        admin = db.query(User).filter(User.email == "admin@esports.gg").first()
        if not admin:
            admin = User(
                username="AdminGG",
                email="admin@esports.gg",
                hashed_password=get_password_hash("admin123"),
                role="admin",
            )
            db.add(admin)
            db.flush()
            print("✅ Admin created  (admin@esports.gg / admin123)")

        # ── Players ────────────────────────────────────────────────────────────
        players_data = [
            ("ShadowStrike",  "shadow@esports.gg",   "shadow123"),
            ("NeonRaider",    "neon@esports.gg",     "neon1234"),
            ("PhantomX",      "phantom@esports.gg",  "phantom1"),
            ("BladeRunner",   "blade@esports.gg",    "blade123"),
            ("CyberWolf",     "cyber@esports.gg",    "cyber123"),
            ("IronFist",      "iron@esports.gg",     "iron1234"),
            ("StormBreaker",  "storm@esports.gg",    "storm123"),
            ("DarkMatter",    "dark@esports.gg",     "dark1234"),
        ]
        players = []
        for uname, email, pw in players_data:
            p = db.query(User).filter(User.email == email).first()
            if not p:
                p = User(
                    username=uname,
                    email=email,
                    hashed_password=get_password_hash(pw),
                    role="player",
                    full_name=uname,
                )
                db.add(p)
                db.flush()
            players.append(p)
        print(f"✅ {len(players)} players ready")

        # ── Game Profiles ──────────────────────────────────────────────────────
        val_profiles = [
            ("ShadowStrike#EZ1", "Shadow#EZ1", "Diamond 2"),
            ("NeonRaider#NR99",  "NeonR#NR99", "Platinum 1"),
            ("PhantomX#PX00",    "Phan#PX00",  "Immortal 1"),
            ("BladeRunner#BL7",  "Blade#BL7",  "Diamond 1"),
            ("CyberWolf#CW22",   "Cyber#CW22", "Gold 3"),
        ]
        for i, (ign, tag, rank) in enumerate(val_profiles):
            existing = db.query(PlayerGameProfile).filter(
                PlayerGameProfile.player_id == players[i].id,
                PlayerGameProfile.game_id == valorant.id,
            ).first()
            if not existing:
                db.add(PlayerGameProfile(
                    player_id=players[i].id, game_id=valorant.id,
                    in_game_name=ign, tag=tag, rank=rank,
                ))

        pubg_profiles = [("ShadowPUBG", "Conqueror"), ("NeonPUBG", "Ace"), ("IronPUBG", "Diamond"), ("Storm_PUBG", "Platinum")]
        for i, (ign, rank) in enumerate(pubg_profiles):
            p = players[i] if i < 3 else players[5]
            existing = db.query(PlayerGameProfile).filter(
                PlayerGameProfile.player_id == p.id,
                PlayerGameProfile.game_id == pubg.id,
            ).first()
            if not existing:
                db.add(PlayerGameProfile(player_id=p.id, game_id=pubg.id, in_game_name=ign, rank=rank))

        db.flush()
        print("✅ Game profiles seeded")

        # ── Teams ──────────────────────────────────────────────────────────────
        team_a = db.query(Team).filter(Team.name == "Team Alpha").first()
        if not team_a:
            team_a = Team(name="Team Alpha", game_id=valorant.id, captain_id=players[0].id)
            db.add(team_a)
            db.flush()
            for i in range(5):
                db.add(TeamMember(team_id=team_a.id, player_id=players[i].id, role="captain" if i == 0 else "member"))

        team_b = db.query(Team).filter(Team.name == "Team Beta").first()
        if not team_b:
            team_b = Team(name="Team Beta", game_id=pubg.id, captain_id=players[5].id)
            db.add(team_b)
            db.flush()
            for pid in [players[5].id, players[0].id, players[1].id, players[2].id]:
                db.add(TeamMember(team_id=team_b.id, player_id=pid, role="captain" if pid == players[5].id else "member"))

        db.flush()
        print("✅ Teams seeded")

        # ── Tournaments ────────────────────────────────────────────────────────
        t1 = db.query(Tournament).filter(Tournament.name == "Valorant Showdown S1").first()
        if not t1:
            t1 = Tournament(
                name="Valorant Showdown S1",
                game_id=valorant.id,
                max_participants=16,
                registration_deadline=datetime.utcnow() + timedelta(days=7),
                description="The premier Valorant tournament. Show your skills!",
                prize_pool="$500 USD",
            )
            db.add(t1)

        t2 = db.query(Tournament).filter(Tournament.name == "PUBG Champions Cup").first()
        if not t2:
            t2 = Tournament(
                name="PUBG Champions Cup",
                game_id=pubg.id,
                max_participants=8,
                registration_deadline=datetime.utcnow() + timedelta(days=3),
                description="Battle royale at its finest.",
                prize_pool="$250 USD",
            )
            db.add(t2)

        db.flush()

        # ── Registrations ──────────────────────────────────────────────────────
        for p in players[:3]:
            exists = db.query(TournamentRegistration).filter(
                TournamentRegistration.tournament_id == t1.id,
                TournamentRegistration.player_id == p.id,
            ).first()
            if not exists:
                db.add(TournamentRegistration(
                    tournament_id=t1.id,
                    player_id=p.id,
                    placement="Top 8" if p.id == players[0].id else None,
                ))

        db.flush()

        # ── Matches ────────────────────────────────────────────────────────────
        m1 = db.query(Match).filter(Match.tournament_id == t1.id).first()
        if not m1:
            m1 = Match(
                tournament_id=t1.id,
                team_a_id=team_a.id,
                team_b_id=team_a.id,  # placeholder - same team for demo
                match_date=datetime.utcnow() + timedelta(days=2),
                status="upcoming",
                round_name="Quarter Final",
            )
            db.add(m1)
            db.flush()

            m2 = Match(
                tournament_id=t1.id,
                team_a_id=team_a.id,
                team_b_id=team_a.id,
                match_date=datetime.utcnow() - timedelta(days=1),
                status="completed",
                round_name="Group Stage",
            )
            db.add(m2)
            db.flush()

            result = MatchResult(match_id=m2.id, score_team_a=13, score_team_b=7, mvp_player_id=players[0].id)
            db.add(result)
            db.add(PlayerStats(match_id=m2.id, player_id=players[0].id, score=280.0, acs=280.0))
            db.add(PlayerStats(match_id=m2.id, player_id=players[1].id, score=210.0, acs=210.0))

        db.commit()
        print("✅ Tournaments, matches, results seeded")
        print("\n🎮 Seed complete!")
        print("   Admin: admin@esports.gg / admin123")
        print("   Player: shadow@esports.gg / shadow123")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()