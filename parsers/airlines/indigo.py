import re
import pytz
from datetime import datetime
from parsers.base import BoardingPassParser
from parsers.dataclass import ParsedBoardingPass

class IndigoParser(BoardingPassParser):
    def __init__(self):
        self.airline_code = "6E"
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

    def _can_handle(self, raw_data: str) -> bool:
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

    def _parse_content(self, raw_data: str) -> ParsedBoardingPass:
        # Remove duplicates
        raw_data = self.deduplicate_block(raw_data)
        raw_data = self.deduplicate_text(raw_data)
        print("Deduplicated Data:\n", raw_data)

        # Pnr Code
        if not self.bp_details.pnr_code:
            pnr_match = re.search(r"\bPNR\s+?([A-Z0-9]{6})\b", raw_data, re.IGNORECASE)
            if pnr_match:
                self.bp_details.pnr_code = pnr_match.group(1).upper()

        # Passenger Name
        if not self.bp_details.passenger_firstname or not self.bp_details.passenger_lastname:
            name_match = re.search(r"[A-Z]+/[A-Z]+\s+(MRS|MR|MS|MSTR|DR)", raw_data)
            if name_match:
                fullname = name_match.group(0).split("/")
                self.bp_details.passenger_firstname = str(re.sub('(MRS|MR|MS|MSTR|DR)$','',fullname[1]).replace(" ", ""))
                self.bp_details.passenger_lastname = str(fullname[0].replace(" ", ""))
        
        # Flight Number
        if not self.bp_details.flight_number:
            flight_match = re.search(rf"\b{self.airline_code}\s?(\d{{3,4}})\b", raw_data, re.IGNORECASE)
            if flight_match:
                self.bp_details.flight_number = flight_match.group(1)
        
        # Route
        if not self.bp_details.origin or not self.bp_details.destination:
            route_match = re.search(r"\n([A-Z]+(?:\s[A-Z]+)*)\s+\(T\d\)\s+To\s+([A-Z]+(?:\s[A-Z]+)*)\n", raw_data, re.IGNORECASE)
            if route_match:
                self.bp_details.origin = route_match.group(1).strip()
                self.bp_details.destination = route_match.group(2).strip()
        
        # Seat
        if not self.bp_details.seat_number:
            seat_match = re.search(r"\bSeat\s+([A-Z]?\d{1,2}[A-F]?)\b", raw_data, re.IGNORECASE)
            if seat_match:
                self.bp_details.seat_number = seat_match.group(1)
        
        # Boarding Group
        if not self.bp_details.boarding_group:
            group_match = re.search(r"Zone\s+(\d+)", raw_data, re.IGNORECASE)
            if group_match:
                self.bp_details.boarding_group = group_match.group(1)
        
        # Departure Date Time
        date_match = re.search(r"Date\s+(\d{2}\s+[A-Za-z]{3}\s+\d{4})", raw_data)
        time_match = re.search(r"Departure\s+(\d{3,4})\s*Hrs", raw_data)
        if date_match and time_match:
            self.bp_details.departure_time = self.parse_departure_datetime(date_match.group(1), time_match.group(1))

        return self.bp_details