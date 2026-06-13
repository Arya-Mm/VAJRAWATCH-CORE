import os
import chromadb
from sentence_transformers import SentenceTransformer

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CHROMA_PATH = os.path.join(BASE_DIR, "data", "chroma_db")

# Singleton instances initialized on demand
_model = None
_client = None
_collection = None

def _get_resources():
    global _model, _client, _collection
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    if _client is None:
        _client = chromadb.PersistentClient(path=CHROMA_PATH)
    if _collection is None:
        _collection = _client.get_collection(name="glof_incidents")
    return _model, _collection

def retrieve_analogous_incidents(query: str, limit: int = 2) -> list[dict]:
    """Retrieves top K GLOF incidents matching the query from ChromaDB vector store."""
    try:
        model, collection = _get_resources()
        
        # Compute query vector
        query_vector = model.encode([query])[0].tolist()
        
        # Query ChromaDB
        results = collection.query(
            query_embeddings=[query_vector],
            n_results=limit
        )
        
        analogs = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            distances = results["distances"][0] if "distances" in results else [0.0] * len(docs)
            ids = results["ids"][0]
            
            for idx in range(len(docs)):
                analogs.append({
                    "id": ids[idx],
                    "text": docs[idx],
                    "metadata": metas[idx],
                    "distance": round(float(distances[idx]), 4)
                })
        return analogs
    except Exception as e:
        print(f"[RAG Retriever] Error retrieving incidents: {e}")
        return []

if __name__ == "__main__":
    # Test query
    print("Testing retriever query...")
    results = retrieve_analogous_incidents("seismic breach Chungthang Dam Chungthang hydropower plant")
    for r in results:
        print(f"\nMatch ID: {r['id']} (Distance: {r['distance']})")
        print(f"Name: {r['metadata']['name']}")
        print(f"Trigger: {r['metadata']['trigger']}")
        print(f"Fatalities: {r['metadata']['deaths']}")
        print(f"Description snippet: {r['text'][:150]}...")
