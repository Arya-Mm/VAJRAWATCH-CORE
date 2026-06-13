export const T = {
  bg:      "#EEF2F7",
  surface: "#FFFFFF",
  panel:   "#F6F8FB",
  border:  "#E2E8F0",
  border2: "#CBD5E1",
  text:    "#1B2838",
  muted:   "#5B7185",
  dim:     "#94A6B8",
  ghost:   "#B8C4D0",
  accent:  "#2F6FE0",
  green:   "#1FAE7A",
  risk: {
    CRITICAL: { fg:"#E5484D", bg:"#FCEBEB", glow:"#E5484D22" },
    HIGH:     { fg:"#F0A500", bg:"#FAEEDA", glow:"#F0A50022" },
    MODERATE: { fg:"#D8A300", bg:"#FBF6E0", glow:"#D8A30022" },
    WATCH:    { fg:"#3B7DD8", bg:"#E6F1FB", glow:"#3B7DD822" },
    LOW:      { fg:"#1FAE7A", bg:"#E1F5EE", glow:"#1FAE7A22" },
  },
};

export const mono    = { fontFamily:"'JetBrains Mono','Courier New',monospace" };
export const ui      = { fontFamily:"'Inter',system-ui,-apple-system,sans-serif" };
export const display = { fontFamily:"'Space Grotesk','Inter',sans-serif" };
export const flex = (extra={}) => ({ display:"flex", ...extra });
export const col  = (extra={}) => ({ display:"flex", flexDirection:"column", ...extra });

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  @import url('https://cdnjs.cloudflare.com/ajax/libs/@tabler/icons-webfont/2.47.0/tabler-icons.min.css');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  select { appearance: none; }
  button { font-family: inherit; }
  @keyframes spin { to { transform: rotate(360deg); } }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
`;
