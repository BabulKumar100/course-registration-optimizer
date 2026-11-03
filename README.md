# Course Registration Optimizer

A web-based tool that helps students build a conflict-free semester timetable. It models course registration as a constrained selection problem and solves it with two classic approaches — a **greedy allocator** and an **exact backtracking search with branch-and-bound pruning** — then visualizes the reasoning behind every decision.

Built with **React 19 + Vite**. The algorithm layer is framework-agnostic plain ES modules, so it can be reused, benchmarked, or unit-tested outside the UI.

---

## Table of contents

- [Highlights](#highlights)
- [How it works](#how-it-works)
- [Features](#features)
- [Data model](#data-model)
- [Scenarios](#scenarios)
- [Default example](#default-example)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Design system](#design-system)
- [Accessibility](#accessibility)
- [Deployment](#deployment)
- [Tech stack](#tech-stack)

---

## Highlights

- **Two solvers, one screen.** Compare a fast heuristic against the provably optimal plan side by side.
- **Explainable results.** Every course carries a human-readable reason for being accepted, waitlisted, or rejected.
- **Visual reasoning.** An interactive conflict graph and a step-by-step backtracking replay show *why* a plan looks the way it does.
- **Reproducible simulation.** A seeded pseudo-random generator makes batch results and benchmarks identical on every run.
- **No black boxes.** The whole algorithm layer is small, readable, dependency-free code.

---

## How it works

### Greedy allocation

Requests are sorted by priority (descending, with a stable tie-break on input order) and the first feasible course is accepted. For each course the checks run in this order:

1. **Prerequisite** — every course in `pre` must already be in the completed set.
2. **Credit limit** — accepting the course must not push the total above `maxCr`.
3. **Timetable clash** — the course must not overlap any already-accepted course, nor an existing fixed commitment.
4. **Capacity** — if the section is full, the request is waitlisted (when waitlisting is enabled) or rejected.

Greedy is `O(n log n)` and very fast, but taking the highest-priority course first can block a combination that scores better overall.

### Backtracking with branch & bound

The exact solver enumerates the feasible search space but prunes aggressively, so it stays practical for the handful of courses a student realistically picks from.

- **Candidates** are pre-filtered: courses with unmet prerequisites, a clash against a fixed commitment, or no free seats are removed up front.
- **Search order** is by objective value, descending, which makes good solutions appear early and strengthens pruning.
- **Prune-min** — if even taking every remaining course cannot reach the minimum credit requirement, the branch is abandoned.
- **Prune-bound** — if the best value reachable from this point cannot beat the current best, the branch is abandoned.
- **Objective** — maximize total priority (`score`) or total credits (`credits`).
- **Fallback** — if no combination satisfies the minimum credits, the search re-runs without that constraint and flags `minMet = false`, so the UI can warn instead of showing nothing.

The search also emits a **trace** of include / exclude / backtrack / prune events, which powers the replay view.

### Conflict detection

Two meetings clash only when they fall on the same day and their half-open intervals overlap:

```text
a.day === b.day && a.start < b.end && b.start < a.end
```

This is the textbook interval-overlap rule: back-to-back classes (one ending exactly when the next begins) do **not** clash. The same rule drives the greedy checks, the backtracking candidate filter, the conflict graph, and the combination explorer, so all four views always agree.

---

## Features

### 1. Planner

The main workspace for building a plan.

- **Course requests** — toggle which offerings you want, adjust seats and priority, and edit the meeting times.
- **Rules panel** — set the minimum and maximum credits, choose the backtracking objective, prefer morning slots or keep a day free, mark completed courses, and enable or disable waitlisting.
- **Timetable grid** — a Monday-to-Friday weekly view with existing commitments overlaid as fixed blocks.
- **Greedy / Backtracking view switch** — flip between the heuristic plan and the optimal plan without changing any inputs.
- **Summary card** — live KPIs for credits, priority score, and search statistics (operations, nodes explored, combinations considered).
- **Decision log** — one row per course with its outcome and the exact reason.
- **Pipeline card** — a direct Greedy-versus-Backtracking comparison so the quality gap is obvious.
- **Combination explorer** — the top ranked valid combinations under the current rules, each clickable to preview.
- **Backtracking replay** — scrub through the search trace and watch branches being taken, explored, and pruned.
- **Export** — download the current plan as CSV, or open a print-ready PDF report in a new window.
- **Reset confirmation** — a modal guards the reset button so a scenario is never cleared by accident.

### 2. Conflict graph

An interactive graph where each node is an offering and each edge means two courses overlap in time. Nodes are laid out on a circle, can be dragged, and hovering an edge reveals the specific overlapping slot.

### 3. Batch simulation

Simulate hundreds of students against the same course pool and measure how fair the allocation is.

- Configure the number of students, courses per student, seat capacity, and the random seed.
- Compare a **priority policy** (highest priority wins) against **round-robin** (everyone gets a turn).
- Read outcomes at a glance: accepted, waitlisted, and rejections split by cause (prerequisite, credits, conflict).
- Inspect a credit histogram and per-course seat fill.
- Fairness metrics highlight how many students got zero credits, the average of the lowest quartile, and the total priority served.

### 4. Analysis

Empirical evidence for the algorithmic claims.

- Nodes explored by backtracking plotted against the brute-force `2^n` curve.
- Greedy-versus-optimal solution quality (mean and worst case).
- Measured runtime for both solvers across increasing course counts.
- A complexity summary table and annotated pseudocode for both algorithms.

---

## Data model

A scenario is a plain object with the following shape:

| Field | Meaning |
| --- | --- |
| `courses[]` | The offerings a student can request. |
| `done[]` | Course codes already completed (used to unlock prerequisites). |
| `minCr` / `maxCr` | Minimum and maximum credits allowed in the plan. |
| `startCredits` | Credits already earned this term before the plan. |
| `waitlist` | Whether full sections go to a waitlist instead of being rejected. |
| `existing[]` | Fixed commitments (existing classes) that must not be overlapped. |

Each course entry contains:

| Field | Meaning |
| --- | --- |
| `code`, `name` | Identifier and display name. |
| `cr` | Credit value. |
| `pre[]` | Prerequisite course codes. |
| `seats`, `cap` | Currently free seats and total capacity. |
| `prio` | Priority weight (higher means the student wants it more). |
| `want` | Whether the student is requesting this course. |
| `meetings[]` | Weekly slots as `{ d, s, e }` — day index and start/end hour. |

---

## Scenarios

Three ready-made scenarios ship with the app:

- **Autumn semester, 8 offerings** — the default, designed so greedy and optimal visibly disagree.
- **Presentation example, conflict detection** — a compact set with an obvious clash for demos.
- **Report dry run, 3 requests** — a small edge-case set including a pre-existing class, a full section, and a non-zero starting credit count.

---

## Default example

The app opens on a sample semester with eight offerings, three completed prerequisites (`CS101`, `MA101`, `MA201`), a 12–16 credit range, and waitlisting enabled.

Note that `CS201` is *not* yet completed, so `CS401` (which requires it) is locked, and `CS405` has zero free seats.

### Greedy result

Requests are processed in priority order: `CS201` (90) → `CS401` (88) → `CS301` (85) → `CS303` (80) → `CS403` (75) → `CS305` (70) → `CS405` (65) → `MA301` (60).

| Course | Outcome | Reason |
| --- | --- | --- |
| CS201 | Accepted | All constraints satisfied |
| CS401 | Rejected | Prerequisite not met — needs CS201 |
| CS301 | Rejected | Timetable conflict with CS201 (Mon 09:00–10:00) |
| CS303 | Accepted | All constraints satisfied |
| CS403 | Rejected | Timetable conflict with CS303 (Tue 13:00–14:00) |
| CS305 | Rejected | Timetable conflict with CS201 (Wed 09:00–10:00) |
| CS405 | Waitlisted | Section full |
| MA301 | Accepted | All constraints satisfied |

**Result: CS201 + CS303 + MA301 → 10 credits, 230 priority points.** Greedy grabbed the single highest-priority course first, which blocked the two courses that would have scored better.

### Backtracking result

The optimal plan is **CS301 + CS303 + CS305 + MA301 → 12 credits, 295 priority points** — which also meets the 12-credit minimum. It deliberately drops CS201, because that one choice costs more than it gains.

### Why the conflict graph matters

The conflict graph makes the difference obvious. In the default scenario it contains exactly three edges:

```text
CS201 ── CS301   (Mon 09:00–10:00)
CS201 ── CS305   (Wed 09:00–10:00)
CS303 ── CS403   (Tue 13:00–14:00)
```

CS201 sits in the middle of the first two edges, which is precisely why taking it first forces greedy into a suboptimal plan.

---

## Project structure

```text
course-registration-optimizer/
├── client/                       # React + Vite application
│   ├── src/
│   │   ├── lib/                  # Pure logic — no React, no DOM
│   │   │   ├── engine.js         # Greedy, backtracking, conflict graph, PRNG, combos
│   │   │   ├── batch.js          # Multi-student simulation and fairness metrics
│   │   │   ├── analysis.js       # Complexity benchmark runner
│   │   │   ├── scenarios.js      # Sample datasets
│   │   │   ├── exporters.js      # CSV and print-ready PDF report
│   │   │   └── utils.js          # Small shared helpers
│   │   ├── hooks/
│   │   │   ├── useOptimizer.js   # Central state and memoized results
│   │   │   └── useTheme.js       # Light / dark theme
│   │   ├── components/           # Header, Tabs, Modal, TooltipLayer, CountUp, Hint, charts
│   │   ├── tabs/                 # PlannerTab, GraphTab, BatchTab, AnalysisTab
│   │   │   └── planner/          # Timetable, SummaryCard, RulesPanel, CombosCard, ...
│   │   └── styles/               # tokens.css, base.css, views.css, charts.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── index.html                    # Legacy vanilla version (kept as fallback)
├── css/ · js/                    # Legacy vanilla assets
└── assets/                       # Shared favicon
```

### Architecture notes

- **`lib/` is the single source of truth.** It contains no React imports — only pure functions. The same code could run in Node for tests or scripts.
- **`useOptimizer` is the only stateful hub.** It holds the scenario, view, objective, and preferences, then derives every result with `useMemo`. Change any input and all four tabs recompute consistently.
- **Tabs are presentation only.** They receive computed results and callbacks as props and never re-implement algorithm logic.

---

## Getting started

### Prerequisites

- Node.js 18 or newer
- npm (or pnpm / yarn)

### Installation

```bash
git clone https://github.com/BabulKumar100/course-registration-optimizer.git
cd course-registration-optimizer/client
npm install
```

### Run the dev server

```bash
npm run dev
```

The app is served at `http://localhost:5173` with hot module replacement.

### Build for production

```bash
npm run build
```

The static output is written to `client/dist`.

### Preview the production build

```bash
npm run preview
```

Served at `http://localhost:4173`.

---

## Available scripts

Run these from inside `client/`:

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR on port 5173. |
| `npm run build` | Produce an optimised static build in `client/dist`. |
| `npm run preview` | Serve the built output locally on port 4173. |

The repository root also has a `start` script that serves the legacy vanilla version with `npx serve .`.

---

## Design system

The UI follows a modern dashboard aesthetic driven by CSS custom properties in `tokens.css`.

- **Theming** — light and dark themes are switched by a single `data-theme` attribute; every colour is a token, so nothing is hard-coded in components.
- **Typography** — Bricolage Grotesque for headings, Inter for body text, and JetBrains Mono for numbers and code.
- **Colour** — a calm slate background with a blue primary, teal success, amber warning, and red error accents. Course chips cycle through a fixed eight-colour palette.
- **Motion** — KPI figures animate with a `requestAnimationFrame` count-up that automatically disables itself when the user prefers reduced motion.

---

## Accessibility

- All tooltips are reachable by keyboard, not just hover (`focusin` / `focusout`).
- Dialogs close on Escape and on backdrop click, and are marked up as proper dialogs.
- Decorative animation respects `prefers-reduced-motion`.
- Interactive controls are real buttons and inputs with visible focus states.

---

## Deployment

The production build is a fully static bundle, so it can be hosted anywhere that serves files — GitHub Pages, Netlify, Vercel, or Railway. Point the host at the `client` directory with:

- **Build command:** `npm run build`
- **Output directory:** `dist`

---

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 19 |
| Build tool | Vite 8 |
| Algorithms | Plain ES modules (no dependencies) |
| Styling | CSS custom properties, no UI framework |
| Charts and graph | Hand-drawn SVG |

The project intentionally ships with **zero runtime dependencies beyond React** — every chart, graph, and animation is written from scratch.
