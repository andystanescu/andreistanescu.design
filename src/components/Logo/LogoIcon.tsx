import { ThemedLogoImage } from "./ThemedLogoImage";

export function LogoIcon({ imageUrl }: { identity: "business" | "personal"; imageUrl: string }) {
  if (imageUrl) return <ThemedLogoImage variant="icon" src={imageUrl} width={30} height={30} alt="" />;
  return <span>Home</span>;
}
