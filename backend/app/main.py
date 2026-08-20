from fastapi import FastAPI, Depends, HTTPException
from app.database import Base, engine, get_db
from app.model import User
from app.schema import UserCreate, UserResponse
from sqlalchemy.orm import Session

from app.security import hash_password, verify_password

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI !!"}

@app.post("/users/")
def create_user(userdata : UserCreate, db: Session = Depends(get_db)):
    new_user = User(
        name = userdata.name,
        email = userdata.email,
        password = hash_password(userdata.password),
        role = userdata.role    
    )
    db.add(new_user)
    db.commit()
    # db.refresh(new_user)
    return {"message": "User created successfully"}

@app.get("/users/", response_model=list[UserResponse])
def get_user(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

@app.put("/users/{user_id}")
def update_user(user_id : int, userdata : UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.name = userdata.name
    user.email = userdata.email
    user.password = hash_password(userdata.password)
    user.role = userdata.role
    db.commit()
    return {"message": "User updated successfully"}

@app.delete("/users/{user_id}")
def delete_user(user_id : int, db: Session = Depends(get_db)):  

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}