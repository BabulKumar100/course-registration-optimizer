# Course Registration Optimizer

Frontend-only project (HTML, CSS, vanilla JavaScript). Koi build step ya backend nahi chahiye.

## Chalane ka tarika
- `index.html` ko seedha browser mein double-click karke kholein, ya
- folder mein `npx serve .` chalayein (ya VS Code ka Live Server use karein).

## Folder structure
```
course-registration-optimizer/
├── index.html          # page markup + saari css/js files ka link
├── css/
│   ├── variables.css   # colors, fonts, light/dark theme tokens
│   ├── base.css        # reset, background, glass card
│   ├── navigation.css  # header, tabs, segmented control
│   ├── layout.css      # grids aur columns
│   ├── forms.css       # inputs, buttons, switches
│   ├── courses.css     # course rows aur chips
│   ├── results.css     # summary, timetable, combos, pipeline
│   ├── charts.css      # chart styles
│   └── graph.css       # conflict graph view
├── js/                 # index.html mein isi order mein load hoti hain
│   ├── engine.js       # greedy, backtracking, conflict graph (pure logic)
│   ├── utils.js        # $, $$, esc, helpers
│   ├── scenarios.js    # sample scenarios
│   ├── state.js        # app state
│   ├── tooltip.js, charts.js, theme.js
│   ├── planner.js      # rows, summary, timetable, decisions
│   ├── graph.js        # conflict graph rendering
│   ├── batch.js        # many-students simulation
│   ├── analysis.js     # complexity benchmark
│   ├── events.js, replay.js, course-form.js, copy-plan.js, extras.js
│   └── main.js         # app start
└── assets/favicon.svg
```

Note: JS files normal `<script>` tags se load hoti hain (ES modules nahi), isliye file:// se bhi chalta hai. Order change mat karein.
