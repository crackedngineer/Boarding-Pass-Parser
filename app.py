# from fastapi import FastAPI

# app = FastAPI(
#     title="Digipin Pro API",
#     version="1.0.0",
#     description="API for encoding/decoding DIGIPINs using the digipin-python library.",
# )

# @app.get("/", include_in_schema=False)
# async def root():
#     return {"message": "Welcome to the Boarding Pass Parser API. Go to /docs for API documentation."}

import os

from parsers.dataclass import ParsedBoardingPass
from parsers.factory import ParserFactory

class BoardingPassService:

    def __init__(self, factory: ParserFactory):
        self.factory = factory

    def process(self, pdf_path: str) -> ParsedBoardingPass:
        parser = self.factory.get_parser(pdf_path)
        result = parser.parse(pdf_path=pdf_path)

        return result
    
if __name__ == "__main__":
    factory = ParserFactory()
    service = BoardingPassService(factory)

    PDF_FILE = os.path.join("samples", "gofirst_sample_0.pdf")
    parsed = service.process(pdf_path=PDF_FILE)
    print(parsed)