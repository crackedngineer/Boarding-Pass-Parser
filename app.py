# from fastapi import FastAPI

# app = FastAPI(
#     title="Digipin Pro API",
#     version="1.0.0",
#     description="API for encoding/decoding DIGIPINs using the digipin-python library.",
# )

# @app.get("/", include_in_schema=False)
# async def root():
#     return {"message": "Welcome to the Boarding Pass Parser API. Go to /docs for API documentation."}

from pathlib import Path
from argparse import ArgumentParser

from parsers.dataclass import ParsedBoardingPass
from parsers.factory import ParserFactory

class BoardingPassService:

    def __init__(self, factory: ParserFactory):
        self.factory = factory

    def process(self, pdf_path: Path) -> ParsedBoardingPass:
        parser = self.factory.get_parser(pdf_path)
        result = parser.parse()

        return result
    
if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("-f", "--file", help="Path to the boarding pass PDF file", required=True)
    args = parser.parse_args()
    
    factory = ParserFactory()
    service = BoardingPassService(factory)

    PDF_FILE = args.file
    parsed = service.process(pdf_path=PDF_FILE)
    print(parsed)