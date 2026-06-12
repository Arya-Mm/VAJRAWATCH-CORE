from __future__ import annotations

from backend.app.db.neo4j import Neo4jConnectionManager

CONSTRAINTS = (
    "CREATE CONSTRAINT user_email_unique IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE",
    "CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.user_id IS UNIQUE",
    "CREATE CONSTRAINT lake_id_unique IF NOT EXISTS FOR (l:GlacialLake) REQUIRE l.lake_id IS UNIQUE",
    "CREATE CONSTRAINT infrastructure_id_unique IF NOT EXISTS FOR (i:Infrastructure) REQUIRE i.infrastructure_id IS UNIQUE",
    "CREATE CONSTRAINT task_id_unique IF NOT EXISTS FOR (t:Task) REQUIRE t.task_id IS UNIQUE",
    "CREATE CONSTRAINT workflow_run_id_unique IF NOT EXISTS FOR (r:WorkflowRun) REQUIRE r.run_id IS UNIQUE",
    "CREATE CONSTRAINT agent_id_unique IF NOT EXISTS FOR (a:Agent) REQUIRE a.agent_id IS UNIQUE",
    "CREATE CONSTRAINT memory_id_unique IF NOT EXISTS FOR (m:Memory) REQUIRE m.memory_id IS UNIQUE",
    "CREATE CONSTRAINT tool_execution_id_unique IF NOT EXISTS FOR (e:ToolExecution) REQUIRE e.execution_id IS UNIQUE",
    "CREATE CONSTRAINT audit_event_id_unique IF NOT EXISTS FOR (a:AuditEvent) REQUIRE a.event_id IS UNIQUE",
)


async def initialize_schema(manager: Neo4jConnectionManager) -> None:
    async with manager.driver.session(database=manager.database) as session:
        for statement in CONSTRAINTS:
            await session.run(statement)


async def seed_demo_graph(manager: Neo4jConnectionManager) -> None:
    statement = """
    MERGE (lake:GlacialLake {lake_id: $lake_id})
      SET lake.name = $lake_name,
          lake.country = 'Nepal',
          lake.latitude = 28.5283,
          lake.longitude = 84.4891,
          lake.area_km2 = 0.88,
          lake.risk_tier = 'RED'
    MERGE (hydro:Infrastructure {infrastructure_id: 'INF_BESISAHAR_HYDRO_01'})
      SET hydro.name = 'Besisahar Hydropower Corridor',
          hydro.type = 'hydropower',
          hydro.capacity_mw = 50.0,
          hydro.population_exposed = 12480,
          hydro.distance_km = 42.5
    MERGE (bridge:Infrastructure {infrastructure_id: 'INF_MARSYANGDI_BRIDGE_01'})
      SET bridge.name = 'Marsyangdi River Bridge',
          bridge.type = 'bridge',
          bridge.distance_km = 31.2
    MERGE (incident:HistoricalIncident {incident_id: 'INC_SOUTH_LONAK_2023'})
      SET incident.name = 'South Lonak 2023',
          incident.deaths = 55,
          incident.damage_usd_m = 120.0
    MERGE (sentinel:Agent {agent_id: 'agent_sentinel'})
      SET sentinel.name = 'Sentinel Intelligence Agent'
    MERGE (environmental:Agent {agent_id: 'agent_environmental'})
      SET environmental.name = 'Environmental Intelligence Agent'
    MERGE (risk:Agent {agent_id: 'agent_risk_assessment'})
      SET risk.name = 'Risk Assessment Agent'
    MERGE (skeptic:Agent {agent_id: 'agent_skeptic'})
      SET skeptic.name = 'Skeptic Verification Agent'
    MERGE (report:Agent {agent_id: 'agent_decision_report'})
      SET report.name = 'Decision Report Agent'
    MERGE (lake)-[:THREATENS {severity: 'critical'}]->(hydro)
    MERGE (lake)-[:THREATENS {severity: 'high'}]->(bridge)
    MERGE (lake)-[:ANALOG_TO]->(incident)
    MERGE (lake)-[:OBSERVED_BY]->(sentinel)
    MERGE (lake)-[:OBSERVED_BY]->(environmental)
    MERGE (risk)-[:PRODUCED]->(lake)
    MERGE (skeptic)-[:AUDITED]->(risk)
    MERGE (report)-[:PRODUCED]->(lake)
    """
    async with manager.driver.session(database=manager.database) as session:
        await session.run(statement, lake_id="PDGL_THULAGI_01", lake_name="Thulagi Lake")
