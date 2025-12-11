from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from typing import Optional, Any, Dict
import json
import logging

logger = logging.getLogger(__name__)

def log_action(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
):
    """
    Log an action to the audit trail.
    """
    try:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id else None,
            details=details,
            ip_address=ip_address
        )
        db.add(audit_log)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")
        # Don't raise exception to avoid breaking the main flow
