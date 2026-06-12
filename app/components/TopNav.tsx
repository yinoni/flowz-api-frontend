"use client";

import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { toggleFocusMode } from "../store/uiSlice";
import { ProjectDropdown } from "./ProjectDropdown";
import Image from "next/image";

export function TopNav() {
  const dispatch = useDispatch();
  const isFocusMode = useSelector((state: RootState) => state.ui.isFocusMode);

  return (
    <header className="bg-surface-container-highest flex justify-between items-center w-full px-lg h-16 border-b border-outline-variant shrink-0 z-30">
      <div className="flex items-center gap-xl">
          <Image
              src={require('../assets/logo_transparent.png')}
              alt="FlowZ"
              width={40}
              height={40}
              className="rounded-xl"
              priority
            />
        <ProjectDropdown />
      </div>
      <button
        onClick={() => dispatch(toggleFocusMode())}
        className={`flex items-center gap-xs px-sm py-xs rounded-lg border transition-all text-sm font-body-md ${
          isFocusMode
            ? "border-primary text-primary bg-primary/10 hover:bg-primary/20"
            : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
        }`}
        title={isFocusMode ? "Exit focus mode  (\\)" : "Focus mode — hide sidebars  (\\)"}
      >
        <span className="material-symbols-outlined text-sm">
          {isFocusMode ? "fullscreen_exit" : "fullscreen"}
        </span>
        <span className="hidden sm:inline">{isFocusMode ? "Exit Focus" : "Focus"}</span>
      </button>
    </header>
  );
}
