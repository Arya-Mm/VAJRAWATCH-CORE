const BASE_URL = 'http://localhost:8000';

export async function fetchImpact(lakeId) {
  const response = await fetch(`${BASE_URL}/impact/${lakeId}`);
  if (!response.ok) {
    throw new Error(`Impact API failed: ${response.status}`);
  }
  return response.json();
}
