const BASE_URL = 'http://localhost:8000';

export async function fetchAgents(lakeId) {
  const response = await fetch(`${BASE_URL}/agents/${lakeId}`);
  if (!response.ok) {
    throw new Error(`Agents API failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchTimeline(lakeId) {
  const response = await fetch(`${BASE_URL}/timeline/${lakeId}`);
  if (!response.ok) {
    throw new Error(`Timeline API failed: ${response.status}`);
  }
  return response.json();
}
