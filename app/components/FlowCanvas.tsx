"use client";

import { useRef } from "react";
import type { Step } from "../store/stepsSlice";

interface StepNodeProps {
  step: Step;
  onClick: () => void;
  onDelete: () => void;
}

function StepNode({ step, onClick, onDelete }: StepNodeProps) {
  const hasHeaders = Object.keys(step.headers).length > 0;
  const hasExtract = Object.keys(step.extract).length > 0;
  const hasAssertions = Object.keys(step.assertions).length > 0;

  return (
    <div
      className="step-node absolute w-[320px] bg-surface-container-high border border-outline-variant rounded-lg overflow-hidden shadow-xl z-10 cursor-pointer hover:border-primary-container"
      style={{ left: step.position.x, top: step.position.y }}
      onClick={onClick}
    >
      <div className="bg-surface-variant px-md py-sm flex justify-between items-center border-b border-outline-variant">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-secondary text-sm">http</span>
          <span className="font-label-caps text-label-caps text-on-surface">
            {step.title || "STEP"}
          </span>
        </div>
        <div className="flex items-center gap-xs">
          <span className="bg-secondary-container text-on-secondary-container px-xs rounded text-[9px] font-bold">
            {step.httpMethod || "GET"}
          </span>
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
}

export default function FlowCanvas({ steps, onStepClick, onStepDelete }: FlowCanvasProps) {
  const canvasRef = useRef<HTMLElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const canvasWidth = Math.max(1800, ...steps.map((s) => s.position.x + 440));
  const canvasHeight = Math.max(700, ...steps.map((s) => s.position.y + 320));

  function handleMouseDown(e: React.MouseEvent<HTMLElement>) {
    const el = canvasRef.current;
    if (!el) return;
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    };
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  }

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    if (!isDragging.current) return;
    e.preventDefault();
    const el = canvasRef.current;
    if (!el) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    el.scrollLeft = dragStart.current.scrollLeft - dx;
    el.scrollTop = dragStart.current.scrollTop - dy;
  }

  function stopDrag() {
    if (!isDragging.current) return;
    isDragging.current = false;
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
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >
      <svg
        className="absolute inset-0 pointer-events-none z-0"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerHeight="7"
            markerWidth="10"
            orient="auto"
            refX="0"
            refY="3.5"
          >
            <polygon fill="#4d8eff" points="0 0, 10 3.5, 0 7" />
          </marker>
        </defs>
        {steps.slice(0, -1).map((step, i) => {
          const next = steps[i + 1];
          const x1 = step.position.x + 320;
          const y1 = step.position.y + 80;
          const x2 = next.position.x;
          const y2 = next.position.y + 80;
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

      <div
        className="absolute inset-0"
        style={{ minWidth: canvasWidth, minHeight: canvasHeight }}
      >
        {steps.map((step) => (
          <StepNode
            key={step.id}
            step={step}
            onClick={() => onStepClick(step)}
            onDelete={() => onStepDelete(step.id)}
          />
        ))}
      </div>
    </section>
  );
}
