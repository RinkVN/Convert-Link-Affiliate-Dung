import { cn } from "@/lib/utils";

export function AuroraBackground({
  className,
  showRadialGradient = true,
  children,
  ...props
}: React.ComponentProps<"div"> & { showRadialGradient?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-orange-50/80 via-stone-50 to-stone-50 px-4 py-16 md:px-24 md:py-24",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#a8a29e0a_1px,transparent_1px),linear-gradient(to_bottom,#a8a29e0a_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="absolute inset-0 h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(238,77,45,0.12),rgba(255,255,255,0))]" />
      <div
        className={cn(
          "absolute inset-0 h-full w-full",
          showRadialGradient &&
            "bg-[radial-gradient(ellipse_60%_40%_at_70%_0%,rgba(251,146,60,0.1),transparent_50%)]"
        )}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
