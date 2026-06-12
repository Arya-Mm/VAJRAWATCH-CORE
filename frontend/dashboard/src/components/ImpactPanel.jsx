/* ─────────────────────────────────────────────────────
 * ImpactPanel
 * Three stat cards: population, hydropower, analog.
 * Icons via react-icons/fi (Feather icon set).
 * ───────────────────────────────────────────────────── */

import { FiUsers, FiZap, FiActivity } from 'react-icons/fi';

function ImpactPanel({ impact }) {
  const stats = [
    {
      icon:  <FiUsers size={17} />,
      value: impact.population.toLocaleString(),
      label: 'At-Risk Population',
      unit:  'people downstream',
    },
    {
      icon:  <FiZap size={17} />,
      value: impact.hydropowerMW,
      label: 'Hydropower Capacity',
      unit:  'megawatts at risk',
    },
    {
      icon:  <FiActivity size={17} />,
      value: impact.historicalAnalog,
      label: 'Historical Analog',
      unit:  null,
    },
  ];

  return (
    <div className="impact-panel">
      <div className="panel-label">IMPACT ASSESSMENT</div>

      <div className="impact-stats">
        {stats.map((s, i) => (
          <div key={i} className="impact-stat">
            <div className="impact-stat__icon" aria-hidden="true">
              {s.icon}
            </div>
            <div className="impact-stat__value">{s.value}</div>
            <div className="impact-stat__label">{s.label}</div>
            {s.unit && (
              <div className="impact-stat__unit">{s.unit}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImpactPanel;
