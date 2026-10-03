"""
UpayAche — Synthetic Location Generator.
Generates realistic administrative divisions, districts, thanas, coordinates,
and regional risk profiles across Bangladesh.
Zero real customer PII.
"""

import uuid
from typing import List, Dict, Any

BANGLADESH_LOCATIONS = [
    # Dhaka Division
    {
        "location_code": "LOC-DHK-DHN",
        "division": "Dhaka",
        "district": "Dhaka",
        "thana_or_upazila": "Dhanmondi",
        "latitude": 23.746100,
        "longitude": 90.374200,
        "ip_subnet": "103.205.71.0/24",
        "is_high_risk_zone": False
    },
    {
        "location_code": "LOC-DHK-MIR",
        "division": "Dhaka",
        "district": "Dhaka",
        "thana_or_upazila": "Mirpur",
        "latitude": 23.822300,
        "longitude": 90.365400,
        "ip_subnet": "103.205.72.0/24",
        "is_high_risk_zone": False
    },
    {
        "location_code": "LOC-DHK-GLS",
        "division": "Dhaka",
        "district": "Dhaka",
        "thana_or_upazila": "Gulshan",
        "latitude": 23.792500,
        "longitude": 90.407800,
        "ip_subnet": "103.205.73.0/24",
        "is_high_risk_zone": False
    },
    {
        "location_code": "LOC-DHK-UTT",
        "division": "Dhaka",
        "district": "Dhaka",
        "thana_or_upazila": "Uttara",
        "latitude": 23.875900,
        "longitude": 90.379500,
        "ip_subnet": "103.205.74.0/24",
        "is_high_risk_zone": False
    },
    {
        "location_code": "LOC-DHK-MOT",
        "division": "Dhaka",
        "district": "Dhaka",
        "thana_or_upazila": "Motijheel",
        "latitude": 23.733000,
        "longitude": 90.417200,
        "ip_subnet": "103.205.75.0/24",
        "is_high_risk_zone": False
    },
    {
        "location_code": "LOC-DHK-GAZ",
        "division": "Dhaka",
        "district": "Gazipur",
        "thana_or_upazila": "Joydebpur",
        "latitude": 24.002300,
        "longitude": 90.426400,
        "ip_subnet": "103.205.76.0/24",
        "is_high_risk_zone": False
    },

    # Chittagong Division
    {
        "location_code": "LOC-CTG-AGR",
        "division": "Chittagong",
        "district": "Chittagong",
        "thana_or_upazila": "Agrabad",
        "latitude": 22.327400,
        "longitude": 91.812200,
        "ip_subnet": "118.179.80.0/24",
        "is_high_risk_zone": False
    },
    {
        "location_code": "LOC-CTG-NAS",
        "division": "Chittagong",
        "district": "Chittagong",
        "thana_or_upazila": "Nasirabad",
        "latitude": 22.366700,
        "longitude": 91.822200,
        "ip_subnet": "118.179.81.0/24",
        "is_high_risk_zone": False
    },
    {
        "location_code": "LOC-CXB-SDR",
        "division": "Chittagong",
        "district": "Cox's Bazar",
        "thana_or_upazila": "Cox's Bazar Sadar",
        "latitude": 21.427200,
        "longitude": 92.005800,
        "ip_subnet": "118.179.82.0/24",
        "is_high_risk_zone": False
    },
    {
        "location_code": "LOC-CXB-TEK",
        "division": "Chittagong",
        "district": "Cox's Bazar",
        "thana_or_upazila": "Teknaf Border Outpost",
        "latitude": 20.865400,
        "longitude": 92.298100,
        "ip_subnet": "45.112.58.0/24",
        "is_high_risk_zone": True
    },

    # Sylhet Division
    {
        "location_code": "LOC-SYL-ZIN",
        "division": "Sylhet",
        "district": "Sylhet",
        "thana_or_upazila": "Zindabazar",
        "latitude": 24.894900,
        "longitude": 91.868700,
        "ip_subnet": "119.30.34.0/24",
        "is_high_risk_zone": False
    },
    {
        "location_code": "LOC-SYL-SRE",
        "division": "Sylhet",
        "district": "Moulvibazar",
        "thana_or_upazila": "Sreemangal",
        "latitude": 24.306500,
        "longitude": 91.729600,
        "ip_subnet": "119.30.35.0/24",
        "is_high_risk_zone": False
    },

    # Rajshahi Division
    {
        "location_code": "LOC-RAJ-SHB",
        "division": "Rajshahi",
        "district": "Rajshahi",
        "thana_or_upazila": "Shaheb Bazar",
        "latitude": 24.363600,
        "longitude": 88.624100,
        "ip_subnet": "103.108.140.0/24",
        "is_high_risk_zone": False
    },
    {
        "location_code": "LOC-BOG-SDR",
        "division": "Rajshahi",
        "district": "Bogra",
        "thana_or_upazila": "Bogra Sadar",
        "latitude": 24.846500,
        "longitude": 89.377300,
        "ip_subnet": "103.108.141.0/24",
        "is_high_risk_zone": False
    },

    # Khulna Division
    {
        "location_code": "LOC-KHU-SDR",
        "division": "Khulna",
        "district": "Khulna",
        "thana_or_upazila": "Khulna Sadar",
        "latitude": 22.845600,
        "longitude": 89.540300,
        "ip_subnet": "103.134.88.0/24",
        "is_high_risk_zone": False
    },
    {
        "location_code": "LOC-JSR-BEN",
        "division": "Khulna",
        "district": "Jessore",
        "thana_or_upazila": "Benapole Border",
        "latitude": 23.039200,
        "longitude": 88.895300,
        "ip_subnet": "45.112.60.0/24",
        "is_high_risk_zone": True
    },

    # Barisal Division
    {
        "location_code": "LOC-BAR-SDR",
        "division": "Barisal",
        "district": "Barisal",
        "thana_or_upazila": "Barisal Sadar",
        "latitude": 22.701000,
        "longitude": 90.353500,
        "ip_subnet": "103.140.92.0/24",
        "is_high_risk_zone": False
    },

    # Rangpur Division
    {
        "location_code": "LOC-RAN-SDR",
        "division": "Rangpur",
        "district": "Rangpur",
        "thana_or_upazila": "Rangpur Sadar",
        "latitude": 25.743900,
        "longitude": 89.275200,
        "ip_subnet": "103.145.100.0/24",
        "is_high_risk_zone": False
    },

    # Mymensingh Division
    {
        "location_code": "LOC-MYM-SDR",
        "division": "Mymensingh",
        "district": "Mymensingh",
        "thana_or_upazila": "Mymensingh Sadar",
        "latitude": 24.747100,
        "longitude": 90.420300,
        "ip_subnet": "103.150.110.0/24",
        "is_high_risk_zone": False
    }
]


def generate_locations() -> List[Dict[str, Any]]:
    """Generate deterministic, valid UUID location entities."""
    locations = []
    for idx, item in enumerate(BANGLADESH_LOCATIONS, start=1):
        loc_id = f"b1000000-0000-0000-0000-{idx:012d}"
        locations.append({
            "id": loc_id,
            "location_code": item["location_code"],
            "division": item["division"],
            "district": item["district"],
            "thana_or_upazila": item["thana_or_upazila"],
            "latitude": item["latitude"],
            "longitude": item["longitude"],
            "ip_subnet": item["ip_subnet"],
            "is_high_risk_zone": item["is_high_risk_zone"]
        })
    return locations
