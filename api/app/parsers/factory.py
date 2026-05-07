from typing import Optional
from app.parsers.base import BoardingPassParser
from app.parsers.airlines.akasa import AkasaParser
from app.parsers.airlines.indigo import IndigoParser
from app.parsers.airlines.generic import IATAGenericParser
from app.parsers.enum import AirlineCodeEnum


class ParserFactory:
    def __init__(self) -> None:
        self._parsers: dict[str, type[BoardingPassParser]] = {
            AirlineCodeEnum.INDIGO.value: IndigoParser,
            AirlineCodeEnum.AKASA_AIR.value: AkasaParser,
        }

    def get_parser(self, operator_code: Optional[str], raw_data: str) -> BoardingPassParser:
        """Return the best parser for the given operator code, falling back to generic."""
        if operator_code:
            parser_cls = self._parsers.get(operator_code.strip().upper())
            if parser_cls:
                return parser_cls()
        else:
            for parser_cls in self._parsers.values():
                instance = parser_cls()
                if instance.can_handle(raw_data):
                    return instance
        return IATAGenericParser()