import { prisma } from "./prisma";

export interface SystemSettings {
  orgName: string;
  orgAddress: string;
  lowStockThreshold: number;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  orgName: "SPMP",
  orgAddress: "",
  lowStockThreshold: 5,
};

export async function getSettings(): Promise<SystemSettings> {
  try {
    const s = await (prisma as any).systemSettings.findFirst();
    if (!s) return DEFAULT_SETTINGS;
    return {
      orgName:           s.orgName           ?? DEFAULT_SETTINGS.orgName,
      orgAddress:        s.orgAddress        ?? DEFAULT_SETTINGS.orgAddress,
      lowStockThreshold: s.lowStockThreshold ?? DEFAULT_SETTINGS.lowStockThreshold,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
