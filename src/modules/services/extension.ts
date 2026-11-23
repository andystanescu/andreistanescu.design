import type { PlatformExtension } from "@/platform/extensions/contract";
import { servicesAvailable } from "@/lib/features";
import { migrateServiceCategories, migrateServicesColumns, migrateServicesSchema } from "./migration";
import { updateServiceCategory, reorderServiceCategories, prepareServiceCategoryDeletion } from "./categoryHooks";
import { seedServices } from "./seed";

export const servicesExtension: PlatformExtension = {
  id: "services",
  contractVersion: 1,
  isEnabled: servicesAvailable,
  categories: { updated: updateServiceCategory, reordered: reorderServiceCategories, beforeDelete: prepareServiceCategoryDeletion },
  migrations: { preSchema: migrateServicesSchema, afterCoreSchema: migrateServicesColumns, beforeCategories: seedServices, afterCategories: migrateServiceCategories },
};
