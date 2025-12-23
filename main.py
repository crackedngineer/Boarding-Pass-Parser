import pdfplumber

def is_scanned_pdf(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        text = "".join(page.extract_text() or "" for page in pdf.pages)
        return len(text.strip()) < 50

def extract_text_pdfplumber(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)




if __name__ == "__main__":
    PDF_FILE = "BoardingPass-Journey12752557598206647-R4KUVC.pdf"
    if not is_scanned_pdf(PDF_FILE):
        content = extract_text_pdfplumber(PDF_FILE)
        print(content)