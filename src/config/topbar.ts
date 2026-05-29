export const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/master-item": "Master Item",
  "/scan": "Scan Station",
  "/inventory": "Inventory",
  "/transfers": "Stock Transfers",
  "/scan-logs": "Scan Logs",
  "/ledger": "Stock Ledger",
  "/products": "Products",
  "/warehouse": "Warehouses",
  "/analytics": "Analytics & Reports",
  "/users": "Users",
  "/division": "Divisions",
  "/department": "Departments",
  "/settings": "Settings",
  "/product-changes": "Change Requests",
  "/activity-trail": "Activity Trail",
  "/requisitions": "Requisitions",
  "/bin-locations": "Bin Locations",
};

export interface TopbarProps {
  onMenuToggle: () => void;
  panelOpen: boolean;
  onPanelToggle: () => void;
}
