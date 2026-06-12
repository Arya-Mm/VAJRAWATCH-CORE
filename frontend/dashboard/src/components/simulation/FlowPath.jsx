import { FLOW_CURVE as STATIC_FLOW_CURVE } from './simUtils';

export default function FlowPath({ flowCurve, selectedLakeId }) {
  const activeCurve = flowCurve || STATIC_FLOW_CURVE;
  return (
    <mesh position={[0, 0.02, 0]}>
      <tubeGeometry key={selectedLakeId || 'static'} args={[activeCurve, 64, 0.04, 8, false]} />
      <meshBasicMaterial
        color="#06b6d4"
        transparent
        opacity={0.35}
        wireframe={true}
      />
    </mesh>
  );
}
