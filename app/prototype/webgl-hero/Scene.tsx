"use client";
/**
 * EXPERIMENTAL. A React Three Fiber version of the hero pipeline, isolated on /prototype/webgl-hero.
 * Nothing on the real site imports this file. Dependencies: three and @react-three/fiber only (no drei, no HDR downloads):
 * reflections come from three's procedural RoomEnvironment.
 *
 * Four instruments on four graphite platforms, joined by one copper signal path:
 *   DATA      a lattice of upright cells, a few in copper
 *   MODEL     three competing bars, the winner in copper
 *   EVALUATE  a gauge whose two arcs are drawn to the real numbers: 80% nominal coverage, 74.2% observed
 *   DEPLOY    a small graph of nodes
 */
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const COPPER = "#D87B55";
const IVORY = "#EDE8DD";
const SLATE = "#6E7C86";

// Platform footprint, and where each of the four sits. The line climbs left to right, like a pipeline.
const PW = 2.1, PH = 0.16, PD = 1.55;
const POS: [number, number, number][] = [
  [-3.3, -0.55, 0.55],
  [-1.1, -0.18, 0.2],
  [1.1, 0.19, -0.15],
  [3.3, 0.56, -0.5],
];
const TOP = PH / 2;

const damp = (cur: number, target: number, rate: number, dt: number) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

type Mats = { graphite: THREE.MeshPhysicalMaterial; ivory: THREE.MeshPhysicalMaterial; slate: THREE.MeshPhysicalMaterial; copper: THREE.MeshPhysicalMaterial };

function useMaterials(): Mats {
  return useMemo(() => ({
    graphite: new THREE.MeshPhysicalMaterial({ color: "#1c2229", metalness: 0.55, roughness: 0.36, clearcoat: 0.55, clearcoatRoughness: 0.32 }),
    ivory: new THREE.MeshPhysicalMaterial({ color: IVORY, metalness: 0, roughness: 0.52, clearcoat: 0.25, clearcoatRoughness: 0.5 }),
    slate: new THREE.MeshPhysicalMaterial({ color: SLATE, metalness: 0.2, roughness: 0.5 }),
    copper: new THREE.MeshPhysicalMaterial({ color: COPPER, metalness: 1, roughness: 0.27, emissive: "#8a3a1c", emissiveIntensity: 0.3 }),
  }), []);
}

function Env() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const tex = pmrem.fromScene(room, 0.04).texture;
    scene.environment = tex;
    scene.environmentIntensity = 0.5;
    return () => { scene.environment = null; tex.dispose(); pmrem.dispose(); room.dispose(); };
  }, [gl, scene]);
  return null;
}

/* ───────────── instruments ───────────── */

const DATA_H = [0.18, 0.42, 0.12, 0.3, 0.52, 0.22, 0.36, 0.15, 0.46, 0.26, 0.34, 0.2, 0.5, 0.14, 0.4, 0.28, 0.16, 0.44, 0.24, 0.32];
const DATA_COPPER = new Set([4, 8, 12, 17]);

function DataField({ m, cell }: { m: Mats; cell: THREE.BufferGeometry }) {
  return (
    <group position={[0, TOP, 0]}>
      {DATA_H.map((h, i) => {
        const c = i % 5, r = Math.floor(i / 5);
        return (
          <mesh key={i} geometry={cell} material={DATA_COPPER.has(i) ? m.copper : m.ivory} position={[(c - 2) * 0.36, h / 2, (r - 1.5) * 0.31]} scale={[1, h, 1]} castShadow />
        );
      })}
    </group>
  );
}

function ModelBars({ m, bar }: { m: Mats; bar: THREE.BufferGeometry }) {
  const bars: [number, number, THREE.Material][] = [[-0.55, 0.4, m.slate], [0, 0.66, m.ivory], [0.55, 1.05, m.copper]];
  return (
    <group position={[0, TOP, 0.05]}>
      {bars.map(([x, h, mat]) => (
        <mesh key={x} geometry={bar} material={mat} position={[x, h / 2, 0]} scale={[1, h, 1]} castShadow />
      ))}
      <mesh material={m.slate} position={[0, 0.012, 0.45]}><boxGeometry args={[1.7, 0.024, 0.04]} /></mesh>
    </group>
  );
}

const NOMINAL = 0.8, OBSERVED = 0.742;
function Gauge({ m }: { m: Mats }) {
  const arcs = useMemo(() => ({
    nominal: new THREE.TorusGeometry(0.62, 0.035, 18, 120, Math.PI * 2 * NOMINAL),
    observed: new THREE.TorusGeometry(0.42, 0.05, 18, 120, Math.PI * 2 * OBSERVED),
    trackOuter: new THREE.TorusGeometry(0.62, 0.008, 8, 120),
    trackInner: new THREE.TorusGeometry(0.42, 0.008, 8, 120),
  }), []);
  return (
    <group position={[0, TOP + 0.07, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
      <mesh geometry={arcs.trackOuter} material={m.slate} />
      <mesh geometry={arcs.trackInner} material={m.slate} />
      <mesh geometry={arcs.nominal} material={m.ivory} castShadow />
      <mesh geometry={arcs.observed} material={m.copper} castShadow />
      <mesh material={m.copper} position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.025, 0.025, 0.2, 16]} /></mesh>
    </group>
  );
}

const NODES: [number, number][] = [[-0.75, 0], [-0.2, 0], [0.35, -0.4], [0.35, 0.4], [0.8, -0.4]];
const EDGES: [number, number][] = [[0, 1], [1, 2], [1, 3], [2, 4]];
function Edge({ a, b, mat }: { a: THREE.Vector3; b: THREE.Vector3; mat: THREE.Material }) {
  const { pos, quat, len } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { pos: a.clone().add(b).multiplyScalar(0.5), quat, len };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} material={mat}><cylinderGeometry args={[0.02, 0.02, len, 10]} /></mesh>
  );
}
function Graph({ m, node }: { m: Mats; node: THREE.BufferGeometry }) {
  const pts = useMemo(() => NODES.map(([x, z]) => new THREE.Vector3(x, 0.1, z)), []);
  return (
    <group position={[0, TOP, 0]}>
      {EDGES.map(([i, j]) => (<Edge key={`${i}${j}`} a={pts[i]} b={pts[j]} mat={m.slate} />))}
      {pts.map((p, i) => (
        <mesh key={i} geometry={node} material={i === 0 || i === 4 ? m.copper : m.ivory} position={p} castShadow />
      ))}
    </group>
  );
}

/* ───────────── platform ───────────── */

function Platform({ index, active, intro, rm, m, geo, onSelect, children }: {
  index: number; active: boolean; intro: React.MutableRefObject<number>; rm: boolean;
  m: Mats; geo: THREE.BufferGeometry; onSelect: (i: number) => void; children: React.ReactNode;
}) {
  const g = useRef<THREE.Group>(null);
  const rim = useRef<THREE.Mesh>(null);
  const rimMat = useMemo(() => new THREE.MeshBasicMaterial({ color: COPPER, transparent: true, opacity: 0 }), []);
  const lift = useRef(0);
  useFrame((_, dt) => {
    if (!g.current) return;
    lift.current = rm ? (active ? 0.2 : 0) : damp(lift.current, active ? 0.2 : 0, 6, dt);
    const rise = rm ? 0 : -(1 - ease((intro.current - index * 0.12) / 0.55)) * 1.1;
    g.current.position.y = POS[index][1] + lift.current + rise;
    rimMat.opacity = damp(rimMat.opacity, active ? 0.95 : 0, rm ? 40 : 7, dt);
    if (rim.current) rim.current.visible = rimMat.opacity > 0.01;
  });
  return (
    <group ref={g} position={[POS[index][0], POS[index][1], POS[index][2]]} rotation={[0, -0.12, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(index); }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = ""; }}>
      <mesh geometry={geo} material={m.graphite} castShadow receiveShadow />
      <mesh ref={rim} material={rimMat} position={[0, -PH / 2 - 0.012, 0]}><boxGeometry args={[PW + 0.1, 0.012, PD + 0.1]} /></mesh>
      {children}
    </group>
  );
}

/* ───────────── signal path ───────────── */

function SignalPath({ active, intro, rm, m }: { active: number; intro: React.MutableRefObject<number>; rm: boolean; m: Mats }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(POS[0][0] - 1.15, POS[0][1] + 0.34, POS[0][2] + 0.95),
    ...POS.map((p) => new THREE.Vector3(p[0], p[1] + 0.34, p[2] + 0.95)),
    new THREE.Vector3(POS[3][0] + 1.15, POS[3][1] + 0.34, POS[3][2] + 0.95),
  ], false, "catmullrom", 0.4), []);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 220, 0.017, 8, false), [curve]);
  const total = tube.index!.count;
  const bead = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    const p = rm ? 1 : ease((intro.current - 0.55) / 0.7);
    tube.setDrawRange(0, Math.floor((total * p) / 6) * 6);
    // the bead goes to the active stage and rests there; it does not loop
    const target = 0.12 + (active / 3) * 0.76;
    t.current = rm ? target : damp(t.current, target, 3.2, dt);
    if (bead.current) {
      bead.current.position.copy(curve.getPointAt(Math.min(0.999, t.current)));
      bead.current.visible = p > 0.99;
    }
  });
  return (
    <group>
      <mesh geometry={tube} material={m.copper} castShadow />
      <mesh ref={bead} material={m.copper}><boxGeometry args={[0.1, 0.1, 0.1]} /></mesh>
    </group>
  );
}

/* ───────────── rig: camera, light, intro ───────────── */

function Rig({ active, rm, intro }: { active: number; rm: boolean; intro: React.MutableRefObject<number> }) {
  const { camera, size } = useThree();
  const key = useRef<THREE.PointLight>(null);
  const look = useRef(new THREE.Vector3(0, 0.1, 0));
  const off = useRef({ x: 0, y: 0 });
  useFrame((state, dt) => {
    intro.current = rm ? 2 : Math.min(2, intro.current + dt * 0.75);
    const aspect = size.width / size.height;
    const k = aspect >= 1.35 ? 1 : Math.min(2.1, (1.35 / aspect) * 0.92);
    const px = rm ? 0 : state.pointer.x, py = rm ? 0 : state.pointer.y;
    off.current.x = damp(off.current.x, px, 3, dt);
    off.current.y = damp(off.current.y, py, 3, dt);
    const tx = POS[active][0] * 0.28, ty = POS[active][1] * 0.5;
    look.current.set(damp(look.current.x, tx, rm ? 40 : 2.5, dt), damp(look.current.y, ty + 0.1, rm ? 40 : 2.5, dt), 0);
    camera.position.set((3.2 + off.current.x * 1.3) * k, (4.3 + off.current.y * 0.8) * k, 9.2 * k);
    camera.lookAt(look.current);
    if (key.current) {
      const p = POS[active];
      key.current.position.set(damp(key.current.position.x, p[0] + 0.3, 4, dt), p[1] + 1.8, p[2] + 1.4);
    }
  });
  return <pointLight ref={key} color={COPPER} intensity={9} distance={6} decay={2} position={[0, 2, 1]} />;
}

/* ───────────── scene ───────────── */

function World({ active, onSelect, rm }: { active: number; onSelect: (i: number) => void; rm: boolean }) {
  const m = useMaterials();
  const intro = useRef(0);
  const g = useMemo(() => ({
    platform: new RoundedBoxGeometry(PW, PH, PD, 4, 0.05),
    cell: new RoundedBoxGeometry(0.24, 1, 0.2, 3, 0.03),
    bar: new RoundedBoxGeometry(0.42, 1, 0.5, 3, 0.04),
    node: new RoundedBoxGeometry(0.17, 0.17, 0.17, 3, 0.035),
  }), []);
  useEffect(() => () => { Object.values(g).forEach((x) => x.dispose()); }, [g]);

  return (
    <>
      <Env />
      <Rig active={active} rm={rm} intro={intro} />
      <hemisphereLight args={["#cfd8df", "#101317", 0.35]} />
      <directionalLight color="#fff1e2" intensity={2.6} position={[5, 8, 4]} castShadow shadow-mapSize={[1536, 1536]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-camera-near={1} shadow-camera-far={24} shadow-bias={-0.0004} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.25, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial opacity={0.5} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <Platform key={i} index={i} active={active === i} intro={intro} rm={rm} m={m} geo={g.platform} onSelect={onSelect}>
          {i === 0 && <DataField m={m} cell={g.cell} />}
          {i === 1 && <ModelBars m={m} bar={g.bar} />}
          {i === 2 && <Gauge m={m} />}
          {i === 3 && <Graph m={m} node={g.node} />}
        </Platform>
      ))}
      <SignalPath active={active} intro={intro} rm={rm} m={m} />
    </>
  );
}

export default function Scene({ active, onSelect, rm, visible }: { active: number; onSelect: (i: number) => void; rm: boolean; visible: boolean }) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.75]}
      frameloop={visible ? "always" : "never"}
      camera={{ fov: 27, near: 0.5, far: 60, position: [3.2, 4.3, 9.2] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <World active={active} onSelect={onSelect} rm={rm} />
    </Canvas>
  );
}
