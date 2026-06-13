import { LS } from "../utils/helpers.js";

export const initialState = {
  selectedLakeId: LS.getLake() ?? 1,
  activeTab:      LS.getTab()  ?? "Overview",
  searchQuery:    "",
  showSearch:     false,
  showNotifications: false,
  showDetails:    false,
  digitalTwinLayers: { lake:true, flood:true, risk:true, infra:false },
  alertFilter:    "ACTIVE",
};

export function dashboardReducer(state, action) {
  let next;
  switch(action.type) {
    case "SELECT_LAKE":
      next = { ...state, selectedLakeId:action.id, showSearch:false, searchQuery:"" };
      LS.setLake(action.id);
      return next;
    case "SET_TAB":
      next = { ...state, activeTab:action.tab };
      LS.setTab(action.tab);
      return next;
    case "SET_SEARCH":           return { ...state, searchQuery:action.q };
    case "TOGGLE_SEARCH":        return { ...state, showSearch:!state.showSearch, searchQuery:"", showNotifications:false, showDetails:false };
    case "TOGGLE_NOTIFICATIONS": return { ...state, showNotifications:!state.showNotifications, showSearch:false, showDetails:false };
    case "TOGGLE_DETAILS":       return { ...state, showDetails:!state.showDetails, showSearch:false, showNotifications:false };
    case "TOGGLE_LAYER":         return { ...state, digitalTwinLayers:{ ...state.digitalTwinLayers, [action.layer]:!state.digitalTwinLayers[action.layer] }};
    case "SET_ALERT_FILTER":     return { ...state, alertFilter:action.filter };
    case "CLOSE_PANELS":         return { ...state, showSearch:false, showNotifications:false, showDetails:false };
    default: return state;
  }
}
