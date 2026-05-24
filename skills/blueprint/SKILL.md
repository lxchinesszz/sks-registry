---
name: blueprint
description: Generate Engineering Blueprint-style technical architecture diagrams and flowcharts as self-contained HTML files with inline SVG. Use when the user asks to draw system architecture diagrams, data flows, deployment pipelines, CI/CD flows, microservice topologies, or any technical system flow that benefits from a dark-mode, grid-paper, Excalidraw-inspired visual style. Triggers on phrases like "画架构图", "画流程图", "系统图", "blueprint", "architecture diagram", "flowchart", "数据流图", or any request to visualize a technical system/structure.
---

# Blueprint — Engineering Architecture Diagram Skill

Generate single-file HTML documents that render **Engineering Blueprint**-style technical diagrams using inline SVG. The output is a self-contained HTML file that opens directly in any browser.

## Workflow

When the user requests a diagram:

1. **Gather information** — If the description is incomplete, ask:
   - What nodes/steps are involved?
   - How does data/requests flow?
   - Which nodes belong to the same domain (local/cloud/external service)?

2. **Plan layout** — Choose orientation:
   - Horizontal flow: left-to-right, max 5–6 main nodes (`viewBox="0 0 960 460"`)
   - Vertical flow: top-to-bottom, better for branching (`viewBox="0 0 600 800"`)
   - Wide flow: extra-wide systems (`viewBox="0 0 1200 500"`)
   - Mixed: main chain horizontal, branches vertical

3. **Assign colors** per the color strategy below

4. **Generate HTML** — Complete single file, browser-ready

5. **Save and inform** — Save as `xxx-flow.html` or `xxx-arch.html`, tell user to open with `open xxx.html`

---

## Design Tokens

Use these exact CSS custom properties. All colors come from Tailwind's semantic palette.

```css
/* Background */
--bg:         #020617;   /* slate-950 */
--bg-card:    rgba(15, 23, 42, 0.5);   /* slate-900/50 */
--grid-line:  #1e293b;   /* slate-800 */
--border:     #1e293b;   /* slate-800 */

/* Text */
--text-white: #ffffff;
--text-muted: #94a3b8;   /* slate-400 */
--text-dim:   #475569;   /* slate-600 */

/* Domain colors (5 sets, assigned by semantics) */
--cyan:    #22d3ee;  /* cyan-400    → user-side / entry / local */
--emerald: #34d399;  /* emerald-400 → processing / agent / transform */
--violet:  #a78bfa;  /* violet-400  → storage / queue / database */
--amber:   #fbbf24;  /* amber-400   → cloud / deployment / output */
--rose:    #fb7185;  /* rose-400    → trigger / warning / exception */

/* Node fill colors (semi-transparent) */
--cyan-fill:    rgba(8, 51, 68, 0.4);
--emerald-fill: rgba(6, 78, 59, 0.4);
--violet-fill:  rgba(76, 29, 149, 0.4);
--amber-fill:   rgba(120, 53, 15, 0.3);
--rose-fill:    rgba(136, 19, 55, 0.3);

/* Region fill colors (lighter than node fill) */
--cyan-region:    rgba(8, 51, 68, 0.06);
--emerald-region: rgba(6, 78, 59, 0.05);
--violet-region:  rgba(76, 29, 149, 0.05);
--amber-region:   rgba(120, 53, 15, 0.05);
```

---

## Font System

Import and use **JetBrains Mono only** — this is what distinguishes Blueprint from other diagram styles.

```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

```css
body { font-family: 'JetBrains Mono', monospace; }
```

**Rule:** Every piece of text in the entire page uses JetBrains Mono. No sans-serif, no serif. This includes SVG text, card text, headers, legends, everything.

---

## Core Diagram Rules

These rules are mandatory for every generated diagram:

1. **Grid paper background** — SVG `<pattern>` as the first element; never omit this
2. **Dashed region boxes** — Group related nodes inside dotted boundary boxes (`stroke-dasharray="8,4"`)
3. **Color consistency** — Each region has one theme color; all nodes within inherit it
4. **Node = dual-layer** — Bottom layer: `#0f172a` solid fill; top layer: semi-transparent colored fill
5. **Arrow colors** — Match the target node's domain color
6. **Dashed arrows** = trigger/async/indirect; **solid arrows** = sync/direct data flow
7. **Node text layering** — White bold title + slate-400 description + domain-color tiny annotation
8. **Explanation cards** — Below the SVG, add cards supplementing details that don't fit in nodes
9. **Header** — Pulse dot + title + subtitle explaining what the diagram depicts
10. **Legend** — Bottom-right or bottom of SVG, showing domain colors and line types

---

## Content Writing Rules

- Node titles: noun phrases stating what the node *is*
- Description lines: technical facts (commands, protocols, formats), no adjectives
- Annotation lines (domain-color tiny text): what it *does* or what it *outputs*
- Card content: details that don't fit in nodes, keep monospace style
- **Forbidden:** words like "高效/强大/智能/自动化" unless part of a system name
- **Forbidden:** non-monospace fonts anywhere in SVG
- **Forbidden:** omitting the grid paper background
- **Forbidden:** node color inconsistent with its region color

---

## Color Assignment Strategy

Assign domain colors to system components by semantic role:

| Color | Hex | Semantic Role |
|-------|-----|---------------|
| cyan | `#22d3ee` | User-side / Entry point / Local environment / Writer |
| emerald | `#34d399` | Processing layer / Agent / Transformer / Business logic |
| violet | `#a78bfa` | Storage / Queue / Database / Message broker |
| amber | `#fbbf24` | Cloud / Deployment / Output / CI/CD |
| rose | `#fb7185` | Trigger signal / Exception / Alert / External dependency |

Use gray (`#94a3b8`) for auxiliary roles, user icons, and non-main-flow nodes.

If the system has more than 5 domains, reuse colors but keep colors consistent within each region.

---

## SVG Coordinate Reference

```
Standard viewBox:  "0 0 960 460"  (horizontal flow)
                    "0 0 600 800"  (vertical flow)
                    "0 0 1200 500" (extra-wide flow)

Node sizes:  width="180" height="80"  (main node)
             width="120" height="50"  (auxiliary node)
             width="560" height="70"  (summary node, spans regions)

Node spacing:  ≥ 16px horizontal within same region
               ≥ 20px horizontal across regions (room for arrows)

Text y-offsets:  title = rect.y + 28
                 description = title.y + 18 (each line +18)
                 annotation = last description.y + 14

text-anchor:  "middle" for centered text, x = rect.x + rect.width/2
```

---

## SVG Component Templates

### Required Defs (include in every diagram)

```svg
<defs>
  <!-- Grid pattern — style DNA, never omit -->
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.5"/>
  </pattern>

  <!-- Arrow markers for each color -->
  <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="#64748b"/>
  </marker>
  <marker id="arrow-cyan" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="#22d3ee"/>
  </marker>
  <marker id="arrow-emerald" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="#34d399"/>
  </marker>
  <marker id="arrow-violet" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="#a78bfa"/>
  </marker>
  <marker id="arrow-amber" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24"/>
  </marker>
  <marker id="arrow-rose" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="#fb7185"/>
  </marker>
</defs>

<!-- Grid background — always the first element -->
<rect width="100%" height="100%" fill="url(#grid)"/>
```

### Region Box (dashed boundary)

```svg
<!-- Cyan region -->
<rect x="12" y="70" width="330" height="250" rx="10"
  fill="rgba(8,51,68,0.06)"
  stroke="#22d3ee" stroke-width="0.8" stroke-dasharray="8,4"/>
<text x="22" y="88" fill="#22d3ee" font-size="9" font-weight="600">
  📝 Region Name
</text>
```

Replace `rgba(8,51,68,0.06)` / `#22d3ee` with the appropriate domain color pair for other regions.

### Node (dual-layer)

```svg
<!-- Cyan node -->
<rect x="24" y="120" width="180" height="80" rx="6"
  fill="#0f172a" stroke="#22d3ee" stroke-width="1.5"/>
<rect x="24" y="120" width="180" height="80" rx="6"
  fill="rgba(8,51,68,0.4)" stroke="none"/>
<text x="114" y="148" fill="white"   font-size="12" font-weight="600" text-anchor="middle">Node Title</text>
<text x="114" y="166" fill="#94a3b8" font-size="9"  text-anchor="middle">Description line 1</text>
<text x="114" y="182" fill="#94a3b8" font-size="8"  text-anchor="middle">Description line 2</text>
<text x="114" y="196" fill="#22d3ee" font-size="7"  text-anchor="middle">→ Domain annotation</text>
```

For other colors, replace the stroke color, fill color, and annotation text color with the matching domain values.

### Gray auxiliary node (user/role, non-main-flow)

```svg
<rect x="24" y="260" width="120" height="50" rx="6"
  fill="rgba(30,41,59,0.5)" stroke="#94a3b8" stroke-width="1.5"/>
```

### Arrows

```svg
<!-- Solid arrow: sync/direct -->
<line x1="204" y1="160" x2="238" y2="160"
  stroke="#22d3ee" stroke-width="1.8"
  marker-end="url(#arrow-cyan)"/>

<!-- Dashed arrow: trigger/async/indirect -->
<line x1="863" y1="200" x2="863" y2="310"
  stroke="#fbbf24" stroke-width="1.2"
  stroke-dasharray="4,3"/>

<!-- Bent path (use for corners) -->
<path d="M 84 310 L 84 340 Q 84 365 140 365 L 198 365"
  fill="none"
  stroke="#64748b" stroke-width="1.2"
  marker-end="url(#arrow)"/>
```

Arrow color rule: use the target node's domain color.

### Legend (bottom of SVG)

```svg
<text x="30" y="435" fill="white" font-size="10" font-weight="600">Legend</text>

<!-- Domain color blocks -->
<rect x="30"  y="443" width="16" height="10" rx="2" fill="rgba(8,51,68,0.4)"   stroke="#22d3ee" stroke-width="1"/>
<text x="52"  y="451" fill="#94a3b8" font-size="8">Region 1</text>

<rect x="140" y="443" width="16" height="10" rx="2" fill="rgba(6,78,59,0.4)"   stroke="#34d399" stroke-width="1"/>
<text x="162" y="451" fill="#94a3b8" font-size="8">Region 2</text>

<rect x="250" y="443" width="16" height="10" rx="2" fill="rgba(76,29,149,0.4)" stroke="#a78bfa" stroke-width="1"/>
<text x="272" y="451" fill="#94a3b8" font-size="8">Region 3</text>

<rect x="360" y="443" width="16" height="10" rx="2" fill="rgba(120,53,15,0.3)" stroke="#fbbf24" stroke-width="1"/>
<text x="382" y="451" fill="#94a3b8" font-size="8">Region 4</text>

<!-- Line type legend -->
<line x1="470" y1="448" x2="490" y2="448" stroke="#94a3b8" stroke-width="1.2" marker-end="url(#arrow)"/>
<text x="497" y="451" fill="#94a3b8" font-size="8">Data Flow</text>

<line x1="560" y1="448" x2="580" y2="448" stroke="#fb7185" stroke-width="1" stroke-dasharray="4,3"/>
<text x="587" y="451" fill="#94a3b8" font-size="8">Trigger</text>
```

### Explanation Cards (below SVG)

```html
<div class="cards">
  <div class="card">
    <div class="card-header">
      <div class="card-dot" style="background:#22d3ee;"></div>
      <h3>① Step Name</h3>
    </div>
    <ul>
      <li>• Factual description, no adjectives</li>
      <li>• Key command or technical detail</li>
      <li>• Input/output specification</li>
      <li>• Trigger condition</li>
    </ul>
  </div>
  <!-- Repeat for each step/region -->
</div>
```

---

## Page Template

Use this exact HTML structure as the starting skeleton for every diagram:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diagram Title</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'JetBrains Mono', monospace;
      background: #020617;
      min-height: 100vh;
      padding: 2rem;
      color: white;
    }
    .container { max-width: 1100px; margin: 0 auto; }

    .header { margin-bottom: 2rem; }
    .header-row { display:flex; align-items:center; gap:1rem; margin-bottom:0.5rem; }
    .pulse-dot {
      width:12px; height:12px; background:#22d3ee;
      border-radius:50%; animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
    h1 { font-size:1.5rem; font-weight:700; letter-spacing:-0.025em; }
    .subtitle { color:#94a3b8; font-size:0.875rem; margin-left:1.75rem; }

    .diagram-container {
      background: rgba(15,23,42,0.5);
      border-radius: 1rem;
      border: 1px solid #1e293b;
      padding: 1.5rem;
      overflow-x: auto;
    }
    svg { width:100%; min-width:960px; display:block; }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
    }
    .card {
      background: rgba(15,23,42,0.5);
      border-radius: 0.75rem;
      border: 1px solid #1e293b;
      padding: 1.25rem;
    }
    .card-header { display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem; }
    .card-dot { width:8px; height:8px; border-radius:50%; }
    .card h3 { font-size:0.875rem; font-weight:600; }
    .card ul { list-style:none; color:#94a3b8; font-size:0.75rem; }
    .card li { margin-bottom:0.375rem; }

    .footer { text-align:center; margin-top:1.5rem; color:#475569; font-size:0.75rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-row">
        <div class="pulse-dot"></div>
        <h1>System/Flow Name</h1>
      </div>
      <p class="subtitle">One-line description of what this diagram depicts</p>
    </div>

    <div class="diagram-container">
      <svg viewBox="0 0 960 460">
        <!-- defs, grid, regions, nodes, arrows, legend -->
      </svg>
    </div>

    <div class="cards">
      <!-- cards -->
    </div>

    <p class="footer">Diagram description footer</p>
  </div>
</body>
</html>
```
