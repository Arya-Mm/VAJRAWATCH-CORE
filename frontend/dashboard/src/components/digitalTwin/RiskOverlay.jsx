// Risk color helpers — used only when backend returns a valid tier
export function riskColor(tier) {
  if (tier === "RED") return "#EF4444";
  if (tier === "ORANGE") return "#F97316";
  if (tier === "YELLOW") return "#EAB308";
  if (tier === "GREEN") return "#22C55E";
  return "#334155";
}

export function tierClass(tier) {
  if (tier === "RED") return "red";
  if (tier === "ORANGE") return "orange";
  if (tier === "YELLOW") return "yellow";
  if (tier === "GREEN") return "green";
  return "";
}

// Map geographic coordinates to SVG canvas pixels
// Himalayan coverage: 76–102°E, 26–37°N
export function lngToX(lng, w = 800) {
  return ((lng - 76) / (102 - 76)) * w;
}
export function latToY(lat, h = 520) {
  return h - ((lat - 26) / (37 - 26)) * h;
}
