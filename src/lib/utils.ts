import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  date: Date | string | null | undefined,
  fmt = "MMM dd, yyyy",
) {
  if (!date) return "—";
  return format(new Date(date), fmt);
}

export function formatRelative(date: Date | string | null | undefined) {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatCurrency(
  value: number | null | undefined,
  currency = "PHP",
) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-PH").format(value);
}

export function getActivityIcon(action: string) {
  switch (action) {
    case "CREATE":
      return "+";
    case "UPDATE":
      return "~";
    case "DELETE":
      return "-";
    case "LOGIN":
      return "→";
    case "LOGOUT":
      return "←";
    default:
      return "·";
  }
}

export function getActivityColor(action: string) {
  switch (action) {
    case "CREATE":
      return "text-green-500";
    case "UPDATE":
      return "text-amber-500";
    case "DELETE":
      return "text-red-500";
    case "LOGIN":
      return "text-blue-500";
    case "LOGOUT":
      return "text-gray-500";
    default:
      return "text-gray-400";
  }
}

export const defaultCreateFormDivision = {
  DivName: "",
  DivInit: "",
  DepartmentId: "",
};

export const defaultCreateFormDepartment = {
  DeptID: "",
  DeptName: "",
  DeptInit: "",
  DepLocation: "",
  DivisionId: "",
};
