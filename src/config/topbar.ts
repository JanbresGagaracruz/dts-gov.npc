// src/config/topbar.ts
export const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/documents": "All Documents",
  "/documents/create": "Create Document",
  "/documents/mine": "My Documents",
  "/documents/pending-approval": "Pending Approval",
  "/documents/inbox": "Routing Inbox",
  "/documents/archive": "Archive",
  "/track": "Track Document",
  "/notifications": "Notifications",
  "/analytics": "Analytics & Reports",
  "/department": "Departments",
  "/users": "Users",
  "/settings": "Settings",
  "/activity-trail": "Activity Trail",
};

export interface TopbarProps {
  onMenuToggle: () => void;
  panelOpen: boolean;
  onPanelToggle: () => void;
}
