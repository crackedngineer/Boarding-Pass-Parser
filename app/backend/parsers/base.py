"""
Abstract base class for boarding pass parsers.
Defines the interface and common functionality for all airline parsers.
"""

from abc import ABC, abstractmethod
from parsers.dataclass import ParsedBoardingPass
from parsers.utils import extract_text_pdfplumber
from core.exceptions import BoardingPassParsingException
import logging


class BoardingPassParser(ABC):
    """Abstract base class for all boarding pass parsers."""
    
    airline_code: str
    airline_name: str = ""
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def can_handle(self, raw_data: str) -> bool:
        """
        Check if this parser can handle the given boarding pass data.
        
        Args:
            raw_data: Raw text extracted from boarding pass PDF
            
        Returns:
            True if this parser can handle the data, False otherwise
        """
        try:
            return self._can_handle(raw_data)
        except Exception as e:
            self.logger.error(f"Error in can_handle check: {str(e)}")
            return False
    
    @abstractmethod
    def _can_handle(self, raw_data: str) -> bool:
        """
        Internal method to check if parser can handle the data.
        Must be implemented by subclasses.
        """
        pass

    def parse(self, raw_data: str, bcbp_details: dict) -> ParsedBoardingPass:
        """
        Parse boarding pass data and return structured information.
        
        Args:
            raw_data: Raw text data from PDF
            bcbp_details: Details extracted from BCBP barcode
            
        Returns:
            Parsed boarding pass data
            
        Raises:
            BoardingPassParsingException: If parsing fails
        """
        try:
            self.logger.info(f"Parsing boarding pass with {self.__class__.__name__}")
            
            bp_obj = ParsedBoardingPass(**bcbp_details)
            result = self._parse_content(raw_data, bp_obj)
            
            if not result:
                raise BoardingPassParsingException("Parser returned empty result")
                
            self.logger.info("Successfully parsed boarding pass data")
            return result
            
        except BoardingPassParsingException:
            raise
        except Exception as e:
            self.logger.error(f"Parsing error in {self.__class__.__name__}: {str(e)}")
            raise BoardingPassParsingException(
                f"Failed to parse boarding pass with {self.airline_name or self.__class__.__name__}: {str(e)}"
            )
        
    @abstractmethod
    def _parse_content(self, raw_data: str, bp_obj: ParsedBoardingPass) -> ParsedBoardingPass:
        """
        Internal method to parse boarding pass content.
        Must be implemented by subclasses.
        
        Args:
            raw_data: Raw text data
            bp_obj: Base boarding pass object with BCBP data
            
        Returns:
            Enhanced boarding pass object with parsed data
        """
        pass