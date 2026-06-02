"use client";

import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/store";
import { createProject, deleteProject, updateProject, ProjectRecord, setActiveProject } from "../store/projectsSlice";
import { createProject as createProjectAPI, deleteProject as deleteProjectAPI, updateProject as updateProjectAPI } from "../api/projectRoute";
import { useToast } from "./ToastProvider";
import { getProjectFlows as getProjectFlowsAPI } from "../api/flowRoute";
import { setActiveFlow, setFlows } from "../store/flowsSlice";

interface ProjectDDRowProps {
  project: ProjectRecord;
  activeProjectId: string | null;
  isEditing: boolean;
  editingName: string;
  onEditingNameChange: (name: string) => void;
  onSelect: (projectId: string) => void;
  onEditStart: (project: ProjectRecord) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDeleteRequest: (projectId: string) => void;
}

function ProjectDDRow({
  project, activeProjectId, isEditing, editingName, onEditingNameChange,
  onSelect, onEditStart, onEditSave, onEditCancel, onDeleteRequest,
}: ProjectDDRowProps) {
  const isActive = project.id === activeProjectId;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  if (isEditing) {
    return (
      <li className="px-sm py-xs mx-xs">
        <form
          onSubmit={(e) => { e.preventDefault(); onEditSave(); }}
          className="flex items-center gap-xs"
        >
          <input
            ref={inputRef}
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            className="flex-1 bg-surface-container-high border border-primary rounded-lg px-sm py-xs font-code-sm text-code-sm text-on-surface focus:outline-none placeholder:text-outline"
          />
          <button
            type="submit"
            disabled={!editingName.trim()}
            className="p-xs rounded-lg bg-primary text-on-primary-fixed hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Save"
          >
            <span className="material-symbols-outlined text-[16px]">check</span>
          </button>
          <button
            type="button"
            onClick={onEditCancel}
            className="p-xs rounded-lg text-on-surface-variant hover:bg-surface-variant transition-all"
            title="Cancel"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </form>
      </li>
    );
  }

  return (
    <li>
      <div className={`group flex items-center gap-xs px-md py-sm mx-xs my-0.5 rounded-lg transition-colors ${isActive ? "bg-primary/10" : "hover:bg-surface-variant"}`}>
        <button
          onClick={() => onSelect(project.id)}
          className={`flex-1 flex items-center gap-sm min-w-0 text-left ${isActive ? "text-primary" : "text-on-surface"}`}
        >
          <span className={`material-symbols-outlined text-sm shrink-0 ${isActive ? "text-primary" : "text-outline"}`}>
            folder
          </span>
          <span className="font-body-md truncate">{project.projectName}</span>
          {isActive && (
            <span className="material-symbols-outlined text-primary text-sm shrink-0 ml-auto">check</span>
          )}
        </button>
        <div className="flex items-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEditStart(project)}
            className="p-xs rounded text-outline hover:text-primary hover:bg-primary/10 transition-colors"
            title="Rename"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
          </button>
          <button
            onClick={() => onDeleteRequest(project.id)}
            className="p-xs rounded text-outline hover:text-error hover:bg-error/10 transition-colors"
            title="Delete"
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
          </button>
        </div>
      </div>
    </li>
  );
}

export function ProjectDropdown() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { projects, activeProjectId } = useSelector((state: RootState) => state.projects);
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setNewName("");
        setEditingProject(null);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isCreating) newInputRef.current?.focus();
  }, [isCreating]);


  const getProjectFlows = async (projectId: string) => {
    const result: any = await getProjectFlowsAPI(projectId);
    if (result.success) {
      dispatch(setFlows(result.data));
      dispatch(setActiveFlow(null));
      dispatch(setActiveProject(projectId));
    }
  }

  async function handleSelect(id: string) {
    await getProjectFlows(id);
    setIsOpen(false);
    setIsCreating(false);
    setNewName("");
    setEditingProject(null);
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const result = await createProjectAPI(newName.trim());
    if (result.success) {
      dispatch(createProject(result.data));
    } else {
      showToast(result.message ?? "Failed to create project. Please try again.");
    }
    setIsOpen(false);
    setIsCreating(false);
    setNewName("");
  }

  async function handleEditSave() {
    if (!editingProject || !editingName.trim()) return;
    const result = await updateProjectAPI(editingProject.id, editingName.trim());
    if (result.success) {
      dispatch(updateProject({ id: editingProject.id, projectName: editingName.trim() }));
    } else {
      showToast(result.message ?? "Failed to rename project. Please try again.");
    }
    setEditingProject(null);
    setEditingName("");
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirmId) return;
    const result = await deleteProjectAPI(deleteConfirmId);
    if (result.success) {
      dispatch(deleteProject(deleteConfirmId));
    } else {
      showToast(result.message ?? "Failed to delete project. Please try again.");
    }
    setDeleteConfirmId(null);
  }
  
  useEffect(() => {
    const fetchFlowsForActiveProject = async () => {
      if (!activeProjectId) {
        await dispatch(setFlows([]));
        return;
      }
  
      await getProjectFlows(activeProjectId);
    };
  
    fetchFlowsForActiveProject();
  }, [activeProjectId, dispatch]);

  return (
    <>
      <div ref={containerRef} className="relative">
        {/* Trigger */}
        <button
          onClick={() => { setIsOpen((v) => !v); setIsCreating(false); setNewName(""); setEditingProject(null); }}
          className="flex items-center gap-xs px-md py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface-variant hover:text-primary hover:border-primary transition-all"
        >
          <span className="material-symbols-outlined text-sm text-outline">folder_open</span>
          <span className="font-body-md max-w-[160px] truncate">
            {activeProject?.projectName ?? "Select Project"}
          </span>
          <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
            keyboard_arrow_down
          </span>
        </button>

        {/* Dropdown panel */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-xs w-64 bg-surface-container border border-outline-variant rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Create section */}
            <div className="border-b border-outline-variant p-sm">
              {isCreating ? (
                <form onSubmit={handleCreateSubmit} className="flex items-center gap-xs">
                  <input
                    ref={newInputRef}
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
                    className="p-xs rounded-lg text-on-surface-variant hover:bg-surface-variant transition-all"
                    title="Cancel"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => { setIsCreating(true); setNewName(""); }}
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
                <li className="px-md py-sm text-outline font-body-sm italic text-center">No projects yet.</li>
              ) : (
                projects.map((project) => (
                  <ProjectDDRow
                    key={project.id}
                    project={project}
                    activeProjectId={activeProjectId}
                    isEditing={editingProject?.id === project.id}
                    editingName={editingName}
                    onEditingNameChange={setEditingName}
                    onSelect={handleSelect}
                    onEditStart={(p) => { setEditingProject(p); setEditingName(p.projectName); }}
                    onEditSave={handleEditSave}
                    onEditCancel={() => { setEditingProject(null); setEditingName(""); }}
                    onDeleteRequest={setDeleteConfirmId}
                  />
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container border border-outline-variant rounded-xl shadow-2xl p-lg w-[360px]">
            <div className="flex items-center gap-sm mb-md">
              <span className="material-symbols-outlined text-error">warning</span>
              <span className="font-headline-md text-headline-md text-on-surface">Delete Project?</span>
            </div>
            <p className="text-on-surface-variant font-body-md mb-lg">
              This will permanently remove the project and all its flows. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-sm">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-lg py-sm rounded-lg border border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface transition-all font-body-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-lg py-sm rounded-lg bg-error text-on-error font-bold hover:opacity-90 transition-all active:scale-95 flex items-center gap-xs font-body-md"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
