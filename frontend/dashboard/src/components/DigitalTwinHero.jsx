import { useRef, useState, useEffect } from "react";
import { T, ui, mono, flex, col } from "../utils/theme.js";
import { ErrorState } from "./UI.jsx";

const LAYER_DEFS = [
  { key: "lake", label: "Lake", color: "#3B7DD8" },
  { key: "risk", label: "Risk zone", color: "#E5484D" },
  { key: "flood", label: "Flood path", color: "#F0A500" },
  { key: "infra", label: "Infrastructure", color: "#6366F1" },
];

export default function DigitalTwinHero({ lake, layers, dispatch }) {
  const cvRef = useRef(null);
  const rafRef = useRef(null);
  const objRef = useRef({});
  const [threeReady, setThreeReady] = useState(false);
  const [threeErr, setThreeErr] = useState(null);

  useEffect(() => {
    const SCRIPT_ID = "three-js-r128-vajra";
    let cancelled = false;

    const initThree = () => {
      if (!cvRef.current || cancelled) return;
      try {
        const THREE = window.THREE;
        const W = cvRef.current.clientWidth || 700;
        const H = cvRef.current.clientHeight || 340;
        const renderer = new THREE.WebGLRenderer({
          canvas: cvRef.current,
          antialias: true,
          alpha: false,
        });
        renderer.setSize(W, H);
        renderer.setClearColor(0xe8eef6, 1);
        renderer.shadowMap.enabled = true;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0xe8eef6, 0.016);
        const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 500);
        camera.position.set(0, 22, 32);
        camera.lookAt(0, 0, 0);

        // Terrain
        const terrainGeo = new THREE.PlaneGeometry(42, 28, 64, 64);
        terrainGeo.rotateX(-Math.PI / 2);
        const pos = terrainGeo.attributes.position;
        const heights = [];
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i),
            z = pos.getZ(i);
          const h =
            Math.sin(x * 0.28) * 3.5 +
            Math.cos(z * 0.35) * 2.8 +
            Math.sin((x * 0.6 + z * 0.4) * 0.45) * 1.8 +
            Math.cos((x * 0.3 - z * 0.5) * 0.6) * 1.2 +
            Math.sin(x * 1.1) * 0.5 +
            Math.cos(z * 1.3) * 0.4;
          pos.setY(i, h);
          heights.push(h);
        }
        terrainGeo.computeVertexNormals();
        const maxH = Math.max(...heights);
        const colors = new Float32Array(pos.count * 3);
        for (let i = 0; i < pos.count; i++) {
          const t = Math.max(0, heights[i] / maxH);
          colors[i * 3] = 0.62 + t * 0.34;
          colors[i * 3 + 1] = 0.7 + t * 0.27;
          colors[i * 3 + 2] = 0.8 + t * 0.18;
        }
        terrainGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        const terrainMat = new THREE.MeshLambertMaterial({
          vertexColors: true,
        });
        const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
        terrainMesh.receiveShadow = true;
        scene.add(terrainMesh);

        const wireGeo = terrainGeo.clone();
        const wireMat = new THREE.MeshBasicMaterial({
          color: 0xc2d2e8,
          wireframe: true,
          transparent: true,
          opacity: 0.3,
        });
        scene.add(new THREE.Mesh(wireGeo, wireMat));

        // Lake body
        const lakeGeo = new THREE.CylinderGeometry(3.8, 3.5, 0.15, 48);
        const lakeMat = new THREE.MeshLambertMaterial({
          color: 0x3b7dd8,
          transparent: true,
          opacity: 0.88,
          emissive: 0x2f6fe0,
          emissiveIntensity: 0.35,
        });
        const lakeMesh = new THREE.Mesh(lakeGeo, lakeMat);
        lakeMesh.position.set(-1, 0.8, 0);
        scene.add(lakeMesh);

        // Risk halo
        const haloGeo = new THREE.CylinderGeometry(5.2, 5.0, 0.04, 48);
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0xe5484d,
          transparent: true,
          opacity: 0.16,
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.position.set(-1, 0.82, 0);
        scene.add(haloMesh);

        // Flood path
        const floodGeo = new THREE.CylinderGeometry(2.2, 0.4, 0.05, 32);
        const floodMat = new THREE.MeshBasicMaterial({
          color: 0xf0a500,
          transparent: true,
          opacity: 0.18,
        });
        const floodMesh = new THREE.Mesh(floodGeo, floodMat);
        floodMesh.position.set(-0.5, -0.1, 9);
        floodMesh.scale.set(1, 1, 3.5);
        scene.add(floodMesh);

        // Infrastructure markers
        const infraGroup = new THREE.Group();
        [
          [-4, 0, 6],
          [3, 0, -4],
          [6, 0, 2],
          [-6, 0, -2],
        ].forEach(([x, , z]) => {
          const m = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8),
            new THREE.MeshBasicMaterial({ color: 0x6366f1 }),
          );
          m.position.set(x, 1, z);
          infraGroup.add(m);
        });
        scene.add(infraGroup);

        // Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 1.0));
        const kl = new THREE.DirectionalLight(0xffffff, 1.2);
        kl.position.set(-12, 28, 12);
        kl.castShadow = true;
        scene.add(kl);
        const fl = new THREE.DirectionalLight(0xcbd8ee, 0.5);
        fl.position.set(14, 10, -10);
        scene.add(fl);

        objRef.current = {
          renderer,
          terrainGeo,
          terrainMat,
          wireGeo,
          wireMat,
          lakeGeo,
          lakeMat,
          lakeMesh,
          haloGeo,
          haloMat,
          haloMesh,
          floodGeo,
          floodMat,
          floodMesh,
          infraGroup,
          scene,
        };

        let frame = 0;
        const animate = () => {
          if (cancelled) return;
          frame++;
          const theta = frame * 0.0012,
            camR = 32 + Math.sin(frame * 0.004) * 2;
          camera.position.x = Math.sin(theta) * camR;
          camera.position.z = Math.cos(theta) * camR;
          camera.position.y = 20 + Math.sin(frame * 0.007) * 1.5;
          camera.lookAt(0, 0, 0);
          haloMesh.material.opacity = 0.1 + Math.sin(frame * 0.04) * 0.08;
          lakeMesh.material.emissiveIntensity =
            0.25 + Math.sin(frame * 0.05) * 0.15;
          floodMesh.material.opacity = 0.1 + Math.sin(frame * 0.03 + 1) * 0.08;
          renderer.render(scene, camera);
          rafRef.current = requestAnimationFrame(animate);
        };
        animate();
        if (!cancelled) setThreeReady(true);
      } catch (e) {
        if (!cancelled) setThreeErr(e.message);
      }
    };

    let s = document.getElementById(SCRIPT_ID);
    if (s) {
      if (window.THREE) initThree();
      else s.addEventListener("load", initThree, { once: true });
    } else {
      s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src =
        "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      s.onload = initThree;
      s.onerror = () => {
        if (!cancelled) setThreeErr("Three.js CDN unreachable");
      };
      document.head.appendChild(s);
    }

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const o = objRef.current;
      [
        "terrainGeo",
        "terrainMat",
        "wireGeo",
        "wireMat",
        "lakeGeo",
        "lakeMat",
        "haloGeo",
        "haloMat",
        "floodGeo",
        "floodMat",
      ].forEach((k) => {
        if (o[k]) o[k].dispose();
      });
      if (o.renderer) o.renderer.dispose();
      objRef.current = {};
    };
  }, [lake.id]);

  useEffect(() => {
    const o = objRef.current;
    if (!o.lakeMesh) return;
    o.lakeMesh.visible = layers.lake;
    o.haloMesh.visible = layers.risk;
    o.floodMesh.visible = layers.flood;
    o.infraGroup.visible = layers.infra;
  }, [layers]);

  const c = T.risk[lake.risk];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${T.border}`,
        background: "#E8EEF6",
      }}
    >
      <canvas
        ref={cvRef}
        style={{ width: "100%", height: "100%", display: "block" }}
        aria-label="Procedural digital twin terrain visualization"
      />

      {/* Lake info overlay */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 18,
          maxWidth: 280,
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.6)",
          borderRadius: 14,
          padding: "12px 14px",
          boxShadow: "0 8px 24px rgba(27,40,56,0.10)",
          ...flex({ gap: 10, alignItems: "flex-start" }),
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: c.bg,
            ...flex({ alignItems: "center", justifyContent: "center" }),
            flexShrink: 0,
          }}
        >
          <i className="ti ti-droplet" style={{ fontSize: 15, color: c.fg }} />
        </div>
        <div>
          <div style={{ ...ui, fontSize: 13, fontWeight: 700, color: T.text }}>
            {lake.name}
          </div>
          <div
            style={{
              ...ui,
              fontSize: 12,
              color: T.muted,
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            Score {lake.score} · {lake.pop.toLocaleString()} at risk ·{" "}
            {lake.reach} km reach
          </div>
        </div>
      </div>

      {/* Risk badge overlay */}
      <div
        style={{
          position: "absolute",
          top: 18,
          right: 18,
          ...flex({ alignItems: "center", gap: 6 }),
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.6)",
          borderRadius: 999,
          padding: "6px 14px",
          fontSize: 11,
          ...ui,
          color: c.fg,
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: c.fg,
            display: "inline-block",
          }}
        />
        {lake.risk}
      </div>

      {/* Layer controls */}
      {threeReady && (
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: 18,
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.6)",
            borderRadius: 12,
            padding: "10px 14px",
            ...col({ gap: 6 }),
          }}
        >
          <div
            style={{
              ...ui,
              fontSize: 10,
              fontWeight: 700,
              color: T.dim,
              marginBottom: 2,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Layers
          </div>
          {LAYER_DEFS.map((ld) => (
            <button
              key={ld.key}
              onClick={() => dispatch({ type: "TOGGLE_LAYER", layer: ld.key })}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                ...flex({ gap: 7, alignItems: "center" }),
                padding: 0,
              }}
              aria-pressed={layers[ld.key]}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: layers[ld.key] ? ld.color : T.ghost,
                  display: "inline-block",
                  transition: "background .15s",
                }}
              />
              <span
                style={{
                  ...ui,
                  fontSize: 11,
                  color: layers[ld.key] ? T.text : T.dim,
                }}
              >
                {ld.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Demo watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 18,
          right: 18,
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.6)",
          borderRadius: 10,
          padding: "5px 12px",
        }}
      >
        <div
          style={{
            fontSize: 9,
            ...mono,
            color: T.risk.HIGH.fg,
            fontWeight: 700,
          }}
        >
          DEMO — PROCEDURAL TERRAIN
        </div>
      </div>

      {threeErr && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            ...flex({
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 8,
            }),
          }}
        >
          <ErrorState message={`3D engine error: ${threeErr}`} />
        </div>
      )}
    </div>
  );
}
