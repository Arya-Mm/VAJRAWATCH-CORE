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
  agents: [
    { name: 'Sentinel Agent',     execTime: '45ms',  decision: 'Anomaly verified',          confidence: '98%'  },
    { name: 'Environmental Agent', execTime: '120ms', decision: 'Rainfall anomaly confirmed',  confidence: '94%'  },
    { name: 'Risk Agent',          execTime: '85ms',  decision: 'GLOF probability calculated', confidence: '88%'  },
    { name: 'Skeptic Agent',       execTime: '60ms',  decision: 'Sensor errors filtered out',  confidence: '95%'  },
    { name: 'Decision Agent',      execTime: '110ms', decision: 'RED Alert signal routed',    confidence: '99%'  }
  ],
  evidence: 'Rainfall anomaly (+210mm) and Lake area expansion (+18.5%) exceed safety bounds.',
  reasoning: 'Sentinel detected abnormal expansion; Env confirmed peak rainfall; Risk calculated GLOF probability at 84%; Skeptic validated sensor health; Decision routed Red Alert.',
  decisionLogs: [
    { time: '23:55:00', message: 'Sentinel: ANOMALY_DETECTED' },
    { time: '23:55:01', message: 'Env: WEATHER_PEAK_RAIN' },
    { time: '23:55:01', message: 'Risk: GLOF_PROBABILITY_84%' },
    { time: '23:55:02', message: 'Skeptic: SENSOR_NOISE_CLEARED' },
    { time: '23:55:02', message: 'Decision: ALERT_ROUTED_RED' }
  ]
};
