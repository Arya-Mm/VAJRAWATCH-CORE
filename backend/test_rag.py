import os
import sys

# Ensure backend can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.rag.ingest import ingest_incidents
from backend.rag.retriever import retrieve_analogous_incidents

def test_rag_flow():
    print("=== STARTING VAJRAWATCH LOCAL VECTOR RAG FLOW TEST ===")
    
    # 1. Run Ingestion
    print("\n--- Running Incident Ingestion ---")
    ingest_incidents()
    
    # 2. Run Retrieval Queries
    queries = [
        "Chungthang Hydropower Chungthang Dam Sikkim",
        "moraine collapse above Thame village Solukhumbu",
        "cloudburst and landslide Kedarnath"
    ]
    
    for q in queries:
        print(f"\nQuery: '{q}'")
        results = retrieve_analogous_incidents(q, limit=1)
        if results:
            r = results[0]
            print(f"  Result Match: {r['metadata']['name']}")
            print(f"  Trigger: {r['metadata']['trigger']}")
            print(f"  Fatalities: {r['metadata']['deaths']}")
            print(f"  Distance Score: {r['distance']}")
        else:
            print("  No analog retrieved.")

if __name__ == "__main__":
    test_rag_flow()
