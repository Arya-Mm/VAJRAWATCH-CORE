import { FLOW_CURVE } from './simUtils';

export default function FlowPath() {
  return (
    <mesh position={[0, 0.02, 0]}>
      <tubeGeometry args={[FLOW_CURVE, 64, 0.04, 8, false]} />
      <meshBasicMaterial
        color="#06b6d4"
        transparent
        opacity={0.35}
        wireframe={true}
      />
    </mesh>
  );
}
