import os
import json
import chromadb
from sentence_transformers import SentenceTransformer

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
JSONL_PATH = os.path.join(BASE_DIR, "data", "glof_incidents.jsonl")
CHROMA_PATH = os.path.join(BASE_DIR, "data", "chroma_db")

def ingest_incidents():
    if not os.path.exists(JSONL_PATH):
        print(f"GLOF incidents dataset missing at {JSONL_PATH}. Skipping ingestion.")
        return

    print("Initializing SentenceTransformer model 'all-MiniLM-L6-v2'...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    print(f"Connecting to ChromaDB at {CHROMA_PATH}...")
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    
    # Get or create collection
    collection = client.get_or_create_collection(name="glof_incidents")

    # Read incident records
    documents = []
    embeddings = []
    metadatas = []
    ids = []

    print(f"Reading records from {JSONL_PATH}...")
    with open(JSONL_PATH, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f):
            if not line.strip():
                continue
            data = json.loads(line)
            
            name = data.get("name", "Unknown GLOF")
            year = data.get("year", 0)
            deaths = data.get("deaths", 0)
            damage = data.get("damage_usd", 0)
            trigger = data.get("trigger", "unknown")
            description = data.get("description", "")

            # Form text representation for embedding search
            doc_text = (
                f"GLOF Event: {name}\n"
                f"Year: {year}\n"
                f"Trigger: {trigger}\n"
                f"Fatalities: {deaths}\n"
                f"Damage USD: {damage}\n"
                f"Details: {description}"
            )
            
            documents.append(doc_text)
            metadatas.append({
                "name": name,
                "year": year,
                "deaths": deaths,
                "damage_usd": damage,
                "trigger": trigger
            })
            ids.append(f"glof_evt_{idx}")

    if not documents:
        print("No incident records found.")
        return

    print(f"Computing embeddings for {len(documents)} GLOF records...")
    # Compute dense vectors (384 dims)
    vectors = model.encode(documents, show_progress_bar=False)

    print("Upserting vectors and documents into Chroma DB...")
    # Add to Chroma
    for i in range(len(documents)):
        collection.upsert(
            ids=[ids[i]],
            embeddings=[vectors[i].tolist()],
            documents=[documents[i]],
            metadatas=[metadatas[i]]
        )

    print("GLOF Incident records successfully indexed in ChromaDB.")

if __name__ == "__main__":
    ingest_incidents()
