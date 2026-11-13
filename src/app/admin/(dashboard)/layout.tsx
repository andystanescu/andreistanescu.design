import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar/AdminSidebar";
import styles from "./dashboard.module.css";
import { getSettings } from "@/lib/settings";

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const settings = getSettings();
  return (
    <div className={styles.shell} data-admin-shell>
      <AdminSidebar logoIdentity={settings.logo_identity} logoImage={settings.logo_image} logoIconImage={settings.logo_icon_image} />
      <main className={styles.content} data-scroll-region data-page-transition-content>{children}</main>
    </div>
  );
}
