import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar/AdminSidebar";
import styles from "./dashboard.module.css";

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={styles.shell} data-admin-shell>
      <AdminSidebar />
      <main className={styles.content} data-scroll-region data-page-transition-content>{children}</main>
    </div>
  );
}
