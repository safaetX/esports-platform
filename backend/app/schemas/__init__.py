from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ── Enums ──────────────────────────────────────────────────────────────────────
class UserRole(str, Enum):
    admin = "admin"
    player = "player"


class TeamMemberRole(str, Enum):
    captain = "captain"
    member = "member"


class InviteStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class MatchStatus(str, Enum):
    upcoming = "upcoming"
    completed = "completed"


# ── Auth ───────────────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ── User ───────────────────────────────────────────────────────────────────────
class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: UserRole
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    country: Optional[str] = None
    favorite_game: Optional[str] = None
    is_active: bool = True
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    country: Optional[str] = None
    favorite_game: Optional[str] = None

    @field_validator("username")
    @classmethod
    def username_valid(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) < 3 or len(v) > 64:
                raise ValueError("Username must be 3–64 characters")
        return v

    @field_validator("full_name")
    @classmethod
    def full_name_valid(cls, v):
        if v is not None and len(v.strip()) > 128:
            raise ValueError("Full name must be at most 128 characters")
        return v.strip() if v else v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class PlayerStatsSummary(BaseModel):
    tournaments_joined: int
    matches_played: int
    teams_joined: int
    wins: int
    losses: int
    win_rate: float


class TournamentHistoryItem(BaseModel):
    id: int
    tournament_id: int
    tournament_name: str
    game_name: Optional[str] = None
    registration_status: str
    placement: Optional[str] = None
    registered_at: datetime
    team_name: Optional[str] = None


class MatchHistoryItem(BaseModel):
    id: int
    match_date: datetime
    opponent: str
    result: Optional[str] = None
    is_mvp: bool = False
    score: Optional[str] = None
    round_name: Optional[str] = None
    tournament_name: Optional[str] = None
    game_name: Optional[str] = None


class TeamMembershipOut(BaseModel):
    team_id: int
    team_name: str
    logo_url: Optional[str] = None
    game_name: Optional[str] = None
    captain_name: Optional[str] = None
    is_captain: bool = False


# ── Game ───────────────────────────────────────────────────────────────────────
class GameOut(BaseModel):
    id: int
    name: str
    team_size: int
    is_solo: bool
    requires_tag: bool
    icon: Optional[str] = None

    model_config = {"from_attributes": True}


# ── PlayerGameProfile ──────────────────────────────────────────────────────────
class GameProfileCreate(BaseModel):
    game_id: int
    in_game_name: str
    tag: Optional[str] = None
    rank: Optional[str] = None


class GameProfileOut(BaseModel):
    id: int
    player_id: int
    game_id: int
    in_game_name: str
    tag: Optional[str] = None
    rank: Optional[str] = None
    game: Optional[GameOut] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class GameProfileUpdate(BaseModel):
    in_game_name: Optional[str] = None
    tag: Optional[str] = None
    rank: Optional[str] = None


# ── Team ───────────────────────────────────────────────────────────────────────
class TeamCreate(BaseModel):
    name: str
    game_id: int
    logo_url: Optional[str] = None


class TeamMemberOut(BaseModel):
    id: int
    player_id: int
    role: TeamMemberRole
    player: Optional[UserOut] = None
    joined_at: datetime

    model_config = {"from_attributes": True}


class TeamOut(BaseModel):
    id: int
    name: str
    game_id: int
    captain_id: Optional[int] = None
    logo_url: Optional[str] = None
    game: Optional[GameOut] = None
    members: List[TeamMemberOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class TeamInviteCreate(BaseModel):
    invitee_id: int


class TeamInviteOut(BaseModel):
    id: int
    team_id: int
    invitee_id: int
    status: InviteStatus
    team: Optional[TeamOut] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class InviteResponse(BaseModel):
    action: str  # "accept" or "reject"


# ── Tournament ─────────────────────────────────────────────────────────────────
class TournamentCreate(BaseModel):
    name: str
    game_id: int
    max_participants: int = 16
    registration_deadline: datetime
    description: Optional[str] = None
    prize_pool: Optional[str] = None


class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    max_participants: Optional[int] = None
    registration_deadline: Optional[datetime] = None
    description: Optional[str] = None
    prize_pool: Optional[str] = None


class TournamentRegistrationCreate(BaseModel):
    team_id: Optional[int] = None  # null for solo


class TournamentRegistrationOut(BaseModel):
    id: int
    tournament_id: int
    player_id: Optional[int] = None
    team_id: Optional[int] = None
    registration_status: Optional[str] = "registered"
    placement: Optional[str] = None
    registered_at: datetime
    player: Optional[UserOut] = None
    team: Optional[TeamOut] = None

    model_config = {"from_attributes": True}


class TournamentOut(BaseModel):
    id: int
    name: str
    game_id: int
    max_participants: int
    registration_deadline: datetime
    description: Optional[str] = None
    prize_pool: Optional[str] = None
    game: Optional[GameOut] = None
    registrations: List[TournamentRegistrationOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Match ──────────────────────────────────────────────────────────────────────
class MatchCreate(BaseModel):
    tournament_id: int
    team_a_id: int
    team_b_id: int
    match_date: datetime
    round_name: Optional[str] = None


class MatchUpdate(BaseModel):
    match_date: Optional[datetime] = None
    status: Optional[MatchStatus] = None
    round_name: Optional[str] = None


class MatchResultCreate(BaseModel):
    score_team_a: int
    score_team_b: int
    mvp_player_id: Optional[int] = None


class PlayerStatsCreate(BaseModel):
    player_id: int
    score: float = 0.0
    acs: Optional[float] = None
    points: Optional[float] = None


class PlayerStatsOut(BaseModel):
    id: int
    player_id: int
    score: float
    acs: Optional[float] = None
    points: Optional[float] = None
    player: Optional[UserOut] = None

    model_config = {"from_attributes": True}


class MatchResultOut(BaseModel):
    id: int
    match_id: int
    score_team_a: int
    score_team_b: int
    mvp_player_id: Optional[int] = None
    mvp: Optional[UserOut] = None

    model_config = {"from_attributes": True}


class MatchOut(BaseModel):
    id: int
    tournament_id: int
    team_a_id: Optional[int] = None
    team_b_id: Optional[int] = None
    match_date: datetime
    status: MatchStatus
    round_name: Optional[str] = None
    team_a: Optional[TeamOut] = None
    team_b: Optional[TeamOut] = None
    result: Optional[MatchResultOut] = None
    player_stats: List[PlayerStatsOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}