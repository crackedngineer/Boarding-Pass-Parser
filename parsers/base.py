from pathlib import Path
from abc import ABC, abstractmethod
import io
import numpy as np
from PIL import Image
import zxingcpp
import pdfplumber
from parsers.dataclass import ParsedBoardingPass
from parsers.utils import extract_text_pdfplumber, is_scanned_pdf, is_valid_bcbp

class BoardingPassParser(ABC):
    def __init__(self):
        self.raw_data = None
    
    @property
    @abstractmethod
    def airline_code(self) -> bool:
        pass
    
    def can_handle(self, pdf_path: Path) -> bool:
        if is_scanned_pdf(pdf_path):
            return False
        
        content = extract_text_pdfplumber(pdf_path)
        self.raw_data = content
        return self._can_handle(content)
    
    @abstractmethod
    def _can_handle(self, raw_data: str) -> bool:
        pass
    
    def decode_bcbp(self, image: Image.Image) -> list[str]:
        img_np = np.array(image)
        results = zxingcpp.read_barcodes(img_np)
        return [r.text.strip() for r in results if r.text]

    def extract_bcbp_barcode(self, pdf_path: Path) -> str:
        with pdfplumber.open(pdf_path) as pdf:
            for page_number, page in enumerate(pdf.pages, start=1):

                # 🔥 Render full page (IMPORTANT)
                pil_image = page.to_image(resolution=300).original

                decoded_list = self.decode_bcbp(pil_image)
                for data in decoded_list:
                    if is_valid_bcbp(data):
                        print(f"✅ Found on page {page_number}")
                        return data
        return ""

    def parse(self, pdf_path: Path) -> ParsedBoardingPass:
        if is_scanned_pdf(pdf_path):
            raise ValueError("Cannot parse scanned PDF")
        
        bp = ParsedBoardingPass(airline_code=self.airline_code)
        barcode_data = self.extract_bcbp_barcode(pdf_path)
        print("Extracted Barcode Data:", barcode_data)
        return bp
        if self.raw_data is None:
            content = extract_text_pdfplumber(pdf_path)
        return self._parse_content(bp, content)
        
    @abstractmethod
    def _parse_content(self, bp: ParsedBoardingPass, content: str) -> ParsedBoardingPass:
        pass