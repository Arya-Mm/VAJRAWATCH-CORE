import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useLakeStore from '../../store/useLakeStore';

export default function CameraController() {
  const { camera, controls } = useThree();
  const resetTrigger = useLakeStore((s) => s.reset3DTrigger);

  const isResettingRef = useRef(false);
  const progressRef = useRef(0);
  const startPosRef = useRef(new THREE.Vector3());
  const startTargetRef = useRef(new THREE.Vector3());

  const targetPos = new THREE.Vector3(0, 8, 12);
  const targetLookAt = new THREE.Vector3(0, 0, 0);

  useEffect(() => {
    if (resetTrigger > 0) {
      isResettingRef.current = true;
      progressRef.current = 0;
      startPosRef.current.copy(camera.position);
      if (controls) {
        startTargetRef.current.copy(controls.target);
      } else {
        startTargetRef.current.set(0, 0, 0);
      }
    }
  }, [resetTrigger, camera, controls]);

  useFrame((state, delta) => {
    if (!isResettingRef.current) return;

    progressRef.current += delta * 2.2; // Lerp over ~0.45s
    const t = Math.min(progressRef.current, 1);
    const eased = t * t * (3 - 2 * t); // Cubic ease-in-out

    camera.position.lerpVectors(startPosRef.current, targetPos, eased);

    if (controls) {
      controls.target.lerpVectors(startTargetRef.current, targetLookAt, eased);
      controls.update();
    }

    if (t >= 1) {
      isResettingRef.current = false;
    }
  });

  return null;
}
