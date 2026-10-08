from fastapi import FastAPI, Depends, HTTPException, UploadFile, File,Form
import json
from app.database import Base, engine, get_db
from app.model import User, Device , Project, AuditLog, DeviceCategory, DevicePasswordNotification
from app.schema import (
    UserCreate,
    UserResponse,
    UserListResponse,
    UserUpdate,
    UserStatusUpdate,
    ProfileUpdate,ChangePassword,
    DeviceCreate ,
    DeviceResponse,
    DeviceDetailResponse ,
    DeviceListResponse,
    DeviceListResponseWrapper,
    DeviceCategoryCreate,
    DeviceCategoryUpdate,
    DeviceCategoryResponse,
    DevicePasswordChange,
    ProjectCreate, 
    ProjectResponse,
    ProjectUpdate,
    ProjectStatusUpdate
)

from app.device_import import (
    read_excel_file,
    validate_device_rows,
    detect_device_duplicates,
    normalize_duplicate_value,
    normalize_import_device_values,
)

from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jose import JWTError
from app.auth import create_access_token, get_current_user, require_roles
from app.github import get_github_repositories
from app.device_password_expiry import process_device_password_expiry

from app.security import hash_password, verify_password ,encrypt_device_password,decrypt_device_password

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







@app.get("/users/assignable")
def get_assignable_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
):
    users = (
        db.query(User)
        .filter(User.is_active == True)
        .order_by(User.name.asc(), User.email.asc())
        .all()
    )

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "is_active":user.is_active,
        }
        for user in users
    ]

@app.get("/users/summary")
def get_user_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
):
    total_users = db.query(User).count()

    active_users = (
        db.query(User)
        .filter(User.is_active == True)
        .count()
    )

    inactive_users = (
        db.query(User)
        .filter(User.is_active == False)
        .count()
    )

    total_admins = db.query(User).filter(User.role == "Admin").count()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "total_admins": total_admins
    }


@app.get("/users/all")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
):
    users = (
        db.query(User)
        .order_by(User.name.asc(), User.email.asc())
        .all()
    )

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "is_active": user.is_active,
        }
        for user in users
    ]

    

@app.get("/users/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "is_active": user.is_active,
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
    # Verify that the selected category exists
    category = db.query(DeviceCategory).filter(
        DeviceCategory.id == device_data.device_category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=400,
            detail="Device category not found"
        )

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
        password_changed_at=datetime.utcnow(),
        device_category_id=device_data.device_category_id,
        password_rotation_days=device_data.password_rotation_days,
        comments=device_data.comments,
        device_status=device_data.device_status,
        device_condition=device_data.device_condition,
        created_by=current_user["user_id"],
        updated_by=current_user["user_id"]
    )

    db.add(new_device)
    db.commit()
    db.refresh(new_device)

    return new_device

@app.get("/devices/summary")
def get_device_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("USER", "ADMIN", "SUPER_ADMIN")
    )
):
    total_devices = db.query(Device).count()

    active_devices = db.query(Device).filter(
        Device.device_status == "Active"
    ).count()

    inactive_devices = db.query(Device).filter(
        Device.device_status == "Inactive"
    ).count()

    reachable_devices = db.query(Device).filter(
        Device.device_condition == "Reachable"
    ).count()

    unreachable_devices = db.query(Device).filter(
        Device.device_condition == "Unreachable"
    ).count()

    switched_off_devices = db.query(Device).filter(
        Device.device_condition == "Switched Off"
    ).count()

    unused_devices = db.query(Device).filter(
        Device.device_condition == "Unused"
    ).count()

    return {
        "total_devices": total_devices,
        "active_devices": active_devices,
        "inactive_devices": inactive_devices,
        "reachable_devices": reachable_devices,
        "unreachable_devices": unreachable_devices,
        "switched_off_devices": switched_off_devices,
        "unused_devices": unused_devices,
    }



@app.get("/devices/",response_model=DeviceListResponseWrapper)
def get_devices(
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    device_status: str | None = None,
    device_condition: str | None = None,
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
    
    # Filter by device condition
    # Filter by device condition
    if device_condition:
      query = query.filter(
        Device.device_condition == device_condition
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


@app.get(
    "/devices/{device_id}",
    response_model=DeviceDetailResponse
)
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

    # Normal users do NOT receive the password
    password = None

    # Only ADMIN and SUPER_ADMIN can receive decrypted password
    if current_user["role"] in ["ADMIN", "SUPER_ADMIN"]:
        password = decrypt_device_password(
            device.password_encrypted
        )

    return {
        "id": device.id,
        "device_name": device.device_name,
        "host": device.host,
        "port": device.port,
        "connection_type": device.connection_type,
        "username": device.username,
        "password": password,
        "device_category_id": device.device_category_id,
        "password_rotation_days": device.password_rotation_days,
        "comments": device.comments,
        "device_status": device.device_status,
        "device_condition": device.device_condition,
        "created_at": device.created_at,
        "updated_at": device.updated_at,
        "password_changed_at": device.password_changed_at,
        "created_by": device.created_by,
        "updated_by": device.updated_by
        
    }



@app.put("/devices/{device_id}", response_model=DeviceResponse)
def update_device(
    device_id: int,
    device_data: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
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

    # Verify that the selected category exists
    category = db.query(DeviceCategory).filter(
        DeviceCategory.id == device_data.device_category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=400,
            detail="Device category not found"
        )

    device.device_name = device_data.device_name
    device.host = device_data.host
    device.port = device_data.port
    device.connection_type = device_data.connection_type
    device.username = device_data.username
    device.device_category_id = device_data.device_category_id
    device.password_rotation_days = device_data.password_rotation_days
    device.comments = device_data.comments
    device.device_status = device_data.device_status
    device.device_condition = device_data.device_condition
    device.updated_by = current_user["user_id"]

    # Only update password when a new password was entered
    if device_data.password:
        device.password_encrypted = encrypt_device_password(
            device_data.password
        )

        # Restart the password expiry cycle
        device.password_changed_at = datetime.utcnow()

    db.commit()
    db.refresh(device)

    return device

@app.patch("/devices/{device_id}/password")
def change_device_password(
    device_id: int,
    password_data: DevicePasswordChange,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
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

    stored_password = decrypt_device_password(
        device.password_encrypted
    )

    if stored_password != password_data.current_password:
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    if stored_password == password_data.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from the current password"
        )

    # Change password
    device.password_encrypted = encrypt_device_password(
        password_data.new_password
    )

    # Start a new password-rotation cycle
    device.password_changed_at = datetime.utcnow()
    device.updated_by = current_user["user_id"]

    # Remove notifications from the previous password cycle
    db.query(DevicePasswordNotification).filter(
        DevicePasswordNotification.device_id == device.id
    ).delete(synchronize_session=False)

    # Create password-changed notification
    password_changed_notification = DevicePasswordNotification(
        device_id=device.id,
        password_cycle_started_at=device.password_changed_at,
        checkpoint="password_changed",
    )

    db.add(password_changed_notification)

    db.commit()

    return {
        "message": "Device password changed successfully"
    }



@app.delete("/devices/{device_id}")
def delete_device(device_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_roles("SUPER_ADMIN"))):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.delete(device)
    db.commit()
    return {"message": "Device deleted successfully"}





@app.post("/devices/import/validate")
def validate_device_import(
    file: UploadFile = File(...),
    error_corrections: str = Form("{}"),
    revalidate_rows: str = Form(""),
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    ),
):
    """
    Validate an Excel workbook before importing devices.
    This endpoint does not write to the database.
    """

    # Check the uploaded filename.
    if not file.filename or not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an Excel file with .xlsx extension.",
        )

    # Read the uploaded file.
    file_bytes = file.file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded Excel file is empty.",
        )

    try:
        error_corrections_data = json.loads(
            error_corrections
        )

        if not isinstance(error_corrections_data, dict):
            raise ValueError(
                "error_corrections must be a JSON object."
            )

    except (json.JSONDecodeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Invalid error_corrections JSON.",
        )


    revalidate_row_numbers = None

    if revalidate_rows:
        try:
            parsed_revalidate_rows = json.loads(
                revalidate_rows
            )

            if not isinstance(parsed_revalidate_rows, list):
                raise ValueError(
                    "revalidate_rows must be a JSON list."
                )

            revalidate_row_numbers = {
                int(row_number)
                for row_number in parsed_revalidate_rows
            }

        except (json.JSONDecodeError, ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail="Invalid revalidate_rows JSON.",
            )



    # Step 1: Parse workbook and validate headers.
    parsed_result = read_excel_file(file_bytes)

    if not parsed_result["success"]:
        return {
            "success": False,
            "stage": "file_validation",
            "errors": parsed_result["errors"],
            "duplicates": [],
            "message": "Please correct the Excel file errors and upload it again.",
        }

    rows = parsed_result["rows"]

    if revalidate_row_numbers is not None:
        rows = [
            row
            for row in rows
            if int(row["excel_row"]) in revalidate_row_numbers
        ]


    for row in rows:
        row_number = str(row["excel_row"])
        correction = error_corrections_data.get(row_number)

        if not correction:
            continue

        row_data = row["data"]

        for field in [
            "device_name",
            "host",
            "port",
            "connection_type",
            "username",
            "device_category_id",
            "password_rotation_days",
            "comments",
            "device_status",
            "device_condition",
        ]:
            if field in correction:
                row_data[field] = correction[field]

        if (
            isinstance(correction, dict)
            and correction.get("password") not in (None, "")
        ):
            row_data["password"] = correction["password"]

    for row in rows:
        normalize_import_device_values(row["data"])   

    if not rows:
        return {
            "success": False,
            "stage": "file_validation",
            "errors": [
                {
                    "row": None,
                    "field": "file",
                    "reason": "The Excel file contains no device rows.",
                }
            ],
            "duplicates": [],
            "message": "The workbook contains no device records.",
        }



       
    # Step 2: Validate every row.
    validation_result = validate_device_rows(
        rows,
        db,
    )

    # Step 3: Check duplicates in the workbook and database.
    # This runs even if row validation found errors,
    # so duplicate conflicts can also be reported.
    errors = validation_result["errors"]

    duplicate_result = detect_device_duplicates(
        validation_result["rows"],
        db,
    )
        
    
    
    duplicates = duplicate_result["duplicates"]

    # Map each original Excel row number to its device data.
    # This lets us include the original values in all three tables.
    row_data_by_number = {
        row["excel_row"]: row["data"]
        for row in rows
    }

    # Fields safe to return to the frontend.
    # Never include password or other credential values.
    display_fields = [
    "device_name",
    "host",
    "port",
    "connection_type",
    "username",
    "device_category_id",
    "password_rotation_days",
    "device_status",
    "device_condition",
    "comments",
  ]
    def get_display_data(excel_row):
        """Return displayable device fields for an Excel row."""
        if excel_row is None:
            return {}

        try:
            excel_row = int(excel_row)
        except (TypeError, ValueError):
            return {}

        source = row_data_by_number.get(excel_row, {})

        return {
            field: source.get(field)
            for field in display_fields
        }

    # --------------------------------------------------
    # 1. NEW DEVICES
    # --------------------------------------------------

    # Identify Excel rows that have duplicate conflicts.
    duplicate_rows = set()

    for duplicate in duplicates:
        duplicate_rows.update(
            duplicate.get("rows", [])
        )

    # Keep rows that passed validation and have no
    # duplicate conflicts.
    eligible_rows = [
        row
        for row in validation_result["rows"]
        if row["excel_row"] not in duplicate_rows
    ]

    # Return all display columns, not just name and host.
    new_devices = [
        {
            "row": row["excel_row"],
            "excel_row": row["excel_row"],
            **get_display_data(row["excel_row"]),
        }
        for row in eligible_rows
    ]

    # --------------------------------------------------
    # 2. VALIDATION ERRORS
    # --------------------------------------------------

    # Attach the original Excel data to each error so
    # React can show the device fields alongside the issue.
    enriched_errors = []

    for error in errors:
        excel_row = (
            error.get("row")
            if isinstance(error, dict)
            else None
        )

        error_data = (
            error if isinstance(error, dict) else {}
        )

        enriched_errors.append({
            **error_data,
            "row": excel_row,
            "excel_row": excel_row,
            **get_display_data(excel_row),
        })

    # --------------------------------------------------
    # 3. EXISTING DEVICE CONFLICTS
    # --------------------------------------------------

    # Convert duplicate records into one table row per
    # conflicting Excel row.
    enriched_duplicates = []

    seen_conflict_rows = set()

    for duplicate in duplicates:
        conflict_rows = duplicate.get("rows", [])

        for excel_row in conflict_rows:
            try:
                excel_row_key = int(excel_row)
            except (TypeError, ValueError):
                excel_row_key = str(excel_row)

            if excel_row_key in seen_conflict_rows:
                continue

            seen_conflict_rows.add(excel_row_key)

            enriched_duplicates.append({
                **duplicate,
                 "row": excel_row,
                 "excel_row": excel_row,
                 **get_display_data(excel_row),
            })


    # --------------------------------------------------
    # 4. RETURN VALIDATION RESULT
    # --------------------------------------------------

    has_errors = bool(errors)
    has_duplicates = bool(duplicates)

    return {
        "success": not has_errors and not has_duplicates,
        "stage": "validation",
        "total_rows": len(rows),
        "valid": not has_errors and not has_duplicates,
        "errors": enriched_errors,
        "duplicates": enriched_duplicates,
        "new_devices": new_devices,
        "message": (
            "Validation completed. Review eligible devices, "
            "resolve conflicts, and correct validation errors "
            "before committing."
        ),
    }



@app.post("/devices/import/commit")
def commit_device_import(
    file: UploadFile = File(...),
    decisions: str = Form(...),
    scope: str = Form("new"),
    excel_rows: str = Form("[]"),
    error_corrections: str = Form("{}"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    ),
):
    # 1. Validate import scope.
    if scope not in {"new", "existing"}:
        return {
            "success": False,
            "stage": "scope",
            "errors": [],
            "duplicates": [],
            "message": "Invalid import scope.",
        }
    # 2. Validate uploaded file.
    if (
        not file.filename
        or not file.filename.lower().endswith(".xlsx")
    ):
        raise HTTPException(
            status_code=400,
            detail="Only .xlsx files are supported.",
        )
    file_bytes = file.file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )
    # 3. Parse admin decisions.
    try:
        decisions_data = json.loads(decisions)
        if not isinstance(decisions_data, dict):
            raise ValueError(
                "Decisions must be a JSON object."
            )
        normalized_decisions = {}
        for row_number, action in decisions_data.items():
            row_key = str(row_number)
            if not row_key.isdigit():
                raise ValueError(
                    "Invalid Excel row number."
                )
            if not isinstance(action, str):
                raise ValueError(
                    "Invalid decision action."
                )
            action = action.strip().upper()
            # Empty decisions are allowed here because a New Devices
            # import does not require Existing Device decisions.
            # Existing Device imports validate their selected rows below.
            if action == "":
                continue
            if action not in {"UPDATE", "SKIP"}:
                raise ValueError(
                    "Actions must be UPDATE or SKIP."
                )
            normalized_decisions[row_key] = action
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Invalid decisions JSON.",
        )
     # 3b. Parse validation-error corrections.
    try:
        error_corrections_data = json.loads(error_corrections)
        if not isinstance(error_corrections_data, dict):
            raise ValueError(
                "error_corrections must be a JSON object."
            )
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Invalid error_corrections JSON.",
        )
    # 4. Parse the Excel rows selected by the frontend.
    try:
        requested_excel_rows = json.loads(excel_rows)
        if not isinstance(requested_excel_rows, list):
            raise ValueError(
                "excel_rows must be a list."
            )
        requested_excel_rows = {
            int(row_number)
            for row_number in requested_excel_rows
        }
    except (json.JSONDecodeError, ValueError, TypeError):
        return {
            "success": False,
            "stage": "request",
            "errors": [],
            "duplicates": [],
            "message": "Invalid excel_rows data.",
        }
    if not requested_excel_rows:
        return {
            "success": False,
            "stage": "request",
            "errors": [],
            "duplicates": [],
            "message": "No Excel rows were selected for import.",
        }
    # 5. Read the workbook.
    workbook_result = read_excel_file(file_bytes)
    if not workbook_result["success"]:
        return {
            "success": False,
            "stage": "file_validation",
            "errors": workbook_result["errors"],
            "duplicates": [],
            "message": "Workbook validation failed.",
        }
    if not workbook_result["rows"]:
        return {
            "success": False,
            "stage": "validation",
            "errors": [],
            "duplicates": [],
            "message": "The workbook contains no device rows.",
        }
    for row in workbook_result["rows"]:
        row_number = str(row["excel_row"])
        correction = error_corrections_data.get(row_number)
        if not correction:
            continue
        row_data = row["data"]
        for field in [
            "device_name",
            "host",
            "port",
            "connection_type",
            "username",
            "device_category_id",
            "password_rotation_days",
            "comments",
            "device_status",
            "device_condition",
        ]:
            if field in correction:
                row_data[field] = correction[field]
        # Password is special:
        # if it is omitted, preserve the original Excel password.
        if isinstance(correction, dict) and "password" in correction:
            row_data["password"] = correction["password"]
    # 6. Validate the complete workbook.
    #
    # We validate everything first so the same validation rules
    # are always applied. We then select only the rows requested
    # by the current Import Devices button.
    validation_result = validate_device_rows(
        workbook_result["rows"],
        db,
    )
    validation_errors = validation_result.get(
        "errors",
        [],
    )
    validated_rows = validation_result.get(
        "rows",
        [],
    )
    # 7. Keep only the rows requested by the frontend.
    #
    # Validation errors in other rows are intentionally ignored
    # for this import operation.
    selected_rows = [
        row
        for row in validated_rows
        if int(row["excel_row"]) in requested_excel_rows
    ]
    selected_excel_rows_found = {
        int(row["excel_row"])
        for row in selected_rows
    }
    missing_requested_rows = (
        requested_excel_rows - selected_excel_rows_found
    )
    # A requested row that is not in validated_rows may be a
    # validation-error row. Such a row must never be imported.
    if missing_requested_rows:
        selected_validation_errors = [
            error
            for error in validation_errors
            if int(
                error.get(
                    "excel_row",
                    error.get("row", -1),
                )
            ) in missing_requested_rows
        ]
        return {
            "success": False,
            "stage": "validation",
            "errors": selected_validation_errors,
            "duplicates": [],
            "message": (
                "One or more selected rows are no longer "
                "valid for import."
            ),
        }
    if not selected_rows:
        return {
            "success": False,
            "stage": "validation",
            "errors": [],
            "duplicates": [],
            "message": (
                "There are no valid selected rows available "
                "for import."
            ),
        }
    # 8. Recheck duplicates/conflicts using only the selected rows.
    duplicate_result = detect_device_duplicates(
        selected_rows,
        db,
    )
    within_file_duplicates = duplicate_result.get(
        "within_file_duplicates",
        [],
    )
    database_conflicts = duplicate_result.get(
        "database_conflicts",
        [],
    )
    # Duplicate identities inside the selected import operation
    # are rejected.
    if within_file_duplicates:
        return {
            "success": False,
            "stage": "validation",
            "errors": [],
            "duplicates": within_file_duplicates,
            "message": (
                "Duplicate device identities within the "
                "selected rows are not allowed."
            ),
        }
    # 9. Build conflict lookup by Excel row.
    conflicts_by_row = {
        str(conflict["rows"][0]): conflict
        for conflict in database_conflicts
    }
    selected_row_keys = {
        str(row["excel_row"])
        for row in selected_rows
    }
    conflict_rows = set(conflicts_by_row.keys())
    # 10. Enforce the requested import scope.
    #
    # NEW scope:
    # Every selected row must still be a new device.
    #
    # EXISTING scope:
    # Every selected row must still be an existing-device
    # conflict.
    if scope == "new":
        unexpected_conflicts = (
            conflict_rows & selected_row_keys
        )
        if unexpected_conflicts:
            return {
                "success": False,
                "stage": "conflict",
                "errors": [],
                "duplicates": [
                    conflict
                    for conflict in database_conflicts
                    if str(conflict["rows"][0])
                    in unexpected_conflicts
                ],
                "message": (
                    "One or more selected New Device rows "
                    "became existing-device conflicts. "
                    "Refresh the validation results and try again."
                ),
            }
        # Decisions belong to the Existing Devices table.
        # They must not affect a New Devices import.
        import_rows = selected_rows
    else:
        missing_conflicts = (
            selected_row_keys - conflict_rows
        )
        if missing_conflicts:
            return {
                "success": False,
                "stage": "conflict",
                "errors": [],
                "duplicates": [],
                "message": (
                    "One or more selected Existing Device rows "
                    "are no longer existing-device conflicts. "
                    "Refresh the validation results and try again."
                ),
            }
        # Only decisions for the rows being imported are relevant.
        selected_decisions = {
            row_key: normalized_decisions[row_key]
            for row_key in selected_row_keys
            if row_key in normalized_decisions
        }
        missing_decisions = (
            selected_row_keys
            - set(selected_decisions.keys())
        )
        if missing_decisions:
            return {
                "success": False,
                "stage": "resolution",
                "missing_decisions": sorted(
                    missing_decisions,
                    key=int,
                ),
                "unexpected_decisions": [],
                "message": (
                    "Select Update or Skip for every "
                    "existing-device row being imported."
                ),
            }
        # Do not allow decisions for unrelated rows to affect
        # this import operation.
        normalized_decisions = selected_decisions
        import_rows = selected_rows
    # 11. Verify every database conflict maps to exactly one
    # database record before beginning the transaction.
    for conflict in database_conflicts:
        matching_ids = conflict.get(
            "existing_device_ids",
            [],
        )
        if len(matching_ids) != 1:
            return {
                "success": False,
                "stage": "resolution",
                "duplicates": [conflict],
                "message": (
                    "A conflict matches multiple database "
                    "records. Resolve it manually first."
                ),
            }
    # 12. Apply the selected import in ONE transaction.
    imported_count = 0
    updated_count = 0
    skipped_count = 0
    try:
        # Only lock database records involved in this import.
        existing_ids = [
            conflict["existing_device_ids"][0]
            for conflict in database_conflicts
        ]
        locked_devices = {}
        if existing_ids:
            devices = (
                db.query(Device)
                .filter(Device.id.in_(existing_ids))
                .with_for_update()
                .all()
            )
            locked_devices = {
                device.id: device
                for device in devices
            }
        now = datetime.utcnow()
        for row in import_rows:
            row_number = str(row["excel_row"])
            device_data = row["data"]
            conflict = conflicts_by_row.get(
                row_number
            )
            # --------------------------------------------------
            # NEW DEVICES
            # --------------------------------------------------
            if scope == "new":
                if conflict is not None:
                    raise ValueError(
                        "A selected New Device became "
                        "an existing-device conflict."
                    )
                new_device = Device(
                    device_name=device_data["device_name"],
                    host=device_data["host"],
                    port=device_data["port"],
                    connection_type=device_data[
                        "connection_type"
                    ],
                    username=device_data["username"],
                    device_category_id=device_data[
                        "device_category_id"
                    ],
                    password_encrypted=(
                        encrypt_device_password(
                            device_data["password"]
                        )
                    ),
                    password_changed_at=now,
                    password_rotation_days=device_data.get(
                        "password_rotation_days"
                    ),
                    comments=device_data.get(
                        "comments"
                    ),
                    device_status=device_data[
                        "device_status"
                    ],
                    device_condition=device_data[
                        "device_condition"
                    ],
                    created_by=current_user["user_id"],
                    updated_by=current_user["user_id"],
                )
                db.add(new_device)
                imported_count += 1
                continue
            # --------------------------------------------------
            # EXISTING DEVICES
            # --------------------------------------------------
            if conflict is None:
                raise ValueError(
                    "A selected Existing Device is no "
                    "longer an existing-device conflict."
                )
            action = normalized_decisions.get(
                row_number
            )
            if action not in {"UPDATE", "SKIP"}:
                raise ValueError(
                    "Every selected existing-device row "
                    "must have an UPDATE or SKIP decision."
                )
            # SKIP means no database change.
            if action == "SKIP":
                skipped_count += 1
                continue
            # UPDATE the existing database record.
            device_id = conflict[
                "existing_device_ids"
            ][0]
            existing_device = locked_devices.get(
                device_id
            )
            if existing_device is None:
                raise ValueError(
                    "A conflicting device no longer exists."
                )
            # Confirm the locked record still represents the
            # same device that was detected during validation.
            expected_identity = (
                normalize_duplicate_value(
                    device_data["device_name"]
                ),
                normalize_duplicate_value(
                    device_data["host"]
                ),
            )
            current_identity = (
                normalize_duplicate_value(
                    existing_device.device_name
                ),
                normalize_duplicate_value(
                    existing_device.host
                ),
            )
            if current_identity != expected_identity:
                raise ValueError(
                    "A conflicting device changed during import."
                )
            existing_device.device_name = (
                device_data["device_name"]
            )
            existing_device.host = (
                device_data["host"]
            )
            existing_device.port = (
                device_data["port"]
            )
            existing_device.connection_type = (
                device_data["connection_type"]
            )
            existing_device.username = (
                device_data["username"]
            )
            existing_device.device_category_id = (
                device_data["device_category_id"]
            )
            existing_device.password_encrypted = (
                encrypt_device_password(
                    device_data["password"]
                )
            )
            existing_device.password_changed_at = now
            existing_device.password_rotation_days = (
                device_data.get(
                    "password_rotation_days"
                )
            )
            existing_device.comments = (
                device_data.get("comments")
            )
            existing_device.device_status = (
                device_data["device_status"]
            )
            existing_device.device_condition = (
                device_data["device_condition"]
            )
            existing_device.updated_by = (
                current_user["user_id"]
            )
            existing_device.updated_at = now
            updated_count += 1
        # Nothing is permanently written until every selected
        # row has been processed successfully.
        db.commit()
        return {
            "success": True,
            "stage": "completed",
            "scope": scope,
            "imported_count": imported_count,
            "updated_count": updated_count,
            "skipped_count": skipped_count,
            "total_processed": (
                imported_count
                + updated_count
                + skipped_count
            ),
            "message": (
                "Device import completed successfully."
            ),
        }
    except Exception:
        # Any failure rolls back the entire import operation.
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=(
                "Device import failed. "
                "All database changes were rolled back."
            ),
        )




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

    existing_project = db.query(Project).filter(
        Project.project_name == project_data.project_name
    ).first()

    if existing_project:
        raise HTTPException(
            status_code=400,
            detail="Project name already exists"
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
        project_status="Pending",
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


    # Automatically mark expired non-completed projects as Overdue
    today = date.today()

    db.query(Project).filter(
      Project.project_status == "Pending",
      Project.deadline < today
    ).update(
      {
        Project.project_status: "Overdue"
      },
      synchronize_session=False
    )

    db.commit()

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
        "Pending",
        "Completed",
        "Overdue",
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


@app.get("/dashboard/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("USER", "ADMIN", "SUPER_ADMIN")
    )
):
    from datetime import date
    today= date.today()
    
    db.query(Project).filter(
    Project.project_status == "Pending",
    Project.deadline < today
    ).update(
      {
         Project.project_status: "Overdue"
    
      },
      synchronize_session=False
    )

    db.commit()

    # =========================
    # PROJECT SUMMARY
    # =========================

    total_projects = (
        db.query(func.count(Project.id))
        .scalar()
        or 0
    )

 

    completed_projects = (
        db.query(func.count(Project.id))
        .filter(Project.project_status == "Completed")
        .scalar()
        or 0
    )

    pending_projects = (
       db.query(func.count(Project.id))
       .filter(Project.project_status == "Pending")
       .scalar()
       or 0
   )

    overdue_projects = (
      db.query(func.count(Project.id))
      .filter(Project.project_status == "Overdue")
      .scalar()
      or 0
    ) 


    


    # =========================
    # DEVICE SUMMARY
    # =========================

    total_devices = (
        db.query(func.count(Device.id))
        .scalar()
        or 0
    )

    active_devices = (
        db.query(func.count(Device.id))
        .filter(Device.device_status == "Active")
        .scalar()
        or 0
    )

    inactive_devices = (
        db.query(func.count(Device.id))
        .filter(Device.device_status == "Inactive")
        .scalar()
        or 0
    )

    reachable_devices = (
        db.query(func.count(Device.id))
        .filter(Device.device_condition == "Reachable")
        .scalar()
        or 0
    )

    unreachable_devices = (
        db.query(func.count(Device.id))
        .filter(Device.device_condition == "Unreachable")
        .scalar()
        or 0
    )

    switched_off_devices = (
        db.query(func.count(Device.id))
        .filter(Device.device_condition == "Switched Off")
        .scalar()
        or 0
    )

    unused_devices = (
        db.query(func.count(Device.id))
        .filter(Device.device_condition == "Unused")
        .scalar()
        or 0
    )


    # =========================
    # RETURN DASHBOARD SUMMARY
    # =========================

    return {
        

        "projects": {
            "total": total_projects,
            "pending": pending_projects,
            "completed": completed_projects,
            "overdue": overdue_projects,
        },

        "devices": {
            "total": total_devices,
            "active": active_devices,
            "inactive": inactive_devices,
            "reachable": reachable_devices,
            "unreachable": unreachable_devices,
            "switched_off": switched_off_devices,
            "unused": unused_devices,
        },
    }


@app.get("/dashboard/device-password-notifications")
def get_device_password_notifications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
):

    process_device_password_expiry(db)

    notifications = (
        db.query(
            DevicePasswordNotification,
            Device.device_name
        )
        .join(
            Device,
            Device.id == DevicePasswordNotification.device_id
        )
        .order_by(
            DevicePasswordNotification.created_at.desc()
        )
        .all()
    )

    result = []

    for notification, device_name in notifications:

        if notification.checkpoint == "password_changed":
            title = "Device password changed"
            description = (
                f"{device_name} — Device password was changed."
            )
            priority = "Low"

        elif notification.checkpoint == "expired":
            title = "Device password expired"
            description = (
                f"{device_name} — Password has expired."
            )
            priority = "High"

        else:
            title = "Device password expiry"
            description = (
                f"{device_name} — Password expires in "
                f"{notification.checkpoint} days."
            )
            priority = "High"


        result.append({
            "id": f"device-password-{notification.id}",
             "device_id": notification.device_id,
            "type": "Devices",
            "priority": priority,
            "title": title,
            "description": description,
            "created_at": notification.created_at,
        })

    return result




@app.get("/dashboard/project-monthly")
def get_project_monthly(
    year: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("USER", "ADMIN", "SUPER_ADMIN")
    )
):
    from datetime import date
    import calendar

    months = []

    projects = (
        db.query(Project)
        .all()
    )

    for month in range(1, 13):

        completed = 0
        pending = 0
        overdue = 0

        for project in projects:

            # Completed projects
            if (
                project.project_status == "Completed"
                and project.updated_at.year == year
                and project.updated_at.month == month
            ):
                completed += 1

            # Pending projects
            elif (
                project.project_status == "Pending"
                and project.start_date.year == year
                and project.start_date.month == month
            ):
                pending += 1

            # Overdue projects
            elif (
                project.project_status == "Overdue"
                and project.deadline.year == year
                and project.deadline.month == month
            ):
                overdue += 1

        months.append({
            "month": calendar.month_abbr[month],
            "pending": pending,
            "completed": completed,
            "overdue": overdue
        })

    return {
        "year": year,
        "months": months
    }


@app.get("/dashboard/device-monthly")
def get_device_monthly(
    year: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("USER", "ADMIN", "SUPER_ADMIN")
    )
):
    import calendar

    months = []

    devices = (
        db.query(Device)
        .all()
    )

    for month in range(1, 13):

        active = 0
        inactive = 0
        reachable = 0
        unreachable = 0
        switched_off = 0
        unused = 0

        for device in devices:

            # Use updated_at to determine the month
            if (
                device.updated_at.year == year
                and device.updated_at.month == month
            ):

                if device.device_status == "Active":
                    active += 1

                elif device.device_status == "Inactive":
                    inactive += 1

                if device.device_condition == "Reachable":
                    reachable += 1

                elif device.device_condition == "Unreachable":
                    unreachable += 1

                elif device.device_condition == "Switched Off":
                    switched_off += 1

                elif device.device_condition == "Unused":
                    unused += 1

        months.append({
            "month": calendar.month_abbr[month],
            "active": active,
            "inactive": inactive,
            "reachable": reachable,
            "unreachable": unreachable,
            "switched_off": switched_off,
            "unused": unused
        })

    return {
        "year": year,
        "months": months
    }


@app.get("/github/repositories")
def get_github_repositories_endpoint(
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
):
    try:
        return get_github_repositories()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )



#=========  DEVICE CATEGORY ===========#

@app.post(
    "/device-categories/",
    response_model=DeviceCategoryResponse
)
def create_device_category(
    category_data: DeviceCategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
):
    existing_category = db.query(DeviceCategory).filter(
        DeviceCategory.category_name == category_data.category_name
    ).first()

    if existing_category:
        raise HTTPException(
            status_code=400,
            detail="Device category already exists"
        )

    new_category = DeviceCategory(
        category_name=category_data.category_name,
        default_rotation_days=category_data.default_rotation_days,
        created_by=current_user["user_id"],
        updated_by=current_user["user_id"]
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category


@app.get("/device-categories/")
def get_device_categories(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("USER", "ADMIN", "SUPER_ADMIN")
    )
):
    total = db.query(DeviceCategory).count()

    total_pages = (
        (total + limit - 1) // limit
        if total > 0
        else 0
    )

    categories = (
        db.query(DeviceCategory)
        .order_by(DeviceCategory.category_name.asc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "data": categories,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1,
        },
    }



@app.get(
    "/device-categories/{category_id}",
    response_model=DeviceCategoryResponse
)
def get_device_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("USER", "ADMIN", "SUPER_ADMIN")
    )
):
    category = db.query(DeviceCategory).filter(
        DeviceCategory.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Device category not found"
        )

    return category


@app.put(
    "/device-categories/{category_id}",
    response_model=DeviceCategoryResponse
)
def update_device_category(
    category_id: int,
    category_data: DeviceCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
):
    category = db.query(DeviceCategory).filter(
        DeviceCategory.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Device category not found"
        )

    if category_data.category_name is not None:
        existing_category = db.query(DeviceCategory).filter(
            DeviceCategory.category_name == category_data.category_name,
            DeviceCategory.id != category_id
        ).first()

        if existing_category:
            raise HTTPException(
                status_code=400,
                detail="Device category already exists"
            )

        category.category_name = category_data.category_name

    if category_data.default_rotation_days is not None:
        category.default_rotation_days = (
            category_data.default_rotation_days
        )

    category.updated_by = current_user["user_id"]

    db.commit()
    db.refresh(category)

    return category


@app.delete("/device-categories/{category_id}")
def delete_device_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
):
    category = (
        db.query(DeviceCategory)
        .filter(DeviceCategory.id == category_id)
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Device category not found"
        )

    devices_using_category = (
        db.query(Device)
        .filter(
            Device.device_category_id == category_id
        )
        .count()
    )

    if devices_using_category > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Device category cannot be deleted because "
                "it is assigned to one or more devices."
            )
        )

    db.delete(category)
    db.commit()

    return {
        "message": "Device category deleted successfully"
    }


@app.post("/devices/password-expiry/test")
def test_device_password_expiry(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "SUPER_ADMIN")
    )
):
    created = process_device_password_expiry(db)

    return {
        "notifications_created": created
    }