# Claude Code Skills - Flowz Frontend

## Create a Client Component
Use this skill when the user wants to create a new UI component that requires state, hooks, or user interaction.

**Instructions:**
1. Ask the user for the component name and where it should live (default to `src/components/`).
2. Create the file with a `.tsx` extension.
3. **CRITICAL**: Always add the `"use client";` directive at the very top of the file.
4. Use Tailwind CSS for modern, clean, and responsive styling.
5. Add proper TypeScript interfaces for the component props (avoid `any`).
6. Export the component cleanly.

## Create a Custom Hook
Use this skill when the user wants to extract stateful logic or side effects (like WebSockets or API calls).

## Create new type
Use this skill when the user wants to create a new type or when you creating a new component
 
**Instructions:**
1. go to this path: C:\Users\User\Niv Course\Spring projects\flowz-api-builder\flowz-api-builder\src\main\java\com\flowzapi\flowz_api_builder\model
2. if you need to create new type search for it in this path before executing

## Create new HTTP request to the server
Use this skill when the user wants to create an HTTP request to the backend server

**Instructions:**
1. Go to this path: C:\Users\User\Niv Course\Spring projects\flowz-api-builder\flowz-api-builder\src\main\java\com\flowzapi\flowz_api_builder\controller
2. Look for the correct controller (for example the user asks you to create an http request to get all the flows of project you should go to the FlowController.java)
3. Look for the correct endpoint
4. Look for the request DTO

**Instructions:**
1. Create the file inside `src/hooks/` with a name starting with `use` (e.g., `useFlowSocket.ts`).
2. Use strict TypeScript types for all arguments, state variables, and return values.
3. If handling side effects, ensure a proper cleanup function is returned inside `useEffect` (especially for WebSockets/STOMP to prevent memory leaks).
4. Do NOT include UI or Tailwind classes in hooks; keep them purely logical.

## Reset and Restart Environment
Use this skill when the Next.js local server or cache becomes corrupted, or when changes aren't reflecting in the browser.

**Instructions:**
1. Stop any currently running dev processes.
2. Run `rm -rf .next` (or the Windows equivalent `Remove-Item -Recurse -Force .next` if using PowerShell) to clear the Next.js build cache.
3. Run `npm install` if `package.json` was recently modified.
4. Run `npm run dev` to start a completely fresh local development server.