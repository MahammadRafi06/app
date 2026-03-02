"use client";

import { useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Handle,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Position,
  useNodesState,
  useEdgesState,
  type NodeProps,
} from "reactflow";
import { type ApplicationTree, type ResourceNode } from "@/lib/argocd-schemas";
import { HealthBadge, StatusDot } from "./status-badges";
import { cn } from "@/lib/utils";

// ─── Custom Node ──────────────────────────────────────────────────────────────

function ResourceNodeCard({ data }: NodeProps) {
  const { node, onClick } = data as { node: ResourceNode; onClick: (n: ResourceNode) => void };
  const health = node.health?.status;
  const hiddenHandleStyle = { opacity: 0, pointerEvents: "none" } as const;

  return (
    <button
      onClick={() => onClick(node)}
      className={cn(
        "group relative flex flex-col gap-1 rounded-lg border bg-card px-3 py-2 text-left shadow-sm",
        "hover:shadow-md hover:border-primary/40 transition-all duration-150",
        "min-w-[140px] max-w-[200px]",
        health === "Degraded" && "border-red-300 dark:border-red-700",
        health === "Progressing" && "border-blue-300 dark:border-blue-700",
        health === "Healthy" && "border-emerald-200 dark:border-emerald-800"
      )}
    >
      {/* Kind chip */}
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {node.kind}
      </span>

      {/* Name */}
      <span className="text-xs font-medium text-foreground truncate max-w-[180px]">
        {node.name}
      </span>

      {/* Namespace */}
      {node.namespace && (
        <span className="text-[10px] text-muted-foreground truncate">
          {node.namespace}
        </span>
      )}

      {/* Health dot */}
      <div className="absolute top-1.5 right-2">
        <StatusDot health={health} />
      </div>

      <Handle type="target" position={Position.Top} style={hiddenHandleStyle} />
      <Handle type="target" position={Position.Left} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Bottom} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Right} style={hiddenHandleStyle} />
    </button>
  );
}

const nodeTypes = { resource: ResourceNodeCard };

// ─── Layout helpers ────────────────────────────────────────────────────────────

function getResourceNodeKey(node: ResourceNode): string {
  if (node.uid) return node.uid;

  return [
    node.group ?? "core",
    node.kind,
    node.namespace ?? "_cluster",
    node.name,
  ].join(":");
}

function getParentRefKey(ref: NonNullable<ResourceNode["parentRefs"]>[number]): string | null {
  if (ref.uid) return ref.uid;
  if (!ref.kind || !ref.name) return null;

  return [
    ref.group ?? "core",
    ref.kind,
    ref.namespace ?? "_cluster",
    ref.name,
  ].join(":");
}

function buildGraph(
  tree: ApplicationTree,
  onNodeClick: (node: ResourceNode) => void
): { nodes: Node[]; edges: Edge[] } {
  const nodes = tree.nodes ?? [];
  if (nodes.length === 0) return { nodes: [], edges: [] };

  const nodeByKey = new Map(nodes.map((node) => [getResourceNodeKey(node), node]));

  // Simple layered layout: assign depth via BFS from roots
  const childrenOf = new Map<string, ResourceNode[]>();
  const hasParent = new Set<string>();

  nodes.forEach((n) => {
    const childKey = getResourceNodeKey(n);
    (n.parentRefs ?? []).forEach((ref) => {
      const parentKey = getParentRefKey(ref);
      if (!parentKey || !nodeByKey.has(parentKey)) return;

      hasParent.add(childKey);
      const arr = childrenOf.get(parentKey) ?? [];
      arr.push(n);
      childrenOf.set(parentKey, arr);
    });
  });

  const roots = nodes.filter((n) => !hasParent.has(getResourceNodeKey(n)));

  // Assign positions using a simple recursive layout
  const CARD_W = 210;
  const CARD_H = 80;
  const GAP_X = 40;
  const GAP_Y = 60;

  const positioned = new Map<string, { x: number; y: number }>();
  let maxColPerRow: number[] = [];

  function layout(node: ResourceNode, depth: number, col: number): number {
    const nodeKey = getResourceNodeKey(node);
    const children = childrenOf.get(nodeKey) ?? [];

    if (children.length === 0) {
      const row = maxColPerRow[depth] ?? 0;
      maxColPerRow[depth] = row + 1;
      positioned.set(nodeKey, { x: col * (CARD_W + GAP_X), y: depth * (CARD_H + GAP_Y) });
      return 1;
    }

    let totalWidth = 0;
    children.forEach((child) => {
      const w = layout(child, depth + 1, col + totalWidth);
      totalWidth += w;
    });

    const x = col * (CARD_W + GAP_X) + ((totalWidth - 1) * (CARD_W + GAP_X)) / 2;
    positioned.set(nodeKey, { x, y: depth * (CARD_H + GAP_Y) });
    return totalWidth;
  }

  let col = 0;
  roots.forEach((r) => {
    const w = layout(r, 0, col);
    col += w;
  });

  const rfNodes: Node[] = nodes.map((n) => {
    const nodeKey = getResourceNodeKey(n);
    const pos = positioned.get(nodeKey) ?? { x: 0, y: 0 };
    return {
      id: nodeKey,
      type: "resource",
      position: pos,
      data: { node: n, onClick: onNodeClick },
    };
  });

  const rfEdges: Edge[] = [];
  nodes.forEach((n) => {
    const childKey = getResourceNodeKey(n);
    (n.parentRefs ?? []).forEach((ref) => {
      const parentKey = getParentRefKey(ref);
      if (!parentKey || !nodeByKey.has(parentKey)) return;

      rfEdges.push({
        id: `${parentKey}-${childKey}`,
        source: parentKey,
        target: childKey,
        type: "smoothstep",
        style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1.5 },
        animated: n.health?.status === "Progressing",
      });
    });
  });

  return { nodes: rfNodes, edges: rfEdges };
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ResourceTreeProps {
  tree: ApplicationTree;
  onNodeClick?: (node: ResourceNode) => void;
  className?: string;
}

export function ResourceTree({ tree, onNodeClick, className }: ResourceTreeProps) {
  const handleNodeClick = useCallback(
    (node: ResourceNode) => onNodeClick?.(node),
    [onNodeClick]
  );

  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildGraph(tree, handleNodeClick),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tree]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  useEffect(() => {
    setNodes(initNodes);
    setEdges(initEdges);
  }, [initEdges, initNodes, setEdges, setNodes]);

  return (
    <div className={cn("h-[600px] w-full rounded-lg border bg-muted/20 overflow-hidden", className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-right"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-30" />
        <Controls className="!bottom-4 !left-4" />
        <MiniMap
          className="!bottom-4 !right-4 !rounded-lg !border !bg-card"
          maskColor="hsl(var(--muted) / 0.5)"
          nodeColor={(n) => {
            const health = (n.data as { node: ResourceNode }).node?.health?.status;
            if (health === "Healthy") return "#22c55e";
            if (health === "Degraded") return "#ef4444";
            if (health === "Progressing") return "#3b82f6";
            return "#94a3b8";
          }}
        />
      </ReactFlow>
    </div>
  );
}
