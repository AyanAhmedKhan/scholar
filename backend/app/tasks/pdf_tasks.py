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
    Converts Images (JPG, PNG) to PDF before merging.
    Returns base64 encoded string or bytes (Celery handles serialization).
    """
    if not file_paths:
        logger.error("No file paths provided for PDF merge")
        return "Error: No file paths provided"
    
    merger = PdfMerger()
    merged_count = 0
    temp_files = [] # Keep track to delete later if needed (though we use BytesIO or temp file, PyPDF2 usually needs file)
    
    try:
        from PIL import Image
        import tempfile
        
        for path in file_paths:
            # Construct full path
            clean_path = path.lstrip("/").lstrip("\\")
            # If path already starts with media dir (common if stored as relative path), don't prepend it again if it duplicates
            if clean_path.startswith(f"{settings.MEDIA_DIR}/") or clean_path.startswith(f"{settings.MEDIA_DIR}\\"):
                 full_path = clean_path
            else:
                 full_path = os.path.join(settings.MEDIA_DIR, clean_path)
            
            # Absolute path check (if running from backend root, full_path is relative)
            if not os.path.exists(full_path):
                 # Try removing the 'media' prefix from clean path if it exists, maybe it was meant to be joined?
                 # Case: stored "/media/foo.jpg", MEDIA_DIR="media"
                 # clean="media/foo.jpg"
                 # JOIN -> "media/media/foo.jpg" (WRONG)
                 # We want "media/foo.jpg"
                 pass

            # Better Logic:
            # 1. Strip basic slashed
            # 2. Check if clean_path starts with MEDIA_DIR name. 
            #    If YES: assume it is already relative to ROOT.
            #    If NO: prepend MEDIA_DIR.
            
            clean_path = path.lstrip("/").lstrip("\\")
            
            parts = clean_path.replace("\\", "/").split("/")
            if parts[0] == settings.MEDIA_DIR:
                full_path = clean_path
            else:
                full_path = os.path.join(settings.MEDIA_DIR, clean_path)
                
            abs_path = os.path.abspath(full_path)
            logger.info(f"Processing for merge: {full_path} (Absolute: {abs_path})")
            
            if os.path.exists(full_path):
                file_lower = path.lower()
                
                if file_lower.endswith('.pdf'):
                    try:
                        merger.append(full_path)
                        merged_count += 1
                        logger.info(f"Added PDF: {full_path}")
                    except Exception as e:
                        logger.error(f"Failed to merge PDF {full_path}: {str(e)}")
                        continue
                        
                elif file_lower.endswith(('.jpg', '.jpeg', '.png')):
                    try:
                        # Convert Image to PDF
                        image = Image.open(full_path)
                        if image.mode != 'RGB':
                            image = image.convert('RGB')
                        
                        # Save to a temp file
                        fd, temp_pdf_path = tempfile.mkstemp(suffix=".pdf")
                        os.close(fd)
                        
                        image.save(temp_pdf_path, "PDF", resolution=100.0)
                        
                        merger.append(temp_pdf_path)
                        temp_files.append(temp_pdf_path) # Mark for deletion
                        merged_count += 1
                        logger.info(f"Converted and added Image: {full_path}")
                        
                    except Exception as e:
                        logger.error(f"Failed to convert/merge Image {full_path}: {str(e)}")
                        continue
                else:
                    logger.warning(f"Skipping unsupported file: {full_path}")
                    continue
            else:
                logger.warning(f"File not found: {full_path}")
                continue
        
        if merged_count == 0:
            logger.error("No documents were successfully merged")
            return "Error: No valid documents found to merge"
        
        logger.info(f"Successfully merged {merged_count} documents")
        output_buffer = io.BytesIO()
        merger.write(output_buffer)
        merger.close()
        
        # Cleanup temp files
        for tmp in temp_files:
            try:
                os.remove(tmp)
            except: pass
        
        pdf_bytes = output_buffer.getvalue()
        logger.info(f"Generated merge size: {len(pdf_bytes)} bytes")
        
        return pdf_bytes
    except Exception as e:
        logger.error(f"Merge task error: {str(e)}", exc_info=True)
        # Cleanup
        for tmp in temp_files:
            try: os.remove(tmp)
            except: pass
        return f"Error: {str(e)}"
