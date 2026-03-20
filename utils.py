import pdfplumber

def is_scanned_pdf(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        text = "".join(page.extract_text() or "" for page in pdf.pages)
        return len(text.strip()) < 50

def extract_text_pdfplumber(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)
