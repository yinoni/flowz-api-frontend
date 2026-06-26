"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/store";
import {
  createFlow,
  deleteFlow,
  updateFlowMeta,
  setActiveFlow,
  type FlowRecord,
  setFlows,
} from "../store/flowsSlice";
import FlowModal from "../components/FlowModal";
import { createFlow as createFlowAPI, deleteFlow as deleteFlowAPI, editFlow as editFlowAPI, getProjectFlows } from "../api/flowRoute";
import { useToast } from "../components/ToastProvider";

interface FlowCardProps {
  flow: FlowRecord;
  onOpen: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function FlowCard({ flow, onOpen, onEdit, onDelete }: FlowCardProps) {
  return (
    <div
      onClick={onOpen}
      className="flow-card-hover bg-surface-container-low border border-outline-variant rounded-xl p-md transition-all duration-300 cursor-pointer hover:border-primary/50 hover:bg-surface-container"
    >
      <div className="flex justify-between items-start mb-md">
        <div className={`p-sm ${flow.iconBg} rounded-lg`}>
          <span className={`material-symbols-outlined ${flow.iconColor}`}>{flow.icon}</span>
        </div>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">{flow.flowName}</h3>
      <p className="text-on-surface-variant text-body-sm mb-md font-code-sm">
        Last modified: {new Date(flow.lastModified).toLocaleDateString('he-IL')}
      </p>
      {flow.globalURL && (
        <p className="text-outline font-code-sm text-[10px] mb-md truncate">
          {flow.globalURL}
        </p>
      )}
      <div className="flex items-center justify-between border-t border-outline-variant pt-md">
        <div className="flex gap-sm">
          <button
            onClick={onEdit}
            className="px-md py-1.5 rounded-lg border border-outline-variant text-body-sm hover:border-primary hover:text-primary transition-all"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            className="px-md py-1.5 rounded-lg border border-outline-variant text-body-sm hover:border-secondary hover:text-secondary transition-all"
          >
            Open
          </button>
        </div>
        <button
          onClick={onDelete}
          className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
          title="Delete flow"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>
  );
}

export default function MyFlowsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const flows = useSelector((state: RootState) => state.flows.flows);
  const activeProjectId = useSelector((state: RootState) => state.projects.activeProjectId);
  const activeProject = useSelector((state: RootState) =>
    state.projects.projects.find((p) => p.id === activeProjectId)
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<FlowRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = flows.filter((f) =>
    f.flowName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleOpenFlow(flow: FlowRecord) {
    dispatch(setActiveFlow(flow.id));
    router.push("/");
  }

  function handleCreateNew() {
    if (!activeProjectId) {
      showToast("Please select or create a project before creating a flow.", "info");
      return;
    }
    setEditingFlow(null);
    setIsModalOpen(true);
  }

  function handleEditFlow(e: React.MouseEvent, flow: FlowRecord) {
    e.stopPropagation();
    setEditingFlow(flow);
    setIsModalOpen(true);
  }

  async function handleSaveModal(data: { flowName: string; globalURL: string; globalHeaders: Record<string, string>; globalVariables: Record<string, string> }) {
    if (editingFlow) {
      const result = await editFlowAPI(editingFlow.id, data.flowName, data.globalURL, data.globalHeaders, data.globalVariables);
      if (result.success) {
        dispatch(updateFlowMeta({ id: editingFlow.id, ...data }));
      } else {
        showToast(result.message ?? "Failed to update flow. Please try again.", "error");
      }
    } else {
      const result = await createFlowAPI(activeProjectId ?? '', data.flowName, data.globalURL, data.globalHeaders, data.globalVariables);
      if (result.success) {
        dispatch(createFlow(result.data));
        router.push("/");
      } else {
        showToast(result.message ?? "Failed to create flow. Please try again.", "error");
      }
    }
  }

  function handleDeleteClick(e: React.MouseEvent, flowId: string) {
    e.stopPropagation();
    setDeleteConfirmId(flowId);
  }

  async function confirmDelete() {
    if (!deleteConfirmId) return;
    const result = await deleteFlowAPI(deleteConfirmId);
    if (result.success) {
      dispatch(deleteFlow(deleteConfirmId));
    } else {
      showToast(result.message ?? "Failed to delete flow. Please try again.", "error");
    }
    setDeleteConfirmId(null);
  }

  return (
    <>
      <section className="flex-1 overflow-y-auto p-lg bg-surface-dim custom-scrollbar">
        {/* Page Header */}
        <div className="flex justify-between items-end mb-xl">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">My Flows</h2>
            <p className="text-on-surface-variant font-body-md">
              {activeProject ? (
                <>Project: <span className="text-primary">{activeProject.projectName}</span></>
              ) : (
                "Manage and monitor your automated architecture."
              )}
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            title={!activeProjectId ? "Select or create a project first" : undefined}
            className={`flex items-center gap-sm bg-primary text-on-primary-fixed font-bold px-lg py-3 rounded-lg transition-all ${activeProjectId ? "hover:opacity-90 active:scale-95" : "opacity-40 cursor-not-allowed"}`}
          >
            <span className="material-symbols-outlined">add_circle</span>
            Create New Flow
          </button>
        </div>

        {/* No-project callout */}
        {!activeProjectId && (
          <div className="mb-xl flex items-start gap-md p-lg bg-primary/5 border-2 border-primary/25 rounded-xl">
            <span className="material-symbols-outlined text-primary text-2xl shrink-0 mt-0.5">account_tree</span>
            <div className="flex-1 min-w-0">
              <p className="font-headline-md text-headline-md text-on-surface mb-xs">No project selected</p>
              <p className="text-on-surface-variant font-body-md">
                Use the <span className="text-primary font-bold">Project</span> selector in the top bar to choose an existing project or create a new one. Flows belong to a project. you need one before you can create flows.
              </p>
            </div>
            <button
              onClick={() => document.querySelector<HTMLButtonElement>('[data-project-trigger]')?.click()}
              className="shrink-0 flex items-center gap-xs px-md py-sm rounded-lg bg-primary text-on-primary-fixed font-bold text-body-sm hover:opacity-90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">folder_open</span>
              Select Project
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex items-center mb-lg bg-surface-container-low p-sm rounded-xl border border-outline-variant">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">
              search
            </span>
            <input
              className="bg-surface-container border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-on-surface text-body-md focus:border-primary w-56 transition-all outline-none"
              placeholder="Search flows..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Flow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {filtered.map((flow) => (
            <FlowCard
              key={flow.id}
              flow={flow}
              onOpen={() => handleOpenFlow(flow)}
              onEdit={(e) => handleEditFlow(e, flow)}
              onDelete={(e) => handleDeleteClick(e, flow.id)}
            />
          ))}
          <div
            onClick={handleCreateNew}
            title={!activeProjectId ? "Select or create a project first" : undefined}
            className={`border-2 border-dashed border-outline-variant rounded-xl p-md flex flex-col items-center justify-center text-center transition-all group ${activeProjectId ? "opacity-60 hover:opacity-100 hover:border-primary hover:bg-surface-container-low cursor-pointer" : "opacity-30 cursor-not-allowed"}`}
          >
            <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center mb-md group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-2xl">add</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">
              New Flow
            </h3>
            <p className="text-on-surface-variant text-body-sm px-lg">
              Start building a new API flow from scratch.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-lowest font-code-sm text-code-sm h-12 flex justify-between items-center px-lg border-t border-outline-variant shrink-0">
        <span className="text-outline">© 2026 FlowZ Engine.</span>
      </footer>

      {/* Create / Edit Modal */}
      <FlowModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingFlow(null); }}
        onSave={handleSaveModal}
        initialData={
          editingFlow
            ? { flowName: editingFlow.flowName, globalURL: editingFlow.globalURL, globalHeaders: editingFlow.globalHeaders ?? {}, globalVariables: editingFlow.globalVariables ?? {} }
            : null
        }
      />

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container border border-outline-variant rounded-xl shadow-2xl p-lg w-[360px]">
            <div className="flex items-center gap-sm mb-md">
              <span className="material-symbols-outlined text-error">warning</span>
              <span className="font-headline-md text-headline-md text-on-surface">Delete Flow?</span>
            </div>
            <p className="text-on-surface-variant font-body-md mb-lg">
              This will permanently remove the flow and all its steps. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-sm">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-lg py-sm rounded-lg border border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface transition-all font-body-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
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
