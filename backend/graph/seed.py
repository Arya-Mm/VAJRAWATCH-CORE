import os
from dotenv import load_dotenv
from langchain_neo4j import Neo4jGraph

load_dotenv()

# Ensure these are in your .env file
NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

def seed_database():
    print("Connecting to Neo4j...")
    try:
        graph = Neo4jGraph(
            url=NEO4J_URI, 
            username=NEO4J_USERNAME, 
            password=NEO4J_PASSWORD
        )
    except Exception as e:
        print(f"Failed to connect to Neo4j: {e}")
        return

    print("Clearing existing data...")
    try:
        graph.query("MATCH (n) DETACH DELETE n")
    except Exception as e:
        print(f"Failed to clear existing database nodes: {e}")

    print("Seeding VajraWatch Schema...")
    
    # 1. Create Target Lake
    try:
        graph.query("""
            CREATE (:GlacialLake {
                id: 'PDGL_THULAGI_01', 
                name: 'Thulagi Lake', 
                risk_tier: 'RED',
                area_km2: 0.52
            })
        """)
    except Exception as e:
        print(f"Failed to seed GlacialLake: {e}")

    # 2. Create Infrastructure & Villages
    try:
        graph.query("""
            CREATE (:Infrastructure {
                name: 'Besisahar Hydro', 
                type: 'hydropower', 
                capacity_mw: 186.0, 
                value_usd: 45000000.0
            })
        """)
        graph.query("""
            CREATE (:Village {
                name: 'Besisahar', 
                population: 12480, 
                district: 'Lamjung'
            })
        """)
    except Exception as e:
        print(f"Failed to seed Infrastructure or Village: {e}")

    # 3. Create Historical Analog (For the LLM Report)
    try:
        graph.query("""
            CREATE (:GLOFEvent {
                year: 2023, 
                name: 'South Lonak 2023',
                deaths: 55, 
                damage_usd: 120000000.0, 
                warning_hours: 0
            })
        """)
    except Exception as e:
        print(f"Failed to seed GLOFEvent analog: {e}")

    # 4. Establish Relationships
    try:
        graph.query("""
            MATCH (l:GlacialLake {name: 'Thulagi Lake'})
            MATCH (i:Infrastructure {name: 'Besisahar Hydro'})
            MATCH (v:Village {name: 'Besisahar'})
            MATCH (e:GLOFEvent {name: 'South Lonak 2023'})
            CREATE (l)-[:THREATENS {distance_km: 12.5}]->(i)
            CREATE (l)-[:THREATENS {distance_km: 14.2}]->(v)
            CREATE (e)-[:SIMILAR_TO {similarity_score: 0.89}]->(l)
        """)
    except Exception as e:
        print(f"Failed to seed relationships: {e}")

    print("Neo4j Seeding Complete. Graph relationships established.")

if __name__ == "__main__":
    seed_database()
