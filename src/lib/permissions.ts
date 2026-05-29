// ─── Access Levels (page visibility) ─────────────────────────────────────────
export const ACCESS = {
  VIEWER:      1,
  STAFF:       2,
  ADMIN:       3,
  SUPER_ADMIN: 4,
} as const;

export type AccessLevel = (typeof ACCESS)[keyof typeof ACCESS];

export function canRead(level: number)        { return level >= ACCESS.VIEWER; }
export function canCreate(level: number)      { return level >= ACCESS.STAFF; }
export function canUpdate(level: number)      { return level >= ACCESS.STAFF; }
export function canDelete(level: number)      { return level >= ACCESS.ADMIN; }
export function canManageUsers(level: number) { return level >= ACCESS.ADMIN; }

export function accessLevelLabel(level: number): string {
  switch (level) {
    case 1: return "Viewer";
    case 2: return "Staff";
    case 3: return "Admin";
    case 4: return "Super Admin";
    default: return `Level ${level}`;
  }
}

export function accessLevelVariant(level: number): "default" | "info" | "warning" | "danger" {
  switch (level) {
    case 1: return "default";
    case 2: return "info";
    case 3: return "warning";
    case 4: return "danger";
    default: return "default";
  }
}

// ─── Functional Roles (data scope) ───────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN:        "ADMIN",
  DEPARTMENT_MANAGER: "DEPARTMENT_MANAGER",
  DIVISION_MANAGER:   "DIVISION_MANAGER",
  MANAGER:            "MANAGER",
  SCANNER:            "SCANNER",
  VIEWER:             "VIEWER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_OPTIONS = [
  { value: "VIEWER",             label: "Viewer",             scope: "none" },
  { value: "SCANNER",            label: "Scanner",            scope: "warehouse" },
  { value: "MANAGER",            label: "Manager",            scope: "warehouse" },
  { value: "DIVISION_MANAGER",   label: "Division Manager",   scope: "division" },
  { value: "DEPARTMENT_MANAGER", label: "Department Manager", scope: "department" },
  { value: "ADMIN",              label: "Admin",              scope: "none" },
] as const;

export function roleLabel(role: string): string {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
}

export function roleScope(role: string): "none" | "warehouse" | "division" | "department" {
  return (ROLE_OPTIONS.find((r) => r.value === role)?.scope ?? "none") as any;
}

export function roleVariant(role: string): "default" | "info" | "warning" | "success" | "danger" {
  switch (role) {
    case "ADMIN":              return "danger";
    case "DEPARTMENT_MANAGER": return "warning";
    case "DIVISION_MANAGER":   return "info";
    case "MANAGER":            return "info";
    case "SCANNER":            return "success";
    default:                   return "default";
  }
}
