"use client";

import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/store";
import { createProject, setActiveProject } from "../store/projectsSlice";

export function ProjectDropdown() {
  const dispatch = useDispatch();
  const { projects, activeProjectId } = useSelector((state: RootState) => state.projects);
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setNewName("");
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus input when create form opens
  useEffect(() => {
    if (isCreating) inputRef.current?.focus();
  }, [isCreating]);

  function handleSelect(id: string) {
    dispatch(setActiveProject(id));
    setIsOpen(false);
    setIsCreating(false);
    setNewName("");
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    //dispatch(createProject({ projectName: newName.trim() }));
    
    setIsOpen(false);
    setIsCreating(false);
    setNewName("");
  }

  function openCreate() {
    setIsCreating(true);
    setNewName("");
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => { setIsOpen((v) => !v); setIsCreating(false); setNewName(""); }}
        className="flex items-center gap-xs px-md py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface-variant hover:text-primary hover:border-primary transition-all"
      >
        <span className="material-symbols-outlined text-sm text-outline">folder_open</span>
        <span className="font-body-md max-w-[160px] truncate">
          {activeProject?.projectName ?? "Select Project"}
        </span>
        <span
          className={`material-symbols-outlined text-sm transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          keyboard_arrow_down
        </span>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-xs w-64 bg-surface-container border border-outline-variant rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Create Project section */}
          <div className="border-b border-outline-variant p-sm">
            {isCreating ? (
              <form onSubmit={handleCreateSubmit} className="flex items-center gap-xs">
                <input
                  ref={inputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Project name..."
                  className="flex-1 bg-surface-container-high border border-primary rounded-lg px-sm py-xs font-code-sm text-code-sm text-on-surface focus:outline-none placeholder:text-outline"
                />
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="p-xs rounded-lg bg-primary text-on-primary-fixed hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Create"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setNewName(""); }}
                  className="p-xs rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all"
                  title="Cancel"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </form>
            ) : (
              <button
                onClick={openCreate}
                className="w-full flex items-center gap-sm px-sm py-xs rounded-lg text-primary hover:bg-primary/10 transition-colors font-body-md"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                Create Project
              </button>
            )}
          </div>

          {/* Project list */}
          <ul className="max-h-56 overflow-y-auto custom-scrollbar py-xs">
            {projects.length === 0 ? (
              <li className="px-md py-sm text-outline font-body-sm italic text-center">
                No projects yet.
              </li>
            ) : (
              projects.map((project) => {
                const isActive = project.id === activeProjectId;
                return (
                  <li key={project.id}>
                    <button
                      onClick={() => handleSelect(project.id)}
                      className={`w-full flex items-center justify-between px-md py-sm text-left transition-colors rounded-lg mx-xs my-0.5 w-[calc(100%-8px)] ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-on-surface hover:bg-surface-variant"
                      }`}
                    >
                      <div className="flex items-center gap-sm min-w-0">
                        <span
                          className={`material-symbols-outlined text-sm shrink-0 ${
                            isActive ? "text-primary" : "text-outline"
                          }`}
                        >
                          folder
                        </span>
                        <span className="font-body-md truncate">{project.projectName}</span>
                      </div>
                      {isActive && (
                        <span className="material-symbols-outlined text-primary text-sm shrink-0">
                          check
                        </span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
