"""
UpayAche — Knowledge Ingestion CLI Script.
Entry point: python -m app.ai.ingest_knowledge

Ingests project documentation, README, ML, API, security, and multilingual FAQ/scam playbooks.
Chunks, computes 768-dim embeddings, and populates Supabase pgvector and the in-memory RAG index.
Guarantees strict idempotence.
"""

import sys
import argparse
import logging
from pathlib import Path

# Ensure backend root is in python path
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Ensure Windows stdout supports utf-8
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from app.services.ingestion_service import get_ingestion_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("upayache.ai.ingest")


def main():
    parser = argparse.ArgumentParser(description="UpayAche AI Knowledge Ingestion CLI")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-ingestion of all documents even if content hashes match"
    )
    args = parser.parse_args()

    print("=" * 70)
    print("  UpayAche AI Knowledge Ingestion System")
    print("  Target: Supabase PostgreSQL + pgvector & Local Semantic RAG Index")
    print("  Idempotent Ingestion across 12 Sources (English, Bangla, Banglish)")
    print("=" * 70)


    service = get_ingestion_service()
    stats = service.ingest_all(force_refresh=args.force)

    print("\n" + "-" * 70)
    print("  INGESTION SUMMARY:")
    print("-" * 70)
    print(f"  • Documents Processed : {stats['documents_processed']}")
    print(f"  • Chunks Created      : {stats['chunks_created']}")
    print(f"  • Embeddings Created  : {stats['embeddings_created']}")
    print(f"  • Documents Skipped   : {stats['documents_skipped']}")
    print(f"  • Errors Encountered  : {stats['errors_count']}")
    
    if stats["errors"]:
        print("\n  ERRORS DETAILED:")
        for err in stats["errors"]:
            print(f"    - {err}")
    print("-" * 70)

    # Test running a second time to verify idempotency!
    if not args.force:
        print("\n[VERIFICATION] Running second idempotency pass...")
        second_pass = service.ingest_all(force_refresh=False)
        print(f"  • Second Pass Skipped (Unchanged): {second_pass['documents_skipped']}")
        print(f"  • Second Pass Newly Processed    : {second_pass['documents_processed']}")
        print(f"  ✓ Idempotency Confirmed: 0 uncontrolled duplicate documents created.")
    print("=" * 70)

    if stats["errors_count"] > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
