import os
import PyPDF2
import tempfile

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file"""
    text = ""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
    return text

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file - simplified version"""
    text = ""
    try:
        # Try to import docx2txt, if not available return empty string
        import docx2txt
        text = docx2txt.process(file_path)
    except ImportError:
        # Fallback method - just read as binary and return basic info
        text = f"[DOCX file: {os.path.basename(file_path)}]"
    except Exception as e:
        print(f"Error extracting DOCX text: {e}")
    return text

def extract_text_from_resume(file_path: str) -> str:
    """Extract text from resume based on file extension"""
    if not os.path.exists(file_path):
        return ""
    
    file_extension = os.path.splitext(file_path)[1].lower()
    
    if file_extension == '.pdf':
        return extract_text_from_pdf(file_path)
    elif file_extension == '.docx':
        return extract_text_from_docx(file_path)
    else:
        return f"[Unsupported file format: {file_extension}]"