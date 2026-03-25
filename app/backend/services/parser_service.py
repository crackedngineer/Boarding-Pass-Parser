from parsers.dataclass import ParsedBoardingPass
from parsers.factory import ParserFactory
from parsers.bcbp_decoder import extract_bcbp_barcode, parse_bcbp_barcode
from parsers.utils import extract_text_pdfplumber


class BoardingPassService:
    def __init__(self, factory: ParserFactory):
        self.factory = factory

    def process(self, pdf_bytes: bytes) -> ParsedBoardingPass:
        # Decode BCBP barcode and extract details
        bcbp_barcode = extract_bcbp_barcode(pdf_bytes)
        if not bcbp_barcode:
            raise ValueError("Invalid or missing BCBP barcode")

        bcbp_details = parse_bcbp_barcode(bcbp_barcode)

        raw_data = extract_text_pdfplumber(pdf_bytes)
        parser = self.factory.get_parser(
            bcbp_details.get("operator_code", None), raw_data
        )
        result = parser.parse(raw_data, bcbp_details)
        return result