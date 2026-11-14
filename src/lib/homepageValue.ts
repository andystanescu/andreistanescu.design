import { db } from "@/lib/db";
import { ukDateTimeValue } from "@/lib/dateUtils";
import { readValueEvidenceOptions } from "./homepageValueContent";

export { parseValueContent } from "./homepageValueContent";
export type { ValueEvidence, ValueProposition, ValueEvidenceOption } from "./homepageValueContent";
export function getValueEvidenceOptions() { return readValueEvidenceOptions(db, ukDateTimeValue()); }
