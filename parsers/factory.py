from pathlib import Path
from parsers.base import BoardingPassParser
from parsers.airlines.akasa import AkasaParser
from parsers.airlines.indigo import IndigoParser
from parsers.airlines.generic import IATAGenericParser

class ParserFactory:
    def __init__(self):
        self.parsers = [
            IndigoParser,
            AkasaParser,
            IATAGenericParser # Default fallback parser
        ]

    def get_parser(self, pdf_path: Path) -> BoardingPassParser:
        for parser in self.parsers:
            instance = parser()
            instance.pdf_path = pdf_path
            if instance.can_handle():
                return instance
        raise ValueError("No suitable parser found for the given PDF.")