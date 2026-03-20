from abc import ABC, abstractmethod
from parsers.dataclass import ParsedBoardingPass

class BoardingPassParser(ABC):
    airline_code = None

    @abstractmethod
    def can_handle(self, raw_data: str) -> bool:
        pass

    @abstractmethod
    def parse(self, raw_data: str, *args, **kwargs) -> ParsedBoardingPass:
        pass