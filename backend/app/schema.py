from pydantic import BaseModel
from datetime import datetime, date


class UserBase(BaseModel):
    name: str
    email : str 
    role : str

class UserCreate(UserBase):
    password : str

class UserResponse(UserBase):
    id : int

    class Config:
        from_attributes = True


class DeviceBase(BaseModel):
    device_name: str
    host: str
    port: int
    connection_type: str
    username: str
    comments: str | None = None
    device_status: str = "Active"


class DeviceCreate(DeviceBase):
    password: str


class DeviceResponse(DeviceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: int | None = None
    updated_by: int | None = None

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    project_name: str
    repo_name: str
    start_date: date
    deadline: date
    assigned_to: int | None = None
    comments: str | None = None
    device_master_id: int
    project_path: str
    deployment_script_path: str | None = None
    tech_stack: str
    project_status: str = "Active"


class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    pass

class ProjectStatusUpdate(BaseModel):
    project_status: str


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: int | None = None
    updated_by: int | None = None

    class Config:
        from_attributes = True