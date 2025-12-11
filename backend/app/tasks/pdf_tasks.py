from celery import shared_task
from PyPDF2 import PdfMerger
import io
import os
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

@shared_task
def merge_pdfs_task(file_paths: list[str]):
    """
    Merge PDFs from given file paths.
    Returns base64 encoded string or bytes (Celery handles serialization).
    """
    if not file_paths:
        logger.error("No file paths provided for PDF merge")
        return "Error: No file paths provided"
    
    merger = PdfMerger()
    merged_count = 0
    
    try:
        for path in file_paths:
            # Construct full path
            # Remove leading slash so os.path.join doesn't treat it as absolute
            clean_path = path.lstrip("/").lstrip("\\")
            full_path = os.path.join(settings.MEDIA_DIR, clean_path)
            logger.info(f"Attempting to merge: {full_path}")
            
            if os.path.exists(full_path):
                # Check for PDF extension
                if not path.lower().endswith('.pdf'):
                    logger.warning(f"Skipping non-PDF file: {full_path}")
                    # Optional: Add a placeholder page saying "File not included" could go here
                    continue

                try:
                    merger.append(full_path)
                    merged_count += 1
                    logger.info(f"Successfully added: {full_path}")
                except Exception as e:
                    logger.error(f"Failed to merge {full_path}: {str(e)}")
                    # Continue merging other files instead of failing completely
                    continue
            else:
                logger.warning(f"File not found: {full_path}")
                # Continue instead of failing
                continue
        
        if merged_count == 0:
            logger.error("No PDFs were successfully merged")
            return "Error: No valid PDFs found to merge"
        
        logger.info(f"Successfully merged {merged_count} PDFs")
        output_buffer = io.BytesIO()
        merger.write(output_buffer)
        merger.close()
        
        pdf_bytes = output_buffer.getvalue()
        logger.info(f"Generated PDF size: {len(pdf_bytes)} bytes")
        
        # Return bytes
        return pdf_bytes
    except Exception as e:
        logger.error(f"PDF merge task error: {str(e)}", exc_info=True)
        return f"Error: {str(e)}"
