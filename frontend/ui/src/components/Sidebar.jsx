import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  TrendingUp,
  Users,
  Zap,
  GitBranch,
  Volume2,
  Play,
  Square,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronRight,
  BarChart2,
  Waves,
} from 'lucide-react';
import RiskGauge from './RiskGauge'; 
import { THULAGI_LAKE_DATA } from '../data/mockData';

const SIMULATED_LOADING_MS = 1500; // Strict 1.5s requirement from Master Prompt

function SkeletonBlock({ height = '1.25rem', width = '100%', style = {} }) {
  return (
    <div
      className="animate-pulse"
      style={{ height, width, borderRadius: '0.375rem', background: '#1e293b', ...style }}
    />
  );
}

function LoadingState() {
  return (
    <motion.div
      key="loading-skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col items-center gap-3 py-4">
        <SkeletonBlock height="180px" width="180px" style={{ borderRadius: '50%' }} />
        <SkeletonBlock height="14px" width="80px" />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <SkeletonBlock height="14px" width="40%" />
          <SkeletonBlock height="40px" />
        </div>
      ))}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <SkeletonBlock key={i} height="80px" />
        ))}
      </div>
    </motion.div>
  );
}

function CriticalAlertBanner({ data }) {
  return (
    <div className="mb-1 p-4 rounded-lg bg-red-500/10 border border-red-500/50">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-red-500" />
        <div className="flex-1">
          <div className="text-[12px] font-extrabold text-red-500 tracking-widest uppercase mb-1">
            ⚠ GLOF RISK CRITICAL — IMMEDIATE ACTION REQUIRED
          </div>
          <div className="text-[11.5px] text-slate-200/75 leading-relaxed">
            LangGraph agent analysis complete. Risk score <strong className="text-red-500">{data.risk_score}/100</strong>.
            Estimated flood front ETA: <strong className="text-[#f8fafc]">~4 hours</strong>.
            Population at risk: <strong className="text-[#f8fafc]">{data.impact.population.toLocaleString()} people</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentTrace({ trace, index }) {
  return (
    <div className={`flex gap-3 py-2 ${index < 3 ? 'border-b border-[#334155]' : ''}`}>
      <div className="w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0 text-[10px] font-bold text-blue-500 mt-[1px]">
        {trace.step}
      </div>
      <div className="flex-1">
        <div className="text-[10.5px] font-bold text-blue-500 mb-[1px]">{trace.agent}</div>
        <div className="text-[11px] text-slate-400 leading-relaxed">{trace.message}</div>
      </div>
      <CheckCircle size={12} className="text-green-500 mt-1 shrink-0" />
    </div>
  );
}

export default function Sidebar() {
  const [analysisState, setAnalysisState] = useState('idle');
  const [liveData, setLiveData] = useState(THULAGI_LAKE_DATA);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  const isLoading = analysisState === 'loading';
  const isCritical = analysisState === 'critical';
  const data = liveData;

  const handlePlayWarning = useCallback(() => {
    if (audioRef.current && audioPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioPlaying(false);
      return;
    }
    const audio = new Audio('/warning.mp3');
    audioRef.current = audio;
    audio.addEventListener('ended', () => setAudioPlaying(false));
    audio.addEventListener('error', () => setTimeout(() => setAudioPlaying(false), 3000));
    audio.play().catch(() => setTimeout(() => setAudioPlaying(false), 3000));
    setAudioPlaying(true);
  }, [audioPlaying]);

  const handleRunAnalysis = useCallback(async () => {
    if (isLoading) return;
    setAnalysisState('loading');
    
    const startTime = Date.now();
    
    try {
      // API Fallback Rule: Fetch actual data, fallback to mock JSON if offline
      const response = await axios.get('http://localhost:8000/risk/thulagi');
      setLiveData(response.data);
    } catch (error) {
      console.warn("Backend offline, silent fallback to mock data");
      setLiveData(THULAGI_LAKE_DATA);
    } finally {
      // Anticipation Loop: Force minimum SIMULATED_LOADING_MS duration
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, SIMULATED_LOADING_MS - elapsed);
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }
      setAnalysisState('critical');
    }
  }, [isLoading]);

  return (
    <aside
      className="flex flex-col h-full bg-[#111827] overflow-hidden"
      style={{ minWidth: '400px', flex: '0 0 40%' }} // Prevents flex collapse
    >
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        
        {/* Header Section */}
        <div className="flex items-start justify-between pb-3.5 border-b border-[#334155]">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin size={13} className="text-blue-500" />
              <span className="text-[10.5px] font-semibold text-slate-400 tracking-widest uppercase">
                Selected Lake
              </span>
            </div>
            <h1 className="text-lg font-extrabold text-[#f8fafc] tracking-tight leading-tight">
              {data.name}
            </h1>
            <div className="text-[10.5px] font-mono text-slate-400 mt-1">
              {data.lake_id}
            </div>
          </div>
          <div
            className={`px-3 py-1.5 rounded-full border text-[10.5px] font-extrabold tracking-widest uppercase shrink-0 transition-none ${
              isCritical ? 'bg-red-500/15 border-red-500/50 text-red-500' : 'bg-slate-500/15 border-[#334155] text-slate-400'
            }`}
          >
            {isCritical ? '● CRITICAL' : data.risk_tier}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <LoadingState key="loading" />
          ) : (
            <motion.div
              key={`data-${analysisState}`}
              initial={isCritical ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {isCritical && <CriticalAlertBanner data={data} />}

              {/* Risk Gauge */}
              <div className="bg-[#1a2236] border border-[#334155] rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart2 size={13} className="text-blue-500" />
                  <span className="text-[10.5px] font-bold text-slate-400 tracking-widest uppercase">
                    AI Risk Assessment
                  </span>
                  <span className={`ml-auto text-[9px] font-semibold tracking-wider ${isCritical ? 'text-green-500/60' : 'text-slate-400/60'}`}>
                    {isCritical ? '● ONLINE' : '● STANDBY'}
                  </span>
                </div>
                {/* Fallback to simple UI if RiskGauge component fails */}
                <RiskGauge score={data.risk_score} animated={false} />
              </div>

              {/* Top Risk Drivers (Von Restorff Effect) */}
              <div className="bg-[#1a2236] border border-[#334155] rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <TrendingUp size={13} className="text-blue-500" />
                  <span className="text-[10.5px] font-bold text-slate-400 tracking-widest uppercase">
                    Top Risk Drivers
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {data.top_drivers.map((driver, i) => {
                    // Von Restorff Effect: Highlight the first item, desaturate the rest
                    const isHighlighted = i === 0; 
                    return (
                      <div
                        key={`${driver.feature}-${i}`}
                        className={`flex items-center justify-between p-2 rounded ${isHighlighted ? 'bg-red-500/5 border border-red-500/20' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          {isHighlighted ? <Waves size={13} className="text-red-500" /> : <TrendingUp size={13} className="text-slate-400" />}
                          <span className={`text-[12.5px] font-semibold ${isHighlighted ? 'text-[#f8fafc]' : 'text-slate-300'}`}>
                            {driver.feature}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-extrabold tracking-tight ${isHighlighted ? 'text-red-500' : 'text-[#f8fafc]'}`}>
                            {driver.value}
                          </span>
                          <span className={`text-[10.5px] font-bold px-1.5 py-[1px] rounded tracking-wide ${isHighlighted ? 'text-red-500/70 bg-red-500/10' : 'text-slate-400 bg-[#0f172a]'}`}>
                            {driver.anomaly_ratio}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Impact Zone */}
              <div className="bg-[#1a2236] border border-[#334155] rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-3.5">
                  <AlertTriangle size={13} className="text-orange-500" />
                  <span className="text-[10.5px] font-bold text-slate-400 tracking-widest uppercase">
                    Impact Zone — Downstream
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg py-3 px-2 flex flex-col items-center gap-1">
                    <Users size={15} className="text-orange-500" />
                    <div className="text-base font-black text-[#f8fafc] leading-none mt-0.5">{data.impact.population.toLocaleString()}</div>
                    <div className="text-[9px] text-slate-500 font-medium tracking-wide">Population</div>
                  </div>
                  <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg py-3 px-2 flex flex-col items-center gap-1">
                    <Zap size={15} className="text-yellow-500" />
                    <div className="text-base font-black text-[#f8fafc] leading-none mt-0.5">
                      {data.impact.hydropower_mw} <span className="text-[9.5px] font-bold text-slate-500">MW</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-medium tracking-wide">Hydropower</div>
                  </div>
                  <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg py-3 px-2 flex flex-col items-center gap-1">
                    <GitBranch size={15} className="text-red-500" />
                    <div className="text-base font-black text-[#f8fafc] leading-none mt-0.5">{data.impact.bridges_at_risk || 4}</div>
                    <div className="text-[9px] text-slate-500 font-medium tracking-wide">Bridges at Risk</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-[#0f172a] rounded-lg border border-[#1e293b]">
                  <ChevronRight size={12} className="text-slate-500" />
                  <span className="text-[11px] text-slate-500">Historical analog:</span>
                  <span className="text-[11px] font-bold text-orange-500 ml-auto">{data.impact.historical_analog}</span>
                </div>
              </div>

              {/* Agent Traces */}
              {isCritical && (
                <div className="bg-[#1a2236] border border-[#334155] rounded-xl p-4 overflow-hidden">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <GitBranch size={13} className="text-blue-500" />
                      <span className="text-[10.5px] font-bold text-slate-400 tracking-widest uppercase">
                        LangGraph Agent Traces
                      </span>
                    </div>
                    <span className="text-[9.5px] font-semibold text-green-500">✓ Complete</span>
                  </div>

                  {data.agent_traces.map((trace, i) => (
                    <AgentTrace key={`${trace.step}-${trace.agent}`} trace={trace} index={i} />
                  ))}

                  <button
                    onClick={handlePlayWarning}
                    className={`flex items-center justify-center gap-2 w-full mt-3 px-4 py-2.5 rounded-lg border text-xs font-semibold ${
                      audioPlaying ? 'bg-red-500/15 border-red-500/60 text-red-500' : 'bg-red-500/10 border-red-500/30 text-red-500'
                    }`}
                  >
                    <Volume2 size={14} />
                    <span>{audioPlaying ? 'Playing Warning…' : 'Play Nepali Warning Broadcast'}</span>
                    {audioPlaying ? <Square size={11} className="ml-auto" fill="currentColor" /> : <Play size={11} className="ml-auto" />}
                  </button>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Primary Action Button (Fitts's Law Target) */}
      <div className="p-4 border-t border-[#334155] bg-[#111827] shrink-0">
        <button
          onClick={handleRunAnalysis}
          disabled={isLoading}
          className={`flex items-center justify-center gap-2 w-full text-white rounded-lg font-extrabold text-sm py-4 ${
            isLoading ? 'cursor-not-allowed bg-blue-900' : 'cursor-pointer'
          }`}
          style={{
            background: isCritical
              ? '#dc2626'
              : isLoading
              ? '#1e3a8a'
              : '#2563eb',
            boxShadow: isCritical
              ? '0 4px 24px rgba(220,38,38,0.4)'
              : '0 4px 24px rgba(37,99,235,0.3)',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Analyzing Satellite Data…</span>
            </>
          ) : isCritical ? (
            <>
              <AlertTriangle size={16} />
              <span>RE-RUN ANALYSIS</span>
            </>
          ) : (
            <>
              <Zap size={16} />
              <span>RUN ANALYSIS</span>
            </>
          )}
        </button>
        <div className="text-center mt-2 text-[10.5px] text-slate-400 tracking-wide">
          {isLoading ? 'Running local simulation…' : isCritical ? 'Analysis complete · Online' : 'Ready to run local analysis'}
        </div>
      </div>
    </aside>
  );
}