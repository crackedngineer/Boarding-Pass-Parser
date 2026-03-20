from parsers.base import BoardingPassParser
from parsers.dataclass import ParsedBoardingPass

class AirIndiaParser(BoardingPassParser):
    airline_code = "AI"

    def can_handle(self, raw_data: str) -> bool:
        return raw_data.startswith("AI")

    def parse(self, raw_data: str) -> ParsedBoardingPass:
        # Example parsing logic (dummy)
        return ParsedBoardingPass(
            airline_code="AI",
            flight_number=raw_data[2:6],
            origin=raw_data[6:9],
            destination=raw_data[9:12],
            seat_number=raw_data[-4:]
        )