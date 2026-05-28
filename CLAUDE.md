# CLAUDE.md - Project Guide for Flowz Frontend

## Build and Development Commands
- Start development server: `npm run dev`
- Build production application: `npm run build`
- Start production server: `npm start`
- Run linter: `npm run lint`
- Install dependencies: `npm install`

## Technology Stack
- **Framework**: Next.js 14+ (App Router Architecture)
- **Language**: TypeScript (Strict mode preferred)
- **Styling**: Tailwind CSS
- **State/Realtime**: WebSockets via STOMP protocol and SockJS
-  **State Management**: Use Redux and Redux Toolskit

## Core Architecture & Code Style Guidelines

### 1. Component Rules
- **Server Components (Default)**: Use for static layouts, pages, and data fetching that doesn't require user interaction.
- **Client Components (`"use client"`)**: **CRITICAL** for any component or page that uses WebSockets, Custom Hooks (`useEffect`, `useState`), or browser-specific APIs. 
- **Always try to reuse components and create them to be reusable, clean and simple as possible

### 2. WebSocket & Realtime Communication
- All WebSocket connection logic must be isolated inside custom hooks (e.g., `src/hooks/useFlowSocket.ts`).
- **Connection Endpoint**: Connects to the Spring Boot backend at `/ws-flow` using SockJS.
- **Subscription Topic**: Subscribes dynamically to `/topic/flow-events/{executionID}`.
- Always implement proper cleanup (disconnecting the STOMP client) in the `useEffect` unmount phase to prevent memory leaks.

### 3. TypeScript & Data Types
- Avoid using `any`. Always define explicit interfaces or types for API payloads and WebSocket messages.
- Match the backend message contract for test execution:
  - Expected WebSocket payloads contain: `status` (e.g., `FLOW_STARTING`, `STEP_PASSED`, `STEP_FAILED`, `FLOW_COMPLETED`), `success` (boolean), and `message` (string).

### 4. Code Formatting
- Use descriptive naming for hooks and components (e.g., `LogConsole`, `ExecutionStatus`).
- Keep components small, modular, and focused on a single responsibility.

## 🎨 FlowState Design System (Strict Adherence Required)

### 1. Color Palette Tokens
Always use these exact Tailwind color utilities to maintain the "controlled power" high-density developer environment:
- **Backgrounds**: Base canvas is `bg-background` (`#0b1326`). Side panels use `bg-surface-container` (`#171f33`) or `bg-surface-container-low` (`#131b2e`). Active nodes use `bg-surface-container-high` (`#222a3d`).
- **Typography & Details**: Primary text uses `text-on-background` (`#dae2fd`). Secondary descriptive items use `text-on-surface-variant` (`#c2c6d6`). Borders use `border-outline-variant` (`#424754`).
- **Accents & Brand**:
  - **Primary (Electric Blue)**: `text-primary` / `bg-primary-container` (`#4d8eff`).
  - **Success (Emerald Green)**: `text-secondary` / `bg-secondary-container` (`#00a572`).
  - **Error (Coral Red)**: `text-tertiary-container` / `bg-error-container` (`#93000a`).

### 2. Typography Strategy
- **UI Labels, Nav, Headers**: Use **Inter** (`font-body-md`, `font-headline-md`, `font-headline-lg`).
- **Code & Live Streams**: Code inputs, JSON textareas, variable mappings, and the Execution Terminal logs MUST use **JetBrains Mono** (`font-code-sm` / `font-code-md`).
- **HTTP Methods / Metadata Pills**: Use `font-label-caps tracking-widest text-[10px] uppercase font-bold`.

### 3. Layout Hierarchy (Fixed-Fluid-Fixed)
- **Left Sidebar**: `w-sidebar-width` (`280px`) shrink-0 - Node Library and Explorer.
- **Center Canvas**: Infinite scrolling backdrop with a radial dot grid (`canvas-grid`).
- **Right Inspector**: `w-inspector-width` (`320px`) shrink-0 - Configuration input panel.
- **Bottom Footer**: `h-[180px]` - Terminal and WebSocket real-time system connection logs.

## 🔌 WebSocket & Data Stream Integrations
- Connects to Spring Boot backend via SockJS/STOMP at `/ws-flow`.
- Streams events dynamically to `/topic/flow-events/{executionID}`.
- Map incoming messages to the execution log screen:
  - `FLOW_STARTING` $\rightarrow$ Render amber spinner / text indicator.
  - `STEP_PASSED` $\rightarrow$ Render success emerald layout (`text-secondary-fixed` / `check_circle` icon).
  - `STEP_FAILED` / `FLOW_FAILED` $\rightarrow$ Highlight component/connection path with error coral.
  - Always clean up subscriptions/disconnect STOMP clients inside `useEffect` unmount phases to safeguard against memory leaks.

