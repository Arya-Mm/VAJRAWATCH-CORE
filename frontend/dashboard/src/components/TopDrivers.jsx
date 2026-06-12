function TopDrivers({ drivers }) {
  return (
    <div>
      <h2>Top Drivers</h2>

      {drivers.map((driver, index) => (
        <div key={index}>
          {driver.feature} {driver.value}
        </div>
      ))}
    </div>
  );
}

export default TopDrivers;
