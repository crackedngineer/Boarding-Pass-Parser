import io
import re
import pytz
import pdfplumber
from datetime import datetime
from pathlib import Path
import zxingcpp
import numpy as np
from PIL import Image
from parsers.base import BoardingPassParser
from parsers.dataclass import ParsedBoardingPass
from parsers.utils import is_valid_bcbp

class IndigoParser(BoardingPassParser):
    airline_code = "6E"

    def __init__(self):
        super().__init__()
    
    def deduplicate_block(self, raw_data: str) -> str:
        blocks = raw_data.split("Boarding Pass (Web Checkin)")
        seen = set()
        unique_blocks = []

        for block in blocks:
            block = block.strip()
            if block and block not in seen:
                seen.add(block)
                unique_blocks.append(block)
        return "Boarding Pass (Web Checkin)".join(unique_blocks)

    def deduplicate_text(self, raw_data: str) -> str:
        lines = raw_data.splitlines()
        seen = set()
        unique_lines = []

        for line in lines:
            line = line.strip()
            if line and line not in seen:
                seen.add(line)
                unique_lines.append(line)
        return "\n".join(unique_lines)

    def can_handle(self, raw_data: str) -> bool:
        return re.search(rf"\b{self.airline_code}\s?\d{{3,4}}\b", raw_data) is not None
    
    def parse_departure_datetime(self, date_str: str, time_str: str) -> str:
        # Convert time to HH:MM
        time_str = time_str.zfill(4)          # ensure 4 digits
        time_formatted = f"{time_str[:2]}:{time_str[2:]}"  # "19:00"

        # Combine
        dt = datetime.strptime(f"{date_str} {time_formatted}", "%d %b %Y %H:%M")
        tz = pytz.timezone("Asia/Kolkata")
        dt = tz.localize(dt)
        return dt.isoformat()

    def decode_bcbp(self, image: Image.Image) -> str:
        img_np = np.array(image)
        results = zxingcpp.read_barcodes(img_np)
        for r in results:
            if r.text:
                return r.text.strip()
        return ""

    def get_iata_barcode(self, pdf_path: Path) -> str:
        with pdfplumber.open(pdf_path) as pdf:
            for page_number, page in enumerate(pdf.pages, start=1):
                
                # Extract images properly
                for img in page.images:
                    try:
                        # Get raw image bytes
                        # obj = page.objects["image"][img["name"]]
                        image_bytes = img["stream"].get_data()

                        # Convert to PIL
                        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

                        # Decode
                        bcbp_string = self.decode_bcbp(image)
                        if is_valid_bcbp(bcbp_string):
                            return bcbp_string

                    except Exception as e:
                        continue  # skip bad images
        return ""

    def parse(self, raw_data: str, pdf_path: Path) -> ParsedBoardingPass:
        bp = ParsedBoardingPass(airline_code=self.airline_code)
        
        barcode_data = self.get_iata_barcode(pdf_path)
        print("Extracted Barcode Data:", barcode_data)
        return ParsedBoardingPass()  # Temporary return for testing

        # Remove duplicates
        raw_data = self.deduplicate_block(raw_data)
        raw_data = self.deduplicate_text(raw_data)
        print("Deduplicated Data:\n", raw_data)

        # Pnr Code
        pnr_match = re.search(r"\bPNR\s+?([A-Z0-9]{6})\b", raw_data, re.IGNORECASE)
        if pnr_match:
            bp.pnr_code = pnr_match.group(1).upper()

        # Passenger Name
        name_match = re.search(r"[A-Z]+/[A-Z]+\s+(MR|MRS|MS|MSTR)", raw_data)
        if name_match:
            bp.passenger_name = name_match.group(0)
        
        # Flight Number
        flight_match = re.search(rf"\b{self.airline_code}\s?(\d{{3,4}})\b", raw_data, re.IGNORECASE)
        if flight_match:
            bp.flight_number = flight_match.group(1)
        
        # Route
        route_match = re.search(r"\n([A-Z]+(?:\s[A-Z]+)*)\s+\(T\d\)\s+To\s+([A-Z]+(?:\s[A-Z]+)*)\n", raw_data, re.IGNORECASE)
        if route_match:
            bp.origin = route_match.group(1).strip()
            bp.destination = route_match.group(2).strip()
        
        # Seat
        seat_match = re.search(r"\bSeat\s+([A-Z]?\d{1,2}[A-F]?)\b", raw_data, re.IGNORECASE)
        if seat_match:
            bp.seat_number = seat_match.group(1)
        
        # Boarding Group
        group_match = re.search(r"Zone\s+(\d+)", raw_data, re.IGNORECASE)
        if group_match:
            bp.boarding_group = group_match.group(1)
        
        # Departure Date Time
        date_match = re.search(r"Date\s+(\d{2}\s+[A-Za-z]{3}\s+\d{4})", raw_data)
        time_match = re.search(r"Departure\s+(\d{3,4})\s*Hrs", raw_data)
        if date_match and time_match:
            bp.departure_time = self.parse_departure_datetime(date_match.group(1), time_match.group(1))

        return bp