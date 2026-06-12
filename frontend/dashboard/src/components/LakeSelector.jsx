import useLakeStore from '../store/useLakeStore';

export default function LakeSelector() {
  const selectedLakeId = useLakeStore((s) => s.selectedLakeId);
  const lakesList = useLakeStore((s) => s.lakesList);
  const selectLake = useLakeStore((s) => s.selectLake);

  return (
    <div className="lake-selector-wrapper">
      <select
        value={selectedLakeId}
        onChange={(e) => selectLake(e.target.value)}
        className="lake-selector-dropdown"
        aria-label="Select monitoring lake"
      >
        {lakesList.map((lake) => (
          <option key={lake.lakeId} value={lake.lakeId}>
            {lake.name} ({lake.riskTier})
          </option>
        ))}
      </select>
      <span className="lake-selector-arrow" aria-hidden="true">▼</span>
    </div>
  );
}
