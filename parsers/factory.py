from pathlib import Path
from parsers.base import BoardingPassParser
from parsers.airlines.akasa import AkasaParser
from parsers.airlines.indigo import IndigoParser
from parsers.airlines.generic import IATAGenericParser

class ParserFactory:
    def __init__(self):
        self.parsers = [
            IndigoParser(),
            AkasaParser(),
        ]

    def get_parser(self, pdf_path: Path) -> BoardingPassParser:
        for parser in self.parsers:
            if parser.can_handle(pdf_path):
                return parser
        raise IATAGenericParser()