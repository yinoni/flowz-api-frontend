"use client";

import { useRef, useReducer } from "react";
import type { Step } from "../store/stepsSlice";
import { getHttpMethodColor } from "../utils/utils";

interface DragState {
  stepId: string;
  startClientX: number;
  currentClientX: number;
  order: string[];
  initialOrder: string[];
}

interface StepNodeProps {
  step: Step;
  visualX: number;
  visualY: number;
  isDragging: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDragHandlePointerDown: (e: React.PointerEvent) => void;
  stepResult?: boolean;
}

function StepNode({ step, visualX, visualY, isDragging, onClick, onDelete, onDragHandlePointerDown, stepResult }: StepNodeProps) {
  const hasHeaders = Object.keys(step.headers).length > 0;
  const hasExtract = Object.keys(step.extract).length > 0;
  const hasAssertions = Object.keys(step.assertions).length > 0;

  return (
    <div
      className={`step-node absolute w-[320px] bg-surface-container-high border-2 rounded-lg overflow-hidden shadow-xl cursor-pointer ${
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
          ? "box-shadow 0.1s"
          : "left 0.15s ease, top 0.15s ease, box-shadow 0.1s",
      }}
      onClick={isDragging ? undefined : onClick}
    >
      <div className="bg-surface-variant px-md py-sm flex justify-between items-center border-b border-outline-variant">
        <div className="flex items-center gap-xs">
          <div
            className="cursor-grab active:cursor-grabbing text-outline hover:text-on-surface-variant transition-colors mr-xs shrink-0"
            onPointerDown={onDragHandlePointerDown}
            onClick={(e) => e.stopPropagation()}
            title="Drag to reorder"
          >
            <span className="material-symbols-outlined text-sm select-none">drag_indicator</span>
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
            {Object.entries(step.headers)
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
            {Object.entries(step.extract).map(([varName, path]) => (
              <div key={varName} className="font-code-sm text-code-sm text-on-background">
                {varName} <span className="text-primary font-bold">←</span> {path}
              </div>
            ))}
          </div>
        )}
        {hasAssertions && (
          <div className="bg-tertiary-container/10 border border-tertiary-container/30 p-xs rounded">
            <label className="text-[9px] text-tertiary uppercase block mb-xs">Assertions</label>
            {Object.entries(step.assertions).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between font-code-sm text-code-sm">
                <span>{k} == {v}</span>
                <span className="material-symbols-outlined text-tertiary text-xs">pending</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface FlowCanvasProps {
  steps: Step[];
  onStepClick: (step: Step) => void;
  onStepDelete: (stepId: string) => void;
  onReorderSteps: (orderedIds: string[]) => void;
  stepResults?: Record<string, boolean>;
}

const STEP_SPACING = 440;
const STEP_SWAP_THRESHOLD = STEP_SPACING / 2;

export default function FlowCanvas({ steps, onStepClick, onStepDelete, onReorderSteps, stepResults }: FlowCanvasProps) {
  const canvasRef = useRef<HTMLElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Ref holds live drag state; forceUpdate triggers re-renders during drag
  const dragRef = useRef<DragState | null>(null);
  const onReorderRef = useRef(onReorderSteps);
  onReorderRef.current = onReorderSteps;
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  function startStepDrag(stepId: string, clientX: number) {
    const initialOrder = steps.map(s => s.id);
    dragRef.current = {
      stepId,
      startClientX: clientX,
      currentClientX: clientX,
      order: initialOrder,
      initialOrder,
    };
    forceUpdate();

    function onPointerMove(e: PointerEvent) {
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
        // TODO: call reorder API when endpoint is available
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

  const drag = dragRef.current;

  function getVisualPos(step: Step): { x: number; y: number } {
    if (!drag) return { x: step.position.x, y: step.position.y };
    const index = drag.order.indexOf(step.id);
    const baseX = 80 + index * STEP_SPACING;
    const baseY = index % 2 === 0 ? 80 : 300;
    const dx = drag.stepId === step.id ? drag.currentClientX - drag.startClientX : 0;
    return { x: baseX + dx, y: baseY };
  }

  // SVG connections follow current drag order at base (non-offset) positions
  const connectionOrder = drag
    ? drag.order.map(id => steps.find(s => s.id === id)).filter(Boolean) as Step[]
    : steps;

  const canvasWidth = Math.max(1800, steps.length * STEP_SPACING + 80);
  const canvasHeight = Math.max(700, ...steps.map(s => s.position.y + 320));

  function handleMouseDown(e: React.MouseEvent<HTMLElement>) {
    if (dragRef.current) return;
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
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    el.scrollLeft = panStart.current.scrollLeft - dx;
    el.scrollTop = panStart.current.scrollTop - dy;
  }

  function stopPan() {
    if (!isPanning.current) return;
    isPanning.current = false;
    const el = canvasRef.current;
    if (el) {
      el.style.cursor = "grab";
      el.style.userSelect = "";
    }
  }

  return (
    <section
      ref={canvasRef as React.RefObject<HTMLElement>}
      className="flex-1 relative overflow-auto canvas-grid canvas-area bg-background cursor-grab"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopPan}
      onMouseLeave={stopPan}
    >
      <svg
        className="absolute inset-0 pointer-events-none z-0"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <defs>
          <marker id="arrowhead" markerHeight="7" markerWidth="10" orient="auto" refX="0" refY="3.5">
            <polygon fill="#4d8eff" points="0 0, 10 3.5, 0 7" />
          </marker>
        </defs>
        {connectionOrder.slice(0, -1).map((step, i) => {
          const next = connectionOrder[i + 1];
          const x1 = 80 + i * STEP_SPACING + 320;
          const y1 = (i % 2 === 0 ? 80 : 300) + 80;
          const x2 = 80 + (i + 1) * STEP_SPACING;
          const y2 = ((i + 1) % 2 === 0 ? 80 : 300) + 80;
          return (
            <path
              key={`conn-${step.id}-${next.id}`}
              className="connection-line"
              d={`M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`}
              fill="none"
              markerEnd="url(#arrowhead)"
              stroke="#4d8eff"
              strokeWidth="2"
            />
          );
        })}
      </svg>

      <div className="absolute inset-0" style={{ minWidth: canvasWidth, minHeight: canvasHeight }}>
        {steps.map((step) => {
          const { x, y } = getVisualPos(step);
          return (
            <StepNode
              key={step.id}
              step={step}
              visualX={x}
              visualY={y}
              isDragging={drag?.stepId === step.id}
              onClick={() => onStepClick(step)}
              onDelete={() => onStepDelete(step.id)}
              onDragHandlePointerDown={(e) => {
                e.stopPropagation();
                startStepDrag(step.id, e.clientX);
              }}
              stepResult={stepResults?.[step.id]}
            />
          );
        })}
      </div>
    </section>
  );
}
