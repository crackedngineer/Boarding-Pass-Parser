# from fastapi import FastAPI

# app = FastAPI(
#     title="Digipin Pro API",
#     version="1.0.0",
#     description="API for encoding/decoding DIGIPINs using the digipin-python library.",
# )

# @app.get("/", include_in_schema=False)
# async def root():
#     return {"message": "Welcome to the Boarding Pass Parser API. Go to /docs for API documentation."}

from parsers.dataclass import ParsedBoardingPass
from parsers.factory import ParserFactory
from utils import extract_text_pdfplumber, is_scanned_pdf

class BoardingPassService:

    def __init__(self, factory: ParserFactory):
        self.factory = factory

    def process(self, content: str, pdf_path: str) -> ParsedBoardingPass:
        parser = self.factory.get_parser(content)
        result = parser.parse(content, pdf_path=pdf_path)

        return result
    
if __name__ == "__main__":
    factory = ParserFactory()
    service = BoardingPassService(factory)

    PDF_FILE = "0_700630908.pdf"
    if not is_scanned_pdf(PDF_FILE):
        content = extract_text_pdfplumber(PDF_FILE)
        parsed = service.process(content, pdf_path=PDF_FILE)
        print(parsed)