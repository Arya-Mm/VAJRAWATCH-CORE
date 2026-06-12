/**
 * TopDrivers — Phase 4
 * Adds AnimatePresence skeleton ↔ data cross-fade.
 */

import { motion, AnimatePresence } from 'framer-motion';

const RANK_WEIGHTS = [87, 63, 45, 32, 20];

function TopDriversSkeleton() {
  return (
    <div className="top-drivers">
      <p className="section-label">Top Risk Drivers</p>
      <div className="drivers-list">
        {[0, 1].map(i => (
          <div key={i} className="driver-item">
            <div className="skeleton skeleton--driver-row" />
            <div className="skeleton skeleton--bar" />
            <div className="skeleton skeleton--driver-footer" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DriversData({ drivers }) {
  return (
    <div className="top-drivers">
      <p className="section-label">Top Risk Drivers</p>
      <div className="drivers-list">
        {drivers.map((driver, i) => {
          const weight = RANK_WEIGHTS[i] ?? 20;

          return (
            <div key={i} className="driver-item">
              <div className="driver-header">
                <span className="driver-rank" aria-label={`Rank ${i + 1}`}>{i + 1}</span>
                <span className="driver-feature">{driver.feature}</span>
                <span className="driver-value">{driver.value}</span>
              </div>
              <div
                className="driver-bar-track"
                role="progressbar"
                aria-valuenow={weight}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="driver-bar-fill" style={{ width: `${weight}%` }} />
              </div>
              <div className="driver-footer">
                <span>Impact weight</span>
                <span>{weight}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopDrivers({ drivers, isLoading }) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <TopDriversSkeleton />
        </motion.div>
      ) : (
        <motion.div
          key="data"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <DriversData drivers={drivers} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TopDrivers;
