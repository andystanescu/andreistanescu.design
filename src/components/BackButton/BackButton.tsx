"use client";

import { useRouter } from "next/navigation";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import styles from "./BackButton.module.css";

export function BackButton({ label, fallbackHref }: { label: string; fallbackHref: string }) {
  const router = useRouter();

  function goBack() {
    // This is an IA control, not browser-history navigation. Always return
    // to the explicit parent section so a detail page remains predictable
    // even when the user arrived from another route.
    router.push(fallbackHref);
  }

  return (
    <button type="button" className={styles.button} onClick={goBack}>
      <ArrowIcon size={16} />
      <span className="label-button">{label}</span>
    </button>
  );
}
