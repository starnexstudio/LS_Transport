import { sample } from "@/lib/showcase";

// Marks sample content on the dev server, so it is never mistaken for real
// reviews or figures. Production builds leave such sections out (lib/showcase.ts).
export function SampleTag({ className = "" }: { className?: string }) {
  if (!sample || process.env.NODE_ENV === "production") return null;
  return (
    <span
      className={`sample-tag ${className}`}
      title="Platzhalter: vor dem Livegang durch echte Daten ersetzen (lib/showcase.ts)"
    >
      Beispielinhalt
    </span>
  );
}
