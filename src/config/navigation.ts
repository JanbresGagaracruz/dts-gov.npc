import {
  LayoutDashboard,
  FileText,
  Cog,
  Activity,
  Users,
  BarChart2,
  ArrowLeftRight,
  Building2,
  GitBranchPlus,
  Warehouse,
  ScanLine,
  ScanSearch,
  BookOpen,
  BoxSelect,
  Gauge,
  ClipboardList,
  Shield,
  Settings,
  Zap,
  Network,
  ShieldCheck,
  UserCog,
  Upload,
  ShoppingCart,
  MapPin,
  Boxes,
  Bell,
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
    id: "ops",
    label: "Operations",
    shortLabel: "Ops",
    description: "Scans, requisitions & transfers",
    icon: ScanLine,
    items: [
      { label: "Scan Station", href: "/scan", icon: ScanLine },
      {
        label: "Item Lookup",
        href: "/item-lookup",
        icon: ScanSearch,
        badge: "New",
      },
      { label: "Requisitions", href: "/requisitions", icon: ShoppingCart },
      { label: "Stock Transfers", href: "/transfers", icon: ArrowLeftRight },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    shortLabel: "Stock",
    description: "Stock levels & bin locations",
    icon: Boxes,
    items: [
      { label: "Warehouse Stock", href: "/warehouse-stock", icon: Boxes },
      { label: "Inventory", href: "/inventory", icon: BoxSelect },
      { label: "Bin Locations", href: "/bin-locations", icon: MapPin },
    ],
  },
  {
    id: "audit",
    label: "Audit & Records",
    shortLabel: "Audit",
    description: "Immutable history & trail",
    icon: ClipboardList,
    items: [
      { label: "Scan Logs", href: "/scan-logs", icon: Activity },
      { label: "Stock Ledger", href: "/ledger", icon: BookOpen },
      {
        label: "Activity Trail",
        href: "/activity-trail",
        icon: ClipboardList,
        minLevel: 3,
      },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    shortLabel: "Catalog",
    description: "Products, warehouses & imports",
    icon: Cog,
    items: [
      { label: "Products", href: "/products", icon: Cog },
      {
        label: "Change Requests",
        href: "/product-changes",
        icon: FileText,
        minLevel: 3,
      },
      {
        label: "Import Products",
        href: "/products/import",
        icon: Upload,
        minLevel: 3,
      },
      { label: "Warehouses", href: "/warehouse", icon: Warehouse },
    ],
  },
  {
    id: "plants",
    label: "Power Plants",
    shortLabel: "Plants",
    description: "Plants & facility mapping",
    icon: Zap,
    items: [
      { label: "Power Plants", href: "/powerplant", icon: Zap },
      { label: "Plant Mapping", href: "/plant-mapping", icon: Network },
    ],
  },
  {
    id: "admin",
    label: "System",
    shortLabel: "Admin",
    description: "Users, access & configuration",
    icon: Shield,
    minLevel: 3,
    items: [
      { label: "Analytics & Reports", href: "/analytics", icon: BarChart2 },
      { label: "Users", href: "/users", icon: Users },
      { label: "Roles", href: "/roles", icon: ShieldCheck },
      { label: "Role Mapping", href: "/role-mapping", icon: UserCog },
      { label: "Divisions", href: "/division", icon: GitBranchPlus },
      { label: "Departments", href: "/department", icon: Building2 },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
