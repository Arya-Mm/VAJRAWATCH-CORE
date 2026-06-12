export const lakesData = {
  PDGL_THULAGI_01: {
    lakeId: 'PDGL_THULAGI_01',
    name:   'Thulagi Lake',
    coordinates: {
      lat:       '28.5143°N',
      lng:       '84.4231°E',
      elevation: '4,149m',
    },
    riskScore: 84,
    riskTier:  'RED',
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
    growth: '+18.5%',
    trend: 'Accelerating',
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
  },
  PDGL_TSHO_ROLPA_02: {
    lakeId: 'PDGL_TSHO_ROLPA_02',
    name:   'Tsho Rolpa Lake',
    coordinates: {
      lat:       '27.8590°N',
      lng:       '86.4750°E',
      elevation: '4,580m',
    },
    riskScore: 78,
    riskTier:  'RED',
    topDrivers: [
      { feature: 'Rainfall Anomaly',      value: '+180mm'  },
      { feature: 'Lake Area Expansion',   value: '+14.8%'  },
      { feature: 'Snowmelt Acceleration', value: '+28%'    },
      { feature: 'Slope Instability',     value: 'MEDIUM'  },
      { feature: 'Seismic Activity',      value: '3.8 Mw'  },
    ],
    impact: {
      population:       8900,
      hydropowerMW:     120,
      historicalAnalog: 'Dig Tsho 1985',
    },
    growth: '+14.8%',
    trend: 'Steady-High',
    agents: [
      { name: 'Sentinel Agent',     execTime: '55ms',  decision: 'Retreat detected',          confidence: '96%'  },
      { name: 'Environmental Agent', execTime: '135ms', decision: 'Slope warming verified',     confidence: '92%'  },
      { name: 'Risk Agent',          execTime: '90ms',  decision: 'GLOF risk index at 78%',    confidence: '86%'  },
      { name: 'Skeptic Agent',       execTime: '70ms',  decision: 'Signal drift cleared',      confidence: '94%'  },
      { name: 'Decision Agent',      execTime: '115ms', decision: 'Alert escalated to RED',    confidence: '97%'  }
    ],
    evidence: 'Volume expansion (+14.8%) and slope instability warning threshold exceeded.',
    reasoning: 'Sentinel detected volume surge; Env confirmed thermal instability; Risk computed risk index at 78%; Skeptic cleared instrument drift; Decision routed Alert.',
    decisionLogs: [
      { time: '23:55:00', message: 'Sentinel: SURGE_DETECTED' },
      { time: '23:55:01', message: 'Env: THERMAL_SLOPE_WARMING' },
      { time: '23:55:01', message: 'Risk: RISK_INDEX_78%' },
      { time: '23:55:02', message: 'Skeptic: INSTRUMENT_DRIFT_FILTERED' },
      { time: '23:55:02', message: 'Decision: RED_ALERT_ESCALATED' }
    ]
  },
  PDGL_IMJA_03: {
    lakeId: 'PDGL_IMJA_03',
    name:   'Imja Lake',
    coordinates: {
      lat:       '27.9015°N',
      lng:       '86.9380°E',
      elevation: '5,010m',
    },
    riskScore: 68,
    riskTier:  'ORANGE',
    topDrivers: [
      { feature: 'Rainfall Anomaly',      value: '+145mm'  },
      { feature: 'Lake Area Expansion',   value: '+12.1%'  },
      { feature: 'Snowmelt Acceleration', value: '+42%'    },
      { feature: 'Slope Instability',     value: 'MEDIUM'  },
      { feature: 'Seismic Activity',      value: '2.1 Mw'  },
    ],
    impact: {
      population:       5200,
      hydropowerMW:     80,
      historicalAnalog: 'Imja 2016',
    },
    growth: '+12.1%',
    trend: 'Slowing',
    agents: [
      { name: 'Sentinel Agent',     execTime: '40ms',  decision: 'Normal expansion',          confidence: '95%'  },
      { name: 'Environmental Agent', execTime: '110ms', decision: 'Temperature anomaly found', confidence: '91%'  },
      { name: 'Risk Agent',          execTime: '80ms',  decision: 'Orange alert probability',  confidence: '84%'  },
      { name: 'Skeptic Agent',       execTime: '55ms',  decision: 'Wind noise filtered',       confidence: '92%'  },
      { name: 'Decision Agent',      execTime: '100ms', decision: 'Orange Alert routed',       confidence: '95%'  }
    ],
    evidence: 'Imja expansion primarily driven by high melt rates (+42%).',
    reasoning: 'Sentinel reported normal boundaries; Env confirmed temperature spike; Risk computed 68% probability; Skeptic filtered noise; Decision logged Orange Alert.',
    decisionLogs: [
      { time: '23:55:00', message: 'Sentinel: EXPANSION_NORMAL' },
      { time: '23:55:01', message: 'Env: WEATHER_TEMP_SPIKE' },
      { time: '23:55:01', message: 'Risk: GLOF_PROBABILITY_68%' },
      { time: '23:55:02', message: 'Skeptic: WIND_NOISE_REJECTED' },
      { time: '23:55:02', message: 'Decision: ORANGE_ALERT_ROUTED' }
    ]
  },
  PDGL_LOWER_BARUN_04: {
    lakeId: 'PDGL_LOWER_BARUN_04',
    name:   'Lower Barun Lake',
    coordinates: {
      lat:       '27.7940°N',
      lng:       '87.0910°E',
      elevation: '4,550m',
    },
    riskScore: 42,
    riskTier:  'YELLOW',
    topDrivers: [
      { feature: 'Rainfall Anomaly',      value: '+80mm'   },
      { feature: 'Lake Area Expansion',   value: '+5.2%'   },
      { feature: 'Snowmelt Acceleration', value: '+15%'    },
      { feature: 'Slope Instability',     value: 'LOW'     },
      { feature: 'Seismic Activity',      value: '1.5 Mw'  },
    ],
    impact: {
      population:       2400,
      hydropowerMW:     45,
      historicalAnalog: 'None',
    },
    growth: '+5.2%',
    trend: 'Stable',
    agents: [
      { name: 'Sentinel Agent',     execTime: '30ms',  decision: 'No anomaly',                confidence: '99%'  },
      { name: 'Environmental Agent', execTime: '90ms',  decision: 'Weather conditions normal',  confidence: '98%'  },
      { name: 'Risk Agent',          execTime: '60ms',  decision: 'Risk index within limits',  confidence: '95%'  },
      { name: 'Skeptic Agent',       execTime: '45ms',  decision: 'System integrity OK',       confidence: '99%'  },
      { name: 'Decision Agent',      execTime: '85ms',  decision: 'Standby - No action',       confidence: '99%'  }
    ],
    evidence: 'Lower Barun remains within historical warning tolerances.',
    reasoning: 'All agents reporting normal ranges; Risk model outputs stable index.',
    decisionLogs: [
      { time: '23:55:00', message: 'Sentinel: STABLE' },
      { time: '23:55:01', message: 'Env: WEATHER_NORMAL' },
      { time: '23:55:01', message: 'Risk: RISK_INDEX_42%' },
      { time: '23:55:02', message: 'Skeptic: HEALTH_CHECK_PASS' },
      { time: '23:55:02', message: 'Decision: STANDBY' }
    ]
  }
};

// Backward compatibility fallback for Thulagi specific imports
export const thulagiData = lakesData.PDGL_THULAGI_01;
