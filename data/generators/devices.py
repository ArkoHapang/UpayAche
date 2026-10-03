"""
UpayAche — Synthetic Device Generator.
Generates client terminal fingerprints, hardware models, OS telemetry,
rooted/jailbroken indicators, and hardware risk scores.
"""

import random
from typing import List, Dict, Any

DEVICE_TEMPLATES = [
    # Clean Consumer Smartphones
    {"type": "SMARTPHONE", "os": "ANDROID", "model": "Samsung Galaxy A54 5G", "rooted": False, "risk": 0.05},
    {"type": "SMARTPHONE", "os": "ANDROID", "model": "Samsung Galaxy M33", "rooted": False, "risk": 0.08},
    {"type": "SMARTPHONE", "os": "IOS", "model": "iPhone 14", "rooted": False, "risk": 0.03},
    {"type": "SMARTPHONE", "os": "IOS", "model": "iPhone 13 Pro", "rooted": False, "risk": 0.04},
    {"type": "SMARTPHONE", "os": "ANDROID", "model": "Xiaomi Redmi Note 12", "rooted": False, "risk": 0.09},
    {"type": "SMARTPHONE", "os": "ANDROID", "model": "Realme 11 Pro", "rooted": False, "risk": 0.07},
    {"type": "SMARTPHONE", "os": "ANDROID", "model": "Vivo Y27", "rooted": False, "risk": 0.08},
    {"type": "SMARTPHONE", "os": "ANDROID", "model": "Oppo A78", "rooted": False, "risk": 0.06},

    # Agent POS Terminals
    {"type": "POS", "os": "ANDROID_EMBEDDED", "model": "Sunmi V2 PRO", "rooted": False, "risk": 0.04},
    {"type": "POS", "os": "ANDROID_EMBEDDED", "model": "Ingenico Move 5000", "rooted": False, "risk": 0.02},
    {"type": "POS", "os": "ANDROID_EMBEDDED", "model": "Verifone V240m", "rooted": False, "risk": 0.03},

    # Web Portals
    {"type": "WEB", "os": "WINDOWS", "model": "Chrome Browser 126", "rooted": False, "risk": 0.05},
    {"type": "WEB", "os": "MACOS", "model": "Safari 17.5", "rooted": False, "risk": 0.04},
    {"type": "WEB", "os": "LINUX", "model": "Firefox 128", "rooted": False, "risk": 0.09},

    # High-Risk / Rooted / Burner Devices (Syndicates & Mules)
    {"type": "SMARTPHONE", "os": "ANDROID", "model": "Symphony Z33 (Burner)", "rooted": True, "risk": 0.88},
    {"type": "SMARTPHONE", "os": "ANDROID", "model": "Walton Primo GH11 (Burner)", "rooted": True, "risk": 0.84},
    {"type": "SMARTPHONE", "os": "ANDROID", "model": "Xiaomi Redmi 9A (Custom ROM)", "rooted": True, "risk": 0.82},
    {"type": "SMARTPHONE", "os": "ANDROID", "model": "Samsung Galaxy J2 (Emulator)", "rooted": True, "risk": 0.94},
]


def generate_devices(count: int = 50, seed: int = 42) -> List[Dict[str, Any]]:
    """Generate deterministic synthetic devices with RFC 4122 hex UUIDs."""
    rng = random.Random(seed)
    devices = []

    for i in range(1, count + 1):
        dev_id = f"d1000000-0000-0000-0000-{i:012d}"
        tpl = rng.choice(DEVICE_TEMPLATES)
        
        # Add slight jitter to risk score
        base_risk = tpl["risk"]
        jittered_risk = round(min(1.0, max(0.01, base_risk + rng.uniform(-0.02, 0.02))), 3)
        fingerprint = f"fp_{tpl['model'].lower().replace(' ', '_').replace('(', '').replace(')', '')}_{i:04d}"

        devices.append({
            "id": dev_id,
            "device_fingerprint": fingerprint,
            "device_type": tpl["type"],
            "os": tpl["os"],
            "model": tpl["model"],
            "app_version": f"3.{rng.randint(2, 5)}.{rng.randint(0, 9)}",
            "is_rooted_or_jailbroken": tpl["rooted"],
            "device_risk_score": jittered_risk
        })

    return devices
