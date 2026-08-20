from app.database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer


class User(Base):
    __tablename__ = "users"

    id:Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable= False)
    email : Mapped[str] = mapped_column(String(50), unique= True, nullable= False)
    password : Mapped[str] = mapped_column(String(250), nullable= False)
    role : Mapped[str] = mapped_column(String(50), nullable= False)

