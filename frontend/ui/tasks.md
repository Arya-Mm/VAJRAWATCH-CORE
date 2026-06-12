CRITICAL SYSTEM INSTRUCTION: You are operating exclusively inside the frontend/ui directory. You are strictly forbidden from generating, navigating to, or modifying any files outside of this specific directory context.

### 1. The Master Frontend AI Prompt

Copy this entire block and paste it into your AI UI generator (Cursor, v0, Lovable, etc.) to generate the React application.

⁠ markdown
# VAJRAWATCH V4 — FRONTEND & UI/UX MASTER PROMPT
# GLOF AI Early Warning Command Center | React + Tailwind + Three.js

## ROLE
[cite_start]You are a Staff Frontend Engineer and an expert in Cognitive Psychology, Behavioral Science, and UI/UX Design[cite: 348]. You build venture-backable, production-grade dashboards with flawless visual hierarchy. 

Your task is to build the frontend for **VajraWatch**, a Glacial Lake Outburst Flood (GLOF) early warning system.

## DESIGN PSYCHOLOGY & VISUAL SYSTEM
You must strictly adhere to these cognitive design principles:
1. [cite_start]**The Halo Effect & Trust Engineering:** The UI must look world-class, creating a positive impression that generalizes to the technical backend[cite: 122]. [cite_start]Use a "Linear-style" premium dark mode to signal authority, power, and confidence[cite: 180, 262]. 
   - Background: `#0a0f1e`
   - Surface/Cards: `#111827`
   - Borders: `#334155`
   - Text: `#f8fafc`
2. [cite_start]**Visual Hierarchy & Cognitive Load:** Working memory holds approximately 4 ± 1 chunks of information[cite: 431]. [cite_start]Never show more than 4 chunks of information at once[cite: 431]. [cite_start]Use whitespace aggressively, targeting 60% space and 40% content to signal confidence[cite: 42]. [cite_start]Apply the isolation principle: an element surrounded by space acquires importance[cite: 38].
3. **Color Singularity:** Keep the interface muted. [cite_start]Follow the 60-30-10 rule: 60% dominant background, 30% secondary UI, and 10% accent color[cite: 182]. [cite_start]Use accent colors ONLY for risk status, as one saturated color in a desaturated environment is irresistible to human vision[cite: 136].
4. [cite_start]**Fitts's Law:** The time to acquire a target is a function of distance and size[cite: 613]. [cite_start]Make the primary "RUN ANALYSIS" button the largest interactive element[cite: 58].
5. [cite_start]**Typography Authority:** Use a Sans-serif font like Inter to convey modern, tech-focused clarity[cite: 34]. [cite_start]Restrict the design to a maximum of 3 font sizes to prevent visual noise[cite: 31, 32].

## CORE ARCHITECTURE & LAYOUT
Build a responsive, split-screen React dashboard. 
- **Header:** Minimal. "VajraWatch | GLOF Command Center". Status indicator: "47 Lakes Monitored". [cite_start]Place your logo or brand in the top-left, as F-Pattern and Z-Pattern scanning dictates this gets first attention[cite: 21, 23].
- **Left Panel (60% width):** The Visual Canvas. 
  - Contains a toggle between `[2D Map]` and `[3D Digital Twin]`.
  - Placeholder div for the Three.js/MapLibre canvas.
- **Right Panel (40% width):** The Action & Data Sidebar.
  - **Selected Lake:** "Thulagi Lake".
  - **Risk Gauge:** A large, animated circular gauge (0-100 score).
  - **Top Drivers:** A clean list showing the specific anomalies (e.g., "Lake Area Expansion +18.5%", "Rainfall Anomaly +210mm"). [cite_start]Ensure this uses the Von Restorff Effect by making one highlighted stat visually distinct[cite: 80].
  - **Impact Zone:** Downstream metrics (Population, Infrastructure MW, Bridges). [cite_start]Use precise numbers, as precision signals rigor and builds authority[cite: 212, 251].
  - **Alert Console:** A section showing the LangGraph agent traces and a "Play Nepali Warning" audio button.
  - **Primary Action:** A massive "RUN ANALYSIS" button at the bottom.

## MOCK DATA REQUIREMENT (CRITICAL)
Do NOT wait for a backend. You must hardcode this exact state object so the UI is fully interactive immediately:
 ⁠json
{
  "lake_id": "PDGL_THULAGI_01",
  "name": "Thulagi Lake",
  "risk_score": 84,
  "risk_tier": "RED",
  "top_drivers": [
    { "feature": "Rainfall Anomaly", "value": "210.0mm", "anomaly_ratio": "1.4x" },
    { "feature": "Lake Area Expansion", "value": "18.5%", "anomaly_ratio": "1.2x" }
  ],
  "impact": {
    "population": 12480,
    "hydropower_mw": 186,
    "historical_analog": "South Lonak 2023"
  }
}



## IMPLEMENTATION RULES

1. Use React (Vite preferred), Tailwind CSS for styling, and Framer Motion for smooth panel transitions.
2. Ensure the "RUN ANALYSIS" button triggers a mocked loading state (skeleton loaders) for exactly 1.5 seconds before revealing the red alert state, exploiting the anticipation loop to fire dopamine before the reward.


3. Output clean, modular component code. Separate the layout into `Sidebar.jsx`, `MapContainer.jsx`, and `RiskGauge.jsx`.



---

### 2. Frontend Engineer (Member 4) Blueprint

Hand this directly to your frontend developer. This ensures they hit the deadlines, integrate perfectly with the backend team, and leverage psychological principles to win over the judges.

[cite_start]*The Mission:* Win the judges in the first 50 milliseconds of visual processing[cite: 250]. [cite_start]Capitalize on the Aesthetic-Usability Effect; if your UI is polished and beautiful, judges will subconsciously perceive the underlying architecture as highly functional and intelligent[cite: 124, 619]. 

#### Phase 1: Static Scaffold & Hardcoded UI (Hours 0 - 8)
Goal: Have a beautiful, clickable demo running locally even if the backend team's server is on fire.
•⁠  ⁠*Action:* Feed the master prompt above into your AI generator.
•⁠  ⁠*Task:* Scaffold the Vite + React app. [cite_start]Implement the dark mode color palette exactly as specified, signaling premium execution and a developer-focused aesthetic[cite: 180, 273].
•⁠  ⁠*Rule:* *Zero Backend Dependencies.* Use the hardcoded ⁠ Thulagi Lake ⁠ JSON. Wire up the "Run Analysis" button to change a React ⁠ useState ⁠ from ⁠ idle ⁠ to ⁠ loading ⁠ to ⁠ critical ⁠. 
•⁠  ⁠*Validation:* Run the "Scan Test". [cite_start]Uncover the slide for 3 seconds, then cover it[cite: 29]. [cite_start]If the Risk Score and the "Run Analysis" button are not the first things noticed, fix the visual hierarchy by adjusting size and whitespace[cite: 29, 36].

#### Phase 2: Wiring & State Management (Hours 8 - 20)
Goal: Connect the beautiful UI to Member 2's FastAPI endpoints.
•⁠  ⁠*Action:* Replace the hardcoded JSON trigger with Axios calls.
•⁠  ⁠*Task:* Send a ⁠ GET ⁠ request to ⁠ http://localhost:8000/risk/thulagi ⁠ on click. Map the incoming JSON to the components.
•⁠  ⁠*Task:* Ensure the "Play Audio" button fetches the ⁠ .mp3 ⁠. 
•⁠  ⁠[cite_start]*Psychology Rule:* Always design for recognition, not recall[cite: 467]. [cite_start]Ensure all incoming metrics are clearly labeled so judges never have to guess what a number means[cite: 467]. 

#### Phase 3: The 3D Digital Twin (Hours 20 - 36)
Goal: Build the ultimate hackathon eye-candy to serve as the Peak-End Rule anchor.
•⁠  ⁠*Action:* Implement ⁠ Three.js ⁠, adapting the headless Python and Blender generation concepts from the VOID-RENDER engine to manage the spatial geometry smoothly in the browser. 
•⁠  ⁠*Task:* Load the SRTM heightmap PNG as a displacement map on a ⁠ PlaneGeometry ⁠. Place a ⁠ CircleGeometry ⁠ (the lake) at the correct coordinates. 
•⁠  ⁠[cite_start]*Task:* Apply the principle of Common Fate[cite: 239]. [cite_start]Animate the flood particle system (blue dots) to flow down the terrain together, ensuring the movement groups them visually[cite: 239].
•⁠  ⁠[cite_start]*Task:* Use motion strictly for the flood simulation, as moving elements involuntarily capture attention via the amygdala[cite: 131, 422].

#### Phase 4: Polish & Fallbacks (Hours 36 - 48)
Goal: Bulletproof the demo and eliminate extraneous cognitive load.
•⁠  ⁠*Action:* Comply with the Doherty Threshold. [cite_start]Ensure response times remain under 400ms to keep the user in a flow state[cite: 613]. [cite_start]Use skeleton screens for optimistic UI loading[cite: 613].
•⁠  ⁠*Task:* Eliminate Extraneous Load. [cite_start]Strip out any decorative elements, transitions, or visual noise that do not directly communicate the risk score[cite: 107, 110]. 
•⁠  ⁠*Task:* Implement strict Error Boundaries. If the backend fails, the UI must gracefully fall back to the Phase 1 mock data. [cite_start]One broken element signals broader incompetence (the Horn Effect), so ensure failure states are invisible to the judges[cite: 472].