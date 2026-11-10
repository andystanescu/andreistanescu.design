import Image from "next/image";
import { PersonalLogoMark } from "./PersonalLogoMark";

export function LogoIcon({ identity, imageUrl }: { identity: "business" | "personal"; imageUrl: string }) {
  if (imageUrl) return <Image src={imageUrl} width={30} height={30} alt="" unoptimized style={{ objectFit: "contain" }} />;
  if (identity === "personal") return <PersonalLogoMark size={30} />;
  return <Image src="/assets/logo-icon-nav.svg" width={30} height={30} alt="" />;
}
