import type { PlatformExtension } from "@/platform/extensions/contract";
import { insightsAvailable } from "@/lib/features";
import { migrateInsightsSchema, migrateInsightsCategories } from "./migration";

export const insightsExtension: PlatformExtension = {
  id: "insights",
  contractVersion: 1,
  isEnabled: insightsAvailable,
  migrations: { schema: migrateInsightsSchema, afterCategories: migrateInsightsCategories },
};
