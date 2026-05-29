// Shared stock-level colour helpers used across inventory, warehouse-stock, item-lookup, etc.

export function qtyColor(qty: number): string {
  if (qty === 0) return "text-red-500";
  if (qty <= 5)  return "text-amber-500";
  return "text-emerald-500";
}

export function qtyBg(qty: number): string {
  if (qty === 0) return "bg-red-500/10";
  if (qty <= 5)  return "bg-amber-500/10";
  return "bg-emerald-500/10";
}

export function stockStatus(qty: number): { label: string; variant: "danger" | "warning" | "success" } {
  if (qty === 0) return { label: "Out of Stock", variant: "danger"  };
  if (qty <= 5)  return { label: "Low Stock",    variant: "warning" };
  return            { label: "In Stock",      variant: "success" };
}
