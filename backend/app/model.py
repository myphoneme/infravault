from app.database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer,Text, DateTime,Date, ForeignKey
from datetime import datetime,date



class User(Base):
    __tablename__ = "users"

    id:Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable= False)
    email : Mapped[str] = mapped_column(String(50), unique= True, nullable= False)
    password : Mapped[str] = mapped_column(String(250), nullable= False)
    role : Mapped[str] = mapped_column(String(50), nullable= False)



class Device(Base):
    __tablename__ = "device_master"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    device_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    host: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    port: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    connection_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    username: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    password_encrypted: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    comments: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    device_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Active"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    created_by: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    updated_by: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )



class Project(Base):
    __tablename__ = "project_master"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    project_name: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False
    )

    repo_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    deadline: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    assigned_to: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    comments: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    device_master_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("device_master.id"),
        nullable=False
    )

    project_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )

    deployment_script_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    tech_stack: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    project_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Active"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    created_by: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    updated_by: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )