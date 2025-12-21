from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from typing import Optional, Any, Dict
import json
import logging

from datetime import date, datetime

logger = logging.getLogger(__name__)

def sanitize_for_json(data: Any) -> Any:
    """
    Recursively convert date/datetime objects to ISO strings for JSON serialization.
    """
    if isinstance(data, dict):
        return {k: sanitize_for_json(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_for_json(v) for v in data]
    elif isinstance(data, (date, datetime)):
        return data.isoformat()
    return data

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
            details=sanitize_for_json(details) if details else None,
            ip_address=ip_address
        )
        db.add(audit_log)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")
        db.rollback()
        # Don't raise exception to avoid breaking the main flow
