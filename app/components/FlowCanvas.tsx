"use client";

import React, { useRef, useReducer, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import type { Step } from "../store/stepsSlice";
import { getHttpMethodColor } from "../utils/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DragState {
  stepId: string;
  startClientX: number;
  currentClientX: number;
  order: string[];
  initialOrder: string[];
}

interface ConnectDrag {
  fromStepId: string;
  fromX: number;
  fromY: number;
  currentX: number;
  currentY: number;
  overFallbackId: string | null;
}

interface PendingConnection {
  fromStepId: string;
  toFallbackId: string;
  popoverX: number;
  popoverY: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_SPACING = 440;
const STEP_SWAP_THRESHOLD = STEP_SPACING / 2;
const STEP_CARD_HEIGHT = 219; // card base + connect port strip (h-7 + border-t ≈ 29px)
const FALLBACK_CARD_WIDTH = 300;
const FALLBACK_CARD_GAP = 24;
const FALLBACK_ROW_CLEARANCE = 500; // minimum clearance below the tallest step row (accounts for max card height ~420px)
const FALLBACK_ROW_MIN = 900;
const FALLBACK_PEEK_AMOUNT = 110; // px of the fallback section visible before scrolling

// ─── Regular Step Node ────────────────────────────────────────────────────────

interface StepNodeProps {
  step: Step;
  visualX: number;
  visualY: number;
  isDragging: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDragHandlePointerDown: (e: React.PointerEvent) => void;
  onPortPointerDown: (e: PointerEvent, stepId: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onJumpToFallback: (fallbackId: string) => void;
  stepResult?: boolean;
  dimmed?: boolean;
}

function StepNode({
  step,
  visualX,
  visualY,
  isDragging,
  onClick,
  onDelete,
  onDragHandlePointerDown,
  onPortPointerDown,
  onMouseEnter,
  onMouseLeave,
  onJumpToFallback,
  stepResult,
  dimmed,
}: StepNodeProps) {
  const hasHeaders = Object.keys(step.headers ?? {}).length > 0;
  const hasExtract = Object.keys(step.extract ?? {}).length > 0;
  const hasAssertions = Object.keys(step.assertions ?? {}).length > 0;
  const hasRoutes = step.routes && Object.keys(step.routes).length > 0;

  return (
    <div
      className={`step-node group absolute w-[320px] bg-surface-container-high border-2 rounded-lg overflow-hidden shadow-xl cursor-pointer ${
        isDragging
          ? "border-primary shadow-primary/30 shadow-2xl z-50"
          : stepResult === true
          ? "border-secondary shadow-secondary/20 z-10"
          : stepResult === false
          ? "border-error shadow-error/20 z-10"
          : "border-outline-variant hover:border-primary-container z-10"
      }`}
      style={{
        left: visualX,
        top: visualY,
        transform: isDragging ? "scale(1.03) rotate(-0.5deg)" : undefined,
        transition: isDragging
          ? "box-shadow 0.1s, opacity 0.15s"
          : "left 0.15s ease, top 0.15s ease, box-shadow 0.1s, opacity 0.15s",
        opacity: dimmed ? 0.4 : 1,
      }}
      onClick={isDragging ? undefined : onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header */}
      <div className="bg-surface-variant px-md py-sm flex justify-between items-center border-b border-outline-variant">
        <div className="flex items-center gap-xs">
          <div
            className="cursor-grab active:cursor-grabbing text-outline hover:text-on-surface-variant transition-colors mr-xs shrink-0"
            onPointerDown={onDragHandlePointerDown}
            onClick={(e) => e.stopPropagation()}
            title="Drag to reorder"
          >
            <span className="material-symbols-outlined text-sm select-none">open_with</span>
          </div>
          <span className="material-symbols-outlined text-secondary text-sm">http</span>
          <span className="font-label-caps text-label-caps text-on-surface">
            {step.title || "STEP"}
          </span>
        </div>
        <div className="flex items-center gap-xs">
          {(() => {
            const { text, bg } = getHttpMethodColor(step.httpMethod);
            return (
              <span className={`${bg} ${text} px-xs rounded text-[9px] font-bold tracking-widest`}>
                {step.httpMethod || "GET"}
              </span>
            );
          })()}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-outline hover:text-error transition-colors"
            title="Delete step"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-md space-y-md">
        {step.url && (
          <div>
            <label className="text-[9px] text-outline uppercase block mb-xs">URL</label>
            <div className="font-code-sm text-code-sm bg-background p-xs border border-outline-variant rounded text-on-surface truncate">
              {step.url}
            </div>
          </div>
        )}
        {hasHeaders && (
          <div className="bg-surface-container-low p-xs rounded border-l-2 border-primary-container">
            <div className="text-[9px] text-outline uppercase mb-1">Headers</div>
            {Object.entries(step.headers ?? {})
              .slice(0, 2)
              .map(([k, v]) => (
                <div key={k} className="font-code-sm text-code-sm truncate">
                  {k}: <span className="text-primary">{v}</span>
                </div>
              ))}
          </div>
        )}
        {step.body && (
          <div>
            <label className="text-[9px] text-outline uppercase block mb-xs">Request Body</label>
            <pre className="font-code-sm text-code-sm bg-background p-xs border border-outline-variant rounded text-primary truncate">
              {step.body.length > 60 ? step.body.slice(0, 60) + "…" : step.body}
            </pre>
          </div>
        )}
        {hasExtract && (
          <div className="bg-primary-container/10 border border-primary/30 p-xs rounded">
            <label className="text-[9px] text-primary uppercase block mb-xs">Extract</label>
            {Object.entries(step.extract ?? {}).map(([varName, path]) => (
              <div key={varName} className="font-code-sm text-code-sm text-on-background">
                {varName} <span className="text-primary font-bold">←</span> {path}
              </div>
            ))}
          </div>
        )}
        {hasAssertions && (
          <div className="bg-tertiary-container/10 border border-tertiary-container/30 p-xs rounded">
            <label className="text-[9px] text-tertiary uppercase block mb-xs">Assertions</label>
            {Object.entries(step.assertions ?? {}).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between font-code-sm text-code-sm">
                <span>{k} == {v}</span>
                <span className="material-symbols-outlined text-tertiary text-xs">pending</span>
              </div>
            ))}
          </div>
        )}
        {hasRoutes && (
          <div className="bg-error/5 border border-error/30 p-xs rounded">
            <label className="text-[9px] text-error uppercase block mb-xs flex items-center gap-xs">
              <span className="material-symbols-outlined text-xs">alt_route</span>
              Fallback Routes
            </label>
            {Object.entries(step.routes ?? {}).map(([code, fallbackId]) => (
              <div key={code} className="flex items-center gap-xs font-code-sm text-code-sm">
                <span className="bg-error/20 text-error px-xs rounded text-[9px] font-bold tracking-widest shrink-0">
                  {code}
                </span>
                <span className="text-outline">→</span>
                <span className="text-on-surface-variant truncate flex-1">{fallbackId}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onJumpToFallback(fallbackId); }}
                  className="shrink-0 text-error/40 hover:text-error transition-colors"
                  title="Jump to fallback handler"
                >
                  <span className="material-symbols-outlined text-xs leading-none">south</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connection port — drag from here to attach a fallback step */}
      <div
        className="h-7 border-t border-error/20 flex justify-center items-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair select-none hover:bg-error/5"
        onPointerDown={(e) => { e.stopPropagation(); onPortPointerDown(e.nativeEvent, step.id); }}
        onClick={(e) => e.stopPropagation()}
        title="Drag to connect to a fallback step"
      >
        <div className="h-px w-8 bg-error/20" />
        <div className="w-2 h-2 rounded-full bg-error/30 border border-error/50" />
        <span className="text-[8px] text-error/40 font-code-sm uppercase tracking-wider">connect fallback</span>
        <div className="w-2 h-2 rounded-full bg-error/30 border border-error/50" />
        <div className="h-px w-8 bg-error/20" />
      </div>
    </div>
  );
}

// ─── Fallback Step Node ───────────────────────────────────────────────────────

interface FallbackStepNodeProps {
  step: Step;
  visualX: number;
  visualY: number;
  onClick: () => void;
  onDelete: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  stepResult?: boolean;
  isDropTarget: boolean;
  dimmed?: boolean;
}

function FallbackStepNode({
  step,
  visualX,
  visualY,
  onClick,
  onDelete,
  onMouseEnter,
  onMouseLeave,
  stepResult,
  isDropTarget,
  dimmed,
}: FallbackStepNodeProps) {
  const hasExtract = Object.keys(step.extract ?? {}).length > 0;
  const hasHeaders = Object.keys(step.headers ?? {}).length > 0;

  return (
    <div
      className={`step-node absolute w-[300px] bg-surface-container-high border-2 border-dashed rounded-lg overflow-hidden shadow-xl cursor-pointer z-10 transition-all ${
        isDropTarget
          ? "border-error shadow-error/50 shadow-2xl bg-error/10 scale-[1.03]"
          : stepResult === true
          ? "border-secondary shadow-secondary/20"
          : stepResult === false
          ? "border-error shadow-error/30"
          : "border-error/60 hover:border-error"
      }`}
      style={{ left: visualX, top: visualY, opacity: dimmed ? 0.4 : 1, transition: "opacity 0.15s" }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bg-error/15 px-md py-sm flex justify-between items-center border-b border-error/30">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-error text-sm">alt_route</span>
          <span className="font-label-caps text-label-caps text-on-surface">
            {step.title || "FALLBACK"}
          </span>
          <span className="px-xs py-0 rounded text-[8px] font-bold tracking-widest uppercase bg-error/20 text-error border border-error/30 leading-4">
            FALLBACK
          </span>
        </div>
        <div className="flex items-center gap-xs">
          {(() => {
            const { text, bg } = getHttpMethodColor(step.httpMethod);
            return (
              <span className={`${bg} ${text} px-xs rounded text-[9px] font-bold tracking-widest`}>
                {step.httpMethod || "GET"}
              </span>
            );
          })()}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-outline hover:text-error transition-colors"
            title="Delete fallback step"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>
      <div className="p-md space-y-md">
        {step.url && (
          <div>
            <label className="text-[9px] text-outline uppercase block mb-xs">URL</label>
            <div className="font-code-sm text-code-sm bg-background p-xs border border-outline-variant rounded text-on-surface truncate">
              {step.url}
            </div>
          </div>
        )}
        {hasHeaders && (
          <div className="bg-surface-container-low p-xs rounded border-l-2 border-error/40">
            <div className="text-[9px] text-outline uppercase mb-1">Headers</div>
            {Object.entries(step.headers ?? {})
              .slice(0, 2)
              .map(([k, v]) => (
                <div key={k} className="font-code-sm text-code-sm truncate">
                  {k}: <span className="text-primary">{v}</span>
                </div>
              ))}
          </div>
        )}
        {step.body && (
          <div>
            <label className="text-[9px] text-outline uppercase block mb-xs">Request Body</label>
            <pre className="font-code-sm text-code-sm bg-background p-xs border border-outline-variant rounded text-error/80 truncate">
              {step.body.length > 60 ? step.body.slice(0, 60) + "…" : step.body}
            </pre>
          </div>
        )}
        {hasExtract && (
          <div className="bg-error/5 border border-error/20 p-xs rounded">
            <label className="text-[9px] text-error uppercase block mb-xs">Extract</label>
            {Object.entries(step.extract ?? {}).map(([varName, path]) => (
              <div key={varName} className="font-code-sm text-code-sm text-on-background">
                {varName} <span className="text-error font-bold">←</span> {path}
              </div>
            ))}
          </div>
        )}
        <div className="pt-xs border-t border-error/20">
          <div className="font-code-sm text-[9px] text-error/60 flex items-center gap-xs">
            <span className="material-symbols-outlined text-xs">info</span>
            ID: <span className="text-outline">{step.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FlowCanvas ───────────────────────────────────────────────────────────────

interface FlowCanvasProps {
  steps: Step[];
  fallbackSteps: Step[];
  onStepClick: (step: Step) => void;
  onFallbackStepClick: (step: Step) => void;
  onStepDelete: (stepId: string) => void;
  onFallbackStepDelete: (stepId: string) => void;
  onReorderSteps: (orderedIds: string[]) => void;
  onAddAfter: (afterStepId: string) => void;
  onConnect: (fromStepId: string, toFallbackId: string, statusCode: string) => void;
  onDisconnect: (stepId: string, statusCode: string) => void;
  stepResults?: Record<string, boolean>;
  isLoading?: boolean;
}

export interface FlowCanvasHandle {
  scrollToStep: (stepId: string) => void;
  scrollToFallback: (fallbackId: string) => void;
  focusNode: (id: string | null) => void;
}

const FlowCanvas = forwardRef<FlowCanvasHandle, FlowCanvasProps>(function FlowCanvas({
  steps,
  fallbackSteps,
  onStepClick,
  onFallbackStepClick,
  onStepDelete,
  onFallbackStepDelete,
  onReorderSteps,
  onAddAfter,
  onConnect,
  onDisconnect,
  stepResults,
  isLoading,
}: FlowCanvasProps, ref) {
  const canvasRef = useRef<HTMLElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const dragRef = useRef<DragState | null>(null);
  const didDragRef = useRef(false);
  const connectDragRef = useRef<ConnectDrag | null>(null);
  const onReorderRef = useRef(onReorderSteps);
  onReorderRef.current = onReorderSteps;
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [statusInput, setStatusInput] = useState("");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<{ stepId: string; fallbackId: string } | null>(null);
  const [canvasViewportHeight, setCanvasViewportHeight] = useState(900);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    setCanvasViewportHeight(el.clientHeight);
    const ro = new ResizeObserver(() => setCanvasViewportHeight(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fallbackPosMapRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  function jumpToFallback(fallbackId: string) {
    const pos = fallbackPosMapRef.current.get(fallbackId);
    if (!pos) return;
    canvasRef.current?.scrollTo({
      top: Math.max(0, pos.y - 80),
      left: Math.max(0, pos.x - 80),
      behavior: 'smooth',
    });
  }

  useImperativeHandle(ref, () => ({
    scrollToStep(stepId) {
      const step = stepsRef.current.find(s => s.id === stepId);
      if (!step) return;
      canvasRef.current?.scrollTo({
        top: Math.max(0, step.position.y - 80),
        left: Math.max(0, step.position.x - 80),
        behavior: 'smooth',
      });
    },
    scrollToFallback(fallbackId) {
      const pos = fallbackPosMapRef.current.get(fallbackId);
      if (!pos) return;
      canvasRef.current?.scrollTo({
        top: Math.max(0, pos.y - 80),
        left: Math.max(0, pos.x - 80),
        behavior: 'smooth',
      });
    },
    focusNode(id) {
      setFocusedNodeId(id);
    },
  }), []);

  // ── Step reorder drag ─────────────────────────────────────────────────────────

  function startStepDrag(stepId: string, clientX: number) {
    const initialOrder = steps.map(s => s.id);
    dragRef.current = { stepId, startClientX: clientX, currentClientX: clientX, order: initialOrder, initialOrder };
    didDragRef.current = false;
    forceUpdate();

    function onPointerMove(e: PointerEvent) {
      didDragRef.current = true;
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startClientX;
      const currentIndex = drag.order.indexOf(drag.stepId);
      let order = drag.order;
      let startClientX = drag.startClientX;
      if (dx > STEP_SWAP_THRESHOLD && currentIndex < order.length - 1) {
        order = [...order];
        [order[currentIndex], order[currentIndex + 1]] = [order[currentIndex + 1], order[currentIndex]];
        startClientX += STEP_SPACING;
      } else if (dx < -STEP_SWAP_THRESHOLD && currentIndex > 0) {
        order = [...order];
        [order[currentIndex - 1], order[currentIndex]] = [order[currentIndex], order[currentIndex - 1]];
        startClientX -= STEP_SPACING;
      }
      dragRef.current = { ...drag, currentClientX: e.clientX, order, startClientX };
      forceUpdate();
    }

    function onPointerUp() {
      const drag = dragRef.current;
      if (drag && drag.order.join() !== drag.initialOrder.join()) {
        onReorderRef.current(drag.order);
      }
      dragRef.current = null;
      forceUpdate();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  // ── Connect drag (step → fallback) ────────────────────────────────────────────

  function startConnectDrag(nativeEvent: PointerEvent, stepId: string) {
    const el = canvasRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const startX = nativeEvent.clientX - rect.left + el.scrollLeft;
    const startY = nativeEvent.clientY - rect.top + el.scrollTop;

    connectDragRef.current = {
      fromStepId: stepId,
      fromX: startX,
      fromY: startY,
      currentX: startX,
      currentY: startY,
      overFallbackId: null,
    };
    forceUpdate();

    // Capture snapshot for closure — these don't change during a single drag
    const capturedFallbackSteps = fallbackSteps;
    const capturedFallbackPositions = fallbackDisplayPositions;

    function onPointerMove(e: PointerEvent) {
      const cd = connectDragRef.current;
      if (!cd) return;
      const el = canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left + el.scrollLeft;
      const y = e.clientY - rect.top + el.scrollTop;

      let overFallbackId: string | null = null;
      for (let i = 0; i < capturedFallbackSteps.length; i++) {
        const fp = capturedFallbackPositions[i];
        if (x >= fp.x && x <= fp.x + 300 && y >= fp.y && y <= fp.y + 300) {
          overFallbackId = capturedFallbackSteps[i].id;
          break;
        }
      }

      connectDragRef.current = { ...cd, currentX: x, currentY: y, overFallbackId };
      forceUpdate();
    }

    function onPointerUp() {
      const cd = connectDragRef.current;
      if (cd?.overFallbackId) {
        const fbIdx = capturedFallbackSteps.findIndex(fb => fb.id === cd.overFallbackId);
        const fbPos = capturedFallbackPositions[fbIdx];
        if (fbPos) {
          setPendingConnection({
            fromStepId: cd.fromStepId,
            toFallbackId: cd.overFallbackId,
            // Place popover above + centered on the fallback card
            popoverX: fbPos.x + 30,
            popoverY: fbPos.y - 120,
          });
        }
      }
      connectDragRef.current = null;
      forceUpdate();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function confirmConnection() {
    if (!pendingConnection || !statusInput.trim()) return;
    onConnect(pendingConnection.fromStepId, pendingConnection.toFallbackId, statusInput.trim());
    setPendingConnection(null);
    setStatusInput("");
  }

  function cancelConnection() {
    setPendingConnection(null);
    setStatusInput("");
  }

  // ── Visual layout ─────────────────────────────────────────────────────────────

  const drag = dragRef.current;
  const connectDrag = connectDragRef.current;

  function getVisualPos(step: Step): { x: number; y: number } {
    if (!drag) return { x: step.position.x, y: step.position.y };
    const index = drag.order.indexOf(step.id);
    const baseX = 80 + index * STEP_SPACING;
    const baseY = index % 2 === 0 ? 80 : 300;
    const dx = drag.stepId === step.id ? drag.currentClientX - drag.startClientX : 0;
    return { x: baseX + dx, y: baseY };
  }

  const connectionOrder = drag
    ? drag.order.map(id => steps.find(s => s.id === id)).filter(Boolean) as Step[]
    : steps;

  // Position the fallback section so FALLBACK_PEEK_AMOUNT px of it shows before the user scrolls.
  // The step-clearance floor ensures it never overlaps regular step cards.
  const maxStepY = steps.length > 0 ? Math.max(...steps.map(s => s.position.y)) : 80;
  const fallbackRowY = Math.max(
    FALLBACK_ROW_MIN,
    maxStepY + FALLBACK_ROW_CLEARANCE,
    canvasViewportHeight - FALLBACK_PEEK_AMOUNT,
  );

  let unattachedCount = 0;
  const fallbackDisplayPositions = fallbackSteps.map(fallback => {
    const referencingIndices: number[] = [];
    for (let i = 0; i < connectionOrder.length; i++) {
      const step = connectionOrder[i];
      if (step.routes && Object.values(step.routes).includes(fallback.id)) {
        referencingIndices.push(i);
      }
    }
    if (referencingIndices.length > 0) {
      const avgIndex = referencingIndices.reduce((sum, i) => sum + i, 0) / referencingIndices.length;
      return { x: 80 + avgIndex * STEP_SPACING, y: fallbackRowY };
    }
    return { x: 80 + (unattachedCount++) * STEP_SPACING, y: fallbackRowY };
  });

  // Spread fallbacks that share the same x so they don't overlap
  const xGroups = new Map<number, number[]>();
  fallbackDisplayPositions.forEach((pos, idx) => {
    const key = Math.round(pos.x);
    if (!xGroups.has(key)) xGroups.set(key, []);
    xGroups.get(key)!.push(idx);
  });
  xGroups.forEach(indices => {
    if (indices.length <= 1) return;
    const baseX = fallbackDisplayPositions[indices[0]].x;
    const totalW = indices.length * FALLBACK_CARD_WIDTH + (indices.length - 1) * FALLBACK_CARD_GAP;
    const startX = baseX + FALLBACK_CARD_WIDTH / 2 - totalW / 2;
    indices.forEach((idx, i) => {
      fallbackDisplayPositions[idx] = {
        x: startX + i * (FALLBACK_CARD_WIDTH + FALLBACK_CARD_GAP),
        y: fallbackRowY,
      };
    });
  });

  const fallbackPosMap = new Map<string, { x: number; y: number }>();
  fallbackSteps.forEach((fb, idx) => {
    fallbackPosMap.set(fb.id, fallbackDisplayPositions[idx]);
  });

  // Sync fallbackPosMap ref so imperative scrollToFallback always reads current positions
  fallbackPosMapRef.current = fallbackPosMap;

  const hasFallbacks = fallbackSteps.length > 0;
  const activeNodeId = hoveredNodeId ?? focusedNodeId;

  // ── Highlight helpers — single source of truth for hover + navigator focus ────

  function isNodeDimmed(nodeId: string, connectionField: "stepId" | "fallbackId"): boolean {
    if (activeNodeId !== null) return activeNodeId !== nodeId;
    if (hoveredConnection !== null) return hoveredConnection[connectionField] !== nodeId;
    return false;
  }

  function isStepConnActive(stepId: string, nextStepId: string): boolean {
    if (!activeNodeId && !hoveredConnection) return true;
    if (activeNodeId) return activeNodeId === stepId || activeNodeId === nextStepId;
    return false;
  }

  function isFallbackConnActive(stepId: string, fallbackId: string): boolean {
    if (!activeNodeId && !hoveredConnection) return true;
    if (activeNodeId) return activeNodeId === stepId || activeNodeId === fallbackId;
    return hoveredConnection?.stepId === stepId && hoveredConnection?.fallbackId === fallbackId;
  }
  const fallbackMaxX = hasFallbacks
    ? Math.max(...fallbackDisplayPositions.map(p => p.x + FALLBACK_CARD_WIDTH + 80))
    : 0;
  const canvasWidth = Math.max(1800, steps.length * STEP_SPACING + 80, fallbackMaxX);
  const canvasHeight = Math.max(900,
    ...steps.map(s => s.position.y + 420),
    hasFallbacks ? fallbackRowY + 380 : 0
  );

  // ── Pan handlers ─────────────────────────────────────────────────────────────

  function handleMouseDown(e: React.MouseEvent<HTMLElement>) {
    if (dragRef.current || connectDragRef.current) return;
    const el = canvasRef.current;
    if (!el) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop };
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  }

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    if (!isPanning.current || dragRef.current) return;
    e.preventDefault();
    const el = canvasRef.current;
    if (!el) return;
    el.scrollLeft = panStart.current.scrollLeft - (e.clientX - panStart.current.x);
    el.scrollTop = panStart.current.scrollTop - (e.clientY - panStart.current.y);
  }

  function stopPan() {
    if (!isPanning.current) return;
    isPanning.current = false;
    const el = canvasRef.current;
    if (el) { el.style.cursor = "grab"; el.style.userSelect = ""; }
  }

  return (
    <section
      ref={canvasRef as React.RefObject<HTMLElement>}
      className="flex-1 relative overflow-auto canvas-grid canvas-area bg-background cursor-grab"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopPan}
      onMouseLeave={stopPan}
      onClick={(e) => {
        if (focusedNodeId === null) return;
        if (!(e.target as HTMLElement).closest('.step-node')) setFocusedNodeId(null);
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-md" />
          <span className="font-code-sm text-code-sm text-on-surface-variant tracking-widest uppercase">
            Loading steps...
          </span>
        </div>
      )}
      <svg
        className="absolute inset-0 pointer-events-none z-0"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <defs>
          <marker id="arrowhead" markerHeight="7" markerWidth="10" orient="auto" refX="0" refY="3.5">
            <polygon fill="#4d8eff" points="0 0, 10 3.5, 0 7" />
          </marker>
          <marker id="arrowhead-error" markerHeight="7" markerWidth="10" orient="auto" refX="0" refY="3.5">
            <polygon fill="#ff516a" points="0 0, 10 3.5, 0 7" />
          </marker>
          <marker id="arrowhead-ghost" markerHeight="7" markerWidth="10" orient="auto" refX="0" refY="3.5">
            <polygon fill="#ff516a" points="0 0, 10 3.5, 0 7" opacity="0.5" />
          </marker>
        </defs>

        {/* Regular step connections */}
        {connectionOrder.slice(0, -1).map((step, i) => {
          const next = connectionOrder[i + 1];
          const x1 = 80 + i * STEP_SPACING + 320;
          const y1 = (i % 2 === 0 ? 80 : 300) + 80;
          const x2 = 80 + (i + 1) * STEP_SPACING;
          const y2 = ((i + 1) % 2 === 0 ? 80 : 300) + 80;
          const isActive = isStepConnActive(step.id, next.id);
          return (
            <path
              key={`conn-${step.id}-${next.id}`}
              className="connection-line"
              d={`M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`}
              fill="none"
              markerEnd="url(#arrowhead)"
              stroke="#4d8eff"
              strokeWidth={isActive ? 2.5 : 1.5}
              opacity={isActive ? 1 : 0.35}
              style={{ transition: "opacity 0.15s, stroke-width 0.15s" }}
            />
          );
        })}

        {/* Fallback connections — visible paths + invisible 20px hit-area paths */}
        {connectionOrder.map((step, i) => {
          if (!step.routes || Object.keys(step.routes).length === 0) return null;
          const stepX = 80 + i * STEP_SPACING;
          const stepY = i % 2 === 0 ? 80 : 300;

          return Object.entries(step.routes).map(([statusCode, fallbackId]) => {
            const fbPos = fallbackPosMap.get(fallbackId);
            if (!fbPos) return null;

            const x1 = stepX + 160;
            const y1 = stepY + STEP_CARD_HEIGHT;
            const x2 = fbPos.x + 150;
            const y2 = fbPos.y;
            const d = `M ${x1} ${y1} C ${x1} ${y1 + 80}, ${x2} ${y2 - 80}, ${x2} ${y2}`;

            const isActive = isFallbackConnActive(step.id, fallbackId);

            return (
              <React.Fragment key={`fallback-group-${step.id}-${statusCode}`}>
                <path
                  d={d}
                  fill="none"
                  stroke="#ff516a"
                  strokeWidth={isActive ? 2.5 : 1.5}
                  strokeDasharray="6 4"
                  markerEnd="url(#arrowhead-error)"
                  opacity={isActive ? 1 : 0.35}
                  style={{ transition: "opacity 0.15s, stroke-width 0.15s" }}
                />
                {/* Wide invisible stroke for easy hover detection */}
                <path
                  d={d}
                  fill="none"
                  stroke="white"
                  strokeOpacity={0}
                  strokeWidth={20}
                  style={{ pointerEvents: "stroke" as React.CSSProperties["pointerEvents"], cursor: "crosshair" }}
                  onMouseEnter={() => setHoveredConnection({ stepId: step.id, fallbackId })}
                  onMouseLeave={() => setHoveredConnection(null)}
                />
              </React.Fragment>
            );
          });
        })}

        {/* Ghost connection line while dragging */}
        {connectDrag && (
          <path
            d={`M ${connectDrag.fromX} ${connectDrag.fromY} C ${connectDrag.fromX} ${connectDrag.fromY + 80}, ${connectDrag.currentX} ${connectDrag.currentY - 80}, ${connectDrag.currentX} ${connectDrag.currentY}`}
            fill="none"
            stroke="#ff516a"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.5"
            markerEnd="url(#arrowhead-ghost)"
          />
        )}

        {/* Fallback row separator */}
        {hasFallbacks && (
          <line
            x1="40" y1={fallbackRowY - 30}
            x2={canvasWidth - 40} y2={fallbackRowY - 30}
            stroke="#ff516a" strokeWidth="1" strokeDasharray="4 8" opacity="0.25"
          />
        )}
      </svg>

      {/* Fallback row label */}
      {hasFallbacks && (
        <div
          className="absolute font-label-caps text-label-caps text-error/50 flex items-center gap-xs pointer-events-none"
          style={{ left: 40, top: fallbackRowY - 22 }}
        >
          <span className="material-symbols-outlined text-xs">alt_route</span>
          FALLBACK HANDLERS
        </div>
      )}

      <div className="absolute inset-0" style={{ minWidth: canvasWidth, minHeight: canvasHeight }}>
        {/* Regular steps */}
        {steps.map((step) => {
          const { x, y } = getVisualPos(step);
          const dimmed = isNodeDimmed(step.id, "stepId");
          return (
            <StepNode
              key={step.id}
              step={step}
              visualX={x}
              visualY={y}
              isDragging={drag?.stepId === step.id}
              onClick={() => { if (didDragRef.current) { didDragRef.current = false; return; } onStepClick(step); }}
              onDelete={() => { setHoveredNodeId(null); setFocusedNodeId(null); setHoveredConnection(null); onStepDelete(step.id); }}
              onDragHandlePointerDown={(e) => {
                e.stopPropagation();
                startStepDrag(step.id, e.clientX);
              }}
              onPortPointerDown={(e, stepId) => startConnectDrag(e, stepId)}
              onMouseEnter={() => { setHoveredNodeId(step.id); setFocusedNodeId(null); }}
              onMouseLeave={() => setHoveredNodeId(null)}
              onJumpToFallback={jumpToFallback}
              stepResult={stepResults?.[step.id]}
              dimmed={dimmed}
            />
          );
        })}

        {/* Insert-after buttons — shown between consecutive steps when not dragging */}
        {!drag && connectionOrder.slice(0, -1).map((step, i) => {
          const midX = 400 + i * STEP_SPACING + (STEP_SPACING - 320) / 2;
          const y1 = (i % 2 === 0 ? 80 : 300) + 80;
          const y2 = ((i + 1) % 2 === 0 ? 80 : 300) + 80;
          const midY = (y1 + y2) / 2;
          return (
            <div
              key={`add-after-${step.id}`}
              className="absolute z-20"
              style={{ left: midX - 14, top: midY - 14 }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onAddAfter(step.id); }}
            >
              <button
                className="w-7 h-7 rounded-md bg-surface-container-high border border-primary/60 text-primary hover:bg-primary hover:border-primary hover:text-white transition-all shadow-[0_0_8px_rgba(77,142,255,0.25)] hover:shadow-[0_0_12px_rgba(77,142,255,0.5)] flex items-center justify-center cursor-pointer"
                title="Insert step here"
              >
                <span className="material-symbols-outlined text-[12px] select-none leading-none">add</span>
              </button>
            </div>
          );
        })}

        {/* Fallback steps */}
        {fallbackSteps.map((fb, idx) => {
          const pos = fallbackDisplayPositions[idx];
          const dimmed = isNodeDimmed(fb.id, "fallbackId");
          return (
            <FallbackStepNode
              key={fb.id}
              step={fb}
              visualX={pos.x}
              visualY={pos.y}
              onClick={() => onFallbackStepClick(fb)}
              onDelete={() => { setHoveredNodeId(null); setFocusedNodeId(null); setHoveredConnection(null); onFallbackStepDelete(fb.id); }}
              onMouseEnter={() => { setHoveredNodeId(fb.id); setFocusedNodeId(null); }}
              onMouseLeave={() => setHoveredNodeId(null)}
              stepResult={stepResults?.[fb.id]}
              isDropTarget={connectDrag?.overFallbackId === fb.id}
              dimmed={dimmed}
            />
          );
        })}

        {/* Connection disconnect badges (HTML for reliable click handling) */}
        {connectionOrder.map((step, i) => {
          if (!step.routes || Object.keys(step.routes).length === 0) return null;
          const stepX = 80 + i * STEP_SPACING;
          const stepY = i % 2 === 0 ? 80 : 300;

          return Object.entries(step.routes).map(([statusCode, fallbackId]) => {
            const fbPos = fallbackPosMap.get(fallbackId);
            if (!fbPos) return null;

            const x1 = stepX + 160;
            const y1 = stepY + STEP_CARD_HEIGHT;
            const x2 = fbPos.x + 150;
            const y2 = fbPos.y;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const isActive = isFallbackConnActive(step.id, fallbackId);

            return (
              <div
                key={`badge-${step.id}-${statusCode}`}
                className="absolute z-20 flex items-center gap-px select-none group"
                style={{
                  left: midX - 30,
                  top: midY - 11,
                  opacity: isActive ? 1 : 0.12,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={() => setHoveredConnection({ stepId: step.id, fallbackId })}
                onMouseLeave={() => setHoveredConnection(null)}
              >
                <div className="flex items-center bg-background border border-error rounded overflow-hidden">
                  <span className="font-code-sm text-[9px] font-bold tracking-widest text-error px-xs py-0.5 leading-none">
                    {statusCode}
                  </span>
                  <button
                    className="px-xs py-0.5 text-error/60 hover:text-error hover:bg-error/20 transition-colors leading-none border-l border-error/40 text-xs font-bold"
                    onClick={(e) => { e.stopPropagation(); setHoveredConnection(null); onDisconnect(step.id, statusCode); }}
                    title="Remove connection"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          });
        })}

        {/* Status code popover */}
        {pendingConnection && (
          <div
            className="absolute z-50 bg-surface-container-high border border-error/60 rounded-xl shadow-2xl p-md min-w-[220px]"
            style={{ left: pendingConnection.popoverX, top: pendingConnection.popoverY }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-xs mb-sm">
              <span className="material-symbols-outlined text-error text-sm">alt_route</span>
              <span className="font-label-caps text-label-caps text-error">Trigger Status Code</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-sm">
              When this step returns which HTTP status code should trigger the fallback?
            </p>
            <input
              autoFocus
              type="text"
              value={statusInput}
              onChange={(e) => setStatusInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && statusInput.trim()) confirmConnection();
                if (e.key === "Escape") cancelConnection();
              }}
              placeholder="e.g. 401"
              className="w-full bg-background border border-outline-variant rounded-lg p-sm font-code-md text-code-md text-on-surface focus:border-error outline-none transition-colors mb-sm"
            />
            <div className="flex gap-xs justify-end">
              <button
                onClick={cancelConnection}
                className="px-md py-xs rounded-lg text-on-surface-variant hover:bg-surface-variant font-bold transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmConnection}
                disabled={!statusInput.trim()}
                className="px-md py-xs rounded-lg bg-error text-on-error font-bold transition-all text-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-sm">link</span>
                Link
              </button>
            </div>
          </div>
        )}
      </div>

    </section>
  );
});

export default FlowCanvas;
