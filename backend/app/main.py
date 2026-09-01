from fastapi import FastAPI, Depends, HTTPException
from app.database import Base, engine, get_db
from app.model import User, Device , Project, AuditLog
from app.schema import UserCreate, UserResponse,UserListResponse,UserUpdate, UserStatusUpdate,ProfileUpdate,ChangePassword, DeviceCreate , DeviceResponse,DeviceListResponse,DeviceListResponseWrapper, ProjectCreate, ProjectResponse, ProjectUpdate, ProjectStatusUpdate
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jose import JWTError
from app.auth import create_access_token, get_current_user, require_roles

from app.security import hash_password, verify_password ,encrypt_device_password

Base.metadata.create_all(bind=engine)

app = FastAPI()

class LoginRequest(BaseModel):
    email: str
    password: str


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI !!"}

@app.post("/users/")
def create_user(
    userdata: UserCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
):
    if (
        current_user["role"] == "ADMIN"
        and userdata.role == "SUPER_ADMIN"
    ):
        raise HTTPException(
            status_code=403,
            detail="ADMIN cannot create a SUPER_ADMIN"
        )

    new_user = User(
        name=userdata.name,
        email=userdata.email,
        password=hash_password(userdata.password),
        role=userdata.role,
        created_by=current_user["user_id"],
        updated_by=current_user["user_id"],
    )

    db.add(new_user)
    db.commit()

    return {
        "message": "User created successfully"
    }

@app.get("/users/", response_model=UserListResponse)
def get_users(
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    role: str | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
):
    if page < 1:
        raise HTTPException(
            status_code=400,
            detail="Page must be greater than or equal to 1"
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100"
        )

    query = db.query(User)

    # Search by name or email
    if search:
        search_value = f"%{search}%"

        query = query.filter(
            (User.name.ilike(search_value)) |
            (User.email.ilike(search_value))
        )

    # Filter by role
    if role:
        query = query.filter(
            User.role == role
        )

    # Filter by active/inactive status
    if is_active is not None:
        query = query.filter(
            User.is_active == is_active
        )

    total = query.count()

    offset = (page - 1) * limit

    users = (
        query
        .offset(offset)
        .limit(limit)
        .all()
    )

    total_pages = (
        (total + limit - 1) // limit
        if total > 0
        else 0
    )

    return {
        "data": users,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1
        }
    }

@app.put("/users/{user_id}")
def update_user(user_id : int, userdata : UserUpdate, db: Session = Depends(get_db), current_user: dict = Depends(require_roles("ADMIN","SUPER_ADMIN"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if(
        current_user["role"] == "ADMIN"
        and user.role == "SUPER_ADMIN"
    ):
        raise HTTPException(
            status_code = 403,
            detail = "ADMIN cannot modify a SUPER_ADMIN"
        )
    if(
        current_user["role"] == "ADMIN"
        and userdata.role == "SUPER_ADMIN"
    ):
        raise HTTPException(
            status_code = 403,
            detail = "ADMIN cannot assign SUPER_ADMIN role"
        )
    user.name = userdata.name
    user.email = userdata.email
    if userdata.password:
        user.password = hash_password(userdata.password)
    user.role = userdata.role
    user.updated_by = current_user["user_id"]
    db.commit()
    return {"message": "User updated successfully"}

@app.delete("/users/{user_id}")
def delete_user(user_id : int, db: Session = Depends(get_db), current_user: dict = Depends(require_roles("SUPER_ADMIN"))):  

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@app.patch("/api/v1/users/{user_id}/status")
def update_user_status(
    user_id: int,
    userdata: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"

        )

    if current_user["role"] == "ADMIN":
        if user.id == current_user["user_id"]:
            raise HTTPException(
                status_code=403,
                detail="ADMIN cannot change their own account status"
            )
        if user.role in ("SUPER_ADMIN", "ADMIN"):
            raise HTTPException(
                status_code=403,
                detail="ADMIN cannot change the status of SUPER_ADMIN or ADMIN accounts"
            )

    user.is_active = userdata.is_active

    db.commit()
    db.refresh(user)

    return {
        "message": "User status updated successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active
        }
    }

@app.post("/api/v1/auth/login")
def login(
    userdata: LoginRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == userdata.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    if not verify_password(
        userdata.password,
        user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    })

    return {
        "access_token": access_token,
        "token_type": "Bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }
@app.get("/api/v1/auth/me")
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active
    }

@app.put("/api/v1/auth/change-password")
def change_my_password(
    password_data: ChangePassword,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not verify_password(
        password_data.current_password,
        user.password
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    user.password = hash_password(
        password_data.new_password
    )

    db.commit()

    return {
        "message": "Password changed successfully"
    }

@app.put("/api/v1/auth/me")
def update_my_profile(
    userdata: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.name = userdata.name
    user.email = userdata.email

    db.commit()
    db.refresh(user)

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active
        }
    }

@app.post("/devices/", response_model=DeviceResponse)
def create_device(
    device_data: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
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
        device_status=device_data.device_status,
        created_by=current_user["user_id"],
        updated_by=current_user["user_id"]
    )

    db.add(new_device)
    db.commit()
    db.refresh(new_device)

    return new_device

@app.get("/devices/",response_model=DeviceListResponseWrapper)
def get_devices(
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    device_status: str | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("USER", "ADMIN", "SUPER_ADMIN")
    )
):
    if page < 1:
        raise HTTPException(
            status_code=400,
            detail="Page must be greater than or equal to 1"
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100"
        )

    query = db.query(Device)

    # Search by device name
    if search:
        query = query.filter(
            Device.device_name.ilike(f"%{search}%")
        )

    # Filter by device status
    if device_status:
        query = query.filter(
            Device.device_status == device_status
        )

    total = query.count()

    offset = (page - 1) * limit

    devices = (
        query
        .offset(offset)
        .limit(limit)
        .all()
    )

    total_pages = (total + limit - 1) // limit

    return {
        "data": devices,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1
        }
    }

@app.get("/devices/{device_id}", response_model=DeviceResponse)
def get_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("USER", "ADMIN", "SUPER_ADMIN")
    )
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
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
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
    device.updated_by = current_user["user_id"]

    db.commit()
    db.refresh(device)

    return device

@app.delete("/devices/{device_id}")
def delete_device(device_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_roles("SUPER_ADMIN"))):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.delete(device)
    db.commit()
    return {"message": "Device deleted successfully"}


@app.post("/projects/", response_model=ProjectResponse)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
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
        project_status=project_data.project_status,
        created_by=current_user["user_id"],
        updated_by=current_user["user_id"]
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project

@app.get("/projects/")
def get_projects(
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    project_status: str | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("USER", "ADMIN", "SUPER_ADMIN")
    )
):
    if page < 1:
        raise HTTPException(
            status_code=400,
            detail="Page must be greater than or equal to 1"
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100"
        )

    query = db.query(Project)

    # Search by project name
    if search:
        query = query.filter(
            Project.project_name.ilike(f"%{search}%")
        )

    # Filter by project status
    if project_status:
        query = query.filter(
            Project.project_status == project_status
        )

    total = query.count()

    offset = (page - 1) * limit

    projects = (
        query
        .offset(offset)
        .limit(limit)
        .all()
    )

    total_pages = (total + limit - 1) // limit

    return {
        "data": projects,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1
        }
    }

@app.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("USER", "ADMIN", "SUPER_ADMIN")
    )
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
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
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
    project.updated_by = current_user["user_id"]

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
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
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
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("SUPER_ADMIN")
    )
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
