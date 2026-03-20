from parsers.base import BoardingPassParser
from parsers.dataclass import ParsedBoardingPass

class AkasaParser(BoardingPassParser):
    airline_code = "AI"

    def _can_handle(self, raw_data: str) -> bool:
        return True
    
    def _parse_content(self, bp: ParsedBoardingPass, raw_data: str) -> ParsedBoardingPass:
        bp.airline_code = self.airline_code
        return bp