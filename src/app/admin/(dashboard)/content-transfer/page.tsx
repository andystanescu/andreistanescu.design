import ContentTransfer from "./ContentTransfer";
import { insightsAvailable, servicesAvailable } from "@/lib/features";

export const dynamic = "force-dynamic";

export default function ContentTransferPage() {
  return <ContentTransfer servicesEnabled={servicesAvailable()} insightsEnabled={insightsAvailable()} />;
}
