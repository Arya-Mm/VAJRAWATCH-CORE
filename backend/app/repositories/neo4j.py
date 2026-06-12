from __future__ import annotations

import json
from typing import Any, TypeVar, cast

from backend.app.db.neo4j import Neo4jConnectionManager
from backend.app.domain.models import (
    AgentMessage,
    AuditEvent,
    ImpactSummary,
    MemoryRecord,
    StoredUser,
    TaskRecord,
    ToolExecution,
    WorkflowRun,
)
from pydantic import BaseModel

ModelT = TypeVar("ModelT", bound=BaseModel)


def _to_json(model: BaseModel) -> str:
    return json.dumps(model.model_dump(mode="json"), separators=(",", ":"))


def _from_json(payload: str, model_type: type[BaseModel]) -> BaseModel:
    return model_type.model_validate_json(payload)


class Neo4jRepository:
    def __init__(self, manager: Neo4jConnectionManager) -> None:
        self._manager = manager

    async def create_user(self, user: StoredUser) -> StoredUser:
        statement = """
        CREATE (u:User {user_id: $user_id, email: $email, payload_json: $payload_json})
        RETURN u.payload_json AS payload
        """
        async with self._manager.driver.session(database=self._manager.database) as session:
            result = await session.run(
                statement,
                user_id=user.user_id,
                email=user.email.lower(),
                payload_json=_to_json(user),
            )
            record = await result.single(strict=True)
        return StoredUser.model_validate_json(record["payload"])

    async def get_user_by_email(self, email: str) -> StoredUser | None:
        return await self._get_single_model(
            "MATCH (u:User {email: $email}) RETURN u.payload_json AS payload",
            StoredUser,
            email=email.lower(),
        )

    async def get_user_by_id(self, user_id: str) -> StoredUser | None:
        return await self._get_single_model(
            "MATCH (u:User {user_id: $user_id}) RETURN u.payload_json AS payload",
            StoredUser,
            user_id=user_id,
        )

    async def save_task(self, task: TaskRecord) -> TaskRecord:
        statement = """
        MERGE (t:Task {task_id: $task_id})
        SET t.lake_id = $lake_id,
            t.status = $status,
            t.payload_json = $payload_json
        RETURN t.payload_json AS payload
        """
        async with self._manager.driver.session(database=self._manager.database) as session:
            result = await session.run(
                statement,
                task_id=task.task_id,
                lake_id=task.lake_id,
                status=task.status.value,
                payload_json=_to_json(task),
            )
            record = await result.single(strict=True)
        return TaskRecord.model_validate_json(record["payload"])

    async def get_task(self, task_id: str) -> TaskRecord | None:
        return await self._get_single_model(
            "MATCH (t:Task {task_id: $task_id}) RETURN t.payload_json AS payload",
            TaskRecord,
            task_id=task_id,
        )

    async def save_workflow_run(self, run: WorkflowRun) -> WorkflowRun:
        statement = """
        MERGE (r:WorkflowRun {run_id: $run_id})
        SET r.task_id = $task_id,
            r.status = $status,
            r.payload_json = $payload_json
        WITH r
        MATCH (t:Task {task_id: $task_id})
        MERGE (t)-[:HAS_WORKFLOW_RUN]->(r)
        RETURN r.payload_json AS payload
        """
        async with self._manager.driver.session(database=self._manager.database) as session:
            result = await session.run(
                statement,
                run_id=run.run_id,
                task_id=run.task_id,
                status=run.status.value,
                payload_json=_to_json(run),
            )
            record = await result.single(strict=True)
        return WorkflowRun.model_validate_json(record["payload"])

    async def get_workflow_run(self, run_id: str) -> WorkflowRun | None:
        return await self._get_single_model(
            "MATCH (r:WorkflowRun {run_id: $run_id}) RETURN r.payload_json AS payload",
            WorkflowRun,
            run_id=run_id,
        )

    async def save_agent_message(self, message: AgentMessage) -> AgentMessage:
        statement = """
        MERGE (m:AgentMessage {message_id: $message_id})
        SET m.task_id = $task_id,
            m.agent_name = $agent_name,
            m.payload_json = $payload_json
        WITH m
        MATCH (t:Task {task_id: $task_id})
        MERGE (t)-[:HAS_AGENT_MESSAGE]->(m)
        RETURN m.payload_json AS payload
        """
        return await self._save_linked_model(
            statement,
            AgentMessage,
            message_id=message.message_id,
            task_id=message.task_id,
            agent_name=message.agent_name,
            payload_json=_to_json(message),
        )

    async def list_agent_messages(self, task_id: str) -> list[AgentMessage]:
        records = await self._list_payloads(
            """
            MATCH (t:Task {task_id: $task_id})-[:HAS_AGENT_MESSAGE]->(m:AgentMessage)
            RETURN m.payload_json AS payload ORDER BY m.payload_json
            """,
            task_id=task_id,
        )
        return [AgentMessage.model_validate_json(payload) for payload in records]

    async def save_tool_execution(self, execution: ToolExecution) -> ToolExecution:
        statement = """
        MERGE (e:ToolExecution {execution_id: $execution_id})
        SET e.task_id = $task_id,
            e.tool_name = $tool_name,
            e.status = $status,
            e.payload_json = $payload_json
        WITH e
        OPTIONAL MATCH (t:Task {task_id: $task_id})
        FOREACH (_ IN CASE WHEN t IS NULL THEN [] ELSE [1] END | MERGE (t)-[:EXECUTED_TOOL]->(e))
        RETURN e.payload_json AS payload
        """
        return await self._save_linked_model(
            statement,
            ToolExecution,
            execution_id=execution.execution_id,
            task_id=execution.task_id,
            tool_name=execution.tool_name,
            status=execution.status.value,
            payload_json=_to_json(execution),
        )

    async def list_tool_executions(self, task_id: str) -> list[ToolExecution]:
        records = await self._list_payloads(
            """
            MATCH (t:Task {task_id: $task_id})-[:EXECUTED_TOOL]->(e:ToolExecution)
            RETURN e.payload_json AS payload ORDER BY e.payload_json
            """,
            task_id=task_id,
        )
        return [ToolExecution.model_validate_json(payload) for payload in records]

    async def save_memory(self, memory: MemoryRecord) -> MemoryRecord:
        statement = """
        MERGE (m:Memory {memory_id: $memory_id})
        SET m.task_id = $task_id,
            m.key = $key,
            m.payload_json = $payload_json
        WITH m
        OPTIONAL MATCH (t:Task {task_id: $task_id})
        FOREACH (_ IN CASE WHEN t IS NULL THEN [] ELSE [1] END | MERGE (t)-[:HAS_MEMORY]->(m))
        RETURN m.payload_json AS payload
        """
        return await self._save_linked_model(
            statement,
            MemoryRecord,
            memory_id=memory.memory_id,
            task_id=memory.task_id,
            key=memory.key,
            payload_json=_to_json(memory),
        )

    async def list_memories(self, task_id: str | None = None) -> list[MemoryRecord]:
        if task_id is None:
            statement = "MATCH (m:Memory) RETURN m.payload_json AS payload ORDER BY m.payload_json"
            records = await self._list_payloads(statement)
        else:
            statement = """
            MATCH (t:Task {task_id: $task_id})-[:HAS_MEMORY]->(m:Memory)
            RETURN m.payload_json AS payload ORDER BY m.payload_json
            """
            records = await self._list_payloads(statement, task_id=task_id)
        return [MemoryRecord.model_validate_json(payload) for payload in records]

    async def save_audit_event(self, event: AuditEvent) -> AuditEvent:
        statement = """
        MERGE (a:AuditEvent {event_id: $event_id})
        SET a.resource_id = $resource_id,
            a.action = $action,
            a.payload_json = $payload_json
        RETURN a.payload_json AS payload
        """
        return await self._save_linked_model(
            statement,
            AuditEvent,
            event_id=event.event_id,
            resource_id=event.resource_id,
            action=event.action,
            payload_json=_to_json(event),
        )

    async def list_audit_events(self, resource_id: str | None = None) -> list[AuditEvent]:
        if resource_id is None:
            records = await self._list_payloads(
                "MATCH (a:AuditEvent) RETURN a.payload_json AS payload ORDER BY a.payload_json"
            )
        else:
            records = await self._list_payloads(
                """
                MATCH (a:AuditEvent {resource_id: $resource_id})
                RETURN a.payload_json AS payload ORDER BY a.payload_json
                """,
                resource_id=resource_id,
            )
        return [AuditEvent.model_validate_json(payload) for payload in records]

    async def set_simulated_score(self, lake_id: str, score: int) -> None:
        async with self._manager.driver.session(database=self._manager.database) as session:
            await session.run(
                """
                MERGE (l:GlacialLake {lake_id: $lake_id})
                SET l.simulated_score = $score
                """,
                lake_id=lake_id,
                score=score,
            )

    async def get_simulated_score(self, lake_id: str) -> int | None:
        async with self._manager.driver.session(database=self._manager.database) as session:
            result = await session.run(
                "MATCH (l:GlacialLake {lake_id: $lake_id}) RETURN l.simulated_score AS score",
                lake_id=lake_id,
            )
            record = await result.single()
        if record is None or record["score"] is None:
            return None
        return int(record["score"])

    async def health_check(self) -> dict[str, object]:
        return await self._manager.health_check()

    async def get_impact(self, lake_id: str) -> ImpactSummary | None:
        statement = """
        MATCH (lake:GlacialLake {lake_id: $lake_id})-[:THREATENS]->(infra:Infrastructure)
        OPTIONAL MATCH (lake)-[:ANALOG_TO]->(incident:HistoricalIncident)
        RETURN collect(infra {.*}) AS infrastructure,
               coalesce(sum(infra.population_exposed), 0) AS population,
               coalesce(sum(infra.capacity_mw), 0.0) AS hydropower_mw,
               size([item IN collect(infra.type) WHERE item = 'bridge']) AS bridges,
               coalesce(head(collect(incident.name)), 'South Lonak 2023') AS historical_analog
        """
        async with self._manager.driver.session(database=self._manager.database) as session:
            result = await session.run(statement, lake_id=lake_id)
            record = await result.single()
        if record is None:
            return None
        infrastructure = [dict(item) for item in record["infrastructure"]]
        if not infrastructure:
            return None
        return ImpactSummary(
            population=int(record["population"]),
            hydropower_mw=float(record["hydropower_mw"]),
            bridges=int(record["bridges"]),
            historical_analog=str(record["historical_analog"]),
            infrastructure=infrastructure,
        )

    async def _get_single_model(
        self,
        statement: str,
        model_type: type[ModelT],
        **params: Any,
    ) -> ModelT | None:
        async with self._manager.driver.session(database=self._manager.database) as session:
            result = await session.run(statement, **params)
            record = await result.single()
        if record is None:
            return None
        return cast(ModelT, _from_json(str(record["payload"]), model_type))

    async def _save_linked_model(
        self,
        statement: str,
        model_type: type[ModelT],
        **params: Any,
    ) -> ModelT:
        async with self._manager.driver.session(database=self._manager.database) as session:
            result = await session.run(statement, **params)
            record = await result.single(strict=True)
        return cast(ModelT, _from_json(str(record["payload"]), model_type))

    async def _list_payloads(self, statement: str, **params: Any) -> list[str]:
        async with self._manager.driver.session(database=self._manager.database) as session:
            result = await session.run(statement, **params)
            records = await result.data("payload")
        return [str(record["payload"]) for record in records]
