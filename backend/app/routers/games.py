from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Game
from app.schemas import GameOut
from typing import List

router = APIRouter(prefix="/api/games", tags=["Games"])


@router.get("/", response_model=List[GameOut])
def list_games(db: Session = Depends(get_db)):
    return db.query(Game).all()


@router.get("/{game_id}", response_model=GameOut)
def get_game(game_id: int, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(404, "Game not found")
    return game