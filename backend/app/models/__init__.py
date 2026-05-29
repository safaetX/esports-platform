from app.database import Base
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey,
    Enum, Text, UniqueConstraint, Float
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    player = "player"


class TeamMemberRole(str, enum.Enum):
    captain = "captain"
    member = "member"


class InviteStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class MatchStatus(str, enum.Enum):
    upcoming = "upcoming"
    completed = "completed"


# ── User ──────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(128), unique=True, nullable=False, index=True)
    hashed_password = Column(String(256), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.player, nullable=False)
    full_name = Column(String(128), nullable=True)
    avatar_url = Column(String(256), nullable=True)
    bio = Column(Text, nullable=True)
    country = Column(String(64), nullable=True)
    favorite_game = Column(String(64), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    game_profiles = relationship("PlayerGameProfile", back_populates="player", cascade="all, delete-orphan")
    team_memberships = relationship("TeamMember", back_populates="player", cascade="all, delete-orphan")
    captained_teams = relationship("Team", back_populates="captain", foreign_keys="Team.captain_id")
    invites_received = relationship("TeamInvite", back_populates="invitee", foreign_keys="TeamInvite.invitee_id")
    tournament_registrations = relationship("TournamentRegistration", back_populates="player")
    player_stats = relationship("PlayerStats", back_populates="player")


# ── Game ──────────────────────────────────────────────────────────────────────
class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), unique=True, nullable=False)
    team_size = Column(Integer, nullable=False, default=5)
    is_solo = Column(Boolean, default=False)
    requires_tag = Column(Boolean, default=False)
    icon = Column(String(128), nullable=True)

    player_profiles = relationship("PlayerGameProfile", back_populates="game")
    teams = relationship("Team", back_populates="game")
    tournaments = relationship("Tournament", back_populates="game")


# ── PlayerGameProfile ─────────────────────────────────────────────────────────
class PlayerGameProfile(Base):
    __tablename__ = "player_game_profiles"
    __table_args__ = (UniqueConstraint("player_id", "game_id", name="uq_player_game"),)

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    in_game_name = Column(String(64), nullable=False)
    tag = Column(String(32), nullable=True)
    rank = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    player = relationship("User", back_populates="game_profiles")
    game = relationship("Game", back_populates="player_profiles")


# ── Team ──────────────────────────────────────────────────────────────────────
class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), unique=True, nullable=False)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    captain_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    logo_url = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    game = relationship("Game", back_populates="teams")
    captain = relationship("User", back_populates="captained_teams", foreign_keys=[captain_id])
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    invites = relationship("TeamInvite", back_populates="team", cascade="all, delete-orphan")
    registrations = relationship("TournamentRegistration", back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"
    __table_args__ = (UniqueConstraint("team_id", "player_id", name="uq_team_player"),)

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    player_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(TeamMemberRole), default=TeamMemberRole.member, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team", back_populates="members")
    player = relationship("User", back_populates="team_memberships")


class TeamInvite(Base):
    __tablename__ = "team_invites"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    invitee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(InviteStatus), default=InviteStatus.pending, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team", back_populates="invites")
    invitee = relationship("User", back_populates="invites_received", foreign_keys=[invitee_id])


# ── Tournament ────────────────────────────────────────────────────────────────
class Tournament(Base):
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    max_participants = Column(Integer, nullable=False, default=16)
    registration_deadline = Column(DateTime, nullable=False)
    description = Column(Text, nullable=True)
    prize_pool = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    game = relationship("Game", back_populates="tournaments")
    registrations = relationship("TournamentRegistration", back_populates="tournament", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="tournament", cascade="all, delete-orphan")


class RegistrationStatus(str, enum.Enum):
    registered = "registered"
    confirmed = "confirmed"
    withdrawn = "withdrawn"


class TournamentRegistration(Base):
    __tablename__ = "tournament_registrations"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=False)
    player_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    registration_status = Column(
        Enum(RegistrationStatus), default=RegistrationStatus.registered, nullable=False
    )
    placement = Column(String(64), nullable=True)
    registered_at = Column(DateTime, default=datetime.utcnow)

    tournament = relationship("Tournament", back_populates="registrations")
    player = relationship("User", back_populates="tournament_registrations")
    team = relationship("Team", back_populates="registrations")


# ── Match ─────────────────────────────────────────────────────────────────────
class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=False)
    team_a_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    team_b_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    match_date = Column(DateTime, nullable=False)
    status = Column(Enum(MatchStatus), default=MatchStatus.upcoming, nullable=False)
    round_name = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tournament = relationship("Tournament", back_populates="matches")
    team_a = relationship("Team", foreign_keys=[team_a_id])
    team_b = relationship("Team", foreign_keys=[team_b_id])
    result = relationship("MatchResult", back_populates="match", uselist=False, cascade="all, delete-orphan")
    player_stats = relationship("PlayerStats", back_populates="match", cascade="all, delete-orphan")


class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), unique=True, nullable=False)
    score_team_a = Column(Integer, default=0)
    score_team_b = Column(Integer, default=0)
    mvp_player_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    match = relationship("Match", back_populates="result")
    mvp = relationship("User")


class PlayerStats(Base):
    __tablename__ = "player_stats"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    player_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, default=0.0)
    acs = Column(Float, nullable=True)
    points = Column(Float, nullable=True)

    match = relationship("Match", back_populates="player_stats")
    player = relationship("User", back_populates="player_stats")