import { cookies } from "next/headers";
import Link from "next/link";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import styles from "./AdminBar.module.css";

// Small floating link back to the admin panel, shown only on the public
// site and only while logged in — a quick way to jump between editing and
// viewing without hunting for the hidden /admin URL again.
export async function AdminBar() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!verifySessionToken(token)) {
    return null;
  }

  return (
    <Link href="/admin" className={styles.bar}>
      Admin
    </Link>
  );
}
