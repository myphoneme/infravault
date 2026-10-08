from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.model import (
    Device,
    DeviceCategory,
    DevicePasswordNotification,
)


EXPIRY_CHECKPOINTS = {
    15: "15",
    10: "10",
    7: "7",
    3: "3",
    0: "expired",
}


def get_effective_rotation_days(
    device: Device,
    category: DeviceCategory,
) -> int:
    return (
        device.password_rotation_days
        if device.password_rotation_days is not None
        else category.default_rotation_days
    )


def process_device_password_expiry(
    db: Session,
):
    now = datetime.utcnow()

    devices = (
        db.query(Device)
        .join(
            DeviceCategory,
            Device.device_category_id == DeviceCategory.id,
        )
        .all()
    )

    notifications_created = 0

    for device in devices:
        category = (
            db.query(DeviceCategory)
            .filter(
                DeviceCategory.id == device.device_category_id
            )
            .first()
        )

        if not category:
            continue

        rotation_days = get_effective_rotation_days(
            device,
            category,
        )

        expiry_date = (
            device.password_changed_at
            + timedelta(days=rotation_days)
        )

        remaining = expiry_date.date() - now.date()
        days_remaining = remaining.days

        checkpoint = None

        if days_remaining <= 0:
            checkpoint = "expired"

        elif days_remaining <= 3:
            checkpoint = "3"

        elif days_remaining <= 7:
            checkpoint = "7"

        elif days_remaining <= 10:
            checkpoint = "10"

        elif days_remaining <= 15:
            checkpoint = "15"

        if checkpoint is None:
            continue

        cycle_started_at = device.password_changed_at

        existing = (
            db.query(DevicePasswordNotification)
            .filter(
                DevicePasswordNotification.device_id
                == device.id,
                DevicePasswordNotification.password_cycle_started_at
                == cycle_started_at,
                DevicePasswordNotification.checkpoint
                == checkpoint,
            )
            .first()
        )

        if existing:
            continue

        notification = DevicePasswordNotification(
            device_id=device.id,
            password_cycle_started_at=cycle_started_at,
            checkpoint=checkpoint,
        )

        db.add(notification)
        notifications_created += 1

    db.commit()

    return notifications_created