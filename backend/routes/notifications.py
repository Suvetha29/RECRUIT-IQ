from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Notification
from routes.auth_deps import get_current_user

router = APIRouter()

# Get all notifications for current user
@router.get("/api/notifications")
def get_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(20).all()

    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        }
        for n in notifications
    ]

# Mark all as read
@router.patch("/api/notifications/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}

# Mark single as read
@router.patch("/api/notifications/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if notification:
        notification.is_read = True
        db.commit()
    return {"message": "Marked as read"}

# Helper to create notification (called from other routes)
def create_notification(db: Session, user_id: int, title: str, message: str):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message
    )
    db.add(notification)
    db.commit()