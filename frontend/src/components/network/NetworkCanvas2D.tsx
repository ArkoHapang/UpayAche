"use client";

import React, { useMemo, useState } from "react";
import { GraphNodeItem, GraphEdgeItem } from "@/lib/api";

interface NetworkCanvas2DProps {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
  selectedNodeId: string | null;
  onSelectNode: (node: GraphNodeItem | null) => void;
  onSelectEdge: (edge: GraphEdgeItem | null) => void;
  focusedNodeId?: string | null;
  showNeighborsOnly?: boolean;
}

export default function NetworkCanvas2D({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onSelectEdge,
  focusedNodeId,
  showNeighborsOnly,
}: NetworkCanvas2DProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // 2D Radial / Force Layout
  const layout = useMemo(() => {
    const coords = new Map<string, { x: number; y: number }>();
    const n = nodes.length;
    if (n === 0) return coords;

    // Arrange clusters around centroids
    const clusterMap = new Map<number, GraphNodeItem[]>();
    nodes.forEach((node) => {
      const c = node.component_id ?? 0;
      if (!clusterMap.has(c)) clusterMap.set(c, []);
      clusterMap.get(c)!.push(node);
    });

    const numClusters = clusterMap.size;
    let cIdx = 0;
    const baseRadius = 260;

    clusterMap.forEach((cNodes) => {
      const angle = (cIdx / Math.max(1, numClusters)) * 2 * Math.PI;
      const cX = Math.cos(angle) * (numClusters > 1 ? baseRadius : 0);
      const cY = Math.sin(angle) * (numClusters > 1 ? baseRadius : 0);

      const count = cNodes.length;
      cNodes.forEach((node, i) => {
        const theta = (i / Math.max(1, count)) * 2 * Math.PI;
        const dist = 50 + Math.min(node.degree * 12, 160);
        coords.set(node.id, {
          x: cX + Math.cos(theta) * dist,
          y: cY + Math.sin(theta) * dist,
        });
      });
      cIdx++;
    });

    return coords;
  }, [nodes]);

  const getNodeColor = (node: GraphNodeItem) => {
    const tier = node.risk?.risk_tier || "LOW";
    if (tier === "CRITICAL" || node.risk?.is_synthetic_mule) return "#EF4444";
    if (tier === "HIGH") return "#F97316";
    if (tier === "MEDIUM") return "#F59E0B";
    return "#3B82F6";
  };

  const visibleNodes = useMemo(() => {
    if (!showNeighborsOnly || !focusedNodeId) return nodes;
    const neighborSet = new Set<string>([focusedNodeId]);
    edges.forEach((e) => {
      if (e.source === focusedNodeId) neighborSet.add(e.target);
      if (e.target === focusedNodeId) neighborSet.add(e.source);
    });
    return nodes.filter((n) => neighborSet.has(n.id));
  }, [nodes, edges, showNeighborsOnly, focusedNodeId]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const visibleEdges = useMemo(() => {
    return edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
  }, [edges, visibleNodeIds]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#090D16] flex items-center justify-center">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs font-mono">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
        >
          +
        </button>
        <span className="px-2 text-slate-400">{(zoom * 100).toFixed(0)}%</span>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
        >
          -
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded ml-1"
        >
          Reset
        </button>
      </div>

      <svg
        className="w-full h-full cursor-grab active:cursor-grabbing"
        viewBox="-600 -400 1200 800"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: "center center",
        }}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="18"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
          </marker>
          <marker
            id="arrow-fraud"
            viewBox="0 0 10 10"
            refX="18"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" />
          </marker>
        </defs>

        {/* Directed Edges */}
        <g>
          {visibleEdges.map((e) => {
            const p1 = layout.get(e.source);
            const p2 = layout.get(e.target);
            if (!p1 || !p2) return null;
            const isFraud = e.is_fraud === 1;

            return (
              <line
                key={e.id}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={isFraud ? "#EF4444" : "#334155"}
                strokeWidth={isFraud ? 2 : 1}
                strokeDasharray={isFraud ? "4 2" : undefined}
                markerEnd={isFraud ? "url(#arrow-fraud)" : "url(#arrow)"}
                className="hover:stroke-blue-400 cursor-pointer transition-colors"
                onClick={() => onSelectEdge(e)}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {visibleNodes.map((n) => {
            const pos = layout.get(n.id);
            if (!pos) return null;
            const isSelected = selectedNodeId === n.id;
            const isFocused = focusedNodeId === n.id;
            const color = getNodeColor(n);
            const radius = Math.max(7, Math.min(18, 7 + n.degree * 1.2));

            return (
              <g
                key={n.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onSelectNode(n)}
                className="cursor-pointer group"
              >
                {/* Selection ring */}
                {(isSelected || isFocused) && (
                  <circle
                    r={radius + 6}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    className="animate-spin"
                    style={{ transformOrigin: "0 0" }}
                  />
                )}
                {/* Node body */}
                <circle
                  r={radius}
                  fill={color}
                  stroke="#0F172A"
                  strokeWidth="2"
                  className="transition-transform group-hover:scale-125"
                />
                {/* Label */}
                <text
                  y={radius + 12}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="monospace"
                  className="pointer-events-none select-none group-hover:fill-white font-bold"
                >
                  {n.metadata?.wallet_number || n.label || n.id.slice(0, 8)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
