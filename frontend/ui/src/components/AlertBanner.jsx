import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Volume2, ShieldAlert } from 'lucide-react';
import { fetchAudioWarning } from '../services/api';

export default function AlertBanner() {
  const [activeAlert, setActiveAlert] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const handleEmergency = (e) => {
      const data = e.detail.data;
      if (!activeAlert) {
        setActiveAlert(data);
        if (data.audio_url) {
          const absoluteUrl = fetchAudioWarning(data.audio_url);
          if (absoluteUrl && !audioRef.current) {
            audioRef.current = new Audio(absoluteUrl);
            audioRef.current.loop = true; // Loop continuously
            audioRef.current.play().catch(err => console.error("Audio play failed:", err));
          }
        }
      }
    };

    window.addEventListener('vajrawatch-emergency-alert', handleEmergency);
    return () => {
      window.removeEventListener('vajrawatch-emergency-alert', handleEmergency);
    };
  }, [activeAlert]);

  const handleAcknowledge = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setActiveAlert(null);
  };

  return (
    <AnimatePresence>
      {activeAlert && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(239, 68, 68, 0.95)', // Deep Red
            backdropFilter: 'blur(10px)',
            color: 'white',
            textAlign: 'center',
            padding: '2rem'
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ShieldAlert size={120} color="white" style={{ marginBottom: '2rem' }} />
          </motion.div>
          
          <h1 style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            CRITICAL GLOF ALERT
          </h1>
          
          <h2 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '2rem', maxWidth: '800px', lineHeight: 1.4 }}>
            {activeAlert.name || activeAlert.lake_id} has reached a RISK SCORE of {activeAlert.risk_score}/100.
          </h2>

          <div style={{ fontSize: '1.25rem', marginBottom: '3rem', maxWidth: '600px', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '1rem' }}>
            <p style={{ marginBottom: '0.5rem' }}><strong>EVACUATION ROUTE:</strong> {activeAlert.impact?.evacuation_route || "Besisahar -> Khudi -> Bhulebhule -> Bharatpur (4.5h)"}</p>
            <p><strong>THREATENED POPULATION:</strong> {activeAlert.impact?.population || 12480} People</p>
          </div>

          <button 
            onClick={handleAcknowledge}
            style={{
              padding: '1.5rem 4rem',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#EF4444',
              background: 'white',
              border: 'none',
              borderRadius: '9999px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              transition: 'transform 0.1s'
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Volume2 size={28} />
            ACKNOWLEDGE & MUTE
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
