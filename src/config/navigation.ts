// src/config/navigation.ts
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  GitBranch,
  CheckSquare,
  Clock,
  Building2,
  Users,
  Shield,
  Settings,
  Bell,
  ClipboardList,
  Send,
  BarChart2,
  Gauge,
  Archive,
  Search,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  minLevel?: number;
  badge?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
  minLevel?: number;
  items: NavItem[];
}

export interface SidebarProps {
  panelOpen: boolean;
  onPanelToggle: () => void;
}

export const navGroups: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    shortLabel: "Home",
    description: "Dashboard & summary",
    icon: LayoutDashboard,
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Gauge },
      { label: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    shortLabel: "Docs",
    description: "Tracking & management",
    icon: FileText,
    items: [
      { label: "All Documents", href: "/documents", icon: FileText },
      {
        label: "Create Document",
        href: "/documents/create",
        icon: FilePlus,
        minLevel: 2,
      },
      { label: "My Documents", href: "/documents/mine", icon: Send },
      {
        label: "Pending Approval",
        href: "/documents/pending-approval",
        icon: CheckSquare,
      },
      { label: "Routing Inbox", href: "/documents/inbox", icon: Clock },
    ],
  },
  {
    id: "track",
    label: "Tracking",
    shortLabel: "Track",
    description: "Search & locate documents",
    icon: Search,
    items: [{ label: "Track by Number", href: "/track", icon: Search }],
  },
  {
    id: "admin",
    label: "System",
    shortLabel: "Admin",
    description: "Users, depts & audit",
    icon: Shield,
    minLevel: 3,
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart2, minLevel: 3 },
      {
        label: "Departments",
        href: "/department",
        icon: Building2,
        minLevel: 3,
      },
      { label: "Users", href: "/users", icon: Users, minLevel: 3 },
      {
        label: "Activity Trail",
        href: "/activity-trail",
        icon: ClipboardList,
        minLevel: 3,
      },
      {
        label: "Archive",
        href: "/documents/archive",
        icon: Archive,
        minLevel: 3,
      },
      { label: "Settings", href: "/settings", icon: Settings, minLevel: 4 },
    ],
  },
];
