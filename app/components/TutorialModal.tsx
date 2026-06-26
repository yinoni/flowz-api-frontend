"use client";

import { useState, useEffect } from "react";
import createProjectGif from "../assets/create-project.gif";
import createFlowGif from "../assets/create-flow.gif";
import createStepGif from "../assets/create-step.gif";

const SLIDES = [
  {
    image: createProjectGif,
    step: "Step 01",
    title: "Create a Project",
    description:
      "A project is your top-level workspace. Everything lives inside a project — flows, steps, variables, and shared headers. Start by creating one from the sidebar.",
  },
  {
    image: createFlowGif,
    step: "Step 02",
    title: "Build a Flow",
    description:
      "A flow is an ordered sequence of HTTP requests. Give it a name, open it in the Flow Editor, and it's ready for you to wire up your full API chain.",
  },
  {
    image: createStepGif,
    step: "Step 03",
    title: "Add Steps & Run",
    description:
      "Each step is an API call. Configure the URL, method, headers, body, and assertions. Hit Start — FlowZ runs every step in order and streams results live.",
  },
];

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (isOpen) setCurrentSlide(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrentSlide(v => Math.min(v + 1, SLIDES.length - 1));
      if (e.key === "ArrowLeft") setCurrentSlide(v => Math.max(v - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isLast = currentSlide === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md backdrop-blur-sm bg-background/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl flex flex-col overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-md right-md z-10 w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          title="Close tutorial"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>

        {/* Slide strip */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {SLIDES.map((slide, i) => (
              <div key={i} className="w-full shrink-0">
                {/* GIF illustration */}
                <div className="bg-surface-container-high px-lg pt-lg pb-0 flex items-center justify-center">
                  <img
                    src={slide.image.src}
                    alt={slide.title}
                    className="w-full object-contain rounded-t-lg border border-b-0 border-outline-variant"
                  />
                </div>

                {/* Text */}
                <div className="px-xl py-lg">
                  <span className="font-label-caps text-[10px] text-outline uppercase tracking-widest">
                    {slide.step}
                  </span>
                  <h2 className="font-headline-lg text-on-surface mt-xs mb-sm">{slide.title}</h2>
                  <p className="font-body-md text-on-surface-variant leading-relaxed">
                    {slide.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-xl py-lg border-t border-outline-variant flex items-center justify-between">
          {/* Dot indicators */}
          <div className="flex items-center gap-sm">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === currentSlide
                    ? "w-5 h-2 bg-primary"
                    : "w-2 h-2 bg-outline-variant hover:bg-outline"
                }`}
                title={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-sm">
            {currentSlide > 0 && (
              <button
                onClick={() => setCurrentSlide(v => v - 1)}
                className="px-lg py-md rounded-lg text-on-surface-variant hover:bg-surface-variant font-bold transition-all active:scale-95 flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back
              </button>
            )}
            <button
              onClick={isLast ? onClose : () => setCurrentSlide(v => v + 1)}
              className="px-xl py-md rounded-lg bg-primary text-on-primary font-extrabold shadow-lg shadow-primary/20 transition-all active:scale-95 hover:opacity-90 flex items-center gap-xs"
            >
              {isLast ? (
                <>
                  Get Started
                  <span className="material-symbols-outlined text-sm">rocket_launch</span>
                </>
              ) : (
                <>
                  Next
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
