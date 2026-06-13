export const RISK_ORDER   = ["CRITICAL","HIGH","MODERATE","WATCH","LOW"];
export const TABS         = ["Overview","Risk Drivers","Propagation","Digital Twin","Reports"];
export const TREND_LABELS = ["Day -6","Day -5","Day -4","Day -3","Day -2","Yesterday","Today"];
export const API_BASE     = "/api/v1";
export const SCORE_THRESHOLDS = { CRITICAL:80, HIGH:60, MODERATE:40, WATCH:20 };
export const FORECAST_HRS = 72;
export const SENSORS_ONLINE = 43;

export const SYSTEM_FEEDS = [
  { id:"satellite", label:"Satellite Feed",  source:"Sentinel-2", nominal:true  },
  { id:"weather",   label:"Weather Feed",    source:"ERA5",        nominal:true  },
  { id:"telemetry", label:"Telemetry Feed",  source:"AWS Network", nominal:true  },
  { id:"dem",       label:"DEM Feed",        source:"SRTM30",      nominal:false },
];

export const MOCK_INCIDENTS = [
  { time:"08:14", icon:"ti-alert-triangle", color:"#E5484D", event:"Tsho Rolpa score crossed 85 — auto-escalation triggered" },
  { time:"07:55", icon:"ti-droplet",         color:"#F0A500", event:"Rolwaling Tsho lake surface +14.1% over 30-day baseline" },
  { time:"07:30", icon:"ti-cloud-rain",      color:"#F0A500", event:"Tama Pokhari rainfall +160 mm above seasonal norm" },
  { time:"06:45", icon:"ti-mountain",        color:"#3B7DD8", event:"Imja Tsho moraine stability dropped below 0.45" },
  { time:"05:20", icon:"ti-thermometer",     color:"#3B7DD8", event:"Sabai Tsho glacial melt index exceeded 0.60" },
  { time:"00:00", icon:"ti-refresh",         color:"#1FAE7A", event:"Nightly model reanalysis completed — all 13 lakes updated" },
];
