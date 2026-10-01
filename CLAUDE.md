# SyncBoard Web — Claude Code Instructions

## 1. Project Overview

SyncBoard Web is the frontend application for SyncBoard, a real-time collaborative board application.

This repository is completely independent from `syncboard-api`.

The web and API repositories must remain separate repositories.

Do NOT:

- create a monorepo
- create workspace configuration
- create shared packages between the repositories
- move files between repositories
- create a local package shared with the API repository

The frontend should remain clean, modular, strongly typed, accessible, and easy to extend incrementally.

---

# 2. Tech Stack

Use the following stack:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Axios
- Socket.IO Client
- Zustand
- ESLint
- Prettier

Do not replace the selected stack unless explicitly requested.

---

# 3. Required Folder Structure

Use this structure as the architectural baseline:

```text
src/
├── pages/
│
├── components/
│   ├── board/
│   ├── canvas/
│   ├── presence/
│   └── ui/
│
├── stores/
│
├── hooks/
│
├── canvas/
│
├── lib/
│
└── types/
```

Keep the structure clean and domain-oriented.

---

# 4. Folder Structure Rules

## `pages/`

Contains page-level components and route-level composition.

Pages should compose smaller components.

Do not put large amounts of business logic inside page components.

---

## `components/board/`

Contains board-specific UI.

Examples of future responsibilities:

- board layout
- board toolbar
- board controls
- board-related UI

Do not put actual canvas rendering logic here.

---

## `components/canvas/`

Contains React UI components surrounding or controlling the canvas.

Canvas implementation itself belongs in:

```text
src/canvas/
```

Do not put rendering engine logic directly into ordinary UI components.

---

## `components/presence/`

Contains UI related to collaborative presence.

Examples:

- collaborator indicators
- participant list
- cursor UI

Do not implement real-time synchronization inside these components.

---

## `components/ui/`

Contains reusable UI primitives and shadcn/ui components.

Keep these components generic.

Do not put SyncBoard-specific business logic inside `components/ui/`.

Prefer existing shadcn/ui primitives before creating custom generic UI components.

---

## `stores/`

Contains Zustand application state.

Planned stores:

```text
stores/
├── boardStore
├── presenceStore
├── sessionStore
└── toolStore
```

Each store should have one clear responsibility.

### `boardStore`

Owns client-side board state.

### `presenceStore`

Owns client-side presence state.

### `sessionStore`

Owns client-side identity/session state.

### `toolStore`

Owns active canvas/tool state.

Do NOT create one giant global store.

Do not put unrelated state into an existing store just because it is convenient.

---

## `hooks/`

Contains reusable React hooks.

Create a hook when it represents reusable behavior or a meaningful abstraction.

Do not create hooks simply to move code into another file.

---

## `canvas/`

Reserved for canvas-specific implementation.

Future responsibilities may include:

- canvas rendering
- pointer interaction
- object selection
- object manipulation
- viewport handling

Do not implement canvas behavior until explicitly requested.

Keep canvas implementation isolated from ordinary React UI.

---

## `lib/`

Contains shared frontend infrastructure and utilities.

Planned areas include:

```text
lib/
├── axios client
├── Socket.IO client
├── identity/session utilities
└── throttle utility
```

Keep infrastructure centralized.

Do not create HTTP clients or Socket.IO connections directly inside React components.

---

## `types/`

Contains shared frontend TypeScript contracts.

Types may include:

- board types
- board object types
- presence types
- session/identity types
- tool types
- API response types
- WebSocket payload types

Avoid duplicating the same type in multiple files.

---

# 5. Avoid Folder Sprawl

Do NOT create random top-level folders such as:

```text
src/utils/
src/helpers/
src/services/
src/shared/
src/constants/
src/api/
src/socket/
src/state/
```

unless there is a clear architectural reason.

Prefer the existing structure.

For example:

- HTTP client → `src/lib/`
- Socket.IO client → `src/lib/`
- shared types → `src/types/`
- Zustand state → `src/stores/`
- reusable React hooks → `src/hooks/`
- board UI → `src/components/board/`
- canvas UI → `src/components/canvas/`
- presence UI → `src/components/presence/`

---

# 6. Before Creating a New File

Before creating a file, ask:

1. Which responsibility does this code have?
2. Which directory owns that responsibility?
3. Can an existing file or component handle it?
4. Is a new abstraction actually necessary?
5. Will this make the project easier to understand?

Prefer the smallest clean solution.

Do not create files just to make the structure look more complex.

---

# 7. React Rules

Use functional React components.

Prefer:

- small focused components
- composition
- explicit props
- reusable components
- semantic HTML

Avoid:

- giant components
- deeply nested conditional rendering
- unnecessary abstraction
- unnecessary `useEffect`
- duplicated UI logic

Keep components focused on presentation and interaction.

Move application state into Zustand when it genuinely needs global/shared state.

Do not use global state when local component state is sufficient.

---

# 8. TypeScript Rules

Use strict TypeScript.

Rules:

- Avoid `any`.
- Prefer explicit interfaces/types.
- Avoid unnecessary type assertions.
- Do not weaken TypeScript configuration.
- Keep API/WebSocket contracts strongly typed.
- Avoid duplicated type definitions.
- Use meaningful names.
- Prefer readable types over clever generic abstractions.

If a type is shared across multiple frontend modules, consider placing it in `src/types/`.

---

# 9. Zustand Rules

Use Zustand for application-level client state.

Keep stores focused:

```text
boardStore
→ board state

presenceStore
→ presence state

sessionStore
→ session/identity state

toolStore
→ active tool state
```

Do not create a single global store containing everything.

Do not put unrelated UI state into Zustand.

Do not put API calls into stores unless explicitly required by the architecture.

Avoid unnecessary side effects inside stores.

---

# 10. Axios Rules

Use Axios for HTTP communication.

The Axios client must be centralized in:

```text
src/lib/
```

Do not create Axios instances inside components.

Do not duplicate base URL or HTTP configuration across the application.

Do not implement API business behavior unless explicitly requested.

---

# 11. Socket.IO Client Rules

Use Socket.IO Client for future real-time communication.

Keep Socket.IO client setup centralized in:

```text
src/lib/
```

Do not create independent Socket.IO connections inside multiple components.

Do not implement:

- real-time synchronization
- presence synchronization
- cursor synchronization
- reconnection behavior

unless explicitly requested.

---

# 12. Identity / Session

Identity/session utilities belong in:

```text
src/lib/
```

Session state belongs in:

```text
src/stores/sessionStore
```

Do not implement authentication.

Do not introduce:

- JWT
- OAuth
- login systems
- authentication providers

unless explicitly requested.

---

# 13. Canvas Rules

Canvas code must remain isolated.

Use:

```text
src/canvas/
```

for canvas implementation.

Use:

```text
src/components/canvas/
```

for React UI surrounding the canvas.

Do not mix canvas engine/rendering code into unrelated React components.

Do not implement the following unless explicitly requested:

- drawing
- object creation
- object movement
- object deletion
- object selection
- canvas synchronization
- cursor synchronization
- collaborative editing
- viewport synchronization

---

# 14. Styling

Use:

- Tailwind CSS
- shadcn/ui

Do not introduce another styling system unless explicitly requested.

Prefer shadcn/ui components where appropriate.

Avoid unnecessary custom CSS.

Do not create large global CSS files for component-specific styling.

Keep styling readable and maintainable.

---

# 15. Accessibility

Accessibility is required by default.

Use semantic HTML.

Interactive elements must be keyboard accessible.

Buttons and controls must have accessible names.

Form inputs must have appropriate labels.

Do not remove focus indicators without providing an accessible alternative.

Do not use clickable `<div>` elements when a semantic button or link is appropriate.

---

# 16. Component Rules

Before creating a new component:

1. Check whether an existing component can be reused.
2. Check `components/ui/` for an appropriate shadcn/ui primitive.
3. Check whether the component belongs to `board`, `canvas`, or `presence`.
4. Keep generic components generic.
5. Avoid duplicate components.

Do not create overly generic components that have only one use case.

---

# 17. Dependency Rules

Before adding a dependency:

1. Check whether the current stack already provides the functionality.
2. Confirm the dependency is necessary.
3. Prefer established and lightweight packages.
4. Avoid dependencies that introduce unnecessary complexity.

Do not install additional state-management, styling, networking, or UI libraries without explicit instruction.

Do not replace existing dependencies without a clear reason.

---

# 18. Business Logic Scope

Do not implement future functionality proactively.

The following are explicitly out of scope until requested:

- authentication
- database logic
- board CRUD
- board persistence
- canvas drawing
- canvas object behavior
- object add/update/delete
- real-time synchronization
- presence synchronization
- cursor synchronization
- optimistic updates
- reconnection logic

Creating types, interfaces, store structure, or infrastructure placeholders for future functionality is acceptable.

Do not implement the actual behavior before it is requested.

---

# 19. API / Web Separation

The frontend and backend are separate repositories.

The frontend may communicate with the API through HTTP and Socket.IO when those features are implemented.

Do not:

- import backend files
- copy backend source code into the frontend
- create a shared local package
- create workspace configuration
- couple build systems

Use explicit TypeScript contracts on the frontend.

---

# 20. Incremental Development

SyncBoard will be implemented step by step.

Follow:

```text
Architecture
    ↓
Types / Contracts
    ↓
Infrastructure
    ↓
Small Feature
    ↓
Tests
    ↓
Verification
    ↓
Next Feature
```

When the user asks for one feature, implement that feature only.

Do not proactively implement the next feature.

Do not combine unrelated features into one task.

---

# 21. Change Discipline

Before modifying code:

1. Inspect the existing project.
2. Read relevant files.
3. Understand the current architecture.
4. Identify the smallest appropriate change.
5. Follow existing conventions.
6. Avoid unrelated refactoring.

Do not rewrite working code simply because you prefer another style.

Do not modify unrelated files.

---

# 22. Git Safety

Before significant changes, check:

```bash
git status
```

Do not:

- force push
- reset user changes
- rewrite git history
- delete unrelated files
- overwrite user work

Preserve existing work.

---

# 23. Verification

After implementation, run the relevant checks.

Expected commands:

```bash
npm run lint
npm run build
```

Run tests when tests exist or when the task requires them.

If a command does not exist in `package.json`, inspect the available scripts first.

Do not invent unnecessary scripts.

Report failures honestly.

---

# 24. Reporting

After completing a task, report:

1. What was changed.
2. Important files created or modified.
3. Dependencies added, if any.
4. Verification commands run.
5. Results.
6. Warnings or unresolved issues.

Do not claim a command passed if it was not actually run.

---

# 25. Important Rule

## Implement Only What the User Requests

Do not jump ahead.

Do not implement future features proactively.

Do not add infrastructure just because it may be useful later.

Do not make major architectural decisions silently.

If a requirement is ambiguous and could materially affect the architecture, ask before implementing.

The goal is:

> Clean foundation first. Features incrementally. No premature complexity.
