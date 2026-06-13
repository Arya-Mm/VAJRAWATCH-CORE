import { runAnalysis } from './api';

class MonitorService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.lakes = ['PDGL_THULAGI_01']; // Add more as needed
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[MonitorService] Background auto-monitor started');
    
    // Initial check
    this.checkLakes();

    // Poll every 15 seconds for demo purposes
    this.intervalId = setInterval(() => this.checkLakes(), 15000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[MonitorService] Background auto-monitor stopped');
  }

  async checkLakes() {
    for (const lakeId of this.lakes) {
      try {
        console.log(`[MonitorService] Auto-checking ${lakeId}...`);
        const data = await runAnalysis(lakeId);
        
        if (data.risk_tier === 'RED') {
          console.warn(`[MonitorService] RED ALERT DETECTED on ${lakeId}!`);
          window.dispatchEvent(new CustomEvent('vajrawatch-emergency-alert', { 
            detail: { data } 
          }));
        }
      } catch (err) {
        console.error(`[MonitorService] Error checking lake ${lakeId}:`, err);
      }
    }
  }
}

export const monitorService = new MonitorService();
