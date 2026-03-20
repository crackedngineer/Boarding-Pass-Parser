from parsers.base import BoardingPassParser
from parsers.dataclass import ParsedBoardingPass

class IATAGenericParser(BoardingPassParser):
    def __init__(self):
        super().__init__()
        
    def _can_handle(self, raw_data: str) -> bool:
        return True

    def _parse_content(self, bp: ParsedBoardingPass, raw_data: str) -> ParsedBoardingPass:
        return bp