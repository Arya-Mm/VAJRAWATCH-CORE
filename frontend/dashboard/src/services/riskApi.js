const BASE_URL = 'http://localhost:8000';

export async function fetchRisk(lakeId) {
  const response = await fetch(`${BASE_URL}/risk/${lakeId}`);
  if (!response.ok) {
    throw new Error(`Risk API failed: ${response.status}`);
  }
  return response.json();
}
