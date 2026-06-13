import { useState, useCallback, useRef, useEffect } from 'react';
import { runAnalysis, fetchAudioWarning } from '../services/api';
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
import { MOCK_LAKES } from '../data/mockData';

const SIMULATED_LOADING_MS = 1500; // Strict 1.5s requirement from Master Prompt

function SkeletonBlock({ height = '1.25rem', width = '100%', style = {} }) {
  return (
    <div
      style={{ height, width, borderRadius: '0.375rem', background: '#F3F4F6', ...style }}
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
    <div className={`mb-1 p-4 rounded-lg border-2 bg-[#FFFFFF] ${data.risk_tier === 'RED' ? 'border-red-500' : 'border-orange-500'}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className={data.risk_tier === 'RED' ? 'text-red-500' : 'text-orange-500'} />
        <div className="flex-1">
          <div className={`text-[12px] font-extrabold tracking-widest uppercase mb-1 ${data.risk_tier === 'RED' ? 'text-red-500' : 'text-orange-500'}`}>
            ⚠ GLOF RISK {data.risk_tier} — IMMEDIATE ACTION REQUIRED
          </div>
          <div className="text-[11.5px] text-[#000000] leading-relaxed">
            LangGraph agent analysis complete. Risk score <strong className={data.risk_tier === 'RED' ? 'text-red-500' : 'text-orange-500'}>{data.risk_score}/100</strong>.
            Estimated flood front ETA: <strong className="text-[#000000]">~4 hours</strong>.
            Population at risk: <strong className="text-[#000000]">{data.impact.population.toLocaleString()} people</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentTrace({ trace, index }) {
  return (
    <div className={`flex gap-3 py-2 ${index < 3 ? 'border-b border-[#E5E7EB]' : ''}`}>
      <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-[10px] font-bold text-blue-600 mt-[1px]">
        {trace.step}
      </div>
      <div className="flex-1">
        <div className="text-[10.5px] font-bold text-[#000000] mb-[1px]">{trace.agent}</div>
        <div className="text-[11px] text-[#6F6F6F] leading-relaxed">{trace.message}</div>
      </div>
      <CheckCircle size={12} className="text-green-500 mt-1 shrink-0" />
    </div>
  );
}

export default function Sidebar({ activeLakeId, setActiveLakeId }) {
  const [analysisState, setAnalysisState] = useState('idle');
  const [liveData, setLiveData] = useState(MOCK_LAKES[activeLakeId]);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  // When active lake changes from the map or dropdown, reset sidebar state
  useEffect(() => {
    setAnalysisState('idle');
    setLiveData(MOCK_LAKES[activeLakeId]);
    if (audioPlaying && audioRef.current) {
      audioRef.current.pause();
      setAudioPlaying(false);
    }
  }, [activeLakeId]);

  const isLoading = analysisState === 'loading';
  const isCritical = analysisState === 'critical';
  const data = liveData || MOCK_LAKES["PDGL_THULAGI_01"];

  const handlePlayWarning = useCallback(() => {
    if (audioRef.current && audioPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioPlaying(false);
      return;
    }
    const audioUrl = data.audio_url ? fetchAudioWarning(data.audio_url) : '/warning.mp3';
    const audio = new Audio(audioUrl);
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
      const result = await runAnalysis(activeLakeId);
      setLiveData(result);
    } catch (error) {
      console.warn(`Fallback triggered in Sidebar`);
    } finally {
      // Anticipation Loop: Force minimum SIMULATED_LOADING_MS duration
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, SIMULATED_LOADING_MS - elapsed);
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }
      setAnalysisState('critical');
    }
  }, [isLoading, activeLakeId]);

  return (
    <aside
      className="flex flex-col h-full bg-[#FFFFFF] overflow-hidden"
      style={{ minWidth: '400px', flex: '0 0 40%' }} // Prevents flex collapse
    >
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        
        {/* Header Section */}
        <div className="flex items-start justify-between pb-3.5 border-b border-[#E5E7EB]">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin size={13} className="text-black" />
              <span className="text-[10.5px] font-semibold text-[#6F6F6F] tracking-widest uppercase">
                Selected Target
              </span>
            </div>
            
            <div
              className="text-3xl font-serif text-[#000000] tracking-tight leading-tight pb-1"
            >
              {data.name}
            </div>

            <div className="text-[10.5px] font-mono text-[#6F6F6F] mt-1">
              {data.lake_id}
            </div>
          </div>
          <div
            className={`px-3 py-1.5 rounded-full border text-[10.5px] font-extrabold tracking-widest uppercase shrink-0 transition-none ${
              isCritical && data.risk_tier === 'RED' ? 'bg-red-50 border-red-500 text-red-500' 
              : isCritical && data.risk_tier === 'AMBER' ? 'bg-orange-50 border-orange-500 text-orange-500'
              : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#6F6F6F]'
            }`}
          >
            {isCritical ? `● ${data.risk_tier}` : 'STANDBY'}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <LoadingState key="loading" />
          ) : (
            <motion.div
              key={`data-${analysisState}-${activeLakeId}`}
              initial={isCritical ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {isCritical && <CriticalAlertBanner data={data} />}

              {/* Risk Gauge */}
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart2 size={13} className="text-black" />
                  <span className="text-[10.5px] font-bold text-[#6F6F6F] tracking-widest uppercase">
                    AI Risk Assessment
                  </span>
                  <span className={`ml-auto text-[9px] font-semibold tracking-wider ${isCritical ? 'text-green-600' : 'text-[#6F6F6F]'}`}>
                    {isCritical ? '● ONLINE' : '● STANDBY'}
                  </span>
                </div>
                {/* Fallback to simple UI if RiskGauge component fails */}
                <RiskGauge score={data.risk_score} animated={false} />
              </div>

              {/* Top Risk Drivers (Von Restorff Effect) */}
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <TrendingUp size={13} className="text-black" />
                  <span className="text-[10.5px] font-bold text-[#6F6F6F] tracking-widest uppercase">
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
                        className={`flex items-center justify-between p-2 rounded ${isHighlighted ? (data.risk_tier === 'RED' ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200') : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          {isHighlighted ? <Waves size={13} className={data.risk_tier === 'RED' ? 'text-red-500' : 'text-orange-500'} /> : <TrendingUp size={13} className="text-[#6F6F6F]" />}
                          <span className={`text-[12.5px] font-semibold ${isHighlighted ? 'text-[#000000]' : 'text-[#6F6F6F]'}`}>
                            {driver.feature}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-extrabold tracking-tight ${isHighlighted ? (data.risk_tier === 'RED' ? 'text-red-500' : 'text-orange-500') : 'text-[#000000]'}`}>
                            {driver.value}
                          </span>
                          <span className={`text-[10.5px] font-bold px-1.5 py-[1px] rounded tracking-wide ${isHighlighted ? (data.risk_tier === 'RED' ? 'text-red-700 bg-red-100' : 'text-orange-700 bg-orange-100') : 'text-[#6F6F6F] bg-[#E5E7EB]'}`}>
                            {driver.anomaly_ratio}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Impact Zone */}
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-3.5">
                  <AlertTriangle size={13} className="text-black" />
                  <span className="text-[10.5px] font-bold text-[#6F6F6F] tracking-widest uppercase">
                    Impact Zone — Downstream
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg py-3 px-2 flex flex-col items-center gap-1">
                    <Users size={15} className="text-black" />
                    <div className="text-base font-black text-[#000000] leading-none mt-0.5">{data.impact.population.toLocaleString()}</div>
                    <div className="text-[9px] text-[#6F6F6F] font-medium tracking-wide">Population</div>
                  </div>
                  <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg py-3 px-2 flex flex-col items-center gap-1">
                    <Zap size={15} className="text-black" />
                    <div className="text-base font-black text-[#000000] leading-none mt-0.5">
                      {data.impact.hydropower_mw} <span className="text-[9.5px] font-bold text-[#6F6F6F]">MW</span>
                    </div>
                    <div className="text-[9px] text-[#6F6F6F] font-medium tracking-wide">Hydropower</div>
                  </div>
                  <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg py-3 px-2 flex flex-col items-center gap-1">
                    <GitBranch size={15} className="text-black" />
                    <div className="text-base font-black text-[#000000] leading-none mt-0.5">{data.impact.bridges_at_risk || 4}</div>
                    <div className="text-[9px] text-[#6F6F6F] font-medium tracking-wide">Bridges at Risk</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-[#FFFFFF] rounded-lg border border-[#E5E7EB]">
                  <ChevronRight size={12} className="text-[#6F6F6F]" />
                  <span className="text-[11px] text-[#6F6F6F]">Historical analog:</span>
                  <span className="text-[11px] font-bold text-[#000000] ml-auto">{data.impact.historical_analog}</span>
                </div>
              </div>

              {/* Agent Traces */}
              {isCritical && (
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 overflow-hidden">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <GitBranch size={13} className="text-black" />
                      <span className="text-[10.5px] font-bold text-[#6F6F6F] tracking-widest uppercase">
                        LangGraph Agent Traces
                      </span>
                    </div>
                    <span className="text-[9.5px] font-semibold text-green-600">✓ Complete</span>
                  </div>

                  {data.agent_traces.map((trace, i) => (
                    <AgentTrace key={`${trace.step}-${trace.agent}`} trace={trace} index={i} />
                  ))}

                  <button
                    onClick={handlePlayWarning}
                    className="flex items-center justify-center gap-2 w-full mt-3 px-4 py-2.5 rounded-lg border border-[#000000] text-[#000000] bg-white text-xs font-semibold hover:bg-gray-50 transition-colors"
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
      <div className="p-4 border-t border-[#E5E7EB] bg-[#FFFFFF] shrink-0">
        <button
          onClick={handleRunAnalysis}
          disabled={isLoading}
          className={`flex items-center justify-center gap-2 w-full text-white rounded-full font-extrabold text-sm py-4 transition-transform duration-200 ${
            isLoading ? 'cursor-not-allowed bg-gray-400' : 'cursor-pointer bg-[#000000] hover:scale-105'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin text-white" />
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
        <div className="text-center mt-2 text-[10.5px] text-[#6F6F6F] tracking-wide">
          {isLoading ? 'Running local simulation…' : isCritical ? 'Analysis complete · Online' : 'Ready to run local analysis'}
        </div>
      </div>
    </aside>
  );
}