import type { ReactNode } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs/AdminTabs";
import { ABOUT_TABS } from "@/app/admin/(dashboard)/adminTabs";
import styles from "@/app/admin/(dashboard)/admin.module.css";

export function AboutAdminHeader({ active, action }: { active: string; action?: ReactNode }) {
  return (
    <div className={`${styles.pageHeader} ${styles.pageHeaderStacked}`} data-admin-about-header>
      <div className={styles.pageHeaderTop}>
        <div>
          <h1 className="heading-01">About</h1>
        </div>
        {action}
      </div>
      <AdminTabs tabs={ABOUT_TABS} active={active} embedded />
    </div>
  );
}
