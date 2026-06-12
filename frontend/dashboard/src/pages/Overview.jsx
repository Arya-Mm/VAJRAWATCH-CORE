import RiskGauge from "../components/RiskGauge";
import TopDrivers from "../components/TopDrivers";
import ImpactPanel from "../components/ImpactPanel";
import RunAnalysisButton from "../components/RunAnalysisButton";

import { thulagiData } from "../data/thulagiMock";

function Overview() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0f1e",
        color: "white",
        padding: "40px",
      }}
    >
      <h1>VAJRAWATCH</h1>

      <h2>{thulagiData.name}</h2>

      <RiskGauge score={thulagiData.riskScore} tier={thulagiData.riskTier} />

      <TopDrivers drivers={thulagiData.topDrivers} />

      <ImpactPanel impact={thulagiData.impact} />

      <RunAnalysisButton />
    </div>
  );
}

export default Overview;
