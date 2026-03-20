from parsers.base import BoardingPassParser
from parsers.airlines.airindia import AirIndiaParser
from parsers.airlines.indigo import IndigoParser


class ParserFactory:
    def __init__(self):
        self.parsers = [
            IndigoParser(),
            AirIndiaParser(),
        ]

    def get_parser(self, raw_data: str) -> BoardingPassParser:
        for parser in self.parsers:
            if parser.can_handle(raw_data):
                return parser
        raise ValueError("Unsupported airline")