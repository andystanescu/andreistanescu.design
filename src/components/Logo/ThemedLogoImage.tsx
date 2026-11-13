import Image from "next/image";
import styles from "./ThemedLogoImage.module.css";

export function ThemedLogoImage({ src, variant, alt, width, height, className, forceDark = false }: { src: string; variant: "full" | "icon"; alt: string; width: number; height: number; className?: string; forceDark?: boolean }) {
  if (!/^\/uploads\/[\da-f-]+\.svg$/i.test(src)) return <Image className={className} src={src} alt={alt} width={width} height={height} unoptimized />;
  const source = (mode: string) => `/api/site-logo?variant=${variant}&mode=${mode}&v=${encodeURIComponent(src)}`;
  if (forceDark) return <Image className={className} src={source("dark")} alt={alt} width={width} height={height} unoptimized />;
  return <>
    <Image className={`${className ?? ""} ${styles.light}`} src={source("light")} alt={alt} width={width} height={height} unoptimized />
    <Image className={`${className ?? ""} ${styles.dark}`} src={source("dark")} alt={alt} width={width} height={height} unoptimized />
  </>;
}
