import os
from dotenv import load_dotenv
from langchain_neo4j import Neo4jGraph

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

def seed_database():
    if not NEO4J_URI or not NEO4J_PASSWORD:
        print("Neo4j environment variables missing. Skipping database seeding.")
        return

    print("Connecting to Neo4j...")
    try:
        graph = Neo4jGraph(
            url=NEO4J_URI,
            username=NEO4J_USERNAME,
            password=NEO4J_PASSWORD
        )
    except Exception as e:
        print(f"Failed to connect to Neo4j database: {e}")
        return

    print("Clearing existing nodes and relationships...")
    try:
        graph.query("MATCH (n) DETACH DELETE n")
    except Exception as e:
        print(f"Failed to clear existing database nodes: {e}")
        return

    print("Seeding GLOF Knowledge Graph...")
    try:
        # Create Target Lake
        graph.query("""
            CREATE (l:GlacialLake {
                id: 'PDGL_THULAGI_01', 
                name: 'Thulagi Lake', 
                risk_tier: 'RED',
                area_km2: 0.52
            })
        """)
        
        # Create Infrastructure and Village
        graph.query("""
            CREATE (i:Infrastructure {
                name: 'Besisahar Hydro', 
                type: 'hydropower', 
                capacity_mw: 186.0, 
                value_usd: 45000000.0
            })
        """)
        
        graph.query("""
            CREATE (v:Village {
                name: 'Besisahar', 
                population: 12480, 
                district: 'Lamjung'
            })
        """)

        # Create Historical Analog GLOF Event
        graph.query("""
            CREATE (e:GLOFEvent {
                year: 2023, 
                name: 'South Lonak 2023',
                deaths: 55, 
                damage_usd: 120000000.0, 
                warning_hours: 0
            })
        """)

        # Establish Relationships
        graph.query("""
            MATCH (l:GlacialLake {name: 'Thulagi Lake'})
            MATCH (i:Infrastructure {name: 'Besisahar Hydro'})
            MATCH (v:Village {name: 'Besisahar'})
            MATCH (e:GLOFEvent {name: 'South Lonak 2023'})
            CREATE (l)-[:THREATENS {distance_km: 12.5}]->(i)
            CREATE (l)-[:THREATENS {distance_km: 14.2}]->(v)
            CREATE (e)-[:SIMILAR_TO {similarity_score: 0.89}]->(l)
        """)
        
        print("Neo4j database successfully seeded with VajraWatch schema.")
    except Exception as e:
        print(f"Error seeding graph elements: {e}")

if __name__ == "__main__":
    seed_database()
