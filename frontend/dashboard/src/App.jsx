import "./App.css";

function App() {
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

      <h2>Thulagi Lake</h2>

      <h3>Risk Score: 84</h3>

      <p>Risk Tier: RED</p>

      <h3>Top Drivers</h3>

      <ul>
        <li>Rainfall Anomaly +210mm</li>
        <li>Lake Area Expansion +18.5%</li>
      </ul>

      <h3>Impact Zone</h3>

      <ul>
        <li>Population: 12,480</li>
        <li>Hydropower: 186 MW</li>
      </ul>

      <button>RUN ANALYSIS</button>
    </div>
  );
}

export default App;
