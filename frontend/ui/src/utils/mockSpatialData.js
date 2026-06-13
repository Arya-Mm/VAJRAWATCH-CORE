export const getMockSpatialData = () => {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { layer_type: "lake", name: "Thulagi Lake" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [84.375, 28.530],
              [84.385, 28.528],
              [84.390, 28.535],
              [84.380, 28.538],
              [84.375, 28.530]
            ]
          ]
        }
      },
      {
        type: "Feature",
        properties: { layer_type: "river", status: "critical" },
        geometry: {
          type: "LineString",
          coordinates: [
            [84.385, 28.528], // Starts at lake edge
            [84.390, 28.510],
            [84.395, 28.480],
            [84.405, 28.450]
          ]
        }
      },
      {
        type: "Feature",
        properties: { layer_type: "impact_boundary" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [84.380, 28.520],
              [84.400, 28.520],
              [84.415, 28.440],
              [84.390, 28.440],
              [84.380, 28.520]
            ]
          ]
        }
      }
    ]
  };
};
