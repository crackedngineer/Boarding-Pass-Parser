import re
import pdfplumber


def is_valid_bcbp(data: str) -> bool:
    if not data.startswith("M1"):
        return False

    checks = [
        r"[A-Z\s]+/[A-Z]+",  # name
        r"\b(?=.*[A-Z])(?=.*\d)[A-Z0-9]{6}\b",  # PNR
        r"\b(?=.*[A-Z])(?=.*\d)[A-Z0-9]{8}\b",  # route
        r"\b[0-9]{4}\b",   # flight number
    ]

    print(all(re.search(p, data) for p in checks))
    return len(data.strip()) > 60 and all(re.search(p, data) for p in checks)


def is_scanned_pdf(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        text = "".join(page.extract_text() or "" for page in pdf.pages)
        return len(text.strip()) < 50


def extract_text_pdfplumber(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)
