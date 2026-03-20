from parsers.base import BoardingPassParser
from parsers.dataclass import ParsedBoardingPass

class AkasaParser(BoardingPassParser):
    def __init__(self):
        self.airline_code = "AI"
        super().__init__()
        
    def _can_handle(self, raw_data: str) -> bool:
        return True
    
    def _parse_content(self, raw_data: str) -> ParsedBoardingPass:
        self.bp_details.airline_code = self.airline_code
        return self.bp_details