import { cn } from "@/lib/utils";

export function BorderBeam({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 rounded-[inherit] [border:1px_solid_rgba(255,255,255,.1)] [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "before:absolute before:inset-0 before:rounded-[inherit] before:[border:1px_solid_transparent] before:[background:linear-gradient(var(--color),var(--color))_padding-box,linear-gradient(180deg,rgba(255,255,255,.4),transparent_50%,transparent,rgba(255,255,255,.2))_border-box] before:[mask-clip:padding-box,border-box] before:[mask-composite:intersect] before:[mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "after:absolute after:inset-0 after:rounded-[inherit] after:[border:1px_solid_transparent] after:[background:linear-gradient(var(--color),var(--color))_padding-box,linear-gradient(90deg,rgba(255,255,255,.4),transparent_50%,transparent,rgba(255,255,255,.2))_border-box] after:[mask-clip:padding-box,border-box] after:[mask-composite:intersect] after:[mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        className
      )}
      style={{ "--color": "#ee4d2d" } as React.CSSProperties}
    />
  );
}
