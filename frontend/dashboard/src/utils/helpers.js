export const LS = {
  getLake: () => {
    try {
      const v = localStorage.getItem("vw_lake");
      return v ? Number(v) : null;
    } catch {
      return null;
    }
  },
  getTab: () => {
    try {
      return localStorage.getItem("vw_tab") || null;
    } catch {
      return null;
    }
  },
  setLake: (id) => {
    try {
      localStorage.setItem("vw_lake", String(id));
    } catch {
      void 0;
    }
  },
  setTab: (t) => {
    try {
      localStorage.setItem("vw_tab", t);
    } catch {
      void 0;
    }
  },
};

export function relTime(isoTs) {
  const diff = Math.floor((Date.now() - new Date(isoTs).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`;
  return `${Math.floor(diff / 1440)} d ago`;
}
