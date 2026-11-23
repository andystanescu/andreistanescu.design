import { createExtensionRegistry } from "./contract";
import { insightsExtension } from "@/modules/insights/extension";
import { servicesExtension } from "@/modules/services/extension";

// This composition belongs to the current site. A Core-only distribution will
// provide a composition without add-on imports once its other boundaries move.
export const installedExtensions = createExtensionRegistry([insightsExtension, servicesExtension]);
