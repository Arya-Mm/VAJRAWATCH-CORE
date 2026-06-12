import os
from dotenv import load_dotenv

load_dotenv()

print("NEO4J_URI:", os.getenv("NEO4J_URI"))
print("NEO4J_USERNAME:", os.getenv("NEO4J_USERNAME"))
print("NEO4J_PASSWORD length:", len(os.getenv("NEO4J_PASSWORD", "")))
print("NEO4J_DATABASE:", os.getenv("NEO4J_DATABASE"))
