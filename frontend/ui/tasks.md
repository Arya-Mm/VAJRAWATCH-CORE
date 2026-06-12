Read the tasks.md file. We are executing Phase 1 (Chunk 1 & Chunk 2) to build the static scaffold and layout.

Perform these steps strictly inside the current directory:
1. Initialize a blank Vite React project here using: npm create vite@latest . -- --template react
2. Install dependencies: npm install tailwindcss postcss autoprefixer framer-motion lucide-react
3. Set up Tailwind CSS configuration (npx tailwindcss init -p) and ensure content paths cover index.html and src/**/*.{js,ts,jsx,tsx}.
4. Configure src/index.css with the exact premium dark mode theme:
   - Background: #0a0f1e
   - Surface/Cards: #111827
   - Borders: #334155
   - Text: #f8fafc
5. Build a modular layout dividing the interface into:
   - src/components/Header.jsx (Top-left branding, F-Pattern focus, "47 Lakes Monitored" status badge)
   - src/components/MapContainer.jsx (Left panel 60% width, 2D/3D toggle, dark placeholder div for the upcoming canvas)
   - src/components/Sidebar.jsx (Right panel 40% width, featuring Thulagi Lake data, a hardcoded metric state, and the primary action button)
   - src/components/RiskGauge.jsx (Animated circular risk gauge for the score of 84)
6. Wire up the "RUN ANALYSIS" button in Sidebar.jsx to a useState hook. Clicking it should trigger a loading skeleton state for exactly 1.5 seconds before displaying the critical RED alert state.

Ensure no outer directories are touched. Let's build the scaffold.