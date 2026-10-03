"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { GraphNodeItem, GraphEdgeItem } from "@/lib/api";

interface NodePosition {
  x: number;
  y: number;
  z: number;
}

interface NetworkCanvas3DProps {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
  selectedNodeId: string | null;
  onSelectNode: (node: GraphNodeItem | null) => void;
  onSelectEdge: (edge: GraphEdgeItem | null) => void;
  focusedNodeId?: string | null;
  showNeighborsOnly?: boolean;
  highlightSuspiciousChains?: boolean;
  resetSignal?: number;
}

// -----------------------------------------------------------------------------
// Cluster-Aware 3D Deterministic Layout Calculation
// -----------------------------------------------------------------------------
function compute3DLayout(nodes: GraphNodeItem[], edges: GraphEdgeItem[]): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();
  const n = nodes.length;
  if (n === 0) return positions;

  // Group nodes by component_id to create cluster centroids
  const componentGroups = new Map<number, GraphNodeItem[]>();
  nodes.forEach((node) => {
    const cId = node.component_id ?? 0;
    if (!componentGroups.has(cId)) componentGroups.set(cId, []);
    componentGroups.get(cId)!.push(node);
  });

  const numComponents = componentGroups.size;
  let compIdx = 0;

  componentGroups.forEach((compNodes) => {
    // Distribute component centers around 3D space
    const angle = (compIdx / Math.max(1, numComponents)) * Math.PI * 2;
    const clusterDist = numComponents > 1 ? 26 : 0;
    const centerX = Math.cos(angle) * clusterDist;
    const centerZ = Math.sin(angle) * clusterDist;
    const centerY = (compIdx % 2 === 0 ? 1 : -1) * (numComponents > 2 ? 6 : 0);

    const compSize = compNodes.length;
    compNodes.forEach((node, i) => {
      const phi = Math.acos(1 - 2 * (i + 0.5) / Math.max(1, compSize));
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const radius = 10 + Math.min(node.degree * 1.6, 14);

      positions.set(node.id, {
        x: centerX + radius * Math.sin(phi) * Math.cos(theta),
        y: centerY + (radius * Math.sin(phi) * Math.sin(theta)) * 0.7,
        z: centerZ + radius * Math.cos(phi),
      });
    });
    compIdx++;
  });

  // Fast force relaxation (intra-cluster cohesion, inter-node repulsion, edge attraction)
  const edgeSet = new Set<string>();
  edges.forEach((e) => {
    edgeSet.add(`${e.source}->${e.target}`);
    edgeSet.add(`${e.target}->${e.source}`);
  });

  for (let iter = 0; iter < 20; iter++) {
    nodes.forEach((u) => {
      const posU = positions.get(u.id);
      if (!posU) return;
      let fx = 0, fy = 0, fz = 0;

      nodes.forEach((v) => {
        if (u.id === v.id) return;
        const posV = positions.get(v.id);
        if (!posV) return;

        const dx = posU.x - posV.x;
        const dy = posU.y - posV.y;
        const dz = posU.z - posV.z;
        const distSq = dx * dx + dy * dy + dz * dz + 0.1;
        const dist = Math.sqrt(distSq);

        // Repulsion
        const rep = 70 / (distSq + 1);
        fx += (dx / dist) * rep;
        fy += (dy / dist) * rep;
        fz += (dz / dist) * rep;

        // Attraction if edge exists
        if (edgeSet.has(`${u.id}->${v.id}`)) {
          const desired = 12;
          const delta = dist - desired;
          const att = 0.05 * delta;
          fx -= (dx / dist) * att;
          fy -= (dy / dist) * att;
          fz -= (dz / dist) * att;
        }
      });

      posU.x += fx * 0.10;
      posU.y += fy * 0.10;
      posU.z += fz * 0.10;
    });
  }

  return positions;
}

// -----------------------------------------------------------------------------
// Interactive Camera Controller with Smooth Slerp & Reset Capability
// -----------------------------------------------------------------------------
function CameraController({
  targetPosition,
  resetSignal,
}: {
  targetPosition: NodePosition | null;
  resetSignal?: number;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const prevResetSignal = useRef(resetSignal);

  useEffect(() => {
    if (resetSignal !== undefined && resetSignal !== prevResetSignal.current) {
      prevResetSignal.current = resetSignal;
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        camera.position.set(0, 24, 60);
        controlsRef.current.update();
      }
    }
  }, [resetSignal, camera]);

  useFrame(() => {
    if (targetPosition && controlsRef.current) {
      const targetVec = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
      controlsRef.current.target.lerp(targetVec, 0.08);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.7}
      zoomSpeed={0.9}
      panSpeed={0.8}
      minDistance={5}
      maxDistance={150}
    />
  );
}

// -----------------------------------------------------------------------------
// Animated Pulse Particle Flow on Suspicious / Fraud Chains
// -----------------------------------------------------------------------------
function SuspiciousChainPulse({
  start,
  end,
  speed = 0.8,
  color = "#EF4444",
}: {
  start: NodePosition;
  end: NodePosition;
  speed?: number;
  color?: string;
}) {
  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (pulseRef.current) {
      const t = (state.clock.getElapsedTime() * speed) % 1;
      pulseRef.current.position.x = start.x + (end.x - start.x) * t;
      pulseRef.current.position.y = start.y + (end.y - start.y) * t;
      pulseRef.current.position.z = start.z + (end.z - start.z) * t;
    }
  });

  return (
    <mesh ref={pulseRef}>
      <sphereGeometry args={[0.32, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

// -----------------------------------------------------------------------------
// 3D Wallet Node Mesh Component
// -----------------------------------------------------------------------------
const NodeMesh = React.memo(function NodeMesh({
  node,
  position,
  isSelected,
  isNeighbor,
  isDimmed,
  onClick,
}: {
  node: GraphNodeItem;
  position: NodePosition;
  isSelected: boolean;
  isNeighbor: boolean;
  isDimmed: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const isCritical = node.risk?.risk_tier === "CRITICAL";
  const isHigh = node.risk?.risk_tier === "HIGH";

  // Pulse animation for high risk nodes or selection
  useFrame((state) => {
    if (ringRef.current && (isCritical || isSelected)) {
      const t = state.clock.getElapsedTime();
      const scale = 1 + Math.sin(t * 3.5) * 0.18;
      ringRef.current.scale.set(scale, scale, scale);
    }
  });

  // Calculate dynamic radius based on transaction degree and volume
  const radius = useMemo(() => {
    return Math.max(0.75, Math.min(1.85, 0.75 + (node.degree || 1) * 0.08));
  }, [node.degree]);

  // Fintech Risk Color Palette
  const { color, emissiveColor, emissiveIntensity } = useMemo(() => {
    if (isSelected) {
      return { color: "#FFD602", emissiveColor: "#CA8A04", emissiveIntensity: 0.8 };
    }
    if (isCritical) {
      return { color: "#EF4444", emissiveColor: "#991B1B", emissiveIntensity: 0.65 };
    }
    if (isHigh) {
      return { color: "#F97316", emissiveColor: "#9A3412", emissiveIntensity: 0.45 };
    }
    if (node.risk?.risk_tier === "MEDIUM") {
      return { color: "#F59E0B", emissiveColor: "#78350F", emissiveIntensity: 0.25 };
    }
    return { color: "#007BFF", emissiveColor: "#002A54", emissiveIntensity: 0.1 };
  }, [node.risk?.risk_tier, isSelected, isCritical, isHigh]);

  const opacity = isDimmed && !isSelected && !isNeighbor ? 0.15 : (hovered ? 1.0 : 0.92);

  // Masked identifier label (Zero real PII)
  const maskedLabel = node.metadata?.phone_number_masked || node.label || node.id.slice(0, 10);
  const totalVolumeBDT = Math.round(node.total_transferred_amount || (node.total_inflow + node.total_outflow));

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Primary Wallet Node Sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[radius, 24, 24]} />
        <meshStandardMaterial
          color={color}
          roughness={0.25}
          metalness={0.35}
          transparent
          opacity={opacity}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Critical Threat or Selection Pulsing Ring */}
      {(isCritical || isSelected) && (
        <mesh ref={ringRef}>
          <ringGeometry args={[radius * 1.35, radius * 1.55, 32]} />
          <meshBasicMaterial
            color={isSelected ? "#FFD602" : "#EF4444"}
            side={THREE.DoubleSide}
            transparent
            opacity={0.75}
          />
        </mesh>
      )}

      {/* Floating 2D Hover / Selection HTML Tooltip */}
      {(hovered || isSelected || isCritical) && (
        <Html distanceFactor={35} position={[0, radius + 0.9, 0]} center>
          <div className="pointer-events-none select-none px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-700/80 backdrop-blur-md shadow-2xl text-center whitespace-nowrap">
            <div className="text-[11px] font-mono font-bold text-white flex items-center gap-1.5 justify-center">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: color }}
              />
              <span>{maskedLabel}</span>
              {node.risk?.in_cycle && (
                <span className="px-1 py-0.2 rounded bg-rose-950 border border-rose-800 text-[8px] text-rose-300 font-bold">
                  CYCLE
                </span>
              )}
            </div>
            <div className="text-[9px] font-mono text-slate-400 mt-0.5">
              {node.risk?.risk_tier || "LOW"} RISK • {node.degree} Conns • ৳{totalVolumeBDT.toLocaleString()} BDT
            </div>
          </div>
        </Html>
      )}
    </group>
  );
});

// -----------------------------------------------------------------------------
// 3D Directed Transaction Edge Component
// -----------------------------------------------------------------------------
const DirectedEdgeMesh = React.memo(function DirectedEdgeMesh({
  edge,
  start,
  end,
  isSelected,
  isDimmed,
  isSuspiciousChain,
  onClick,
}: {
  edge: GraphEdgeItem;
  start: NodePosition;
  end: NodePosition;
  isSelected: boolean;
  isDimmed: boolean;
  isSuspiciousChain: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const { points, midpoint, directionAngle } = useMemo(() => {
    const vStart = new THREE.Vector3(start.x, start.y, start.z);
    const vEnd = new THREE.Vector3(end.x, end.y, end.z);

    // Direction marker positioned at 65% along the directed path
    const mid = new THREE.Vector3().lerpVectors(vStart, vEnd, 0.65);
    const dir = new THREE.Vector3().subVectors(vEnd, vStart).normalize();

    // Orientation quaternion for direction cone
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    const euler = new THREE.Euler().setFromQuaternion(quat);

    return {
      points: [vStart, vEnd],
      midpoint: mid,
      directionAngle: euler,
    };
  }, [start, end]);

  const lineColor = useMemo(() => {
    if (isSelected) return "#FFD602"; // Upay Fintech Yellow
    if (hovered) return "#38BDF8"; // Cyan
    if (isSuspiciousChain || edge.is_fraud === 1) return "#EF4444"; // Crimson for fraud/suspicious
    if (edge.is_anomaly === 1) return "#F97316"; // Orange for anomaly
    return "#334155"; // Neutral Slate
  }, [isSelected, hovered, isSuspiciousChain, edge.is_fraud, edge.is_anomaly]);

  const opacity = isDimmed && !isSelected && !hovered ? 0.08 : (isSelected ? 0.95 : (isSuspiciousChain ? 0.75 : 0.45));
  const lineWidth = isSelected ? 3.0 : (isSuspiciousChain ? 2.0 : 1.0);

  const lineGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <group>
      {/* Edge Line */}
      <primitive
        object={
          new THREE.Line(
            lineGeo,
            new THREE.LineBasicMaterial({
              color: new THREE.Color(lineColor),
              transparent: true,
              opacity: opacity,
              linewidth: lineWidth,
            })
          )
        }
      />

      {/* Directional Flow Cone Marker */}
      <mesh
        position={[midpoint.x, midpoint.y, midpoint.z]}
        rotation={directionAngle}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <coneGeometry args={[0.35, 0.85, 8]} />
        <meshBasicMaterial
          color={lineColor}
          transparent
          opacity={opacity + 0.2}
        />
      </mesh>

      {/* Suspicious Flow Particle Pulse */}
      {isSuspiciousChain && (
        <SuspiciousChainPulse
          start={start}
          end={end}
          speed={0.9}
          color={edge.is_fraud === 1 ? "#EF4444" : "#F59E0B"}
        />
      )}

      {/* Hover Information Tooltip */}
      {hovered && (
        <Html position={[midpoint.x, midpoint.y + 0.6, midpoint.z]} center distanceFactor={40}>
          <div className="pointer-events-none select-none px-3 py-1 rounded-lg bg-slate-950/95 border border-slate-700 text-white font-mono text-[10px] shadow-2xl whitespace-nowrap">
            <span className="font-bold text-amber-400">৳{edge.amount.toLocaleString()} BDT</span> • {edge.tx_type}
            {edge.is_fraud === 1 && (
              <span className="ml-1 text-rose-400 font-bold">[FRAUD]</span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
});

// -----------------------------------------------------------------------------
// Master NetworkCanvas3D Component
// -----------------------------------------------------------------------------
export default function NetworkCanvas3D({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onSelectEdge,
  focusedNodeId,
  showNeighborsOnly = false,
  highlightSuspiciousChains = true,
  resetSignal,
}: NetworkCanvas3DProps) {
  // Compute deterministic positions with cluster awareness
  const nodePositions = useMemo(() => compute3DLayout(nodes, edges), [nodes, edges]);

  // Identify neighbor IDs of the currently selected node
  const neighborIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const set = new Set<string>();
    edges.forEach((e) => {
      if (e.source === selectedNodeId) set.add(e.target);
      if (e.target === selectedNodeId) set.add(e.source);
    });
    return set;
  }, [selectedNodeId, edges]);

  // Camera focus position
  const focusPosition = useMemo(() => {
    const targetId = focusedNodeId || selectedNodeId;
    return targetId ? nodePositions.get(targetId) || null : null;
  }, [focusedNodeId, selectedNodeId, nodePositions]);

  // Filter nodes & edges if "showNeighborsOnly" is active
  const visibleNodes = useMemo(() => {
    if (!showNeighborsOnly || !selectedNodeId) return nodes;
    return nodes.filter((n) => n.id === selectedNodeId || neighborIds.has(n.id));
  }, [nodes, showNeighborsOnly, selectedNodeId, neighborIds]);

  const visibleEdges = useMemo(() => {
    if (!showNeighborsOnly || !selectedNodeId) return edges;
    return edges.filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId
    );
  }, [edges, showNeighborsOnly, selectedNodeId]);

  return (
    <div className="w-full h-full relative bg-[#0B1120] overflow-hidden select-none">
      <Canvas
        camera={{ position: [0, 24, 60], fov: 48 }}
        onPointerMissed={() => {
          onSelectNode(null);
          onSelectEdge(null);
        }}
      >
        {/* Sky / Atmosphere & Lighting */}
        <color attach="background" args={["#0B1120"]} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[20, 40, 20]} intensity={1.3} />
        <pointLight position={[-20, -20, -20]} intensity={0.6} color="#38BDF8" />
        <pointLight position={[20, -10, 20]} intensity={0.4} color="#F59E0B" />

        {/* Ambient Floor Grid */}
        <gridHelper
          args={[140, 40, "#1E293B", "#0F172A"]}
          position={[0, -24, 0]}
        />

        {/* Camera Controller with Reset Listener */}
        <CameraController
          targetPosition={focusPosition}
          resetSignal={resetSignal}
        />

        {/* Render Directed Edges */}
        {visibleEdges.map((edge) => {
          const start = nodePositions.get(edge.source);
          const end = nodePositions.get(edge.target);
          if (!start || !end) return null;

          const isEdgeSelected =
            selectedNodeId === edge.source || selectedNodeId === edge.target;
          const isDimmed =
            !!selectedNodeId && !isEdgeSelected;

          const isSuspicious =
            highlightSuspiciousChains && (edge.is_fraud === 1 || edge.is_anomaly === 1);

          return (
            <DirectedEdgeMesh
              key={edge.id}
              edge={edge}
              start={start}
              end={end}
              isSelected={isEdgeSelected}
              isDimmed={isDimmed}
              isSuspiciousChain={isSuspicious}
              onClick={() => onSelectEdge(edge)}
            />
          );
        })}

        {/* Render Wallet Nodes */}
        {visibleNodes.map((node) => {
          const pos = nodePositions.get(node.id);
          if (!pos) return null;

          const isSelected = selectedNodeId === node.id;
          const isNeighbor = neighborIds.has(node.id);
          const isDimmed = !!selectedNodeId && !isSelected && !isNeighbor;

          return (
            <NodeMesh
              key={node.id}
              node={node}
              position={pos}
              isSelected={isSelected}
              isNeighbor={isNeighbor}
              isDimmed={isDimmed}
              onClick={() => onSelectNode(node)}
            />
          );
        })}
      </Canvas>
    </div>
  );
}
