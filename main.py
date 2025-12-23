import pdfplumber

def is_scanned_pdf(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        text = "".join(page.extract_text() or "" for page in pdf.pages)
        return len(text.strip()) < 50

def extract_text_pdfplumber(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)

from PIL import Image
import zxingcpp

def decode_bcbp(image_path: str) -> str | None:
    image = Image.open(image_path).convert("RGB")

    results = zxingcpp.read_barcodes(image)

    for r in results:
        if r.text:
            return r.text.strip()

    return None

if __name__ == "__main__":
    PDF_FILE = "BoardingPass-Journey12752557598206647-R4KUVC.pdf"
    if not is_scanned_pdf(PDF_FILE):
        content = extract_text_pdfplumber(PDF_FILE)
        # print(content)

    import pdfplumber
    import os

    output_dir = "."

    os.makedirs(output_dir, exist_ok=True)

    img_count = 0
    MIN_SIZE = 40      # points
    MAX_SIZE = 120     # points
    ASPECT_TOL = 0.15  # square tolerance

    with pdfplumber.open(PDF_FILE) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            for img in page.images:
                w = img["width"]
                h = img["height"]

                # 1️⃣ size filter
                if not (MIN_SIZE <= w <= MAX_SIZE and MIN_SIZE <= h <= MAX_SIZE):
                    continue

                # 2️⃣ square-ish filter
                aspect_ratio = w / h if h else 0
                if not (1 - ASPECT_TOL <= aspect_ratio <= 1 + ASPECT_TOL):
                    continue

                # 3️⃣ crop using correct bbox
                bbox = (img["x0"], img["top"], img["x1"], img["bottom"])
                cropped = page.crop(bbox).to_image(resolution=300)

                filename = f"page{page_number}_bcbp_qr_{img_count}.png"
                cropped.save(os.path.join(output_dir, filename))

                bcbp_string = decode_bcbp(os.path.join(output_dir, filename))
                print(bcbp_string)

                print(f"✅ BCBP candidate saved: {filename}")
                img_count += 1

    print(f"🎯 Extracted {img_count} BCBP QR candidates")