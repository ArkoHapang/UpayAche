"""
UpayAche — Synthetic Data Generation Runner CLI.
Usage:
    python data/generate.py --wallets 150 --transactions 2500 --seed 42
"""

import argparse
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from data.generators.engine import SyntheticDataEngine


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic MFS transactions and entities.")
    parser.add_argument("--wallets", type=int, default=150, help="Total synthetic wallets")
    parser.add_argument("--transactions", type=int, default=2500, help="Total synthetic transactions")
    parser.add_argument("--fraud-rate", type=float, default=0.15, help="Proportion of suspicious/fraud patterns")
    parser.add_argument("--seed", type=int, default=42, help="Deterministic random seed")
    parser.add_argument("--output-dir", type=str, default=None, help="Base output directory")

    args = parser.parse_args()

    base_dir = Path(args.output_dir) if args.output_dir else Path(__file__).resolve().parent
    engine = SyntheticDataEngine(base_dir=base_dir, seed=args.seed)
    engine.generate_all(
        wallet_count=args.wallets,
        transaction_count=args.transactions,
        fraud_rate=args.fraud_rate
    )


if __name__ == "__main__":
    main()
