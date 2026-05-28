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
  type FlowStatus,
  setFlows,
} from "../store/flowsSlice";
import FlowModal from "../components/FlowModal";
import { getProjectFlows } from "../api/flowRoute";

const STATUS_CONFIG: Record<FlowStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: "ACTIVE",
    className: "bg-secondary-container text-on-secondary-container",
  },
  PAUSED: {
    label: "PAUSED",
    className: "bg-surface-container-highest text-on-surface-variant",
  },
  DRAFT: {
    label: "DRAFT",
    className: "bg-surface-container-highest text-on-surface-variant border border-outline-variant",
  },
};

interface SparkBar {
  height: number;
  opacity?: number;
}

const SPARK_PRESETS: Record<FlowStatus, { bars: SparkBar[]; color: string }> = {
  ACTIVE: {
    bars: [
      { height: 4, opacity: 30 },
      { height: 6, opacity: 50 },
      { height: 5 },
      { height: 8 },
      { height: 6 },
      { height: 7 },
    ],
    color: "bg-secondary",
  },
  PAUSED: {
    bars: [{ height: 4 }, { height: 4 }, { height: 4 }, { height: 4 }, { height: 4 }],
    color: "bg-outline-variant",
  },
  DRAFT: {
    bars: [
      { height: 8 },
      { height: 3, opacity: 40 },
      { height: 7 },
      { height: 2, opacity: 20 },
      { height: 6 },
    ],
    color: "bg-error",
  },
};

function Sparkline({ bars, color }: { bars: SparkBar[]; color: string }) {
  return (
    <div className="h-8 w-24 flex items-end gap-1">
      {bars.map((bar, i) => (
        <div
          key={i}
          className={`w-1 rounded-full ${color}`}
          style={{
            height: `${bar.height * 4}px`,
            opacity: bar.opacity !== undefined ? bar.opacity / 100 : 1,
          }}
        />
      ))}
    </div>
  );
}

interface FlowCardProps {
  flow: FlowRecord;
  onOpen: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function FlowCard({ flow, onOpen, onEdit, onDelete }: FlowCardProps) {
  const { label, className } = STATUS_CONFIG[flow.status];
  const spark = SPARK_PRESETS[flow.status];

  return (
    <div
      onClick={onOpen}
      className="flow-card-hover bg-surface-container-low border border-outline-variant rounded-xl p-md transition-all duration-300 cursor-pointer hover:border-primary/50 hover:bg-surface-container"
    >
      <div className="flex justify-between items-start mb-md">
        <div className={`p-sm ${flow.iconBg} rounded-lg`}>
          <span className={`material-symbols-outlined ${flow.iconColor}`}>{flow.icon}</span>
        </div>
        <span className={`${className} px-sm py-xs rounded-full font-label-caps text-label-caps`}>
          {label}
        </span>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">{flow.flowName}</h3>
      <p className="text-on-surface-variant text-body-sm mb-md font-code-sm">
        Last modified: {flow.lastModified}
      </p>
      {flow.globalURL && (
        <p className="text-outline font-code-sm text-[10px] mb-md truncate">
          {flow.globalURL}
        </p>
      )}
      <div className="bg-surface-container p-sm rounded-lg border border-outline-variant mb-md flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-label-caps text-on-surface-variant mb-xs">STEPS</span>
          <span className="font-code-md text-code-md text-primary">{flow.steps.length}</span>
        </div>
        <Sparkline bars={spark.bars} color={spark.color} />
      </div>
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
  const flows = useSelector((state: RootState) => state.flows.flows);
  const activeProjectId = useSelector((state: RootState) => state.projects.activeProjectId);
  const activeProject = useSelector((state: RootState) =>
    state.projects.projects.find((p) => p.id === activeProjectId)
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<FlowRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const projectFlows = flows.filter((f) => f.projectId === activeProjectId);
  const filtered = projectFlows.filter((f) =>
    f.flowName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleOpenFlow(flow: FlowRecord) {
    dispatch(setActiveFlow(flow.id));
    router.push("/");
  }

  function handleCreateNew() {
    setEditingFlow(null);
    setIsModalOpen(true);
  }

  function handleEditFlow(e: React.MouseEvent, flow: FlowRecord) {
    e.stopPropagation();
    setEditingFlow(flow);
    setIsModalOpen(true);
  }

  function handleSaveModal(data: { flowName: string; status: FlowStatus; globalURL: string }) {
    if (editingFlow) {
      //dispatch(updateFlowMeta({ id: editingFlow.id, ...data }));
    } else {
      //dispatch(createFlow({ ...data, projectId: activeProjectId ?? '' }));
      router.push("/");
    }
  }

  function handleDeleteClick(e: React.MouseEvent, flowId: string) {
    e.stopPropagation();
    setDeleteConfirmId(flowId);
  }

  function confirmDelete() {
    if (deleteConfirmId) dispatch(deleteFlow(deleteConfirmId));
    setDeleteConfirmId(null);
  }

  useEffect(() => {
    const initPageData = async () => {
      if(activeProject){
        console.log('Hi! 2');
        
        const apiResponse = await getProjectFlows(activeProject.id);
        console.log("Hi! 3");
        
        if(apiResponse.success){
          console.log("Hi! 4");
            
            dispatch(setFlows(apiResponse.data));
        }
        else{
          console.log("Hi! 5");

          //Show a toast message that says there was an error
        }
      }
    }

    initPageData();
  }, [activeProject]);

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
            className="flex items-center gap-sm bg-primary text-on-primary-fixed font-bold px-lg py-3 rounded-lg hover:opacity-90 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Create New Flow
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between mb-lg bg-surface-container-low p-sm rounded-xl border border-outline-variant">
          <div className="flex items-center gap-sm">
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
            <button className="flex items-center gap-xs px-md py-2 bg-surface-container-highest text-on-surface rounded-lg font-body-md border border-outline-variant hover:bg-surface-bright transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
              Filter
            </button>
          </div>
          <div className="flex items-center gap-xs text-on-surface-variant text-body-sm mr-sm">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span>{projectFlows.filter((f) => f.status === "ACTIVE").length} Flows Active</span>
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
            className="border-2 border-dashed border-outline-variant rounded-xl p-md flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 hover:border-primary hover:bg-surface-container-low transition-all cursor-pointer group"
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
        <div className="flex items-center gap-lg">
          <span className="font-code-md text-code-md text-tertiary">FlowState Engine</span>
          <span className="text-outline">© 2024 FlowState Engine. All logs encrypted.</span>
        </div>
        <div className="flex items-center gap-md">
          <div className="flex items-center gap-xs">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-secondary opacity-90">v1.24.4-STABLE</span>
          </div>
        </div>
      </footer>

      {/* Create / Edit Modal */}
      <FlowModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingFlow(null); }}
        onSave={handleSaveModal}
        initialData={
          editingFlow
            ? { flowName: editingFlow.flowName, status: editingFlow.status, globalURL: editingFlow.globalURL }
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
