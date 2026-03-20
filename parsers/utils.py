import re

def is_valid_bcbp(data: str) -> bool:
    pattern = (
        r"^M1"                         # format code
        r"[A-Z]+/[A-Z]+/[A-Z]\s+"      # NAME (LAST/FIRST/TITLE)
        r"[A-Z0-9]{6}\s+"              # PNR
        r"[A-Z]{3}[A-Z]{3}"            # FROM + TO
        r"[A-Z0-9]{2}\s?\d{3,4}"       # airline + flight
    )
    return len(data.strip()) > 60 and re.search(pattern, data) is not None