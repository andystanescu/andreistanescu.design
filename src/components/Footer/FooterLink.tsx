"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export function FooterLink({ href, className, style, children }: { href: string; className?: string; style?: CSSProperties; children: ReactNode }) {
  return <Link href={href} className={className} style={style} onClick={() => sessionStorage.setItem("conScept-force-top", "1")}>{children}</Link>;
}
