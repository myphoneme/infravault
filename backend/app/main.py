from fastapi import FastAPI, Depends, HTTPException
from app.database import Base, engine, get_db
from app.model import User, Device , Project
from app.schema import UserCreate, UserResponse, DeviceCreate , DeviceResponse, ProjectCreate, ProjectResponse, ProjectUpdate, ProjectStatusUpdate
from sqlalchemy.orm import Session

from app.security import hash_password, verify_password ,encrypt_device_password

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


@app.post("/devices/", response_model=DeviceResponse)
def create_device(
    device_data: DeviceCreate,
    db: Session = Depends(get_db)
):
    encrypted_password = encrypt_device_password(
        device_data.password
    )

    new_device = Device(
        device_name=device_data.device_name,
        host=device_data.host,
        port=device_data.port,
        connection_type=device_data.connection_type,
        username=device_data.username,
        password_encrypted=encrypted_password,
        comments=device_data.comments,
        device_status=device_data.device_status
    )

    db.add(new_device)
    db.commit()
    db.refresh(new_device)

    return new_device


@app.get("/devices/", response_model=list[DeviceResponse])
def get_devices(db: Session = Depends(get_db)):
    devices = db.query(Device).all()
    return devices

@app.get("/devices/{device_id}", response_model=DeviceResponse)
def get_device(
    device_id: int,
    db: Session = Depends(get_db)
    ):
    device = db.query(Device).filter(
        Device.id == device_id
    ).first()

    if not device:
        raise HTTPException(
            status_code=404,
            detail="Device not found"
        )

    return device

@app.put("/devices/{device_id}", response_model=DeviceResponse)
def update_device(
    device_id: int,
    device_data: DeviceCreate,
    db: Session = Depends(get_db)
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    encrypted_password = encrypt_device_password(
        device_data.password
    )

    device.device_name = device_data.device_name
    device.host = device_data.host
    device.port = device_data.port
    device.connection_type = device_data.connection_type
    device.username = device_data.username
    device.password_encrypted = encrypted_password
    device.comments = device_data.comments
    device.device_status = device_data.device_status

    db.commit()
    db.refresh(device)

    return device

@app.delete("/devices/{device_id}")
def delete_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.delete(device)
    db.commit()
    return {"message": "Device deleted successfully"}


@app.post("/projects/", response_model=ProjectResponse)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db)
):
    device = db.query(Device).filter(
        Device.id == project_data.device_master_id
    ).first()

    if not device:
        raise HTTPException(
            status_code=404,
            detail="Device not found"
        )

    if device.device_status != "Active":
        raise HTTPException(
            status_code=400,
            detail="Selected device is not active"
        )

    new_project = Project(
        project_name=project_data.project_name,
        repo_name=project_data.repo_name,
        start_date=project_data.start_date,
        deadline=project_data.deadline,
        assigned_to=project_data.assigned_to,
        comments=project_data.comments,
        device_master_id=project_data.device_master_id,
        project_path=project_data.project_path,
        deployment_script_path=project_data.deployment_script_path,
        tech_stack=project_data.tech_stack,
        project_status=project_data.project_status
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project

@app.get("/projects/", response_model=list[ProjectResponse])
def get_projects(
    db: Session = Depends(get_db)
):
    projects = db.query(Project).all()

    return projects

@app.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return project


@app.put("/projects/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    # Check selected device
    device = db.query(Device).filter(
        Device.id == project_data.device_master_id
    ).first()

    if not device:
        raise HTTPException(
            status_code=404,
            detail="Device not found"
        )

    if device.device_status != "Active":
        raise HTTPException(
            status_code=400,
            detail="Selected device is not active"
        )

    # Check project name uniqueness
    existing_project = db.query(Project).filter(
        Project.project_name == project_data.project_name,
        Project.id != project_id
    ).first()

    if existing_project:
        raise HTTPException(
            status_code=400,
            detail="Project name already exists"
        )

    project.project_name = project_data.project_name
    project.repo_name = project_data.repo_name
    project.start_date = project_data.start_date
    project.deadline = project_data.deadline
    project.assigned_to = project_data.assigned_to
    project.comments = project_data.comments
    project.device_master_id = project_data.device_master_id
    project.project_path = project_data.project_path
    project.deployment_script_path = project_data.deployment_script_path
    project.tech_stack = project_data.tech_stack
    project.project_status = project_data.project_status

    db.commit()
    db.refresh(project)

    return project


@app.patch(
    "/projects/{project_id}/status",
    response_model=ProjectResponse
)
def update_project_status(
    project_id: int,
    status_data: ProjectStatusUpdate,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    allowed_statuses = {
        "Active",
        "Completed",
        "On Hold",
        "Archived"
    }

    if status_data.project_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid project status"
        )

    project.project_status = status_data.project_status

    db.commit()
    db.refresh(project)

    return project

@app.delete("/projects/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    db.delete(project)
    db.commit()

    return {
        "message": "Project deleted successfully"
    }
