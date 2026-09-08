import { readFileSync } from "fs";
import { join } from "path";

const svgMarkup = readFileSync(
  join(process.cwd(), "public/assets/lattice-diagram.svg"),
  "utf-8"
);

export function LatticeDiagram() {
  return (
    <div
      role="img"
      aria-label="A lattice diagram: four highlighted foundation nodes anchor a wider grid of connected system nodes, all gently drifting in place and responding to the cursor."
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
