from pathlib import Path
import pdfplumber


def is_valid_bcbp(data: str) -> bool:
    if not data.startswith("M1") or len(data) < 60:
        return False
    return True


def is_pdf_valid(pdf_path: Path) -> bool:
    with pdfplumber.open(pdf_path) as pdf:
        text = "".join(page.extract_text() or "" for page in pdf.pages)
        return len(text.strip()) >= 50


def extract_text_pdfplumber(pdf_path: Path) -> str:
    with pdfplumber.open(pdf_path) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)
