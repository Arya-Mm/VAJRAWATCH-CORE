function RiskGauge({ score, tier }) {
  return (
    <div>
      <h2>Risk Score</h2>
      <h1>{score}</h1>
      <p>{tier}</p>
    </div>
  );
}

export default RiskGauge;
