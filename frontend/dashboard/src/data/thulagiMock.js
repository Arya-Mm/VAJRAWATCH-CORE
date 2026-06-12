export const thulagiData = {
  lakeId: 'PDGL_THULAGI_01',
  name:   'Thulagi Lake',

  /* Coordinates — read by ThreatMonitoringZone */
  coordinates: {
    lat:       '28.5143°N',
    lng:       '84.4231°E',
    elevation: '4,149m',
  },

  riskScore: 84,
  riskTier:  'RED',

  /* 5 risk drivers — fills the full TopDrivers panel */
  topDrivers: [
    { feature: 'Rainfall Anomaly',      value: '+210mm'  },
    { feature: 'Lake Area Expansion',   value: '+18.5%'  },
    { feature: 'Snowmelt Acceleration', value: '+34%'    },
    { feature: 'Slope Instability',     value: 'HIGH'    },
    { feature: 'Seismic Activity',      value: '4.2 Mw'  },
  ],

  impact: {
    population:       12480,
    hydropowerMW:     186,
    historicalAnalog: 'South Lonak 2023',
  },
};
