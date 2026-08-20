from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,DeclarativeBase

DATABASE_URL = "mysql+pymysql://root:@localhost:3306/infravault"

engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class Base(DeclarativeBase):
    pass 