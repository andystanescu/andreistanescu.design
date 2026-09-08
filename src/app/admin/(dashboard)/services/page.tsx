import Link from "next/link";
import { getAllServiceItemsAdmin } from "@/lib/serviceItems";
import { ReorderableList } from "@/components/admin/ReorderableList/ReorderableList";
import { AdminTabs } from "@/components/admin/AdminTabs/AdminTabs";
import { SERVICES_TABS } from "../adminTabs";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default function AdminServicesPage() {
  const services = getAllServiceItemsAdmin();

  return (
    <>
      <div className={styles.pageHeader}><h1 className="heading-01">Services</h1><Link href="/admin/services/new" className={styles.newLink}>New service</Link></div>
      <AdminTabs tabs={SERVICES_TABS} active="/admin/services" />
      <div className={styles.toolbar}>
        <p className="heading-02">Listed items</p>
      </div>
      <p className={`body-small ${styles.helper}`}>
        Listed on /services. Toggle &ldquo;Show on homepage&rdquo; on a
        service&apos;s edit screen to also feature it in the homepage
        Services section. Drag to reorder, or use the arrows.
      </p>

      {services.length === 0 ? (
        <p className={`body-default ${styles.empty}`}>
          No services yet.
        </p>
      ) : (
        <ReorderableList
          className={styles.list}
          itemClassName={styles.listItem}
          reorderUrl="/api/admin/services/reorder"
          items={services.map((service, index) => ({
            id: String(service.id),
            node: (
              <>
                <div className={styles.listItemMeta}>
                  <p className="body-default">
                    {service.title}
                    {!service.published && (
                      <span className={styles.unpublished}> — unpublished</span>
                    )}
                    {!!service.show_on_homepage && (
                      <span
                        className="body-small"
                        style={{ color: "var(--text-accent)", marginLeft: "var(--space-150)" }}
                      >
                        on homepage
                      </span>
                    )}
                  </p>
                  <p className="body-small" style={{ color: "var(--text-tertiary)" }}>
                    /services/{service.slug}
                  </p>
                </div>
                <div className={styles.listItemActions}>
                  <form action={`/api/admin/services/${service.id}/move`} method="POST">
                    <input type="hidden" name="direction" value="up" />
                    <button type="submit" disabled={index === 0} aria-label="Move up">
                      ↑
                    </button>
                  </form>
                  <form action={`/api/admin/services/${service.id}/move`} method="POST">
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={index === services.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </form>
                  <Link href={`/admin/services/${service.id}`} className={styles.editLink}>
                    <span aria-hidden="true">✎</span><span className={styles.srOnly}>Edit service</span>
                  </Link>
                  <form
                    action={`/api/admin/services/${service.id}/delete`}
                    method="POST"
                    className={styles.deleteForm}
                  >
                    <button type="submit" className={styles.deleteButton} aria-label="Delete service" title="Delete service">
                      <span aria-hidden="true">×</span>
                    </button>
                  </form>
                </div>
              </>
            ),
          }))}
        />
      )}
    </>
  );
}
