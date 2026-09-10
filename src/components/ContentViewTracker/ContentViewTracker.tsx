"use client";

import { useEffect } from "react";

export function ContentViewTracker({ contentType, contentId }: { contentType: "article" | "case_study"; contentId: string }) {
  useEffect(() => {
    let source = "Direct";
    try {
      const hostname = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : "";
      if (hostname.includes("google.")) source = "Google";
      else if (hostname.includes("linkedin.")) source = "LinkedIn";
      else if (hostname && hostname !== window.location.hostname) source = "Other sources";
    } catch { source = "Other sources"; }
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "view", contentType, contentId, source }),
      keepalive: true,
    });
  }, [contentId, contentType]);
  return null;
}
