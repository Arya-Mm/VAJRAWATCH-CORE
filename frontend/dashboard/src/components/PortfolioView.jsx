import useLakeStore from '../store/useLakeStore';

export default function PortfolioView() {
  const lakesList = useLakeStore((s) => s.lakesList);

  // Compute stats dynamically from the lakesList to support scalability
  const totalLakes = lakesList.length;
  const criticalLakes = lakesList.filter((l) => l.riskTier === 'RED').length;
  const totalPopulation = lakesList.reduce((acc, l) => acc + (l.impact?.population || 0), 0);
  const totalHydropower = lakesList.reduce((acc, l) => acc + (l.impact?.hydropowerMW || 0), 0);

  return (
    <div className="portfolio-view">
      <h3 className="portfolio-title">REGIONAL PORTFOLIO</h3>
      <div className="portfolio-grid">
        <div className="portfolio-card">
          <span className="portfolio-card__label">TOTAL LAKES</span>
          <span className="portfolio-card__value">{totalLakes}</span>
          <span className="portfolio-card__sub text-green">Active Monitoring</span>
        </div>

        <div className="portfolio-card">
          <span className="portfolio-card__label">CRITICAL (RED)</span>
          <span className="portfolio-card__value text-red">{criticalLakes}</span>
          <span className="portfolio-card__sub">Immediate Threat</span>
        </div>

        <div className="portfolio-card">
          <span className="portfolio-card__label">POP. AT RISK</span>
          <span className="portfolio-card__value">
            {totalPopulation.toLocaleString()}
          </span>
          <span className="portfolio-card__sub">Downstream Valley</span>
        </div>

        <div className="portfolio-card">
          <span className="portfolio-card__label">HYDRO CAPACITY</span>
          <span className="portfolio-card__value text-orange">
            {totalHydropower} MW
          </span>
          <span className="portfolio-card__sub">Grid Infrastructure</span>
        </div>
      </div>
    </div>
  );
}
